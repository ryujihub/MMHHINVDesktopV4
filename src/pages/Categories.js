import React, { useState } from 'react';
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
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { useInventory } from '../contexts/InventoryContext.js';
import { useAuth } from '../contexts/AuthContext.js';

const Categories = () => {
  const { categories, products, addCategory, updateCategory, deleteCategory } = useInventory();
  const { hasPermission } = useAuth();
  
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  // DataGrid columns
  const columns = [
    { field: 'name', headerName: 'Category Name', width: 200 },
    { field: 'description', headerName: 'Description', width: 300 },
    { 
      field: 'productCount', 
      headerName: 'Products', 
      width: 120,
      valueGetter: (params) => {
        return products.filter(p => p.category === params.row.name).length;
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          {hasPermission('edit') && (
            <Tooltip title="Edit">
              <IconButton
                size="small"
                onClick={() => handleEdit(params.row)}
                color="primary"
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
          )}
          {hasPermission('all') && (
            <Tooltip title="Delete">
              <IconButton
                size="small"
                onClick={() => handleDelete(params.row.id)}
                color="error"
                disabled={products.some(p => p.category === params.row.name)}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )
    }
  ];

  const handleOpenDialog = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData(category);
    } else {
      setEditingCategory(null);
      setFormData({ name: '', description: '' });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCategory(null);
  };

  const handleEdit = (category) => {
    handleOpenDialog(category);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      setSnackbar({
        open: true,
        message: 'Category name is required',
        severity: 'error'
      });
      return;
    }

    try {
      if (editingCategory) {
        updateCategory(editingCategory.id, formData);
        setSnackbar({
          open: true,
          message: 'Category updated successfully',
          severity: 'success'
        });
      } else {
        addCategory(formData);
        setSnackbar({
          open: true,
          message: 'Category added successfully',
          severity: 'success'
        });
      }
      handleCloseDialog();
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'An error occurred',
        severity: 'error'
      });
    }
  };

  const handleDelete = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    const productCount = products.filter(p => p.category === category.name).length;
    
    if (productCount > 0) {
      setSnackbar({
        open: true,
        message: `Cannot delete category with ${productCount} products. Please reassign products first.`,
        severity: 'warning'
      });
      return;
    }

    if (window.confirm('Are you sure you want to delete this category?')) {
      deleteCategory(categoryId);
      setSnackbar({
        open: true,
        message: 'Category deleted successfully',
        severity: 'success'
      });
    }
  };

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1, color: '#3b82f6' }}>
            Categories
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Organize your products into logical categories for better inventory management
          </Typography>
        </Box>
        {hasPermission('edit') && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ 
              backgroundColor: '#3b82f6',
              '&:hover': {
                backgroundColor: '#2563eb'
              }
            }}
          >
            Add Category
          </Button>
        )}
      </Box>

      {/* Categories DataGrid */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <DataGrid
            rows={categories}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            disableSelectionOnClick
            autoHeight
            sx={{
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid #e5e7eb'
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f8fafc',
                borderBottom: '2px solid #e5e7eb'
              }
            }}
          />
        </CardContent>
      </Card>

      {/* Add/Edit Category Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCategory ? 'Edit Category' : 'Add New Category'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Category Name *"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            margin="normal"
            required
            placeholder="e.g., Tools, Hardware, Electrical"
          />
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            margin="normal"
            multiline
            rows={3}
            placeholder="Describe what products belong in this category"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" sx={{ backgroundColor: '#3b82f6' }}>
            {editingCategory ? 'Update' : 'Add'} Category
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

export default Categories;
