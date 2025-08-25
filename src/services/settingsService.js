import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase.js';

const SETTINGS_DOC_ID = 'general'; // Fixed document ID for general settings

export const settingsService = {
  // Get general settings
  async getGeneralSettings() {
    try {
      const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      }
      
      // Return default settings if none exist
      return {
        companyName: 'MMH Hardware',
        currency: 'PHP',
        dateFormat: 'MM/DD/YYYY',
        emailNotifications: true,
        backupFrequency: 'daily',
        updatedAt: new Date().toISOString(),
        updatedBy: null
      };
    } catch (error) {
      console.error('Error getting settings:', error);
      throw error;
    }
  },

  // Update general settings
  async updateGeneralSettings(settings, userId) {
    try {
      const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
      await setDoc(docRef, {
        ...settings,
        updatedAt: new Date().toISOString(),
        updatedBy: userId
      }, { merge: true });
      return true;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }
};
