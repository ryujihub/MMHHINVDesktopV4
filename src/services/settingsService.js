import { doc, getDoc, setDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
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
  },

  // Backup all data
  async backupAllData() {
    try {
      const backupData = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        collections: {}
      };

      // Collections to backup
      const collections = ['inventory', 'categories', 'orders', 'users', 'settings', 'activity'];

      for (const collectionName of collections) {
        try {
          const querySnapshot = await getDocs(collection(db, collectionName));
          backupData.collections[collectionName] = [];

          querySnapshot.forEach((doc) => {
            backupData.collections[collectionName].push({
              id: doc.id,
              ...doc.data()
            });
          });
        } catch (error) {
          console.warn(`Failed to backup collection ${collectionName}:`, error);
          backupData.collections[collectionName] = [];
        }
      }

      return backupData;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  },

  // Restore data from backup
  async restoreFromBackup(backupData, userId) {
    try {
      const batch = writeBatch(db);

      // Restore each collection
      for (const [collectionName, documents] of Object.entries(backupData.collections)) {
        if (!Array.isArray(documents)) continue;

        for (const docData of documents) {
          const { id, ...data } = docData;
          const docRef = doc(db, collectionName, id);

          // Add metadata for restored documents
          const restoredData = {
            ...data,
            restoredAt: new Date().toISOString(),
            restoredBy: userId,
            backupTimestamp: backupData.timestamp
          };

          batch.set(docRef, restoredData);
        }
      }

      await batch.commit();
      return { success: true, message: 'Data restored successfully' };
    } catch (error) {
      console.error('Error restoring backup:', error);
      throw error;
    }
  },

  // Export backup as JSON file
  async exportBackup() {
    try {
      const backupData = await this.backupAllData();

      const dataStr = JSON.stringify(backupData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });

      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mmh-backup-${new Date().toISOString().split('T')[0]}.json`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return { success: true, message: 'Backup exported successfully' };
    } catch (error) {
      console.error('Error exporting backup:', error);
      throw error;
    }
  },

  // Import backup from file
  async importBackup(file, userId) {
    try {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (e) => {
          try {
            const backupData = JSON.parse(e.target.result);

            // Validate backup structure
            if (!backupData.collections || !backupData.timestamp) {
              throw new Error('Invalid backup file format');
            }

            const result = await this.restoreFromBackup(backupData, userId);
            resolve(result);
          } catch (parseError) {
            reject(new Error('Failed to parse backup file: ' + parseError.message));
          }
        };

        reader.onerror = () => {
          reject(new Error('Failed to read backup file'));
        };

        reader.readAsText(file);
      });
    } catch (error) {
      console.error('Error importing backup:', error);
      throw error;
    }
  }
};
