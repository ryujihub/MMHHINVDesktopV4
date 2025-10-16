import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileUpload as UploadIcon,
  FileDownload as DownloadIcon,
  Search as SearchIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { useInventory } from '../contexts/InventoryContext.js';
import { useAuth } from '../contexts/AuthContext.js';
import { useLocation } from 'react-router-dom';

const Products = () => {
  const { products, categories, loading, addProduct, updateProduct, deleteProduct, updatePhysicalCount } = useInventory();
  const { hasPermission } = useAuth();
  const location = useLocation();
  
  // Debug logging
  console.log('Products loaded:', products);
  console.log('Categories loaded:', categories);

  console.log('Loading state:', loading);
  
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(''); // New state for category filter
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [isFullscreen, setIsFullscreen] = useState(false); // New state for fullscreen mode
  const [formData, setFormData] = useState({
    name: '',
    productCode: '',
    category: '',
    price: '',
    currentStock: '0',
    minimumStock: '0',
    physicalCount: '0', // Add physicalCount to initial state
    variance: 0,
    variancePercentage: 0,
    unit: '',
    description: '',
    location: '',
    createdAt: null,
    lastUpdated: null
  });

  // Calculate variance between current stock and minimum stock (total stock)
  const calculateVariance = (currentStock, minimumStock) => {
    const current = parseInt(currentStock) || 0;
    const total = parseInt(minimumStock) || 0;

    // Calculate how many items are missing from total stock
    const variance = current - total;
    const variancePercentage = total === 0 ? 0 : (variance / total) * 100;

    return {
      variance,
      variancePercentage,
      status: variance === 0 ? 'MATCH' : variance > 0 ? 'EXCESS' : 'MISSING'
    };
  };

  // Filtered products based on search and category
  const filteredProducts = useMemo(() => {
    let currentProducts = products;

    // Apply search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      currentProducts = currentProducts.filter(product =>
        (product.name && product.name.toLowerCase().includes(query)) ||
        (product.sku && product.sku.toLowerCase().includes(query)) ||
        (product.productCode && product.productCode.toLowerCase().includes(query)) ||
        (product.category && product.category.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (selectedCategory) {
      currentProducts = currentProducts.filter(product =>
        product.category === selectedCategory
      );
    }

    return currentProducts;
  }, [products, searchQuery, selectedCategory]);

  // Define handler functions first
  const handleEdit = (product) => {
    console.log('Editing product:', product);
    handleOpenDialog(product);
  };

  const handleDelete = (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteProduct(productId);
      setSnackbar({
        open: true,
        message: 'Product deleted successfully',
        severity: 'success'
      });
    }
  };

  // DataGrid columns
  const columns = [
    { 
      field: 'sku', 
      headerName: 'Product Code', 
      width: 100,
      valueGetter: (params) => params.row.productCode || params.row.sku || ''
    },
    { field: 'name', headerName: 'Product Name', width: 200 },
    { field: 'category', headerName: 'Category', width: 130 },

    { 
      field: 'price', 
      headerName: 'Cost Price', 
      width: 100,
      valueFormatter: (params) => {
        if (params.value == null || params.value === undefined) return '₱0.00';
        return `₱${Number(params.value).toFixed(2)}`;
      }
    },
    { field: 'currentStock', headerName: 'Current Stock', width: 100 },
    { field: 'minimumStock', headerName: 'Target Stock', width: 100 },
    {
      field: 'targetGap',
      headerName: 'Target Gap',
      width: 100,
      renderCell: (params) => {
        const targetGap = params.row.targetGap || 0;
        let color = 'default';
        let label = 'No Gap';

        if (targetGap > 0) {
          color = 'warning'; // Orange/Red if stock is below target
          label = `Gap: ${targetGap}`;
        } else if (targetGap <= 0) {
          color = 'success'; // Green if stock meets/exceeds target
          label = `OK`;
        }

        return (
          <Tooltip title={`Target Stock: ${params.row.minimumStock || 0}, Current Stock: ${params.row.currentStock || 0}`}>
            <Chip label={label} color={color} size="small" />
          </Tooltip>
        );
      }
    },
    {
      field: 'physicalCount',
      headerName: 'Physical Count',
      width: 120,
      renderCell: (params) => (
        <TextField
          value={params.row.physicalCount || ''}
          type="number"
          size="small"
          onChange={(e) => updatePhysicalCount(params.row.id, parseInt(e.target.value) || 0)}
          inputProps={{ min: 0 }}
        />
      ),
    },
    {
      field: 'inventoryVariance',
      headerName: 'Inventory Variance',
      width: 130,
      renderCell: (params) => {
        const inventoryVariance = params.row.inventoryVariance || 0;
        let color = 'default';
        let label = 'No Variance';

        if (inventoryVariance < 0) {
          color = 'error'; // Red if missing
          label = `Missing: ${Math.abs(inventoryVariance)}`;
        } else if (inventoryVariance > 0) {
          color = 'success'; // Green if excess
          label = `Excess: +${inventoryVariance}`;
        } else {
          color = 'default'; // Gray if no variance
          label = 'No Variance';
        }

        return (
          <Tooltip title={`Physical Count: ${params.row.physicalCount || 0}, Current Stock: ${params.row.currentStock || 0}`}>
            <Chip label={label} color={color} size="small" />
          </Tooltip>
        );
      }
    },
    { field: 'unit', headerName: 'Unit', width: 80 },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 100,
      renderCell: (params) => {
        const stock = params.row.currentStock || 0;
        const reorderPoint = params.row.reorderPoint || 0;
        let color = 'default';
        let label = 'In Stock';
        
        if (stock === 0) {
          color = 'error';
          label = 'Out of Stock';
        } else if (stock <= reorderPoint) {
          color = 'warning';
          label = 'Low Stock';
        }
        
        return <Chip label={label} color={color} size="small" />;
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
    <Box sx={{ p: 2 }}>
          {hasPermission('edit') && (
            <IconButton
              size="small"
              onClick={() => handleEdit(params.row)}
              color="primary"
            >
              <EditIcon />
            </IconButton>
          )}
          {hasPermission('all') && (
            <IconButton
              size="small"
              onClick={() => handleDelete(params.row.id)}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          )}
        </Box>
      ),
    }
  ];

  const handleOpenDialog = (product = null) => {
    if (product) {
      setEditingProduct(product);
      // Map productCode to sku for the form if it exists
      setFormData({
        ...product,
        sku: product.productCode || product.sku || '',
        physicalCount: product.physicalCount || '', // Populate physicalCount
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        sku: '',
        category: '',
        price: '',
        currentStock: '',
        minimumStock: '',
        reorderPoint: '',
        unit: '',
        description: '',
        location: '',
        physicalCount: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProduct(null);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    // Validation
    if (!formData.name || !formData.category) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields (Name, Category)',
        severity: 'error'
      });
      return;
    }

    // Auto-generate product code if not provided
    let finalProductCode = formData.sku;
    if (!finalProductCode) {
      const timestamp = Date.now().toString().slice(-6);
      const prefix = formData.name.substring(0, 3).toUpperCase();
      const categoryPrefix = formData.category ? formData.category.substring(0, 2).toUpperCase() : '';
      finalProductCode = `${categoryPrefix}${prefix}${timestamp}`;
    }

    // Check if product code already exists (for new products)
    if (!editingProduct) {
      const existingProduct = products.find(p => p.sku === finalProductCode);
      if (existingProduct) {
        setSnackbar({
          open: true,
          message: 'Product code already exists. Please use a different code.',
          severity: 'error'
        });
        return;
      }
    }

    // Prepare data with proper type conversion and field mapping
    const productData = {
      ...formData,
      sku: finalProductCode,
      productCode: finalProductCode, // Add the Firebase field
      price: formData.price ? Number(formData.price) : 0,
      currentStock: formData.currentStock ? Number(formData.currentStock) : 0,
      physicalCount: formData.physicalCount ? Number(formData.physicalCount) : 0, // Include physicalCount
      reorderPoint: formData.reorderPoint ? Number(formData.reorderPoint) : 0,
      minimumStock: formData.minimumStock ? Number(formData.minimumStock) : 0
    };

    try {
      if (editingProduct) {
        updateProduct(editingProduct.id, productData);
        setSnackbar({
          open: true,
          message: 'Product updated successfully',
          severity: 'success'
        });
      } else {
        addProduct(productData);
        setSnackbar({
          open: true,
          message: 'Product added successfully',
          severity: 'success'
        });
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving product:', error);
      setSnackbar({
        open: true,
        message: 'An error occurred while saving the product',
        severity: 'error'
      });
    }
  };

  const handleImport = () => {
    setSnackbar({
      open: true,
      message: 'Import functionality is currently disabled.',
      severity: 'info'
    });
  };

  const handleExport = () => {
    setSnackbar({
      open: true,
      message: 'Export functionality is currently disabled.',
      severity: 'info'
    });
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Handle escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    } else {
      document.body.style.overflow = 'unset'; // Restore scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isFullscreen]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Compact Search and Filter Bar - Hidden in fullscreen */}
      {!isFullscreen && (
        <Box sx={{ display: 'flex', gap: 2, mb: 1, alignItems: 'center', flexShrink: 0 }}>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            sx={{ minWidth: 250 }}
          />
          <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Category</InputLabel>
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              label="Filter by Category"
            >
              <MenuItem value="">
                <em>All Categories</em>
              </MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.name}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {hasPermission('edit') && (
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{
                backgroundColor: '#3b82f6',
                '&:hover': {
                  backgroundColor: '#2563eb'
                }
              }}
            >
              Add Product
            </Button>
          )}
          <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Table"}>
            <IconButton
              onClick={toggleFullscreen}
              sx={{
                color: isFullscreen ? '#f59e0b' : '#6b7280',
                '&:hover': {
                  backgroundColor: isFullscreen ? '#fef3c7' : '#f3f4f6',
                }
              }}
            >
              {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* Fullscreen Mode Header */}
      {isFullscreen && (
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          backgroundColor: '#f8f9fa',
          borderBottom: '1px solid #e0e0e0',
          flexShrink: 0
        }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Products Inventory - Fullscreen View
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {filteredProducts.length} products • Press ESC to exit fullscreen
            </Typography>
            <Tooltip title="Exit Fullscreen">
              <IconButton
                onClick={toggleFullscreen}
                sx={{
                  color: '#f59e0b',
                  '&:hover': {
                    backgroundColor: '#fef3c7',
                  }
                }}
              >
                <FullscreenExitIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      )}

      {/* Fullscreen DataGrid */}
      <Box sx={{
        flexGrow: 1,
        minHeight: 0,
        position: isFullscreen ? 'fixed' : 'static',
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        right: isFullscreen ? 0 : 'auto',
        bottom: isFullscreen ? 0 : 'auto',
        zIndex: isFullscreen ? 9999 : 'auto',
        backgroundColor: 'white'
      }}>
        {loading ? (
          <Box sx={{ p: 4, textAlign: 'center', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              Loading products...
            </Typography>
          </Box>
        ) : filteredProducts.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              {searchQuery ? 'No products found matching your search.' : 'No products available. Add your first product to get started!'}
            </Typography>
          </Box>
        ) : (
          <DataGrid
            rows={filteredProducts}
            columns={columns}
            pageSize={25}
            rowsPerPageOptions={[25, 50, 100]}
            disableSelectionOnClick
            sx={{
              height: '100%',
              '& .MuiDataGrid-root': {
                border: 'none',
              },
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid #e0e0e0',
                padding: '12px 16px',
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f5f5f5',
                borderBottom: '2px solid #e0e0e0',
              },
              '& .MuiDataGrid-columnHeaderTitle': {
                fontWeight: 'bold',
              },
              '& .MuiDataGrid-row': {
                '&:nth-of-type(odd)': {
                  backgroundColor: '#fafafa',
                },
                '&:hover': {
                  backgroundColor: '#e3f2fd',
                },
              },
              '& .MuiDataGrid-footerContainer': {
                borderTop: '1px solid #e0e0e0',
              },
            }}
          />
        )}
      </Box>

      {/* Add/Edit Product Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingProduct ? 'Edit Product' : 'Add New Product'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Product Name *"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Product Code"
                value={formData.sku}
                onChange={(e) => handleInputChange('sku', e.target.value)}
                margin="normal"
                placeholder="e.g., HAM001, SCR002 (auto-generated if empty)"
                helperText="Leave empty to auto-generate a unique product code"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  label="Category"
                >
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.name}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Price (₱)"
                type="number"
                value={formData.price}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || isNaN(value)) {
                    handleInputChange('price', '');
                  } else {
                    handleInputChange('price', parseFloat(value));
                  }
                }}
                margin="normal"
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Current Stock"
                type="number"
                value={formData.currentStock}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || isNaN(value)) {
                    handleInputChange('currentStock', '');
                  } else {
                    handleInputChange('currentStock', parseInt(value));
                  }
                }}
                margin="normal"
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Physical Count"
                type="number"
                value={formData.physicalCount}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || isNaN(value)) {
                    handleInputChange('physicalCount', '');
                  } else {
                    handleInputChange('physicalCount', parseInt(value));
                  }
                }}
                margin="normal"
                inputProps={{ min: 0 }}
                helperText="The actual physical count of stock during an audit"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Reorder Point"
                type="number"
                value={formData.reorderPoint}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || isNaN(value)) {
                    handleInputChange('reorderPoint', '');
                  } else {
                    handleInputChange('reorderPoint', parseInt(value));
                  }
                }}
                margin="normal"
                inputProps={{ min: 0 }}
              />
            </Grid>
    <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Target Stock"
                type="number"
                value={formData.minimumStock} // Using minimumStock as Target Stock
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || isNaN(value)) {
                    handleInputChange('minimumStock', '');
                  } else {
                    handleInputChange('minimumStock', parseInt(value));
                  }
                }}
                margin="normal"
                inputProps={{ min: 0 }}
                helperText="The target stock level for reorder purposes"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Unit"
                value={formData.unit}
                onChange={(e) => handleInputChange('unit', e.target.value)}
                margin="normal"
                placeholder="e.g., piece, set, kg"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                margin="normal"
                placeholder="e.g., A1-B2"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                margin="normal"
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" sx={{ backgroundColor: '#3b82f6' }}>
            {editingProduct ? 'Update' : 'Add'} Product
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Products;
