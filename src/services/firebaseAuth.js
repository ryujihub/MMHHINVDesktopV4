import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase.js';

// Authentication service
export const firebaseAuth = {
  // Login with email and password
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get user profile from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        return { success: true, user: { ...user, ...userDoc.data() } };
      }
      
      return { success: true, user };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' 
          ? 'Invalid email or password' 
          : 'Login failed. Please try again.' 
      };
    }
  },

  // Logout
  async logout() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, message: 'Logout failed' };
    }
  },

  // Create new user
  async createUser(email, password, userData) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update profile with display name
      await updateProfile(user, {
        displayName: userData.name
      });
      
      // Save user data to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        name: userData.name,
        email: userData.email,
        role: userData.role || 'staff',
        permissions: userData.permissions || ['view', 'edit'],
        createdAt: new Date().toISOString(),
        ...userData
      });
      
      return { success: true, user };
    } catch (error) {
      console.error('Create user error:', error);
      return { 
        success: false, 
        message: error.code === 'auth/email-already-in-use' 
          ? 'Email already exists' 
          : 'Failed to create user' 
      };
    }
  },

  // Get current user
  getCurrentUser() {
    return auth.currentUser;
  },

  // Listen to auth state changes
  onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback);
  }
};
