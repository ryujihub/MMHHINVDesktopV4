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
  Alert,
  Chip,
  Paper,
  Divider,
  TextField
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useInventory } from '../contexts/InventoryContext.js';
import { useAuth } from '../contexts/AuthContext.js';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import {
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  AttachMoney as AttachMoneyIcon,
  TrendingUp as TrendingUpIcon,
  Download as DownloadIcon,
  FilterList as FilterListIcon,
  Assessment as AssessmentIcon,
  Search as SearchIcon,
  Print as PrintIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon
} from '@mui/icons-material';

const currency = (n) => `₱${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const InventoryReport = () => {
  const { products, orders, totalLostAmount } = useInventory();
  const { isAdmin, user } = useAuth();


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
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [datePreset, setDatePreset] = useState('last30days');

  const productMap = useMemo(() => {
    const map = new Map();
    for (const p of (products || [])) map.set(p.id, p);
    return map;
  }, [products]);

  // Filtered orders for the period
  const filteredOrders = useMemo(() => {
    return (orders || []).filter((s) => {
      const t = new Date(s.date).getTime();
      const inRange = t >= startDate.getTime() && t <= endDate.getTime();
      return inRange;
    });
  }, [orders, startDate, endDate]);

  // Inventory KPIs
  const kpis = useMemo(() => {
    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => p.currentStock <= p.reorderPoint).length;
    const outOfStockProducts = products.filter(p => p.currentStock === 0).length;
    const totalValue = products.reduce((sum, p) => sum + (p.currentStock * (p.cost || 0)), 0);
    return { totalProducts, lowStockProducts, outOfStockProducts, totalValue };
  }, [products]);

  // Revenue by category (based on items * price)
  const revenueByCategory = useMemo(() => {
    const map = new Map();
    for (const s of (filteredOrders || [])) {
      for (const item of s.items || []) {
        const category = item.category || 'Uncategorized';
        const p = productMap.get(item.productId);
        const revenue = (item.quantity || 0) * (item.price || p?.sellingPrice || p?.price || 0);
        map.set(category, (map.get(category) || 0) + revenue);
      }
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredOrders, productMap]);

  // Top products by quantity sold
  const topProducts = useMemo(() => {
    const qtyMap = new Map();
    for (const s of (filteredOrders || [])) {
      for (const item of s.items || []) {
        qtyMap.set(item.productId, (qtyMap.get(item.productId) || 0) + (item.quantity || 0));
      }
    }
    const rows = Array.from(qtyMap.entries()).map(([productId, quantity]) => {
      const productItem = filteredOrders.flatMap(order => order.items).find(item => item.productId === productId);
      return {
        product: productItem?.productName || 'Unknown Product',
        category: productItem?.category || 'Uncategorized',
        quantity,
        currentStock: productMap.get(productId)?.currentStock || 0
      };
    });
    rows.sort((a, b) => b.quantity - a.quantity);
    return rows.slice(0, 10);
  }, [filteredOrders, productMap]);

  // Low stock products
  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.currentStock <= p.reorderPoint).map(p => ({
      product: p.name,
      category: p.category,
      currentStock: p.currentStock,
      reorderPoint: p.reorderPoint,
      status: p.currentStock === 0 ? 'Out of Stock' : 'Low Stock'
    }));
  }, [products]);

  const resetFilters = () => {
    const d1 = new Date();
    d1.setDate(d1.getDate() - 30);
    d1.setHours(0, 0, 0, 0);
    const d2 = new Date();
    d2.setHours(23, 59, 59, 999);
    setStartDate(d1);
    setEndDate(d2);
    setCategoryFilter('all');
    setSearchTerm('');
    setDatePreset('last30days');
  };

  const handleDatePreset = (preset) => {
    const now = new Date();
    let start, end;

    switch (preset) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        start = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
        end = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);
        break;
      case 'last7days':
        start = new Date(now);
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
        break;
      case 'last30days':
        start = new Date(now);
        start.setDate(start.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
        break;
      case 'last90days':
        start = new Date(now);
        start.setDate(start.getDate() - 90);
        start.setHours(0, 0, 0, 0);
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
        break;
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        break;
      default:
        return;
    }

    setStartDate(start);
    setEndDate(end);
    setDatePreset(preset);
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
    exportToCsv('inventory_report.csv', rows);
  };

  // Check if user is admin
  if (!isAdmin()) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Access Denied: You don't have permission to view Inventory Report.
        </Alert>
        <Typography variant="body1">
          This page is restricted to administrators only. Please contact your administrator if you need access to reports.
        </Typography>
      </Box>
    );
  }

  if (!products) {
    return <Box sx={{ p: 3 }}>Loading inventory report...</Box>;
  }

  return (
    <Box sx={{ backgroundColor: '#f8fafc', minHeight: '100vh', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" sx={{
          fontWeight: 700,
          color: '#1e293b',
          mb: 1,
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Inventory Management Report
        </Typography>
        <Typography variant="subtitle1" sx={{ color: '#64748b', fontSize: '1.1rem' }}>
          Comprehensive analysis of stock levels, product performance, and inventory insights
        </Typography>
        <Divider sx={{ mt: 2, borderColor: '#e2e8f0' }} />
      </Box>

      {/* ── Compact Filter Bar ── */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid #e2e8f0', borderRadius: 3 }}>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <DatePicker
            label="From"
            value={startDate}
            onChange={(d) => d && setStartDate(d)}
            slotProps={{ textField: { size: 'small', sx: { width: 150 } } }}
          />
          <DatePicker
            label="To"
            value={endDate}
            onChange={(d) => d && setEndDate(d)}
            slotProps={{ textField: { size: 'small', sx: { width: 150 } } }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Category</InputLabel>
            <Select value={categoryFilter} label="Category" onChange={(e) => setCategoryFilter(e.target.value)} sx={{ borderRadius: 2 }}>
              <MenuItem value="all">All Categories</MenuItem>
              {Array.from(new Set(products.map(p => p.category))).map(cat => (
                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ flex: 1 }} />
          <Button size="small" onClick={resetFilters} sx={{ color: '#64748b', textTransform: 'none', borderRadius: 2 }}>Reset</Button>
          <Button
            size="small" variant="contained" onClick={exportInventory} startIcon={<DownloadIcon />}
            sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, borderRadius: 2, boxShadow: 'none', textTransform: 'none', fontWeight: 600 }}
          >
            Export CSV
          </Button>
        </Box>
      </Paper>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            borderRadius: 3,
            boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <InventoryIcon sx={{ fontSize: 40, mr: 2, opacity: 0.9 }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 500, opacity: 0.9 }}>
                    Total Products
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {kpis.totalProducts.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
              <Chip
                label="Active inventory items"
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontSize: '0.75rem'
                }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: 'white',
            borderRadius: 3,
            boxShadow: '0 8px 25px rgba(245, 158, 11, 0.3)'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <WarningIcon sx={{ fontSize: 40, mr: 2, opacity: 0.9 }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 500, opacity: 0.9 }}>
                    Low Stock Alert
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {kpis.lowStockProducts.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
              <Chip
                label="Requires attention"
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontSize: '0.75rem'
                }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: 'white',
            borderRadius: 3,
            boxShadow: '0 8px 25px rgba(239, 68, 68, 0.3)'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckCircleIcon sx={{ fontSize: 40, mr: 2, opacity: 0.9 }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 500, opacity: 0.9 }}>
                    Out of Stock
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {kpis.outOfStockProducts.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
              <Chip
                label="Critical - Reorder needed"
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontSize: '0.75rem'
                }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
            color: 'white',
            borderRadius: 3,
            boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AttachMoneyIcon sx={{ fontSize: 40, mr: 2, opacity: 0.9 }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 500, opacity: 0.9 }}>
                    Inventory Value
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {currency(kpis.totalValue)}
                  </Typography>
                </Box>
              </Box>
              <Chip
                label="Total cost basis"
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontSize: '0.75rem'
                }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={8}>
          <Card sx={{
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: '1px solid #e2e8f0'
          }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" sx={{
                fontWeight: 600,
                color: '#1e293b',
                mb: 3,
                display: 'flex',
                alignItems: 'center'
              }}>
                <TrendingUpIcon sx={{ mr: 1, color: '#10b981' }} />
                Revenue by Product Category
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={revenueByCategory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${currency(value)}`}
                  />
                  <Tooltip
                    formatter={(v) => [currency(v), 'Revenue']}
                    labelStyle={{ color: '#1e293b' }}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar
                    dataKey="value"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Card sx={{
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: '1px solid #e2e8f0'
          }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" sx={{
                fontWeight: 600,
                color: '#1e293b',
                mb: 3,
                display: 'flex',
                alignItems: 'center'
              }}>
                <AssessmentIcon sx={{ mr: 1, color: '#f59e0b' }} />
                Stock Status Overview
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Normal Stock', value: kpis.totalProducts - kpis.lowStockProducts },
                      { name: 'Low Stock', value: kpis.lowStockProducts - kpis.outOfStockProducts },
                      { name: 'Out of Stock', value: kpis.outOfStockProducts }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#f59e0b" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                    mr: 2
                  }} />
                  <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                    Normal Stock: {kpis.totalProducts - kpis.lowStockProducts} items
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: '#f59e0b',
                    mr: 2
                  }} />
                  <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                    Low Stock: {kpis.lowStockProducts - kpis.outOfStockProducts} items
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: '#ef4444',
                    mr: 2
                  }} />
                  <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                    Out of Stock: {kpis.outOfStockProducts} items
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top Products Table */}
      <Card sx={{
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        border: '1px solid #e2e8f0',
        mb: 4
      }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <TrendingUpIcon sx={{ color: '#10b981', mr: 1 }} />
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1e293b' }}>
              Best Performing Products
            </Typography>
          </Box>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 600, color: '#374151', borderBottom: '2px solid #e2e8f0' }}>
                  Product Name
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151', borderBottom: '2px solid #e2e8f0' }}>
                  Category
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: '#374151', borderBottom: '2px solid #e2e8f0' }}>
                  Units Sold
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: '#374151', borderBottom: '2px solid #e2e8f0' }}>
                  Current Stock
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: '#374151', borderBottom: '2px solid #e2e8f0' }}>
                  Status
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {topProducts.map((row, idx) => (
                <TableRow key={idx} sx={{
                  '&:hover': { backgroundColor: '#f8fafc' },
                  borderBottom: '1px solid #f1f5f9'
                }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        backgroundColor: idx < 3 ? '#10b981' : '#e2e8f0',
                        color: idx < 3 ? 'white' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        mr: 2
                      }}>
                        {idx + 1}
                      </Box>
                      <Typography variant="body1" sx={{ fontWeight: 500, color: '#1e293b' }}>
                        {row.product}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={row.category}
                      size="small"
                      sx={{
                        backgroundColor: '#e0f2fe',
                        color: '#0369a1',
                        fontWeight: 500
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e293b' }}>
                      {row.quantity.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body1" sx={{ fontWeight: 500, color: '#64748b' }}>
                      {row.currentStock.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      label={row.currentStock > 10 ? 'In Stock' : row.currentStock > 0 ? 'Low Stock' : 'Out of Stock'}
                      color={row.currentStock > 10 ? 'success' : row.currentStock > 0 ? 'warning' : 'error'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
              {topProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No sales data available for the selected period.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Low Stock Products Table */}
      <Card sx={{
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        border: '1px solid #e2e8f0'
      }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <WarningIcon sx={{ color: '#f59e0b', mr: 1 }} />
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1e293b' }}>
              Inventory Alerts - Low Stock Items
            </Typography>
          </Box>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 600, color: '#374151', borderBottom: '2px solid #e2e8f0' }}>
                  Product Name
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151', borderBottom: '2px solid #e2e8f0' }}>
                  Category
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: '#374151', borderBottom: '2px solid #e2e8f0' }}>
                  Current Stock
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: '#374151', borderBottom: '2px solid #e2e8f0' }}>
                  Reorder Point
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: '#374151', borderBottom: '2px solid #e2e8f0' }}>
                  Status
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: '#374151', borderBottom: '2px solid #e2e8f0' }}>
                  Action Required
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lowStockProducts.map((row, idx) => (
                <TableRow key={idx} sx={{
                  '&:hover': { backgroundColor: '#f8fafc' },
                  borderBottom: '1px solid #f1f5f9'
                }}>
                  <TableCell>
                    <Typography variant="body1" sx={{ fontWeight: 500, color: '#1e293b' }}>
                      {row.product}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={row.category}
                      size="small"
                      sx={{
                        backgroundColor: '#e0f2fe',
                        color: '#0369a1',
                        fontWeight: 500
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body1" sx={{
                      fontWeight: 600,
                      color: row.currentStock === 0 ? '#ef4444' : '#f59e0b'
                    }}>
                      {row.currentStock.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body1" sx={{ fontWeight: 500, color: '#64748b' }}>
                      {row.reorderPoint.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      label={row.status}
                      color={row.status === 'Out of Stock' ? 'error' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="outlined"
                      color={row.status === 'Out of Stock' ? 'error' : 'warning'}
                      sx={{
                        fontSize: '0.75rem',
                        minWidth: 'auto',
                        px: 2
                      }}
                    >
                      Reorder
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {lowStockProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <CheckCircleIcon sx={{ fontSize: 48, color: '#10b981', mb: 2 }} />
                      <Typography variant="h6" sx={{ color: '#10b981', mb: 1 }}>
                        Excellent! All products are well-stocked.
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        No inventory alerts at this time. Your stock levels are optimal.
                      </Typography>
                    </Box>
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

export default InventoryReport;
