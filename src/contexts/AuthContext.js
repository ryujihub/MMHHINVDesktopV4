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
          // Check if this is during user creation process
          const isUserCreationProcess = sessionStorage.getItem('userCreationInProgress');

          if (isUserCreationProcess) {
            console.log('User creation in progress, skipping automatic login for new user');
            // Don't change current user state during user creation
            setLoading(false);
            return;
          }

          // Get user profile from Firestore to get role and permissions
          const { getDoc, doc, setDoc } = await import('firebase/firestore');
          const { db } = await import('../config/firebase.js');

          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          let userData = {};

          if (userDoc.exists()) {
            userData = userDoc.data();
          } else {
            // Only create user document for actual sign-ins, not during user creation
            console.log('Creating new user document for:', firebaseUser.email);
            const defaultUserData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || firebaseUser.email,
              role: 'admin', // Default to admin for first user
              permissions: ['view', 'edit', 'delete', 'admin'],
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString(),
              loginCount: 1
            };

            try {
              await setDoc(userDocRef, defaultUserData);
              userData = defaultUserData;
              console.log('User document created successfully');
            } catch (error) {
              console.error('Error creating user document:', error);
              // Continue with basic user data as fallback
            }
          }

          // User is signed in
          const userObject = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: userData.name || firebaseUser.displayName || firebaseUser.email,
            role: userData.role || 'admin', // Default to admin if not set
            permissions: userData.permissions || ['view', 'edit'],
            createdAt: userData.createdAt || null,
            lastLogin: userData.lastLogin || null,
            loginCount: userData.loginCount || 0
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
            role: 'admin', // Default to admin as fallback
            permissions: ['view', 'edit'],
            createdAt: null,
            lastLogin: new Date().toISOString(),
            loginCount: 0
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
        // Ensure the user object includes all necessary fields
        const userWithDefaults = {
          ...result.user,
          createdAt: result.user.createdAt || null,
          lastLogin: result.user.lastLogin || new Date().toISOString(),
          loginCount: result.user.loginCount || 0
        };
        setUser(userWithDefaults);
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
      // Check if current user is admin - SECURITY REQUIREMENT
      if (!isAdmin()) {
        return { success: false, message: 'Unauthorized: Admin access required to create users' };
      }

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
