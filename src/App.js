import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider/index.js';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns/index.js';

// Layout Components
import Layout from './components/Layout/Layout.js';
import Sidebar from './components/Layout/Sidebar.js';
import Header from './components/Layout/Header.js';

// Page Components
import Dashboard from './pages/Dashboard.js';
import Products from './pages/Products.js';
import Categories from './pages/Categories.js';
import Reports from './pages/Reports.js';
import InventoryReport from './pages/InventoryReport.js';
import GuideManual from './pages/GuideManual.js';
import QuickStartModal from './components/QuickStart/QuickStartModal.js';
import Settings from './pages/Settings.js';
import UserManagement from './pages/UserManagement.js';
import Profile from './pages/Profile.js';
import Login from './pages/Login.js';

// Context
import { AuthProvider, useAuth } from './contexts/AuthContext.js';
import { InventoryProvider } from './contexts/InventoryContext.js';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Admin Route Component
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  return isAuthenticated && isAdmin() ? children : <Navigate to="/" replace />;
};

// Main App Content
const AppContent = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // Handle Electron menu events
  useEffect(() => {
    if (window.electronAPI) {
      const handleImportProducts = () => {
        // Handle import products from menu
        console.log('Import products triggered from menu');
      };

      const handleExportReport = () => {
        // Handle export report from menu
        console.log('Export report triggered from menu');
      };

      window.electronAPI.onImportProducts(handleImportProducts);
      window.electronAPI.onExportReport(handleExportReport);

      return () => {
        window.electronAPI.removeAllListeners('import-products');
        window.electronAPI.removeAllListeners('export-report');
      };
    }
  }, []);

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Layout>
      <Sidebar open={true} />
      <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <Header />
        {/* First-run quick start modal shown to authenticated users who haven't dismissed it */}
        <QuickStartModal />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: location.pathname === '/products' ? 1 : 3,
            width: '100%', // Ensure it takes full width
            maxWidth: location.pathname === '/products' ? 'none' : '1400px', // Remove max width for products page
            mx: 'auto', // Center the content
            overflowY: 'auto', // Allow vertical scrolling for content
            height: 'calc(100vh - 64px)', // Adjust height based on header (assuming header height is 64px)
          }}
        >
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/guide" element={<GuideManual />} />
            <Route path="/products" element={<Products />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/reports" element={<AdminRoute><Reports /></AdminRoute>} />


            <Route path="/reports/inventory" element={<AdminRoute><InventoryReport /></AdminRoute>} />
            <Route path="/user-management" element={<AdminRoute><UserManagement /></AdminRoute>} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Box>
      </Box>
    </Layout>
  );
};

// Main App Component
const App = () => {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <AuthProvider>
        <InventoryProvider>
          <Router>
            <CssBaseline />
            <AppContent />
          </Router>
        </InventoryProvider>
      </AuthProvider>
    </LocalizationProvider>
  );
};

export default App;
