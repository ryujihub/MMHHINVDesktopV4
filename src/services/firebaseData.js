import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { db } from '../config/firebase.js';

// Firebase data service
export const firebaseData = {
  // Products
  products: {
    // Get all products
    async getAll() {
      try {
        const querySnapshot = await getDocs(collection(db, 'inventory'));
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (error) {
        console.error('Error getting products:', error);
        throw error;
      }
    },

    // Get product by ID
    async getById(id) {
      try {
        const docRef = doc(db, 'inventory', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
      } catch (error) {
        console.error('Error getting product:', error);
        throw error;
      }
    },

async add(productData) {
  // Set expectedStock to currentStock initially
  const expectedStock = productData.currentStock || 0; // Default to 0 if not provided
      try {
        const docRef = await addDoc(collection(db, 'inventory'), {
          ...productData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        return { id: docRef.id, ...productData };
      } catch (error) {
        console.error('Error adding product:', error);
        throw error;
      }
    },

    // Update product
    async update(id, updates) {
      try {
        const docRef = doc(db, 'inventory', id);
        await updateDoc(docRef, {
          ...updates,
          updatedAt: serverTimestamp()
        });
        return { success: true };
      } catch (error) {
        console.error('Error updating product:', error);
        throw error;
      }
    },

    // Delete product
    async delete(id) {
      try {
        await deleteDoc(doc(db, 'inventory', id));
        return { success: true };
      } catch (error) {
        console.error('Error deleting product:', error);
        throw error;
      }
    },

    // Search products
    async search(query) {
      try {
        const q = query(
          collection(db, 'inventory'),
          where('name', '>=', query),
          where('name', '<=', query + '\uf8ff')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (error) {
        console.error('Error searching products:', error);
        throw error;
      }
    }
  },

  // Categories
  categories: {
    async getAll() {
      try {
        const querySnapshot = await getDocs(collection(db, 'categories'));
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (error) {
        console.error('Error getting categories:', error);
        throw error;
      }
    },

    async add(categoryData) {
      try {
        const docRef = await addDoc(collection(db, 'categories'), {
          ...categoryData,
          createdAt: serverTimestamp()
        });
        return { id: docRef.id, ...categoryData };
      } catch (error) {
        console.error('Error adding category:', error);
        throw error;
      }
    },

    async update(id, updates) {
      try {
        const docRef = doc(db, 'categories', id);
        await updateDoc(docRef, updates);
        return { success: true };
      } catch (error) {
        console.error('Error updating category:', error);
        throw error;
      }
    },

    async delete(id) {
      try {
        await deleteDoc(doc(db, 'categories', id));
        return { success: true };
      } catch (error) {
        console.error('Error deleting category:', error);
        throw error;
      }
    }
  },

  // Activity feed
  activity: {
    async add(activity) {
      try {
        const docRef = await addDoc(collection(db, 'activity'), {
          ...activity,
          createdAt: serverTimestamp()
        });
        return { id: docRef.id, ...activity };
      } catch (error) {
        console.error('Error adding activity:', error);
        throw error;
      }
    },

    async getRecent(limitCount = 10) {
      try {
        const q = query(collection(db, 'activity'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.slice(0, limitCount).map(d => ({ id: d.id, ...d.data() }));
      } catch (error) {
        console.error('Error fetching recent activity:', error);
        return [];
      }
    }
  },

  // Sales (Completed Orders)
  sales: { // Keeping the object name as 'sales' for consistency with useInventory context, but it will now interact with 'orders' collection
    async getAll() {
      try {
        const querySnapshot = await getDocs(collection(db, 'orders')); // Changed from 'sales' to 'orders'
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (error) {
        console.error('Error getting orders:', error); // Changed log message
        throw error;
      }
    },

    async add(saleData) {
      try {
        const docRef = await addDoc(collection(db, 'orders'), { // Changed from 'sales' to 'orders'
          ...saleData,
          createdAt: serverTimestamp()
        });
        return { id: docRef.id, ...saleData };
      } catch (error) {
        console.error('Error adding order:', error); // Changed log message
        throw error;
      }
    },

    async update(id, updates) {
      try {
        const docRef = doc(db, 'orders', id); // Changed from 'sales' to 'orders'
        await updateDoc(docRef, updates);
        return { success: true };
      } catch (error) {
        console.error('Error updating order:', error); // Changed log message
        throw error;
      }
    },

    async delete(id) {
      try {
        await deleteDoc(doc(db, 'orders', id)); // Changed from 'sales' to 'orders'
        return { success: true };
      } catch (error) {
        console.error('Error deleting order:', error); // Changed log message
        throw error;
      }
    }
  }
};
