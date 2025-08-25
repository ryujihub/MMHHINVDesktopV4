import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { firebaseAuth } from '../services/firebaseAuth.js';

// Function to set up current user as admin
export const setupCurrentUserAsAdmin = async () => {
  try {
    const currentUser = firebaseAuth.getCurrentUser();
    
    if (!currentUser) {
      console.error('No user is currently signed in');
      return { success: false, message: 'No user signed in' };
    }

    // Check if user document already exists
    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    let userData = {};
    if (userDoc.exists()) {
      userData = userDoc.data();
      console.log('Existing user data:', userData);
    }

    // Update or create user document with admin role
    const updatedUserData = {
      ...userData,
      uid: currentUser.uid,
      email: currentUser.email,
      name: userData.name || currentUser.displayName || currentUser.email,
      role: 'admin',
      permissions: ['view', 'edit', 'delete', 'admin'],
      updatedAt: new Date().toISOString(),
      createdAt: userData.createdAt || new Date().toISOString()
    };

    await setDoc(userDocRef, updatedUserData);
    
    console.log('User set as admin successfully:', updatedUserData);
    
    return { 
      success: true, 
      message: 'User role updated to admin',
      userData: updatedUserData
    };
    
  } catch (error) {
    console.error('Error setting up admin user:', error);
    return { 
      success: false, 
      message: `Error: ${error.message}` 
    };
  }
};

// Function to check current user's role
export const checkCurrentUserRole = async () => {
  try {
    const currentUser = firebaseAuth.getCurrentUser();
    
    if (!currentUser) {
      return { success: false, message: 'No user signed in' };
    }

    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return { 
        success: true, 
        userData,
        message: `Current user role: ${userData.role || 'not set'}`
      };
    } else {
      return { 
        success: false, 
        message: 'User document not found in Firestore' 
      };
    }
    
  } catch (error) {
    console.error('Error checking user role:', error);
    return { 
      success: false, 
      message: `Error: ${error.message}` 
    };
  }
};
