import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Assessment as AssessmentIcon, Receipt as ReceiptIcon, Inventory as InventoryIcon } from '@mui/icons-material';
import { useInventory } from '../contexts/InventoryContext.js';
import { useAuth } from '../contexts/AuthContext.js';

const currency = (n) => `₱${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const Reports = () => {
  const navigate = useNavigate();
  const { orders, products, totalLostAmount } = useInventory();
  const { isAdmin, user } = useAuth();

  // Check if user is admin
  if (!isAdmin()) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Access Denied: You don't have permission to view Reports & Analytics.
        </Alert>
        <Typography variant="body1">
          This page is restricted to administrators only. Please contact your administrator if you need access to reports.
        </Typography>
      </Box>
    );
  }

  if (!orders || !products) {
    return <Box sx={{ p: 3 }}>Loading reports...</Box>;
  }

  // Calculate overall KPIs
  const kpis = useMemo(() => {
    const totalRevenue = orders.reduce((sum, s) => sum + (s.total || 0), 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;
    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => p.currentStock <= p.reorderPoint).length;
    const totalValue = products.reduce((sum, p) => sum + (p.currentStock * (p.cost || 0)), 0);
    return { totalRevenue, totalOrders, avgOrderValue, totalProducts, lowStockProducts, totalValue };
  }, [orders, products]);

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 3, color: '#3b82f6' }}>
        Reports & Analytics
      </Typography>

      <Typography variant="body1" sx={{ mb: 4, color: '#64748b' }}>
        Select a report type below to view detailed analytics and insights.
      </Typography>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card><CardContent>
            <Typography color="textSecondary">Total Revenue</Typography>
            <Typography variant="h5">{currency(kpis.totalRevenue)}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card><CardContent>
            <Typography color="textSecondary">Total Sales</Typography>
            <Typography variant="h5">{kpis.totalOrders}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card><CardContent>
            <Typography color="textSecondary">Avg Order Value</Typography>
            <Typography variant="h5">{currency(kpis.avgOrderValue)}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card><CardContent>
            <Typography color="textSecondary">Total Products</Typography>
            <Typography variant="h5">{kpis.totalProducts}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card><CardContent>
            <Typography color="textSecondary">Low Stock Products</Typography>
            <Typography variant="h5">{kpis.lowStockProducts}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card><CardContent>
            <Typography color="textSecondary">Total Inventory Value</Typography>
            <Typography variant="h5">{currency(kpis.totalValue)}</Typography>
          </CardContent></Card>
        </Grid>
      </Grid>

      {/* Report Options */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', cursor: 'pointer', transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.02)' } }} onClick={() => navigate('/reports/sales')}>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <ReceiptIcon sx={{ fontSize: 48, color: '#3b82f6', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>Sales Report</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Analyze sales performance, revenue trends, and customer insights.
              </Typography>
              <Button variant="contained" color="primary">View Sales Report</Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', cursor: 'pointer', transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.02)' } }} onClick={() => navigate('/reports/inventory')}>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <InventoryIcon sx={{ fontSize: 48, color: '#10b981', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>Inventory Report</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Monitor stock levels, low inventory alerts, and product performance.
              </Typography>
              <Button variant="contained" color="success">View Inventory Report</Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Reports;
