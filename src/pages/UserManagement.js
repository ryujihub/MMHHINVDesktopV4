import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TextField,
  MenuItem,
  Chip,
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
  FormControlLabel,
  Switch,
  InputAdornment,
  CircularProgress,
  Avatar,
  Badge
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext.js';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, setDoc, serverTimestamp, query, where, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase.js';

const UserManagement = () => {
  const { user: currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'staff',
    isActive: true
  });
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Load users on component mount
  useEffect(() => {
    if (isAdmin()) {
      loadUsers();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastLogin: doc.data().lastLogin?.toDate?.() || null
      }));
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      setSnackbar({
        open: true,
        message: 'Error loading users: ' + error.message,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate secure password
  const generateSecurePassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setGeneratedPassword(password);
    setFormData(prev => ({ ...prev, password }));
    return password;
  };

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'active' && user.isActive !== false) ||
                         (statusFilter === 'inactive' && user.isActive === false);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Handle user creation
  const handleCreateUser = async () => {
    if (!formData.name || !formData.email) {
      setSnackbar({
        open: true,
        message: 'Name and email are required',
        severity: 'error'
      });
      return;
    }

    if (!generatedPassword || generatedPassword.length < 8) {
      setSnackbar({
        open: true,
        message: 'Please generate a secure password (minimum 8 characters)',
        severity: 'error'
      });
      return;
    }

    setFormLoading(true);
    try {
      // First, create the user in Firebase Auth
      const { createUserWithEmailAndPassword } = await import('firebase/auth');
      const { auth } = await import('../config/firebase.js');

      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, generatedPassword);
      const newUser = userCredential.user;

      // Then save user data to Firestore
      await setDoc(doc(db, 'users', newUser.uid), {
        uid: newUser.uid,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        isActive: formData.isActive,
        permissions: formData.role === 'admin' ? ['view', 'edit', 'delete', 'admin'] : ['view', 'edit'],
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        lastLogin: null,
        loginCount: 0
      });

      // Log audit event
      await logAuditEvent('USER_CREATED', {
        targetUserId: newUser.uid,
        targetUserEmail: formData.email,
        role: formData.role,
        createdBy: currentUser.uid
      });

      setSnackbar({
        open: true,
        message: `User created successfully! Temporary password: ${generatedPassword}`,
        severity: 'success'
      });

      setShowCreateDialog(false);
      resetForm();
      loadUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      setSnackbar({
        open: true,
        message: 'Error creating user: ' + error.message,
        severity: 'error'
      });
    } finally {
      setFormLoading(false);
    }
  };

  // Handle user update
  const handleUpdateUser = async () => {
    if (!selectedUser || !formData.name || !formData.email) {
      setSnackbar({
        open: true,
        message: 'Name and email are required',
        severity: 'error'
      });
      return;
    }

    setFormLoading(true);
    try {
      await updateDoc(doc(db, 'users', selectedUser.id), {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        isActive: formData.isActive,
        permissions: formData.role === 'admin' ? ['view', 'edit', 'delete', 'admin'] : ['view', 'edit'],
        updatedBy: currentUser.uid,
        updatedAt: serverTimestamp()
      });

      // Log audit event
      await logAuditEvent('USER_UPDATED', {
        targetUserId: selectedUser.id,
        targetUserEmail: formData.email,
        newRole: formData.role,
        updatedBy: currentUser.uid
      });

      setSnackbar({
        open: true,
        message: 'User updated successfully!',
        severity: 'success'
      });

      setShowEditDialog(false);
      setSelectedUser(null);
      resetForm();
      loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      setSnackbar({
        open: true,
        message: 'Error updating user: ' + error.message,
        severity: 'error'
      });
    } finally {
      setFormLoading(false);
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (userToDelete) => {
    if (userToDelete.id === currentUser.uid) {
      setSnackbar({
        open: true,
        message: 'Cannot delete your own account!',
        severity: 'error'
      });
      return;
    }

    if (window.confirm(`Are you sure you want to delete user "${userToDelete.name}"? This action cannot be undone.`)) {
      try {
        await deleteDoc(doc(db, 'users', userToDelete.id));

        // Log audit event
        await logAuditEvent('USER_DELETED', {
          targetUserId: userToDelete.id,
          targetUserEmail: userToDelete.email,
          deletedBy: currentUser.uid
        });

        setSnackbar({
          open: true,
          message: 'User deleted successfully!',
          severity: 'success'
        });

        loadUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        setSnackbar({
          open: true,
          message: 'Error deleting user: ' + error.message,
          severity: 'error'
        });
      }
    }
  };

  // Audit logging function
  const logAuditEvent = async (action, details) => {
    try {
      await addDoc(collection(db, 'audit_logs'), {
        action,
        details,
        performedBy: currentUser.uid,
        performedByEmail: currentUser.email,
        timestamp: serverTimestamp(),
        ipAddress: 'system' // In production, get from request
      });
    } catch (error) {
      console.error('Error logging audit event:', error);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'staff',
      isActive: true
    });
    setGeneratedPassword('');
    setShowPassword(false);
  };

  // Open edit dialog
  const openEditDialog = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'staff',
      isActive: user.isActive !== false
    });
    setShowEditDialog(true);
  };

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    return role === 'admin' ? 'primary' : 'default';
  };

  // Get status badge
  const getStatusBadge = (user) => {
    if (user.id === currentUser.uid) return 'You';
    if (user.isActive === false) return 'Inactive';
    if (user.lastLogin) {
      const daysSinceLogin = Math.floor((Date.now() - user.lastLogin.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceLogin === 0) return 'Online';
      if (daysSinceLogin <= 7) return 'Recent';
      return 'Away';
    }
    return 'Never';
  };

  if (!isAdmin()) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Access Denied: Administrator privileges required for user management.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#3b82f6' }}>
          👥 User Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowCreateDialog(true)}
        >
          Create New User
        </Button>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                select
                label="Filter by Role"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <MenuItem value="all">All Roles</MenuItem>
                <MenuItem value="admin">Administrators</MenuItem>
                <MenuItem value="staff">Staff Members</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                select
                label="Filter by Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadUsers}
                disabled={loading}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell>Login Count</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: user.role === 'admin' ? '#3b82f6' : '#64748b' }}>
                          {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">{user.name || 'No Name'}</Typography>
                          <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.role?.toUpperCase() || 'STAFF'}
                        color={getRoleBadgeColor(user.role)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusBadge(user)}
                        color={user.id === currentUser.uid ? 'primary' : user.isActive === false ? 'error' : 'success'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {user.lastLogin ? user.lastLogin.toLocaleDateString() : 'Never'}
                    </TableCell>
                    <TableCell>{user.loginCount || 0}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Edit User">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => openEditDialog(user)}
                            disabled={user.id === currentUser.uid}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete User">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteUser(user)}
                            disabled={user.id === currentUser.uid}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No users found matching the current filters.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              margin="normal"
              required
            />

            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              margin="normal"
              required
            />

            <TextField
              fullWidth
              select
              label="Role"
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              margin="normal"
              required
            >
              <MenuItem value="staff">Staff</MenuItem>
              <MenuItem value="admin">Administrator</MenuItem>
            </TextField>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                />
              }
              label="Account Active"
              sx={{ mt: 2 }}
            />

            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Temporary Password
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  fullWidth
                  type={showPassword ? 'text' : 'password'}
                  value={generatedPassword}
                  onChange={(e) => setGeneratedPassword(e.target.value)}
                  placeholder="Generate a secure password..."
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  variant="outlined"
                  onClick={generateSecurePassword}
                  startIcon={<LockIcon />}
                >
                  Generate
                </Button>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Generate a secure temporary password for the new user
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button
                variant="contained"
                onClick={handleCreateUser}
                disabled={formLoading || !generatedPassword}
                fullWidth
              >
                {formLoading ? 'Creating...' : 'Create User'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setShowCreateDialog(false);
                  resetForm();
                }}
                fullWidth
              >
                Cancel
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onClose={() => setShowEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              margin="normal"
              required
            />

            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              margin="normal"
              required
            />

            <TextField
              fullWidth
              select
              label="Role"
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              margin="normal"
              required
            >
              <MenuItem value="staff">Staff</MenuItem>
              <MenuItem value="admin">Administrator</MenuItem>
            </TextField>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                />
              }
              label="Account Active"
              sx={{ mt: 2 }}
            />

            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button
                variant="contained"
                onClick={handleUpdateUser}
                disabled={formLoading}
                fullWidth
              >
                {formLoading ? 'Updating...' : 'Update User'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setShowEditDialog(false);
                  setSelectedUser(null);
                  resetForm();
                }}
                fullWidth
              >
                Cancel
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserManagement;
