import React, { useMemo } from 'react';
import {
  Box, Typography, Grid, Button, Alert, Paper, Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Assessment as AssessmentIcon,
  Receipt as ReceiptIcon,
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  ShoppingCart as CartIcon,
  TrendingUp as TrendingIcon,
  Warning as WarningIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';
import { useInventory } from '../contexts/InventoryContext.js';
import { useAuth } from '../contexts/AuthContext.js';

const currency = (n) => `₱${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const KPI = ({ icon, label, value, color, bg }) => (
  <Paper elevation={0} sx={{
    p: 2.5, borderRadius: 3,
    border: `1.5px solid ${bg}`,
    bgcolor: bg,
    display: 'flex', alignItems: 'center', gap: 2,
    transition: 'box-shadow 0.2s',
    '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.08)' },
  }}>
    <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: color, display: 'flex' }}>
      {React.cloneElement(icon, { sx: { color: '#fff', fontSize: 22 } })}
    </Box>
    <Box>
      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.68rem' }}>
        {label}
      </Typography>
      <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2, color: '#1e293b' }}>
        {value}
      </Typography>
    </Box>
  </Paper>
);

const ReportCard = ({ icon, title, description, color, bg, buttonLabel, onClick }) => (
  <Paper elevation={0} onClick={onClick} sx={{
    p: 3, borderRadius: 3, cursor: 'pointer',
    border: `1.5px solid #e2e8f0`,
    height: '100%', display: 'flex', flexDirection: 'column', gap: 1.5,
    transition: 'all 0.2s',
    '&:hover': { borderColor: color, boxShadow: `0 4px 20px ${color}22`, transform: 'translateY(-2px)' },
  }}>
    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: bg, display: 'inline-flex', width: 'fit-content' }}>
      {React.cloneElement(icon, { sx: { color, fontSize: 28 } })}
    </Box>
    <Box sx={{ flex: 1 }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#1e293b', mb: 0.5 }}>{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>{description}</Typography>
    </Box>
    <Button
      variant="outlined"
      size="small"
      endIcon={<ArrowIcon />}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      sx={{
        borderColor: color, color, '&:hover': { bgcolor: bg, borderColor: color },
        borderRadius: 2, textTransform: 'none', fontWeight: 600, alignSelf: 'flex-start'
      }}
    >
      {buttonLabel}
    </Button>
  </Paper>
);

const Reports = () => {
  const navigate = useNavigate();
  const { orders, products } = useInventory();
  const { isAdmin } = useAuth();

  const kpis = useMemo(() => {
    const os = orders || [];
    const ps = products || [];
    const totalRevenue = os.reduce((s, o) => s + (o.total || 0), 0);
    const totalOrders = os.length;
    const avgOrder = totalOrders ? totalRevenue / totalOrders : 0;
    const totalProducts = ps.length;
    const lowStock = ps.filter(p => p.currentStock <= p.reorderPoint).length;
    const inventoryValue = ps.reduce((s, p) => s + (p.currentStock * (p.cost || 0)), 0);
    return { totalRevenue, totalOrders, avgOrder, totalProducts, lowStock, inventoryValue };
  }, [orders, products]);

  if (!isAdmin()) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Access Denied — this page is for administrators only.</Alert>
      </Box>
    );
  }

  if (!orders || !products) return <Box sx={{ p: 3 }}>Loading...</Box>;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} color="#3b82f6">Reports & Analytics</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Business overview and detailed reports for your inventory.
        </Typography>
      </Box>

      {/* KPI Grid */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <KPI icon={<MoneyIcon />} label="Total Revenue" value={currency(kpis.totalRevenue)} color="#3b82f6" bg="#eff6ff" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <KPI icon={<CartIcon />} label="Total Sales" value={kpis.totalOrders} color="#10b981" bg="#f0fdf4" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <KPI icon={<TrendingIcon />} label="Avg. Order Value" value={currency(kpis.avgOrder)} color="#f59e0b" bg="#fefce8" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <KPI icon={<InventoryIcon />} label="Total Products" value={kpis.totalProducts} color="#8b5cf6" bg="#faf5ff" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <KPI icon={<WarningIcon />} label="Low Stock Items" value={kpis.lowStock} color={kpis.lowStock > 0 ? '#ef4444' : '#10b981'} bg={kpis.lowStock > 0 ? '#fef2f2' : '#f0fdf4'} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <KPI icon={<MoneyIcon />} label="Inventory Value" value={currency(kpis.inventoryValue)} color="#0891b2" bg="#ecfeff" />
        </Grid>
      </Grid>

      <Divider sx={{ mb: 3 }} />
      <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.72rem' }}>
        Detailed Reports
      </Typography>

      {/* Report Navigation Cards */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <ReportCard
            icon={<AssessmentIcon />}
            title="Full Business Report"
            description="Complete inventory and sales analysis with insights and trends."
            color="#8b5cf6" bg="#faf5ff"
            buttonLabel="View Report"
            onClick={() => navigate('/reports/comprehensive')}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <ReportCard
            icon={<ReceiptIcon />}
            title="Sales Report"
            description="Sales performance, revenue trends, and customer insights."
            color="#3b82f6" bg="#eff6ff"
            buttonLabel="View Report"
            onClick={() => navigate('/reports/sales')}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <ReportCard
            icon={<InventoryIcon />}
            title="Inventory Report"
            description="Stock levels, low inventory alerts, and product performance."
            color="#10b981" bg="#f0fdf4"
            buttonLabel="View Report"
            onClick={() => navigate('/reports/inventory')}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Reports;
