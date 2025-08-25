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
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Store as StoreIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext.js';

// Create User Form Component
const CreateUserForm = ({ onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'staff'
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { createUser } = useAuth();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      onError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      onError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const result = await createUser(formData.email, formData.password, {
        name: formData.name,
        role: formData.role,
        permissions: formData.role === 'admin' ? ['view', 'edit', 'delete', 'admin'] : ['view', 'edit']
      });

      if (result.success) {
        setSuccess(true);
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: 'staff'
        });
        // Auto-close after 2 seconds
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        onError(result.message);
      }
    } catch (error) {
      onError('Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          User created successfully! You can now log in with the new account.
        </Alert>
      )}
      
      <TextField
        fullWidth
        label="Full Name"
        value={formData.name}
        onChange={(e) => handleInputChange('name', e.target.value)}
        margin="normal"
        required
      />
      
      <TextField
        fullWidth
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => handleInputChange('email', e.target.value)}
        margin="normal"
        required
      />
      
      <TextField
        fullWidth
        label="Password"
        type="password"
        value={formData.password}
        onChange={(e) => handleInputChange('password', e.target.value)}
        margin="normal"
        required
        helperText="Minimum 6 characters"
      />
      
      <TextField
        fullWidth
        label="Confirm Password"
        type="password"
        value={formData.confirmPassword}
        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
        margin="normal"
        required
      />
      
      <FormControl fullWidth margin="normal">
        <InputLabel>Role</InputLabel>
        <Select
          value={formData.role}
          onChange={(e) => handleInputChange('role', e.target.value)}
          label="Role"
        >
          <MenuItem value="staff">Staff</MenuItem>
          <MenuItem value="admin">Admin</MenuItem>
        </Select>
      </FormControl>
      
      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create User'}
        </Button>
        <Button
          variant="outlined"
          fullWidth
          onClick={() => onSuccess()}
        >
          Cancel
        </Button>
      </Box>
    </form>
  );
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const { login, createUser } = useAuth();

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

          {/* Create User Link */}
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
              Don't have an account?
            </Typography>
            <Button
              variant="text"
              color="primary"
              onClick={() => setShowCreateUser(true)}
              sx={{ textTransform: 'none' }}
            >
              Create New User
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={showCreateUser} onClose={() => setShowCreateUser(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          <CreateUserForm 
            onSuccess={() => {
              setShowCreateUser(false);
              setError('');
            }}
            onError={(message) => setError(message)}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export { CreateUserForm };
export default Login;
