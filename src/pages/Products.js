import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  Box, Button, Typography, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, FormControl, InputLabel, Select,
  MenuItem, Grid, Chip, IconButton, Tooltip, Snackbar, Alert,
  Collapse, Divider, Paper, InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Image as ImageIcon,
  Inventory as InventoryIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Checklist as ChecklistIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  ArrowDropDown as ArrowDropDownIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { useInventory } from '../contexts/InventoryContext.js';
import { useAuth } from '../contexts/AuthContext.js';

/* ─────────────────────────────────────────────
   Colour helpers
───────────────────────────────────────────── */
const BLUE = '#3b82f6';
const AMBER = '#f59e0b';

export default function Products() {
  const { products, categories, loading, addProduct, updateProduct, deleteProduct, updatePhysicalCount } = useInventory();
  const { hasPermission } = useAuth();

  /* state */
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [auditMode, setAuditMode] = useState(false);
  const [auditCounts, setAuditCounts] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const auditRefs = useRef({});

  const [form, setForm] = useState({
    name: '', sku: '', category: '', price: '', cost: '',
    currentStock: '', minimumStock: '', reorderPoint: '',
    unit: '', description: '', location: '', physicalCount: '', image: '',
  });

  /* derived */
  const missingCostCount = useMemo(() =>
    products.filter(p => !p.cost || p.cost <= 0).length, [products]);

  const rows = useMemo(() => {
    let list = products;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        (p.name?.toLowerCase().includes(q)) ||
        (p.sku?.toLowerCase().includes(q)) ||
        (p.productCode?.toLowerCase().includes(q)) ||
        (p.category?.toLowerCase().includes(q))
      );
    }
    if (categoryFilter === '_missing') list = list.filter(p => !p.cost || p.cost <= 0);
    else if (categoryFilter) list = list.filter(p => p.category === categoryFilter);
    return list;
  }, [products, searchQuery, categoryFilter]);

  /* ── Audit Mode ── */
  const startAudit = () => {
    const map = {};
    products.forEach(p => { map[p.id] = p.physicalCount ?? p.currentStock ?? 0; });
    setAuditCounts(map);
    setAuditMode(true);
  };
  const cancelAudit = () => { setAuditMode(false); setAuditCounts({}); };
  const saveAudit = async () => {
    for (const [id, cnt] of Object.entries(auditCounts))
      await updatePhysicalCount(id, parseInt(cnt) || 0);
    setSnack({ open: true, msg: `✅ Counts saved for all ${rows.length} products!`, sev: 'success' });
    cancelAudit();
  };
  const auditKey = (e, id) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      const ids = rows.map(r => r.id);
      const next = ids[ids.indexOf(id) + 1];
      if (next && auditRefs.current[next]) {
        auditRefs.current[next].focus();
        auditRefs.current[next].select();
      }
    }
  };

  /* ── Dialog helpers ── */
  const openAdd = () => { setShowAdvanced(false); setEditingProduct(null); setSelectedFile(null); setForm({ name: '', sku: '', category: '', price: '', cost: '', currentStock: '', minimumStock: '', reorderPoint: '', unit: '', description: '', location: '', physicalCount: '', image: '' }); setOpenDialog(true); };
  const openEdit = (prod) => { setShowAdvanced(false); setEditingProduct(prod); setSelectedFile(null); setForm({ ...prod, sku: prod.productCode || prod.sku || '', cost: prod.cost || '', physicalCount: prod.physicalCount || '', image: prod.image || '' }); setOpenDialog(true); };
  const closeDialog = () => { setOpenDialog(false); setEditingProduct(null); };
  const f = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const submit = async () => {
    if (!form.name || !form.category) { setSnack({ open: true, msg: 'Product Name and Category are required.', sev: 'error' }); return; }
    let code = form.sku || `${(form.category || '').substring(0, 2).toUpperCase()}${form.name.substring(0, 3).toUpperCase()}${Date.now().toString().slice(-6)}`;
    let img = form.image;
    if (selectedFile) {
      img = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(selectedFile); }).catch(() => null);
      if (!img) { setSnack({ open: true, msg: 'Image upload failed.', sev: 'error' }); return; }
    }
    const data = { ...form, sku: code, productCode: code, image: img, price: Number(form.price) || 0, cost: Number(form.cost) || 0, currentStock: Number(form.currentStock) || 0, minimumStock: Number(form.minimumStock) || 0, reorderPoint: Number(form.reorderPoint) || 0, physicalCount: Number(form.physicalCount) || 0 };
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, data);
      } else {
        await addProduct(data);
      }
      setSnack({ open: true, msg: editingProduct ? 'Product updated!' : 'Product added!', sev: 'success' });
      closeDialog();
    } catch (error) {
      console.error('Error saving product:', error);
      setSnack({ open: true, msg: 'Error saving product.', sev: 'error' });
    }
  };

  /* ── Columns ── */
  const columns = [
    {
      field: 'image', headerName: '', width: 54, sortable: false,
      renderCell: ({ row }) => row.image
        ? <img src={row.image} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6, marginTop: 6, cursor: 'pointer' }} onClick={() => window.open(row.image, '_blank')} />
        : <Box sx={{ width: 36, height: 36, bgcolor: '#f1f5f9', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', mt: '6px' }}><ImageIcon sx={{ color: '#cbd5e1', fontSize: 18 }} /></Box>
    },
    {
      field: 'name', headerName: 'Product', flex: 1, minWidth: 160,
      renderCell: ({ row }) => (
        <Box>
          <Typography variant="body2" fontWeight={600} lineHeight={1.3}>{row.name}</Typography>
          <Typography variant="caption" color="text.secondary">{row.productCode || row.sku || '—'}</Typography>
        </Box>
      )
    },
    {
      field: 'category', headerName: 'Category', width: 110,
      renderCell: ({ row }) => <Chip label={row.category || '—'} size="small" sx={{ bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 600, fontSize: '0.7rem' }} />
    },
    {
      field: 'price', headerName: 'Price', width: 90,
      renderCell: ({ row }) => <Typography variant="body2" fontWeight={600}>₱{Number(row.price || 0).toFixed(2)}</Typography>
    },
    {
      field: 'cost', headerName: 'Cost', width: 90,
      renderCell: ({ row }) => {
        const c = row.cost || 0;
        return <Typography variant="body2" sx={{ color: c > 0 ? 'inherit' : AMBER, fontWeight: c > 0 ? 400 : 700 }}>
          {c > 0 ? `₱${c.toFixed(2)}` : 'Missing'}
        </Typography>;
      }
    },
    {
      field: 'currentStock', headerName: 'Stock', width: 72, type: 'number', align: 'center', headerAlign: 'center',
      renderCell: ({ row }) => {
        const s = row.currentStock || 0;
        const t = row.minimumStock || 0;
        const color = s === 0 ? '#ef4444' : s < t ? AMBER : '#22c55e';
        return <Typography variant="body2" sx={{ fontWeight: 700, color }}>{s}</Typography>;
      }
    },
    {
      field: 'minimumStock', headerName: 'Target', width: 70, type: 'number', align: 'center', headerAlign: 'center',
      renderCell: ({ row }) => <Typography variant="body2" color="text.secondary">{row.minimumStock || 0}</Typography>
    },
    {
      field: 'physicalCount', headerName: 'Counted', width: auditMode ? 130 : 85, align: 'center', headerAlign: 'center',
      renderCell: ({ row }) => auditMode ? (
        <TextField
          inputRef={el => { if (el) auditRefs.current[row.id] = el; }}
          value={auditCounts[row.id] ?? ''}
          type="number" size="small"
          onFocus={e => e.target.select()}
          onChange={e => setAuditCounts(p => ({ ...p, [row.id]: e.target.value }))}
          onKeyDown={e => auditKey(e, row.id)}
          inputProps={{ min: 0, style: { textAlign: 'center', fontWeight: 700 } }}
          sx={{ width: 100, '& .MuiOutlinedInput-root': { bgcolor: '#fefce8', '& fieldset': { borderColor: AMBER, borderWidth: 2 }, '&:focus-within fieldset': { borderColor: '#d97706' } } }}
        />
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
          {row.physicalCount ?? '—'}
        </Typography>
      )
    },
    {
      field: 'inventoryVariance', headerName: 'Variance', width: 95,
      renderCell: ({ row }) => {
        const v = row.inventoryVariance || 0;
        if (v === 0) return <Chip label="OK" size="small" sx={{ bgcolor: '#f0fdf4', color: '#15803d', fontWeight: 600, fontSize: '0.7rem' }} />;
        return <Chip label={v < 0 ? `−${Math.abs(v)}` : `+${v}`} color={v < 0 ? 'error' : 'success'} size="small" sx={{ fontWeight: 600, fontSize: '0.7rem' }} />;
      }
    },
    {
      field: 'actions', headerName: '', width: 80, sortable: false,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {hasPermission('edit') && <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(row)} sx={{ color: BLUE }}><EditIcon fontSize="small" /></IconButton></Tooltip>}
          {hasPermission('all') && (
            <Tooltip title="Delete">
              <IconButton 
                size="small" 
                onClick={async () => { 
                  if (window.confirm('Delete this product?')) { 
                    try {
                      await deleteProduct(row.id); 
                      setSnack({ open: true, msg: 'Deleted.', sev: 'success' }); 
                    } catch (err) {
                      setSnack({ open: true, msg: 'Failed to delete product.', sev: 'error' });
                    }
                  } 
                }} 
                sx={{ color: '#ef4444' }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )
    },
  ];

  /* ── ESC to cancel audit ── */
  useEffect(() => {
    const h = e => { if (e.key === 'Escape' && auditMode) cancelAudit(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [auditMode]);

  /* ════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════ */
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 1.5, pb: 1 }}>

      {/* ── Audit Mode Banner ── */}
      {auditMode && (
        <Paper elevation={0} sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 2, border: `2px solid ${AMBER}`, borderRadius: 2, bgcolor: '#fffbeb', flexShrink: 0 }}>
          <ChecklistIcon sx={{ color: AMBER }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" fontWeight={700} color="#92400e">Audit Mode active</Typography>
            <Typography variant="caption" color="#a16207">Type counts → press <strong>Enter</strong> to move to next row → <strong>Save Counts</strong> when done.</Typography>
          </Box>
          <Button variant="contained" color="warning" size="small" startIcon={<SaveIcon />} onClick={saveAudit} sx={{ fontWeight: 700, boxShadow: 'none', borderRadius: 2 }}>
            Save Counts
          </Button>
          <IconButton size="small" onClick={cancelAudit} sx={{ color: '#92400e' }}><CloseIcon fontSize="small" /></IconButton>
        </Paper>
      )}

      {/* ── Toolbar ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
        {/* Search */}
        <TextField
          size="small"
          placeholder="Search products…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: '#94a3b8' }} /></InputAdornment> }}
          sx={{ width: 210, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />

        {/* Category */}
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <Select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            displayEmpty
            sx={{ borderRadius: 2 }}
            IconComponent={ArrowDropDownIcon}
          >
            <MenuItem value=""><Typography variant="body2" color="text.secondary">All categories</Typography></MenuItem>
            {missingCostCount > 0 && <MenuItem value="_missing"><Typography variant="body2" color="warning.main">⚠ Missing Cost ({missingCostCount})</Typography></MenuItem>}
            {categories.map(c => <MenuItem key={c.id} value={c.name}><Typography variant="body2">{c.name}</Typography></MenuItem>)}
          </Select>
        </FormControl>

        <Box sx={{ flex: 1 }} />

        {/* Audit Mode */}
        <Tooltip title="Quickly update all physical counts at once">
          <Button
            variant={auditMode ? 'contained' : 'outlined'}
            color="warning"
            size="small"
            startIcon={<ChecklistIcon />}
            onClick={auditMode ? cancelAudit : startAudit}
            sx={{ borderRadius: 2, fontWeight: 600, boxShadow: 'none' }}
          >
            {auditMode ? 'Exit Audit' : 'Audit Mode'}
          </Button>
        </Tooltip>

        {/* Add */}
        {hasPermission('edit') && (
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={openAdd}
            sx={{ bgcolor: BLUE, '&:hover': { bgcolor: '#2563eb' }, borderRadius: 2, fontWeight: 600, boxShadow: 'none' }}
          >
            Add Product
          </Button>
        )}
      </Box>

      {/* ── Count label ── */}
      <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, ml: 0.5 }}>
        {rows.length} {rows.length === 1 ? 'product' : 'products'}{searchQuery ? ` matching "${searchQuery}"` : ''}
      </Typography>

      {/* ── DataGrid ── */}
      <Box sx={{ flexGrow: 1, minHeight: 0 }}>
        {loading ? (
          <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary">Loading…</Typography>
          </Box>
        ) : rows.length === 0 ? (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <InventoryIcon sx={{ fontSize: 52, color: '#cbd5e1' }} />
            <Typography variant="h6" color="text.secondary">{searchQuery ? 'No results' : 'No products yet'}</Typography>
            {!searchQuery && hasPermission('edit') && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}
                sx={{ bgcolor: BLUE, '&:hover': { bgcolor: '#2563eb' }, borderRadius: 2, boxShadow: 'none' }}>
                Add First Product
              </Button>
            )}
          </Box>
        ) : (
          <DataGrid
            rows={rows}
            columns={columns}
            pageSize={100}
            rowsPerPageOptions={[25, 50, 100]}
            disableSelectionOnClick
            rowHeight={52}
            sx={{
              height: '100%',
              border: '1px solid #e2e8f0',
              borderRadius: 2,
              '& .MuiDataGrid-columnHeaders': { bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
              '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700, fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' },
              '& .MuiDataGrid-cell': { borderBottom: '1px solid #f1f5f9' },
              '& .MuiDataGrid-row:hover': { bgcolor: '#f0f9ff' },
              '& .MuiDataGrid-row:nth-of-type(even)': { bgcolor: '#fafbfc' },
              '& .MuiDataGrid-footerContainer': { borderTop: '1px solid #e2e8f0', bgcolor: '#f8fafc' },
              '& .MuiDataGrid-selectedRowCount': { display: 'none' },
            }}
          />
        )}
      </Box>

      {/* ══════════════════════════════════════════
          Add / Edit Dialog  (clean, minimal)
      ══════════════════════════════════════════ */}
      <Dialog open={openDialog} onClose={closeDialog} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' } }}>

        <DialogTitle sx={{ pb: 0, pt: 2.5, px: 3 }}>
          <Typography variant="h6" fontWeight={700}>
            {editingProduct ? 'Edit Product' : 'New Product'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {editingProduct ? 'Update the product details below.' : 'Fill in the basics — the rest is optional.'}
          </Typography>
        </DialogTitle>

        <Divider sx={{ mt: 1.5 }} />

        <DialogContent sx={{ px: 3, pt: 2.5 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth label="Product Name *" value={form.name}
                onChange={e => f('name', e.target.value)} autoFocus size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Category *</InputLabel>
                <Select value={form.category} onChange={e => f('category', e.target.value)} label="Category *" sx={{ borderRadius: 2 }}>
                  {categories.map(c => <MenuItem key={c.id} value={c.name}>{c.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6} sm={3}>
              <TextField fullWidth label="Selling Price ₱" type="number" value={form.price} size="small"
                onChange={e => f('price', e.target.value === '' ? '' : parseFloat(e.target.value))}
                inputProps={{ min: 0, step: 0.01 }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
            </Grid>

            <Grid item xs={6} sm={3}>
              <TextField fullWidth label="Cost ₱" type="number" value={form.cost} size="small"
                onChange={e => f('cost', e.target.value === '' ? '' : parseFloat(e.target.value))}
                inputProps={{ min: 0, step: 0.01 }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
            </Grid>

            <Grid item xs={6}>
              <TextField fullWidth label="Current Stock" type="number" value={form.currentStock} size="small"
                onChange={e => f('currentStock', e.target.value === '' ? '' : parseInt(e.target.value))}
                inputProps={{ min: 0 }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
            </Grid>

            <Grid item xs={6}>
              <TextField fullWidth label="Target Stock" type="number" value={form.minimumStock} size="small"
                onChange={e => f('minimumStock', e.target.value === '' ? '' : parseInt(e.target.value))}
                inputProps={{ min: 0 }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
            </Grid>

            {/* ── Advanced section ── */}
            <Grid item xs={12}>
              <Button size="small" onClick={() => setShowAdvanced(!showAdvanced)}
                endIcon={showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                sx={{ color: 'text.secondary', textTransform: 'none', fontSize: '0.78rem', p: 0 }}>
                {showAdvanced ? 'Hide advanced fields' : 'More fields (code, unit, location, image…)'}
              </Button>
            </Grid>

            <Grid item xs={12} sx={{ pt: '0!important' }}>
              <Collapse in={showAdvanced}>
                <Grid container spacing={2} sx={{ pt: 1 }}>
                  <Grid item xs={6}>
                    <TextField fullWidth label="Product Code" value={form.sku} size="small" placeholder="Auto-generated"
                      onChange={e => f('sku', e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField fullWidth label="Reorder Point" type="number" value={form.reorderPoint} size="small"
                      onChange={e => f('reorderPoint', e.target.value === '' ? '' : parseInt(e.target.value))}
                      inputProps={{ min: 0 }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField fullWidth label="Unit" value={form.unit} size="small" placeholder="e.g. piece, kg"
                      onChange={e => f('unit', e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField fullWidth label="Location" value={form.location} size="small" placeholder="e.g. A1-B2"
                      onChange={e => f('location', e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Description" value={form.description} size="small" multiline rows={2}
                      onChange={e => f('description', e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={e => setSelectedFile(e.target.files[0])} style={{ display: 'none' }} />
                      <Button variant="outlined" size="small" startIcon={<ImageIcon />} onClick={() => fileInputRef.current?.click()}
                        sx={{ borderRadius: 2, textTransform: 'none' }}>
                        Choose Image
                      </Button>
                      {selectedFile && <Typography variant="caption">📎 {selectedFile.name}</Typography>}
                      {form.image && !selectedFile && (
                        <img src={form.image} alt="" style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 4, border: '1px solid #e2e8f0' }} />
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </Collapse>
            </Grid>
          </Grid>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={closeDialog} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
          <Button onClick={submit} variant="contained"
            sx={{ bgcolor: BLUE, '&:hover': { bgcolor: '#2563eb' }, borderRadius: 2, fontWeight: 700, boxShadow: 'none', textTransform: 'none', px: 3 }}>
            {editingProduct ? 'Save Changes' : 'Add Product'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.sev} onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
