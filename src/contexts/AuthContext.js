import React, { createContext, useContext, useState, useEffect } from 'react';
import { firebaseAuth } from '../services/firebaseAuth.js';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get user profile from Firestore to get role and permissions
          const { getDoc, doc } = await import('firebase/firestore');
          const { db } = await import('../config/firebase.js');
          
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          let userData = {};
          
          if (userDoc.exists()) {
            userData = userDoc.data();
          }
          
          // User is signed in
          const userObject = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: userData.name || firebaseUser.displayName || firebaseUser.email,
            role: userData.role || 'staff',
            permissions: userData.permissions || ['view', 'edit']
          };
          
          console.log('User data loaded:', userObject);
          console.log('User document from Firestore:', userData);
          
          setUser(userObject);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Fallback to basic user data
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email,
            role: 'staff',
            permissions: ['view', 'edit']
          });
          setIsAuthenticated(true);
        }
      } else {
        // User is signed out
        setUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      const result = await firebaseAuth.login(email, password);
      if (result.success) {
        setUser(result.user);
        setIsAuthenticated(true);
      }
      return result;
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Login failed' };
    }
  };

  const logout = async () => {
    try {
      await firebaseAuth.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const createUser = async (email, password, userData) => {
    try {
      const result = await firebaseAuth.createUser(email, password, userData);
      return result;
    } catch (error) {
      console.error('Create user error:', error);
      return { success: false, message: 'Failed to create user' };
    }
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.permissions && user.permissions.includes(permission);
  };

  const isAdmin = () => {
    return user && user.role === 'admin';
  };

  const getUserRole = () => {
    return user ? user.role : 'guest';
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    createUser,
    hasPermission,
    isAdmin,
    getUserRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
