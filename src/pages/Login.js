import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Store as StoreIcon,
  Lock as LockIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext.js';
import { setupCurrentUserAsAdmin, checkCurrentUserRole } from '../utils/setupAdminUser.js';



const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAdminSetup, setShowAdminSetup] = useState(false);
  const [adminSetupLoading, setAdminSetupLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      if (!result.success) {
        setError(result.message);
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSetup = async () => {
    setAdminSetupLoading(true);
    try {
      const result = await setupCurrentUserAsAdmin();
      if (result.success) {
        setShowAdminSetup(false);
        setError('');
        // Show success message
        alert('Admin setup completed! Please refresh the page and try logging in again.');
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Failed to setup admin user: ' + error.message);
    } finally {
      setAdminSetupLoading(false);
    }
  };



  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: 2
      }}
    >
      <Card
        sx={{
          maxWidth: 400,
          width: '100%',
          borderRadius: 3,
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          overflow: 'visible'
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Logo and Title */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                backgroundColor: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
                boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)'
              }}
            >
              <StoreIcon sx={{ fontSize: 40, color: 'white' }} />
            </Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#1e293b', mb: 1 }}>
              MMH Hardware
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748b' }}>
              Inventory Management System
            </Typography>
          </Box>

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
                         <TextField
               fullWidth
               label="Email"
               type="email"
               value={email}
               onChange={(e) => setEmail(e.target.value)}
               margin="normal"
               required
               InputProps={{
                 startAdornment: (
                   <InputAdornment position="start">
                     <LockIcon color="action" />
                   </InputAdornment>
                 ),
               }}
             />
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                backgroundColor: '#3b82f6',
                '&:hover': {
                  backgroundColor: '#2563eb'
                }
              }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          {/* Admin Setup Button */}
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<AdminIcon />}
              onClick={() => setShowAdminSetup(true)}
              sx={{ textTransform: 'none' }}
            >
              Setup Admin Access
            </Button>
          </Box>

        </CardContent>
      </Card>

      {/* Admin Setup Dialog */}
      <Dialog open={showAdminSetup} onClose={() => setShowAdminSetup(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AdminIcon color="primary" />
            Admin Setup
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            This will set up your current user account as an administrator with full access to all system features.
          </Alert>
          <Typography variant="body2" sx={{ mb: 2 }}>
            This setup is required for first-time users to establish proper permissions in the system. Make sure you're logged in with the account you want to use as an administrator.
          </Typography>
          <Alert severity="warning">
            <strong>Security Note:</strong> This action creates an admin user in the system. Only use this if you're authorized to set up administrative access.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAdminSetup(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAdminSetup}
            variant="contained"
            disabled={adminSetupLoading}
            startIcon={adminSetupLoading ? <CircularProgress size={16} /> : <AdminIcon />}
          >
            {adminSetupLoading ? 'Setting up...' : 'Setup Admin User'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default Login;
