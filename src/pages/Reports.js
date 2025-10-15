import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useInventory } from '../contexts/InventoryContext.js';
import { useAuth } from '../contexts/AuthContext.js';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const currency = (n) => `₱${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const Reports = () => {
  const { orders, products, totalLostAmount } = useInventory(); // Use 'orders' instead of 'sales' and add totalLostAmount
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

  if (!orders || !products) { // Check for orders and products
    return <Box sx={{ p: 3 }}>Loading reports...</Box>;
  }

  // Filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
  });
  const [paymentFilter, setPaymentFilter] = useState('all');

  const productMap = useMemo(() => {
    const map = new Map();
    for (const p of (products || [])) map.set(p.id, p);
    return map;
  }, [products]);

  // Filtered sales
  const filteredOrders = useMemo(() => { // Renamed filteredSales to filteredOrders
    return (orders || []).filter((s) => {
      const t = new Date(s.date).getTime();
      const inRange = t >= startDate.getTime() && t <= endDate.getTime();
      const paymentOk = paymentFilter === 'all' || s.paymentMethod === paymentFilter;
      return inRange && paymentOk;
    });
  }, [orders, startDate, endDate, paymentFilter]);

  // KPIs
  const kpis = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((sum, s) => sum + (s.total || 0), 0);
    const totalOrders = filteredOrders.length;
    const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;
    return { totalRevenue, totalOrders, avgOrderValue };
  }, [filteredOrders]);

  // Sales over time (per day)
  const salesOverTime = useMemo(() => {
    const map = new Map();
    for (const s of (filteredOrders || [])) { // Use filteredOrders
      const d = new Date(s.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const current = map.get(key) || { date: key, orders: 0, revenue: 0 };
      current.orders += 1;
      current.revenue += s.total || 0;
      map.set(key, current);
    }
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredOrders]); // Use filteredOrders

  // Revenue by category (based on items * price)
  const revenueByCategory = useMemo(() => {
    const map = new Map();
    for (const s of (filteredOrders || [])) { // Use filteredOrders
      for (const item of s.items || []) {
        const category = item.category || 'Uncategorized'; // Use category from processed item
        const p = productMap.get(item.productId); // Get product from map for price fallback
        const revenue = (item.quantity || 0) * (item.price || p?.sellingPrice || p?.price || 0); // Fallback to product prices
        map.set(category, (map.get(category) || 0) + revenue);
      }
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredOrders, productMap]); // Re-added productMap to dependencies

  // Top products by quantity
  const topProducts = useMemo(() => {
    const qtyMap = new Map();
    const revMap = new Map();
    for (const s of (filteredOrders || [])) { // Use filteredOrders
      for (const item of s.items || []) {
        qtyMap.set(item.productId, (qtyMap.get(item.productId) || 0) + (item.quantity || 0));
        const p = productMap.get(item.productId); // Get product from map for price fallback
        const revenue = (item.quantity || 0) * (item.price || p?.sellingPrice || p?.price || 0); // Fallback to product prices
        revMap.set(item.productId, (revMap.get(item.productId) || 0) + revenue);
      }
    }
    const rows = Array.from(qtyMap.entries()).map(([productId, quantity]) => {
      const productItem = filteredOrders.flatMap(order => order.items).find(item => item.productId === productId);
      return {
        product: productItem?.productName || 'Unknown Product', // Use productName from processed item
        category: productItem?.category || 'Uncategorized', // Use category from processed item
        quantity,
        revenue: revMap.get(productId) || 0
      };
    });
    rows.sort((a, b) => b.quantity - a.quantity);
    return rows.slice(0, 10);
  }, [filteredOrders, productMap]); // Re-added productMap to dependencies

  const resetFilters = () => {
    const d1 = new Date();
    d1.setDate(d1.getDate() - 30);
    d1.setHours(0, 0, 0, 0);
    const d2 = new Date();
    d2.setHours(23, 59, 59, 999);
    setStartDate(d1);
    setEndDate(d2);
    setPaymentFilter('all');
  };

  // CSV export helper
  const exportToCsv = (filename, rows) => {
    if (!rows || rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const escape = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (/[",\n]/.test(str)) return '"' + str.replace(/"/g, '""') + '"';
      return str;
    };
    const csv = [headers.join(',')]
      .concat(rows.map((r) => headers.map((h) => escape(r[h])).join(',')))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportOrders = () => { // Renamed exportSales to exportOrders
    const rows = filteredOrders.map((order) => ({ // Use filteredOrders
      date: new Date(order.date).toLocaleString(),
      orderNumber: order.orderNumber || order.id, // Use orderNumber or id
      customer: order.customer?.name || 'Walk-in', // Access customer name from nested object
      items: (order.items || []).length,
      total: order.total,
      payment: order.paymentMethod,
      deliveryOption: order.deliveryOption, // Include delivery option
      status: order.status // Include status
    }));
    exportToCsv('orders.csv', rows); // Export as orders.csv
  };

  const exportInventory = () => {
    const rows = (products || []).map((p) => ({
      code: p.productCode || p.sku || '',
      name: p.name,
      category: p.category,
      stock: p.currentStock,
      reorderPoint: p.reorderPoint,
      cost: p.cost,
      sellingPrice: p.sellingPrice || p.price || 0
    }));
    exportToCsv('inventory.csv', rows);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 3, color: '#3b82f6' }}>
        Reports & Analytics
      </Typography>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <DatePicker label="Start date" value={startDate} onChange={(d) => d && setStartDate(d)} />
            </Grid>
            <Grid item xs={12} md={3}>
              <DatePicker label="End date" value={endDate} onChange={(d) => d && setEndDate(d)} />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Payment</InputLabel>
                <Select value={paymentFilter} label="Payment" onChange={(e) => setPaymentFilter(e.target.value)}>
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="card">Card</MenuItem>
                  <MenuItem value="gcash">GCash</MenuItem>
                  <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button variant="outlined" onClick={resetFilters}>Reset</Button>
                <Button variant="outlined" onClick={exportInventory}>Export Inventory</Button>
                <Button variant="contained" onClick={exportOrders}>Export Orders</Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
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
            <Typography color="textSecondary">Total Lost Amount</Typography>
            <Typography variant="h5">{currency(totalLostAmount)}</Typography>
          </CardContent></Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Sales Over Time</Typography>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={salesOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(v, n) => n === 'revenue' ? currency(v) : v} />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" name="Revenue" />
                  <Line type="monotone" dataKey="orders" stroke="#10b981" name="Orders" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Revenue by Category</Typography>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={revenueByCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(v) => currency(v)} />
                  <Bar dataKey="value" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top Products Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Top Products</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Qty Sold</TableCell>
                <TableCell align="right">Revenue</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {topProducts.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell>{row.product}</TableCell>
                  <TableCell>{row.category}</TableCell>
                  <TableCell align="right">{row.quantity}</TableCell>
                  <TableCell align="right">{currency(row.revenue)}</TableCell>
                </TableRow>
              ))}
              {topProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography variant="body2" color="text.secondary">No data for the selected period.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Reports;
