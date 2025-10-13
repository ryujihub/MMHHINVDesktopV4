import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  AttachMoney as MoneyIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  AdminPanelSettings as AdminIcon,
  MoneyOff as MoneyOffIcon // Import MoneyOffIcon for lost amount
} from '@mui/icons-material';
import { useInventory } from '../contexts/InventoryContext.js';
import { useAuth } from '../contexts/AuthContext.js';
import { setupCurrentUserAsAdmin, checkCurrentUserRole } from '../utils/setupAdminUser.js';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, limit as fbLimit, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase.js';

const Dashboard = () => {
  const { products, categories, getLowStockProducts, totalLostAmount } = useInventory();
  const { user, isAdmin, getUserRole, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [adminSetupMessage, setAdminSetupMessage] = useState('');
  const [adminSetupSeverity, setAdminSetupSeverity] = useState('info');
  const [recentActivity, setRecentActivity] = useState([]);

  const lowStockProducts = (products || []).filter(p => (Number(p.currentStock) || 0) <= (Number(p.reorderPoint) || 0));
  const totalValue = (products || []).reduce((sum, product) => {
    const stock = Number(product.currentStock) || 0;
    // Use cost if available, otherwise fallback to price, then to 0
    const cost = Number(product.cost) || Number(product.price) || 0;
    const productValue = stock * cost;
    
    // Debug logging for products with issues
    if (isNaN(productValue)) {
      console.log('Product with calculation issue:', {
        name: product.name,
        currentStock: product.currentStock,
        cost: product.cost,
        price: product.price,
        calculatedValue: productValue
      });
    }
    
    return sum + productValue;
  }, 0);

  // Check if we have products but no total value (missing cost/price data)
  const hasProductsButNoValue = (products || []).length > 0 && totalValue === 0;
  if (hasProductsButNoValue) {
    console.log('Warning: Products exist but Total Value is 0. Check if products have cost or price fields set.');
  }

  // Admin setup functions
  const handleSetupAdmin = async () => {
    try {
      const result = await setupCurrentUserAsAdmin();
      if (result.success) {
        setAdminSetupMessage('Successfully set as admin! Please refresh the page.');
        setAdminSetupSeverity('success');
      } else {
        setAdminSetupMessage(`Failed: ${result.message}`);
        setAdminSetupSeverity('error');
      }
    } catch (error) {
      setAdminSetupMessage(`Error: ${error.message}`);
      setAdminSetupSeverity('error');
    }
  };

  const handleCheckRole = async () => {
    try {
      const result = await checkCurrentUserRole();
      if (result.success) {
        setAdminSetupMessage(result.message);
        setAdminSetupSeverity('info');
      } else {
        setAdminSetupMessage(result.message);
        setAdminSetupSeverity('warning');
      }
    } catch (error) {
      setAdminSetupMessage(`Error: ${error.message}`);
      setAdminSetupSeverity('error');
    }
  };

  const stockData = useMemo(() => {
    const categoryCounts = new Map();
    (categories || []).forEach(cat => categoryCounts.set(cat.name, 0));

    (products || []).forEach(product => {
      const categoryName = product.category || 'Uncategorized';
      categoryCounts.set(categoryName, (categoryCounts.get(categoryName) || 0) + 1);
    });

    return Array.from(categoryCounts.entries()).map(([name, value]) => ({ name, value }));
  }, [products, categories]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const StatCard = ({ title, value, subtitle, icon, color, action, onAction }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              backgroundColor: color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}
          >
            {icon}
          </Box>
          {action && (
            <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={onAction}>
              {action}
            </Button>
          )}
        </Box>
        <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  // Quick actions handlers
  const handleAddNewProduct = () => {
    navigate('/products', { state: { openAddDialog: true } });
  };

  const handleViewReports = () => {
    navigate('/reports');
  };

  // Subscribe to recent activity (if collection exists)
  useEffect(() => {
    try {
      const q = query(
        collection(db, 'activity'),
        orderBy('createdAt', 'desc'),
        fbLimit(10)
      );
      const unsub = onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setRecentActivity(items);
      }, (err) => {
        console.error('Recent activity subscription error:', err);
      });
      return () => unsub();
    } catch (e) {
      console.error('Failed to subscribe to activity:', e);
    }
  }, []);

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1, color: '#3b82f6' }}>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome back, {user?.name}! Here's an overview of your inventory system.
        </Typography>
        
        {/* Admin Setup Section - Only show for users who need admin setup */}
        {user && user.role === 'admin' && !hasPermission('admin') && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              🔧 Admin Setup Required
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Current Role: <strong>{getUserRole()}</strong> | 
              You need admin permissions to access all features.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<AdminIcon />}
                onClick={handleSetupAdmin}
              >
                Set as Admin
              </Button>
              <Button 
                variant="outlined" 
                onClick={handleCheckRole}
              >
                Check Current Role
              </Button>
            </Box>
          </Box>
        )}
        
        {/* Admin Setup Messages */}
        {adminSetupMessage && (
          <Alert 
            severity={adminSetupSeverity} 
            sx={{ mt: 2 }}
            onClose={() => setAdminSetupMessage('')}
          >
            {adminSetupMessage}
          </Alert>
        )}
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Products"
            value={products.length}
            subtitle={`${categories.length} categories`}
            icon={<InventoryIcon />}
            color="#3b82f6"
            action="Add Product"
            onAction={handleAddNewProduct}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Value"
            value={`₱${isNaN(totalValue) ? '0.00' : totalValue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subtitle={`${products.filter(p => (Number(p.currentStock) || 0) > 0).length} stocked items`}
            icon={<MoneyIcon />}
            color="#10b981"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Low Stock Items"
            value={lowStockProducts.length}
            subtitle="Need reordering"
            icon={<WarningIcon />}
            color="#f59e0b"
            action="View All"
            onAction={() => navigate('/products')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Lost Amount"
            value={`₱${isNaN(totalLostAmount) ? '0.00' : totalLostAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subtitle="Due to inventory variance"
            icon={<WarningIcon />}
            color="#ef4444"
          />
        </Grid>
      </Grid>

      {/* Charts and Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Stock Distribution Chart */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                Product Distribution by Category
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stockData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                Quick Actions
              </Typography>
              
              {/* User Role Display */}
              <Box sx={{ mb: 2, p: 1, bgcolor: 'primary.50', borderRadius: 1 }}>
                <Typography variant="body2" color="primary.main" sx={{ fontWeight: 'bold' }}>
                  👤 User Role: {getUserRole().toUpperCase()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {isAdmin() ? 'Full access to all features' : 'Limited access - contact admin'}
                </Typography>
              </Box>
              
              <List>
                <ListItem button onClick={handleAddNewProduct}>
                  <ListItemIcon>
                    <AddIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Add New Product" />
                </ListItem>
                <ListItem button onClick={handleViewReports}>
                  <ListItemIcon>
                    <ViewIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="View Reports" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Low Stock Alerts and Recent Activity */}
      <Grid container spacing={3}>
        {/* Low Stock Alerts */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <WarningIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Low Stock Alerts
                </Typography>
                <Chip
                  label={lowStockProducts.length}
                  color="warning"
                  size="small"
                  sx={{ ml: 'auto' }}
                />
              </Box>
              {lowStockProducts.length > 0 ? (
                <List dense>
                  {lowStockProducts.slice(0, 5).map((product) => (
                    <ListItem key={product.id} sx={{ px: 0 }}>
                                             <ListItemText
                         primary={product.name}
                         secondary={`Stock: ${product.currentStock} ${product.unit} • Reorder: ${product.reorderPoint}`}
                       />
                      <Chip
                        label="Reorder"
                        color="primary"
                        size="small"
                        variant="outlined"
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  All products are well stocked! 🎉
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                Recent Activity
              </Typography>
              {recentActivity.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No recent activity yet.
                </Typography>
              ) : (
                <List dense>
                  {recentActivity.map((item) => (
                    <React.Fragment key={item.id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon>
                          {(() => {
                            const type = item.type || '';
                            if (type.startsWith('product')) return <InventoryIcon color="primary" />;
                            if (type.startsWith('category')) return <InventoryIcon color="info" />;
                            if (type.startsWith('sale')) return <TrendingUpIcon color="success" />;
                            return <TrendingUpIcon color="action" />;
                          })()}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.message || item.title || 'Activity'}
                          secondary={(() => {
                            const ts = item.createdAt?.toDate?.();
                            const when = ts ? ts.toLocaleString() : '';
                            if (item.type?.startsWith('sale')) {
                              const parts = [];
                              if (item.saleNumber) parts.push(item.saleNumber);
                              if (item.customerName) parts.push(item.customerName);
                              if (typeof item.total === 'number') parts.push(`₱${item.total.toFixed(2)}`);
                              const details = parts.join(' • ');
                              return details ? `${details} • ${when}` : when;
                            }
                            return when;
                          })()}
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
