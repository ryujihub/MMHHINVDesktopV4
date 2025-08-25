import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyABZw1Jk2WdOFqmp2ww8lYV0DBdcVR50GI",
  authDomain: "hardwareinventory-65123.firebaseapp.com",
  projectId: "hardwareinventory-65123",
  storageBucket: "hardwareinventory-65123.firebasestorage.app",
  messagingSenderId: "1006715726520",
  appId: "1:1006715726520:web:13897a36fb527e8194224d",
  measurementId: "G-Y4ZHE3GBN5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
