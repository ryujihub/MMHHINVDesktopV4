import React, { useState } from 'react';
import {
  Box, Button, Typography, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, Tooltip,
  Snackbar, Alert, Divider, Paper, Grid, Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { useInventory } from '../contexts/InventoryContext.js';
import { useAuth } from '../contexts/AuthContext.js';

const BLUE = '#3b82f6';

// A gentle palette for category cards
const CARD_COLORS = [
  { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' },
  { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d' },
  { bg: '#fef9c3', border: '#fde68a', text: '#b45309' },
  { bg: '#fdf4ff', border: '#e9d5ff', text: '#7e22ce' },
  { bg: '#fff1f2', border: '#fecdd3', text: '#be123c' },
  { bg: '#f0fdfa', border: '#99f6e4', text: '#0f766e' },
];

export default function Categories() {
  const { categories, products, addCategory, updateCategory, deleteCategory } = useInventory();
  const { hasPermission } = useAuth();

  const [openDialog, setOpenDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });

  const productCountOf = (name) => products.filter(p => p.category === name).length;

  /* ── Dialog ── */
  const openAdd = () => { setEditingCategory(null); setForm({ name: '', description: '' }); setOpenDialog(true); };
  const openEdit = (cat) => { setEditingCategory(cat); setForm({ name: cat.name, description: cat.description || '' }); setOpenDialog(true); };
  const close = () => { setOpenDialog(false); setEditingCategory(null); };

  const submit = async () => {
    if (!form.name.trim()) { setSnack({ open: true, msg: 'Category name is required.', sev: 'error' }); return; }
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, form);
        setSnack({ open: true, msg: 'Category updated!', sev: 'success' });
      } else {
        await addCategory(form);
        setSnack({ open: true, msg: 'Category added!', sev: 'success' });
      }
      close();
    } catch (error) {
      console.error('Error saving category:', error);
      setSnack({ open: true, msg: 'Error saving category.', sev: 'error' });
    }
  };

  const handleDelete = async (cat) => {
    const count = productCountOf(cat.name);
    if (count > 0) { setSnack({ open: true, msg: `Cannot delete — ${count} product(s) still use this category.`, sev: 'warning' }); return; }
    if (window.confirm(`Delete category "${cat.name}"?`)) {
      try {
        await deleteCategory(cat.id);
        setSnack({ open: true, msg: 'Category deleted.', sev: 'success' });
      } catch (error) {
        console.error('Error deleting category:', error);
        setSnack({ open: true, msg: 'Failed to delete category.', sev: 'error' });
      }
    }
  };

  /* ═══════════════════════ RENDER ═══════════════════════ */
  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color={BLUE}>Categories</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {categories.length} {categories.length === 1 ? 'category' : 'categories'} total
          </Typography>
        </Box>
        {hasPermission('edit') && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}
            sx={{ bgcolor: BLUE, '&:hover': { bgcolor: '#2563eb' }, borderRadius: 2, boxShadow: 'none', fontWeight: 600, textTransform: 'none' }}>
            Add Category
          </Button>
        )}
      </Box>

      {/* Empty state */}
      {categories.length === 0 ? (
        <Box sx={{ py: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CategoryIcon sx={{ fontSize: 56, color: '#cbd5e1' }} />
          <Typography variant="h6" color="text.secondary">No categories yet</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360, textAlign: 'center' }}>
            Categories help organise your products. Add your first one to get started.
          </Typography>
          {hasPermission('edit') && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}
              sx={{ mt: 1, bgcolor: BLUE, '&:hover': { bgcolor: '#2563eb' }, borderRadius: 2, boxShadow: 'none', textTransform: 'none' }}>
              Add Category
            </Button>
          )}
        </Box>
      ) : (
        /* Category Cards */
        <Grid container spacing={2}>
          {categories.map((cat, idx) => {
            const color = CARD_COLORS[idx % CARD_COLORS.length];
            const count = productCountOf(cat.name);
            const canDelete = count === 0;
            return (
              <Grid item xs={12} sm={6} md={4} key={cat.id}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    border: `1.5px solid ${color.border}`,
                    bgcolor: color.bg,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    transition: 'box-shadow 0.2s',
                    '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.08)' },
                  }}
                >
                  {/* Top row */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle1" fontWeight={700} sx={{ color: color.text, lineHeight: 1.3 }}>
                        {cat.name}
                      </Typography>
                      {cat.description && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.3 }}>
                          {cat.description}
                        </Typography>
                      )}
                    </Box>

                    {/* Actions */}
                    <Box sx={{ display: 'flex', gap: 0.5, ml: 1, flexShrink: 0 }}>
                      {hasPermission('edit') && (
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEdit(cat)}
                            sx={{ color: color.text, '&:hover': { bgcolor: 'rgba(0,0,0,0.06)' } }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {hasPermission('all') && (
                        <Tooltip title={canDelete ? 'Delete' : `Can't delete — has ${count} products`}>
                          <span>
                            <IconButton size="small" onClick={() => handleDelete(cat)} disabled={!canDelete}
                              sx={{ color: canDelete ? '#ef4444' : '#cbd5e1', '&:hover': { bgcolor: 'rgba(239,68,68,0.08)' } }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                    </Box>
                  </Box>

                  {/* Product count chip */}
                  <Box>
                    <Chip
                      label={count === 0 ? 'No products' : `${count} product${count !== 1 ? 's' : ''}`}
                      size="small"
                      sx={{
                        bgcolor: count > 0 ? color.text : 'transparent',
                        color: count > 0 ? '#fff' : color.text,
                        border: `1px solid ${color.border}`,
                        fontWeight: 600,
                        fontSize: '0.7rem',
                      }}
                    />
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Dialog */}
      <Dialog open={openDialog} onClose={close} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3, boxShadow: '0 20px 60px rgba(0,0,0,0.12)' } }}>
        <DialogTitle sx={{ pb: 0.5 }}>
          <Typography variant="h6" fontWeight={700}>{editingCategory ? 'Edit Category' : 'New Category'}</Typography>
        </DialogTitle>
        <Divider sx={{ mt: 1 }} />
        <DialogContent sx={{ pt: 2.5, pb: 1 }}>
          <TextField
            fullWidth autoFocus label="Category Name *" value={form.name} size="small"
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            placeholder="e.g. Tools, Electrical, Hardware"
            sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
          <TextField
            fullWidth label="Description (optional)" value={form.description} size="small" multiline rows={2}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            placeholder="What products belong here?"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </DialogContent>
        <Divider sx={{ mt: 1 }} />
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={close} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
          <Button onClick={submit} variant="contained"
            sx={{ bgcolor: BLUE, '&:hover': { bgcolor: '#2563eb' }, borderRadius: 2, boxShadow: 'none', fontWeight: 700, textTransform: 'none', px: 3 }}>
            {editingCategory ? 'Save Changes' : 'Add Category'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.sev} onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ borderRadius: 2 }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
