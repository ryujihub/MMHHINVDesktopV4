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
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
  AreaChart,
  ComposedChart
} from 'recharts';
import {
  TrendingUp as TrendingUpIcon,
  AttachMoney as AttachMoneyIcon,
  ShoppingCart as ShoppingCartIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Download as DownloadIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  PictureAsPdf as PdfIcon,
  CompareArrows as CompareIcon,
  DateRange as DateRangeIcon,
  Assessment as AssessmentIcon,
  Business as BusinessIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';

const currency = (n) => `₱${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const ComprehensiveReport = () => {
  const { products, orders, totalLostAmount } = useInventory();
  const { isAdmin, user } = useAuth();

  // Check if user is admin
  if (!isAdmin()) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Access Denied: You don't have permission to view Comprehensive Report.
        </Alert>
        <Typography variant="body1">
          This page is restricted to administrators only. Please contact your administrator if you need access to reports.
        </Typography>
      </Box>
    );
  }

  if (!products || !orders) {
    return <Box sx={{ p: 3 }}>Loading comprehensive report...</Box>;
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
  const [activeTab, setActiveTab] = useState(0);
  const [datePreset, setDatePreset] = useState('last30days');

  // Product map for quick lookup
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

  // Comprehensive KPIs
  const kpis = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((sum, s) => sum + (s.total || 0), 0);
    const totalOrders = filteredOrders.length;
    const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;

    // Inventory metrics
    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => p.currentStock <= p.reorderPoint).length;
    const outOfStockProducts = products.filter(p => p.currentStock === 0).length;
    const totalInventoryValue = products.reduce((sum, p) => {
      const stock = Number(p.currentStock) || 0;
      // Use cost if available, otherwise fallback to price (selling price), then to 0
      const cost = Number(p.cost) || Number(p.price) || 0;
      return sum + (stock * cost);
    }, 0);

    // Sales metrics
    const uniqueCustomers = new Set(filteredOrders.map(o => o.customer?.name || 'Walk-in')).size;
    const totalItemsSold = filteredOrders.reduce((sum, o) => sum + (o.items || []).reduce((itemSum, item) => itemSum + (item.quantity || 0), 0), 0);

    // Profit calculations (estimated)
    const totalCostOfGoods = filteredOrders.reduce((sum, order) => {
      return sum + (order.items || []).reduce((itemSum, item) => {
        const product = productMap.get(item.productId);
        // Use cost if available, otherwise fallback to price (selling price), then to 0
        const cost = Number(product?.cost) || Number(product?.price) || 0;
        return itemSum + (cost * (item.quantity || 0));
      }, 0);
    }, 0);
    const grossProfit = totalRevenue - totalCostOfGoods;

    return {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      totalInventoryValue,
      uniqueCustomers,
      totalItemsSold,
      grossProfit,
      totalCostOfGoods
    };
  }, [filteredOrders, products, productMap]);

  // Sales over time with inventory correlation
  const salesOverTime = useMemo(() => {
    const map = new Map();
    for (const s of (filteredOrders || [])) {
      const d = new Date(s.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const current = map.get(key) || { date: key, orders: 0, revenue: 0, items: 0 };
      current.orders += 1;
      current.revenue += s.total || 0;
      current.items += (s.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
      map.set(key, current);
    }
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredOrders]);

  // Top products by revenue and stock correlation
  const topProductsByRevenue = useMemo(() => {
    const revenueMap = new Map();
    for (const s of (filteredOrders || [])) {
      for (const item of s.items || []) {
        const productId = item.productId;
        const revenue = (item.quantity || 0) * (item.price || 0);
        const current = revenueMap.get(productId) || { productId, revenue: 0, quantity: 0, productName: '', category: '' };
        current.revenue += revenue;
        current.quantity += item.quantity || 0;
        current.productName = item.productName || 'Unknown Product';
        current.category = item.category || 'Uncategorized';
        revenueMap.set(productId, current);
      }
    }
    const rows = Array.from(revenueMap.values());
    rows.sort((a, b) => b.revenue - a.revenue);
    return rows.slice(0, 10).map(row => ({
      ...row,
      currentStock: productMap.get(row.productId)?.currentStock || 0,
      cost: productMap.get(row.productId)?.cost || 0,
      profit: row.revenue - (row.quantity * row.cost)
    }));
  }, [filteredOrders, productMap]);

  // Inventory turnover analysis
  const inventoryTurnover = useMemo(() => {
    return topProductsByRevenue.map(product => {
      const turnover = product.currentStock > 0 ? (product.quantity / product.currentStock) : 0;
      return {
        ...product,
        turnover,
        turnoverValue: turnover * product.cost
      };
    });
  }, [topProductsByRevenue]);

  // Revenue by category with stock correlation
  const revenueByCategory = useMemo(() => {
    const map = new Map();
    for (const s of (filteredOrders || [])) {
      for (const item of s.items || []) {
        const category = item.category || 'Uncategorized';
        const revenue = (item.quantity || 0) * (item.price || 0);
        const current = map.get(category) || { category, revenue: 0, items: 0, products: new Set() };
        current.revenue += revenue;
        current.items += item.quantity || 0;
        current.products.add(item.productId);
        map.set(category, current);
      }
    }
    return Array.from(map.values()).map(cat => ({
      ...cat,
      products: cat.products.size,
      avgMargin: 0.25 // Placeholder - would need cost data for accurate calculation
    })).sort((a, b) => b.revenue - a.revenue);
  }, [filteredOrders]);

  // Low stock impact analysis
  const lowStockImpact = useMemo(() => {
    const lowStockItems = products.filter(p => p.currentStock <= p.reorderPoint);
    const impact = lowStockItems.map(product => {
      const productSales = filteredOrders.flatMap(order =>
        (order.items || []).filter(item => item.productId === product.id)
      );
      const potentialRevenue = productSales.reduce((sum, item) =>
        sum + ((item.price || 0) * (product.reorderPoint - product.currentStock)), 0
      );
      return {
        product: product.name,
        category: product.category,
        currentStock: product.currentStock,
        reorderPoint: product.reorderPoint,
        potentialRevenue,
        status: product.currentStock === 0 ? 'Out of Stock' : 'Low Stock'
      };
    });
    return impact.sort((a, b) => b.potentialRevenue - a.potentialRevenue);
  }, [products, filteredOrders]);

  // Top customers by revenue (from SalesReport)
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

  // Revenue by payment method (from SalesReport)
  const revenueByPayment = useMemo(() => {
    const map = new Map();
    for (const s of (filteredOrders || [])) {
      const payment = s.paymentMethod || 'Unknown';
      map.set(payment, (map.get(payment) || 0) + (s.total || 0));
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredOrders]);

  // Top products by quantity sold (from InventoryReport)
  const topProductsByQuantity = useMemo(() => {
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

  // Low stock products (from InventoryReport)
  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.currentStock <= p.reorderPoint).map(p => ({
      product: p.name,
      category: p.category,
      currentStock: p.currentStock,
      reorderPoint: p.reorderPoint,
      status: p.currentStock === 0 ? 'Out of Stock' : 'Low Stock'
    }));
  }, [products]);



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

  // PDF Export Function
  const exportToPDF = async () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;

      // Helper function to add text with word wrapping
      const addWrappedText = (text, x, y, maxWidth, fontSize = 12) => {
        pdf.setFontSize(fontSize);
        const lines = pdf.splitTextToSize(text, maxWidth);
        pdf.text(lines, x, y);
        return y + (lines.length * fontSize * 0.4);
      };

      // Helper function to format currency for PDF (without special characters)
      const formatCurrencyForPDF = (amount) => {
        return 'P' + Number(amount || 0).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
      };

      // Helper function to add new page if needed
      const checkNewPage = (requiredHeight) => {
        if (yPosition + requiredHeight > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }
      };

      // Title
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(139, 92, 246); // Purple color
      pdf.text('Metro Manila Hills Hardware Inventory', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30, 41, 59); // Dark gray
      pdf.text('Comprehensive Business Report', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 20;

      // Report period
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 116, 139);
      const periodText = `Report Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
      pdf.text(periodText, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 20;

      // Executive Summary
      checkNewPage(60);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30, 41, 59);
      pdf.text('Executive Summary', margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 116, 139);

      const summaryText = `This comprehensive business report covers ${kpis.totalOrders} transactions with total revenue of ${formatCurrencyForPDF(kpis.totalRevenue)}. The report includes detailed analysis of sales performance, inventory status, product performance, and business insights for the selected period.`;
      yPosition = addWrappedText(summaryText, margin, yPosition, pageWidth - 2 * margin);
      yPosition += 10;

      // Key Performance Indicators
      checkNewPage(80);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30, 41, 59);
      pdf.text('Key Performance Indicators', margin, yPosition);
      yPosition += 15;

      const kpiData = [
        ['Total Revenue', formatCurrencyForPDF(kpis.totalRevenue)],
        ['Total Orders', kpis.totalOrders.toString()],
        ['Average Order Value', formatCurrencyForPDF(kpis.avgOrderValue)],
        ['Gross Profit', formatCurrencyForPDF(kpis.grossProfit)],
        ['Unique Customers', kpis.uniqueCustomers.toString()],
        ['Total Products', kpis.totalProducts.toString()],
        ['Inventory Value', formatCurrencyForPDF(kpis.totalInventoryValue)],
        ['Items Sold', kpis.totalItemsSold.toString()]
      ];

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      kpiData.forEach(([label, value]) => {
        checkNewPage(8);
        pdf.setTextColor(100, 116, 139);
        pdf.text(label + ':', margin, yPosition);
        pdf.setTextColor(30, 41, 59);
        pdf.setFont('helvetica', 'bold');
        pdf.text(value, pageWidth - margin - 40, yPosition);
        pdf.setFont('helvetica', 'normal');
        yPosition += 6;
      });

      yPosition += 10;

      // Top Products
      checkNewPage(60);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30, 41, 59);
      pdf.text('Top Performing Products', margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 116, 139);
      pdf.text('Product Name', margin, yPosition);
      pdf.text('Revenue', margin + 80, yPosition);
      pdf.text('Quantity', margin + 120, yPosition);
      pdf.text('Stock', margin + 150, yPosition);
      yPosition += 5;

      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;

      topProductsByRevenue.slice(0, 10).forEach((product, index) => {
        checkNewPage(8);
        pdf.setTextColor(30, 41, 59);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${index + 1}. ${product.productName}`, margin, yPosition);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 116, 139);
        pdf.text(formatCurrencyForPDF(product.revenue), margin + 80, yPosition);
        pdf.text(product.quantity.toString(), margin + 120, yPosition);
        pdf.text(product.currentStock.toString(), margin + 150, yPosition);
        yPosition += 6;
      });

      yPosition += 10;

      // Inventory Status
      checkNewPage(60);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30, 41, 59);
      pdf.text('Inventory Status Summary', margin, yPosition);
      yPosition += 15;

      const inventoryData = [
        ['Total Products', kpis.totalProducts.toString()],
        ['Normal Stock', (kpis.totalProducts - kpis.lowStockProducts).toString()],
        ['Low Stock Items', (kpis.lowStockProducts - kpis.outOfStockProducts).toString()],
        ['Out of Stock Items', kpis.outOfStockProducts.toString()]
      ];

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      inventoryData.forEach(([label, value]) => {
        checkNewPage(8);
        pdf.setTextColor(100, 116, 139);
        pdf.text(label + ':', margin, yPosition);
        pdf.setTextColor(30, 41, 59);
        pdf.setFont('helvetica', 'bold');
        pdf.text(value, pageWidth - margin - 30, yPosition);
        pdf.setFont('helvetica', 'normal');
        yPosition += 6;
      });

      // Footer
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(
          `Generated on ${new Date().toLocaleDateString()} | Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      // Save the PDF
      const fileName = `comprehensive_business_report_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF report. Please try again.');
    }
  };

  return (
    <Box sx={{ backgroundColor: '#f8fafc', minHeight: '100vh', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" sx={{
          fontWeight: 700,
          color: '#1e293b',
          mb: 1,
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          <BusinessIcon sx={{ mr: 2, verticalAlign: 'bottom' }} />
          Comprehensive Business Report
        </Typography>
        <Typography variant="subtitle1" sx={{ color: '#64748b', fontSize: '1.1rem' }}>
          Complete inventory and sales analysis with business insights and performance metrics
        </Typography>
        <Divider sx={{ mt: 2, borderColor: '#e2e8f0' }} />
      </Box>

      {/* Filters */}
      <Paper elevation={0} sx={{
        p: 3,
        mb: 4,
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        border: '1px solid #e2e8f0',
        borderRadius: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FilterListIcon sx={{ color: '#8b5cf6', mr: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
            Report Filters & Controls
          </Typography>
        </Box>

        {/* Date Presets */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1 }}>
            Quick Date Ranges
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {[
              { label: 'Today', value: 'today' },
              { label: 'Yesterday', value: 'yesterday' },
              { label: 'Last 7 Days', value: 'last7days' },
              { label: 'Last 30 Days', value: 'last30days' },
              { label: 'Last 90 Days', value: 'last90days' },
              { label: 'This Month', value: 'thisMonth' },
              { label: 'Last Month', value: 'lastMonth' }
            ].map((preset) => (
              <Chip
                key={preset.value}
                label={preset.label}
                onClick={() => handleDatePreset(preset.value)}
                variant={datePreset === preset.value ? 'filled' : 'outlined'}
                sx={{
                  cursor: 'pointer',
                  backgroundColor: datePreset === preset.value ? '#8b5cf6' : 'transparent',
                  color: datePreset === preset.value ? 'white' : '#64748b',
                  borderColor: '#cbd5e1',
                  '&:hover': {
                    backgroundColor: datePreset === preset.value ? '#7c3aed' : '#f8fafc',
                    borderColor: '#8b5cf6'
                  }
                }}
              />
            ))}
          </Box>
        </Box>

        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={3}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={(d) => d && setStartDate(d)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  sx: {
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#ffffff',
                      '&:hover fieldset': {
                        borderColor: '#8b5cf6',
                      },
                    }
                  }
                }
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={(d) => d && setEndDate(d)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  sx: {
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#ffffff',
                      '&:hover fieldset': {
                        borderColor: '#8b5cf6',
                      },
                    }
                  }
                }
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<PdfIcon />}
                onClick={exportToPDF}
                sx={{
                  borderColor: '#ef4444',
                  color: '#ef4444',
                  '&:hover': {
                    borderColor: '#dc2626',
                    backgroundColor: '#fef2f2'
                  }
                }}
              >
                PDF
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            color: 'white',
            borderRadius: 3,
            boxShadow: '0 8px 25px rgba(139, 92, 246, 0.3)'
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
                label={`${kpis.totalOrders} transactions`}
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
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            borderRadius: 3,
            boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUpIcon sx={{ fontSize: 40, mr: 2, opacity: 0.9 }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 500, opacity: 0.9 }}>
                    Gross Profit
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {currency(kpis.grossProfit)}
                  </Typography>
                </Box>
              </Box>
              <Chip
                label={`${((kpis.grossProfit / kpis.totalRevenue) * 100).toFixed(1)}% margin`}
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
                <PeopleIcon sx={{ fontSize: 40, mr: 2, opacity: 0.9 }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 500, opacity: 0.9 }}>
                    Unique Customers
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {kpis.uniqueCustomers.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
              <Chip
                label={`${kpis.totalItemsSold} items sold`}
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
                <InventoryIcon sx={{ fontSize: 40, mr: 2, opacity: 0.9 }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 500, opacity: 0.9 }}>
                    Inventory Value
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {currency(kpis.totalInventoryValue)}
                  </Typography>
                </Box>
              </Box>
              <Chip
                label={`${kpis.totalProducts} products`}
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

      {/* Tabs for different views */}
      <Paper sx={{ mb: 4, borderRadius: 3, overflow: 'hidden' }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            backgroundColor: '#f8fafc',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              minHeight: 64
            }
          }}
        >
          <Tab icon={<TimelineIcon />} label="Sales Overview" />
          <Tab icon={<InventoryIcon />} label="Inventory Overview" />
          <Tab icon={<BusinessIcon />} label="Product Performance" />
          <Tab icon={<AssessmentIcon />} label="Business Insights" />
        </Tabs>

        {/* Tab Panels */}
        {activeTab === 0 && (
          <Box sx={{ p: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1e293b', mb: 3 }}>
              Sales Overview
            </Typography>
            <Grid container spacing={4}>
              <Grid item xs={12} lg={8}>
                <Card sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', mb: 4 }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 3 }}>
                      Revenue & Order Trends
                    </Typography>
                    <ResponsiveContainer width="100%" height={350}>
                      <ComposedChart data={salesOverTime}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                          dataKey="date"
                          stroke="#64748b"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          yAxisId="left"
                          stroke="#64748b"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `${currency(value)}`}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          stroke="#64748b"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
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
                          yAxisId="left"
                          type="monotone"
                          dataKey="revenue"
                          stroke="#8b5cf6"
                          strokeWidth={3}
                          fill="#8b5cf6"
                          fillOpacity={0.1}
                          name="Revenue"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="orders"
                          stroke="#10b981"
                          strokeWidth={3}
                          name="Orders"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 3 }}>
                      Top Performing Customers
                    </Typography>
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
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} lg={4}>
                <Card sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', mb: 4 }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 3 }}>
                      Revenue by Category
                    </Typography>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={revenueByCategory}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="revenue"
                        >
                          {revenueByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={
                              index === 0 ? '#8b5cf6' :
                              index === 1 ? '#10b981' :
                              index === 2 ? '#3b82f6' :
                              index === 3 ? '#f59e0b' : '#ef4444'
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
                      {revenueByCategory.map((entry, index) => (
                        <Box key={entry.category} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Box sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: index === 0 ? '#8b5cf6' : index === 1 ? '#10b981' : index === 2 ? '#3b82f6' : index === 3 ? '#f59e0b' : '#ef4444',
                            mr: 2
                          }} />
                          <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                            {entry.category}: {currency(entry.revenue)}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
                <Card sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 3 }}>
                      Payment Methods
                    </Typography>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={revenueByPayment}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
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
          </Box>
        )}

        {activeTab === 1 && (
          <Box sx={{ p: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1e293b', mb: 3 }}>
              Inventory Overview
            </Typography>
            <Grid container spacing={4}>
              <Grid item xs={12} lg={8}>
                <Card sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', mb: 4 }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 3 }}>
                      Best Performing Products (by Quantity Sold)
                    </Typography>
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
                        {topProductsByQuantity.map((row, idx) => (
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
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                <Card sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 3 }}>
                      Inventory Alerts - Low Stock Items
                    </Typography>
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
              </Grid>
              <Grid item xs={12} lg={4}>
                <Card sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', mb: 4 }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 3 }}>
                      Stock Status Overview
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
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
                          outerRadius={100}
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
                <Card sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 3 }}>
                      Low Stock Impact Analysis
                    </Typography>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                          <TableCell sx={{ fontWeight: 600, color: '#374151', borderBottom: '2px solid #e2e8f0' }}>
                            Product
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: '#374151', borderBottom: '2px solid #e2e8f0' }}>
                            Current Stock
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: '#374151', borderBottom: '2px solid #e2e8f0' }}>
                            Reorder Point
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: '#374151', borderBottom: '2px solid #e2e8f0' }}>
                            Potential Revenue
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {lowStockImpact.slice(0, 5).map((row, idx) => (
                          <TableRow key={idx} sx={{
                            '&:hover': { backgroundColor: '#f8fafc' },
                            borderBottom: '1px solid #f1f5f9'
                          }}>
                            <TableCell>
                              <Typography variant="body1" sx={{ fontWeight: 500, color: '#1e293b' }}>
                                {row.product}
                              </Typography>
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
                              <Typography variant="body1" sx={{
                                fontWeight: 600,
                                color: row.potentialRevenue > 0 ? '#10b981' : '#64748b'
                              }}>
                                {currency(row.potentialRevenue)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {activeTab === 2 && (
          <Box sx={{ p: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1e293b', mb: 3 }}>
              Inventory Analysis & Alerts
            </Typography>
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 3 }}>
                      Stock Status Overview
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
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
                          outerRadius={100}
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
              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 3 }}>
                      Low Stock Impact Analysis
                    </Typography>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                          <TableCell sx={{ fontWeight: 600, color: '#374151', borderBottom: '2px solid #e2e8f0' }}>
                            Product
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: '#374151', borderBottom: '2px solid #e2e8f0' }}>
                            Current Stock
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: '#374151', borderBottom: '2px solid #e2e8f0' }}>
                            Reorder Point
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: '#374151', borderBottom: '2px solid #e2e8f0' }}>
                            Potential Revenue
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {lowStockImpact.slice(0, 5).map((row, idx) => (
                          <TableRow key={idx} sx={{
                            '&:hover': { backgroundColor: '#f8fafc' },
                            borderBottom: '1px solid #f1f5f9'
                          }}>
                            <TableCell>
                              <Typography variant="body1" sx={{ fontWeight: 500, color: '#1e293b' }}>
                                {row.product}
                              </Typography>
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
                              <Typography variant="body1" sx={{
                                fontWeight: 600,
                                color: row.potentialRevenue > 0 ? '#10b981' : '#64748b'
                              }}>
                                {currency(row.potentialRevenue)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {activeTab === 3 && (
          <Box sx={{ p: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1e293b', mb: 3 }}>
              Business Insights & Recommendations
            </Typography>
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 3 }}>
                      Key Performance Indicators
                    </Typography>
                    <Box sx={{ space: 3 }}>
                      <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" sx={{ color: '#64748b' }}>
                            Average Order Value
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e293b' }}>
                            {currency(kpis.avgOrderValue)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" sx={{ color: '#64748b' }}>
                            Gross Profit Margin
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: '#10b981' }}>
                            {kpis.totalRevenue > 0 ? ((kpis.grossProfit / kpis.totalRevenue) * 100).toFixed(1) : 0}%
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" sx={{ color: '#64748b' }}>
                            Customer Acquisition
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e293b' }}>
                            {kpis.uniqueCustomers} customers
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" sx={{ color: '#64748b' }}>
                            Inventory Turnover
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e293b' }}>
                            {inventoryTurnover.length > 0 ?
                              (inventoryTurnover.reduce((sum, item) => sum + item.turnover, 0) / inventoryTurnover.length).toFixed(2) : 0}x
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 3 }}>
                      Recommendations
                    </Typography>
                    <Box sx={{ space: 3 }}>
                      {kpis.outOfStockProducts > 0 && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                          <Typography variant="body2">
                            <strong>Critical:</strong> {kpis.outOfStockProducts} products are out of stock.
                            Potential revenue impact: {currency(lowStockImpact.reduce((sum, item) => sum + item.potentialRevenue, 0))}
                          </Typography>
                        </Alert>
                      )}
                      {kpis.lowStockProducts > 5 && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                          <Typography variant="body2">
                            <strong>Attention:</strong> {kpis.lowStockProducts} products have low stock levels.
                            Consider restocking high-performing items first.
                          </Typography>
                        </Alert>
                      )}
                      {kpis.grossProfit > 0 && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                          <Typography variant="body2">
                            <strong>Excellent:</strong> Your gross profit margin is healthy at {((kpis.grossProfit / kpis.totalRevenue) * 100).toFixed(1)}%.
                            Focus on high-margin products for maximum profitability.
                          </Typography>
                        </Alert>
                      )}
                      {kpis.uniqueCustomers < 10 && filteredOrders.length > 0 && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                          <Typography variant="body2">
                            <strong>Opportunity:</strong> Consider customer loyalty programs to increase repeat business.
                            Current customer base: {kpis.uniqueCustomers}
                          </Typography>
                        </Alert>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ComprehensiveReport;
