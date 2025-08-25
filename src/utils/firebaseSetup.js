import { firebaseData } from '../services/firebaseData';

// Initial data setup for MMH Hardware Inventory
export const setupInitialData = async () => {
  try {
    console.log('Setting up initial data...');

    // Setup initial categories
    const categories = [
      { name: 'Tools', description: 'Hand and power tools' },
      { name: 'Painting', description: 'Paint and painting supplies' },
      { name: 'Plumbing', description: 'Plumbing fixtures and supplies' },
      { name: 'Electrical', description: 'Electrical supplies and fixtures' },
      { name: 'Hardware', description: 'Nuts, bolts, and fasteners' }
    ];

    for (const category of categories) {
      await firebaseData.categories.add(category);
      console.log(`Added category: ${category.name}`);
    }



    // Setup initial products
    const products = [
      {
        name: 'Hammer',
        sku: 'HAM001',
        category: 'Tools',
        price: 25.99,
        cost: 18.50,
        currentStock: 50,
        reorderPoint: 10,
        unit: 'piece',
        description: 'Standard claw hammer',
        location: 'A1-B2'
      },
      {
        name: 'Screwdriver Set',
        sku: 'SCR002',
        category: 'Tools',
        price: 15.99,
        cost: 11.00,
        currentStock: 30,
        reorderPoint: 8,
        unit: 'set',
        description: 'Phillips and flathead screwdrivers',
        location: 'A1-B3'
      },
      {
        name: 'Paint Brush',
        sku: 'PBR003',
        category: 'Painting',
        price: 8.99,
        cost: 5.50,
        currentStock: 100,
        reorderPoint: 20,
        unit: 'piece',
        description: '2-inch paint brush',
        location: 'C1-D1'
      }
    ];

    for (const product of products) {
      await firebaseData.products.add(product);
      console.log(`Added product: ${product.name}`);
    }



    console.log('Initial data setup completed successfully!');
    return true;
  } catch (error) {
    console.error('Error setting up initial data:', error);
    return false;
  }
};

// Function to check if data exists
export const checkDataExists = async () => {
  try {
    const [products, categories] = await Promise.all([
      firebaseData.products.getAll(),
      firebaseData.categories.getAll()
    ]);

    return {
      products: products.length > 0,
      categories: categories.length > 0
    };
  } catch (error) {
    console.error('Error checking data:', error);
    return {
      products: false,
      categories: false
    };
  }
};
