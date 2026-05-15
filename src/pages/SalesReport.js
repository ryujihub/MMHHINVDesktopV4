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
  Paper,
  Divider,
  Chip,
  TextField,
  Tabs,
  Tab,
  IconButton,
  Tooltip as MuiTooltip
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
  Cell,
  Area,
  AreaChart
} from 'recharts';
import {
  TrendingUp as TrendingUpIcon,
  AttachMoney as AttachMoneyIcon,
  ShoppingCart as ShoppingCartIcon,
  People as PeopleIcon,
  Download as DownloadIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  Print as PrintIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  CompareArrows as CompareIcon,
  DateRange as DateRangeIcon
} from '@mui/icons-material';

const currency = (n) => `₱${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const SalesReport = () => {
  const { orders } = useInventory();
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
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [datePreset, setDatePreset] = useState('last30days');

  // Filtered sales
  const filteredOrders = useMemo(() => {
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
    for (const s of (filteredOrders || [])) {
      const d = new Date(s.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const current = map.get(key) || { date: key, orders: 0, revenue: 0 };
      current.orders += 1;
      current.revenue += s.total || 0;
      map.set(key, current);
    }
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredOrders]);

  // Revenue by payment method
  const revenueByPayment = useMemo(() => {
    const map = new Map();
    for (const s of (filteredOrders || [])) {
      const payment = s.paymentMethod || 'Unknown';
      map.set(payment, (map.get(payment) || 0) + (s.total || 0));
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredOrders]);

  // Top customers by revenue
  const topCustomers = useMemo(() => {
    const map = new Map();
    for (const s of (filteredOrders || [])) {
      const customer = s.customer?.name || 'Walk-in';
      map.set(customer, (map.get(customer) || 0) + (s.total || 0));
    }
    const rows = Array.from(map.entries()).map(([name, revenue]) => ({ name, revenue }));
    rows.sort((a, b) => b.revenue - a.revenue);
    return rows.slice(0, 10);
  }, [filteredOrders]);

  const resetFilters = () => {
    const d1 = new Date();
    d1.setDate(d1.getDate() - 30);
    d1.setHours(0, 0, 0, 0);
    const d2 = new Date();
    d2.setHours(23, 59, 59, 999);
    setStartDate(d1);
    setEndDate(d2);
    setPaymentFilter('all');
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

  const exportOrders = () => {
    const rows = filteredOrders.map((order) => ({
      date: new Date(order.date).toLocaleString(),
      orderNumber: order.orderNumber || order.id,
      customer: order.customer?.name || 'Walk-in',
      items: (order.items || []).length,
      total: order.total,
      payment: order.paymentMethod,
      deliveryOption: order.deliveryOption,
      status: order.status
    }));
    exportToCsv('sales_report.csv', rows);
  };

  // Check if user is admin
  if (!isAdmin()) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Access Denied: You don't have permission to view Sales Report.
        </Alert>
        <Typography variant="body1">
          This page is restricted to administrators only. Please contact your administrator if you need access to reports.
        </Typography>
      </Box>
    );
  }

  if (!orders) {
    return <Box sx={{ p: 3 }}>Loading sales report...</Box>;
  }

  return (
    <Box sx={{ backgroundColor: '#f8fafc', minHeight: '100vh', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" sx={{
          fontWeight: 700,
          color: '#1e293b',
          mb: 1,
          background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Sales Performance Report
        </Typography>
        <Typography variant="subtitle1" sx={{ color: '#64748b', fontSize: '1.1rem' }}>
          Comprehensive analysis of sales metrics and customer insights
        </Typography>
        <Divider sx={{ mt: 2, borderColor: '#e2e8f0' }} />
      </Box>

      {/* ── Single-row Filter Bar ── */}
      <Paper elevation={0} sx={{ p: 1.5, mb: 3, border: '1px solid #e2e8f0', borderRadius: 3 }}>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Period</InputLabel>
            <Select value={datePreset} label="Period" onChange={(e) => handleDatePreset(e.target.value)} sx={{ borderRadius: 2 }}>
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="yesterday">Yesterday</MenuItem>
              <MenuItem value="last7days">Last 7 Days</MenuItem>
              <MenuItem value="last30days">Last 30 Days</MenuItem>
              <MenuItem value="last90days">Last 90 Days</MenuItem>
              <MenuItem value="thisMonth">This Month</MenuItem>
              <MenuItem value="lastMonth">Last Month</MenuItem>
            </Select>
          </FormControl>
          <DatePicker label="From" value={startDate} onChange={(d) => d && setStartDate(d)}
            slotProps={{ textField: { size: 'small', sx: { width: 145 } } }} />
          <DatePicker label="To" value={endDate} onChange={(d) => d && setEndDate(d)}
            slotProps={{ textField: { size: 'small', sx: { width: 145 } } }} />
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Payment</InputLabel>
            <Select value={paymentFilter} label="Payment" onChange={(e) => setPaymentFilter(e.target.value)} sx={{ borderRadius: 2 }}>
              <MenuItem value="all">All Methods</MenuItem>
              <MenuItem value="cash">Cash</MenuItem>
              <MenuItem value="card">Card</MenuItem>
              <MenuItem value="gcash">GCash</MenuItem>
              <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
            </Select>
          </FormControl>
          <TextField size="small" placeholder="Search customers…" value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{ startAdornment: <SearchIcon sx={{ fontSize: 16, color: '#94a3b8', mr: 0.5 }} /> }}
            sx={{ width: 170, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
          <Box sx={{ flex: 1 }} />
          <Button size="small" onClick={resetFilters} sx={{ color: '#64748b', textTransform: 'none', borderRadius: 2 }}>Reset</Button>
          <Button size="small" variant="contained" onClick={exportOrders} startIcon={<DownloadIcon />}
            sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, borderRadius: 2, boxShadow: 'none', textTransform: 'none', fontWeight: 600 }}>
            Export CSV
          </Button>
        </Box>
      </Paper>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
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
                    Total Revenue
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {currency(kpis.totalRevenue)}
                  </Typography>
                </Box>
              </Box>
              <Chip
                label={`${filteredOrders.length} transactions`}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontSize: '0.75rem'
                }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            borderRadius: 3,
            boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ShoppingCartIcon sx={{ fontSize: 40, mr: 2, opacity: 0.9 }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 500, opacity: 0.9 }}>
                    Total Sales
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {kpis.totalOrders.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
              <Chip
                label="Orders processed"
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontSize: '0.75rem'
                }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: 'white',
            borderRadius: 3,
            boxShadow: '0 8px 25px rgba(245, 158, 11, 0.3)'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUpIcon sx={{ fontSize: 40, mr: 2, opacity: 0.9 }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 500, opacity: 0.9 }}>
                    Average Order Value
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {currency(kpis.avgOrderValue)}
                  </Typography>
                </Box>
              </Box>
              <Chip
                label="Per transaction"
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
                <TrendingUpIcon sx={{ mr: 1, color: '#3b82f6' }} />
                Sales Trend Analysis
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={salesOverTime}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
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
                    formatter={(v, n) => n === 'revenue' ? [currency(v), 'Revenue'] : [v, 'Orders']}
                    labelStyle={{ color: '#1e293b' }}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    name="Revenue"
                  />
                  <Area
                    type="monotone"
                    dataKey="orders"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorOrders)"
                    name="Orders"
                  />
                </AreaChart>
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
                <AttachMoneyIcon sx={{ mr: 1, color: '#f59e0b' }} />
                Payment Methods
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={revenueByPayment}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {revenueByPayment.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={
                        index === 0 ? '#3b82f6' :
                          index === 1 ? '#10b981' :
                            index === 2 ? '#f59e0b' :
                              index === 3 ? '#ef4444' : '#8b5cf6'
                      } />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => [currency(v), 'Revenue']}
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
                {revenueByPayment.map((entry, index) => (
                  <Box key={entry.name} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: index === 0 ? '#3b82f6' : index === 1 ? '#10b981' : index === 2 ? '#f59e0b' : index === 3 ? '#ef4444' : '#8b5cf6',
                      mr: 2
                    }} />
                    <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                      {entry.name}: {currency(entry.value)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top Customers Table */}
      <Card sx={{
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        border: '1px solid #e2e8f0'
      }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <PeopleIcon sx={{ color: '#3b82f6', mr: 1 }} />
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1e293b' }}>
              Top Performing Customers
            </Typography>
          </Box>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 600, color: '#374151', borderBottom: '2px solid #e2e8f0' }}>
                  Customer Name
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: '#374151', borderBottom: '2px solid #e2e8f0' }}>
                  Total Revenue
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: '#374151', borderBottom: '2px solid #e2e8f0' }}>
                  Contribution
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {topCustomers.map((row, idx) => (
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
                        backgroundColor: idx < 3 ? '#3b82f6' : '#e2e8f0',
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
                        {row.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e293b' }}>
                      {currency(row.revenue)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      label={`${((row.revenue / kpis.totalRevenue) * 100).toFixed(1)}%`}
                      size="small"
                      sx={{
                        backgroundColor: idx < 3 ? '#dbeafe' : '#f3f4f6',
                        color: idx < 3 ? '#1e40af' : '#374151',
                        fontWeight: 500
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {topCustomers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No customer data available for the selected period.
                    </Typography>
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

export default SalesReport;
