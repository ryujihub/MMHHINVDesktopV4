import React, { createContext, useContext, useState, useEffect } from 'react';
import { firebaseData } from '../services/firebaseData.js';
import { useAuth } from './AuthContext.js';

const InventoryContext = createContext();

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};

export const InventoryProvider = ({ children }) => {
  const { user } = useAuth();
  // State for all inventory data
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]); // Rename sales state to orders
  const [loading, setLoading] = useState(true);

  // CRUD Operations for Products
  const addProduct = async (product) => {
    try {
      const currentStock = product.currentStock || 0;
      const targetStock = product.minimumStock || 0; // Assuming minimumStock is Target Stock
      const targetGap = targetStock - currentStock;

      const productWithDefaults = {
        ...product,
        physicalCount: currentStock, // Default physicalCount to currentStock
        inventoryVariance: 0, // Default inventoryVariance to 0
        targetGap: targetGap, // Calculate initial targetGap
      };
      const newProduct = await firebaseData.products.add(productWithDefaults);
      setProducts(prev => [...prev, newProduct]);
      // Log activity
      try {
        await firebaseData.activity.add({
          type: 'product.add',
          message: `New product added: ${product.name}`,
          entityType: 'product',
          entityId: newProduct.id,
          userId: user?.uid || null,
          userName: user?.name || user?.email || 'Unknown'
        });
      } catch (_) {}
      return newProduct;
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  };

  const updateProduct = async (id, updates) => {
    try {
      await firebaseData.products.update(id, updates);
      
      // Update local state and get updated product
      let updatedProduct;
      setProducts(prev => {
        const newProducts = prev.map(product => {
          if (product.id === id) {
            updatedProduct = { ...product, ...updates };
            return updatedProduct;
          }
          return product;
        });
        return newProducts;
      });


      // Log activity
      try {
        await firebaseData.activity.add({
          type: 'product.update',
          message: `Product updated: ${updates.name || id}`,
          entityType: 'product',
          entityId: id,
          userId: user?.uid || null,
          userName: user?.name || user?.email || 'Unknown'
        });
      } catch (_) {}
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  };

  const deleteProduct = async (id) => {
    try {
      await firebaseData.products.delete(id);
      setProducts(prev => prev.filter(product => product.id !== id));
      // Log activity
      try {
        await firebaseData.activity.add({
          type: 'product.delete',
          message: `Product deleted: ${id}`,
          entityType: 'product',
          entityId: id,
          userId: user?.uid || null,
          userName: user?.name || user?.email || 'Unknown'
        });
      } catch (_) {}
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  };

  // CRUD Operations for Categories
  const addCategory = async (category) => {
    try {
      const newCategory = await firebaseData.categories.add(category);
      setCategories(prev => [...prev, newCategory]);
      try {
        await firebaseData.activity.add({
          type: 'category.add',
          message: `New category added: ${category.name}`,
          entityType: 'category',
          entityId: newCategory.id,
          userId: user?.uid || null,
          userName: user?.name || user?.email || 'Unknown'
        });
      } catch (_) {}
      return newCategory;
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  };

  const updateCategory = async (id, updates) => {
    try {
      await firebaseData.categories.update(id, updates);
      setCategories(prev => prev.map(category => 
        category.id === id ? { ...category, ...updates } : category
      ));
      try {
        await firebaseData.activity.add({
          type: 'category.update',
          message: `Category updated: ${updates.name || id}`,
          entityType: 'category',
          entityId: id,
          userId: user?.uid || null,
          userName: user?.name || user?.email || 'Unknown'
        });
      } catch (_) {}
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  };

  const deleteCategory = async (id) => {
    try {
      await firebaseData.categories.delete(id);
      setCategories(prev => prev.filter(category => category.id !== id));
      try {
        await firebaseData.activity.add({
          type: 'category.delete',
          message: `Category deleted: ${id}`,
          entityType: 'category',
          entityId: id,
          userId: user?.uid || null,
          userName: user?.name || user?.email || 'Unknown'
        });
      } catch (_) {}
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  };

  // Function to update physical count and calculate inventory variance
  const updatePhysicalCount = async (productId, newPhysicalCount) => {
    try {
      const productToUpdate = products.find(p => p.id === productId);
      if (!productToUpdate) {
        console.error('Product not found:', productId);
        return;
      }

      const currentStock = productToUpdate.currentStock || 0;
      const inventoryVariance = newPhysicalCount - currentStock;

      await firebaseData.products.update(productId, {
        physicalCount: newPhysicalCount,
        inventoryVariance: inventoryVariance,
      });

      setProducts(prev => prev.map(product =>
        product.id === productId
          ? { ...product, physicalCount: newPhysicalCount, inventoryVariance: inventoryVariance }
          : product
      ));

      // Log activity
      try {
        await firebaseData.activity.add({
          type: 'inventory.physicalCountUpdate',
          message: `Physical count updated for ${productToUpdate.name || productId}. New count: ${newPhysicalCount}, Variance: ${inventoryVariance}`,
          entityType: 'product',
          entityId: productId,
          userId: user?.uid || null,
          userName: user?.name || user?.email || 'Unknown'
        });
      } catch (_) {}

    } catch (error) {
      console.error('Error updating physical count:', error);
      throw error;
    }
  };

  // Inventory Management
  const updateStock = async (productId, quantity, type = 'add') => {
    try {
      const productToUpdate = products.find(p => p.id === productId);
      if (!productToUpdate) {
        console.error('Product not found:', productId);
        return;
      }

      const newCurrentStock = type === 'add' 
        ? (productToUpdate.currentStock || 0) + quantity 
        : (productToUpdate.currentStock || 0) - quantity;
      const safeNewCurrentStock = Math.max(0, newCurrentStock);

      const targetStock = productToUpdate.minimumStock || 0;
      const newTargetGap = targetStock - safeNewCurrentStock;
      
      // Inventory Variance is only updated by physical count, not sales
      const newInventoryVariance = (productToUpdate.physicalCount || 0) - safeNewCurrentStock;

      await firebaseData.products.update(productId, {
        currentStock: safeNewCurrentStock,
        targetGap: newTargetGap,
        inventoryVariance: newInventoryVariance,
      });

      setProducts(prev => prev.map(product =>
        product.id === productId
          ? { 
              ...product, 
              currentStock: safeNewCurrentStock, 
              targetGap: newTargetGap,
              inventoryVariance: newInventoryVariance,
            }
          : product
      ));

      // Log activity for stock update
      try {
        await firebaseData.activity.add({
          type: `stock.${type}`,
          message: `${type === 'add' ? 'Added' : 'Deducted'} ${quantity} units for ${productToUpdate.name || productId}. New stock: ${safeNewCurrentStock}`,
          entityType: 'product',
          entityId: productId,
          userId: user?.uid || null,
          userName: user?.name || user?.email || 'Unknown'
        });
      } catch (_) {}

    } catch (error) {
      console.error('Error updating stock:', error);
      throw error;
    }
  };

  const recordSale = async (items) => {
    try {
      for (const item of items) {
        await updateStock(item.productId, item.quantity, 'deduct');
      }
      // Optionally, add a log for the entire sale transaction
      try {
        await firebaseData.activity.add({
          type: 'sale.recorded',
          message: `Sale recorded for multiple items.`,
          entityType: 'sale',
          userId: user?.uid || null,
          userName: user?.name || user?.email || 'Unknown'
        });
      } catch (_) {}
    } catch (error) {
      console.error('Error recording sale:', error);
      throw error;
    }
  };

  const getLowStockProducts = () => {
    return (products || []).filter(product => (product.currentStock || 0) <= (product.reorderPoint || 0));
  };

  const searchProducts = (query) => {
    const lowercaseQuery = query.toLowerCase();
    return products.filter(product => 
      product.name.toLowerCase().includes(lowercaseQuery) ||
      product.sku.toLowerCase().includes(lowercaseQuery) ||
      product.category.toLowerCase().includes(lowercaseQuery)
    );
  };

  const getProductById = (id) => {
    return products.find(product => product.id === id);
  };

  // Load data from Firebase on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load all data in parallel
        const [productsData, categoriesData, ordersData] = await Promise.all([
          firebaseData.products.getAll(),
          firebaseData.categories.getAll(),
          firebaseData.sales.getAll(), // Load orders data (firebaseData.sales now points to 'orders' collection)
        ]);
        
        console.log('Fetched productsData:', productsData);
        console.log('Fetched categoriesData:', categoriesData);
        console.log('Fetched ordersData:', ordersData);

        // Process orders data to include 'date' and 'total' fields
        const processedOrders = ordersData.map(order => {
          // Ensure product name and category are available for reporting
          const itemsWithProductInfo = (order.items || []).map(item => {
            let productId = item.id;
            let product = null;
            let productName = item.name || 'Unknown Product';
            let category = 'Uncategorized';

            if (!item.id) {
              console.warn(`Item in order ${order.id} has undefined ID. Generating a fallback productId.`);
              productId = `unknown-product-${item.name || 'no-name'}-${Math.random().toString(36).substring(7)}`;
            } else {
              product = productsData.find(p => p.id === item.id);
              if (product) {
                productName = product.name;
                category = product.category || 'Uncategorized';
              } else {
                console.warn(`Product with ID ${item.id} not found in inventory for order ${order.id}. Using item.name as product name.`);
              }
            }

            return {
              ...item, // Return the original item properties
              productId,
              productName,
              category,
            };
          });

          return {
            ...order,
            date: order.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            total: itemsWithProductInfo.reduce((sum, item) => {
              const price = item.price || 0; // Use item.price from the processed item
              return sum + (item.quantity || 0) * price;
            }, 0),
            items: itemsWithProductInfo,
          };
        });

        setProducts(productsData);
        setCategories(categoriesData);
        setOrders(processedOrders); // Set processed orders data
      } catch (error) {
        console.error('Error loading data:', error);
        // Set empty arrays if Firebase is not available
        setProducts([]);
        setCategories([]);
        setOrders([]); // Also set orders to empty array on error
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const value = {
    // Data
    products,
    categories,
    orders, // Include orders in context value
    loading,
    
    // Product operations
    addProduct,
    updateProduct,
    deleteProduct,
    getProductById,
    searchProducts,
    
    // Category operations
    addCategory,
    updateCategory,
    deleteCategory,
    
    // Inventory operations
    updateStock,
    getLowStockProducts,
    updatePhysicalCount,
    recordSale, // Add recordSale to context value
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );

};
