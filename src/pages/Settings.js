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
  DialogActions,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  TextField,
  MenuItem,
  Switch,
  FormControlLabel,
  CircularProgress,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add as AddIcon,
  People as PeopleIcon,
  AdminPanelSettings as AdminIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Backup as BackupIcon,
  Restore as RestoreIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  ExpandMore as ExpandMoreIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext.js';
// Admin User Management Component
const AdminUserManagement = ({ onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'staff'
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { createUser, isAdmin } = useAuth();

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
    <Box component="form" onSubmit={handleSubmit}>
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          User created successfully! The user can now log in with their credentials.
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

      <TextField
        fullWidth
        select
        label="Role"
        value={formData.role}
        onChange={(e) => handleInputChange('role', e.target.value)}
        margin="normal"
        required
      >
        <MenuItem value="staff">Staff</MenuItem>
        <MenuItem value="admin">Admin</MenuItem>
      </TextField>

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
    </Box>
  );
};
import { settingsService } from '../services/settingsService.js';

// Backup Management Component - Admin Only
const BackupManagement = ({ onSuccess, onError }) => {
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [backupStats, setBackupStats] = useState(null);
  const { user } = useAuth();

  const handleExportBackup = async () => {
    setBackupLoading(true);
    try {
      const result = await settingsService.exportBackup();
      onSuccess('Backup exported successfully! Check your downloads folder.');
    } catch (error) {
      onError('Failed to export backup: ' + error.message);
    } finally {
      setBackupLoading(false);
    }
  };

  const handleImportBackup = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setRestoreLoading(true);
    try {
      const result = await settingsService.importBackup(file, user?.uid);
      if (result.success) {
        setShowRestoreDialog(false);
        onSuccess('Backup restored successfully! All data has been imported.');
      } else {
        onError('Failed to restore backup: ' + result.message);
      }
    } catch (error) {
      onError('Failed to restore backup: ' + error.message);
    } finally {
      setRestoreLoading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handlePreviewBackup = async () => {
    setBackupLoading(true);
    try {
      const backupData = await settingsService.backupAllData();
      const stats = {
        inventory: backupData.collections.inventory?.length || 0,
        categories: backupData.collections.categories?.length || 0,
        orders: backupData.collections.orders?.length || 0,
        users: backupData.collections.users?.length || 0,
        settings: backupData.collections.settings?.length || 0,
        activity: backupData.collections.activity?.length || 0,
        timestamp: backupData.timestamp
      };
      setBackupStats(stats);
    } catch (error) {
      onError('Failed to preview backup: ' + error.message);
    } finally {
      setBackupLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handlePreviewBackup}
          disabled={backupLoading}
        >
          {backupLoading ? 'Loading...' : 'Preview Backup'}
        </Button>
        <Button
          variant="contained"
          startIcon={<BackupIcon />}
          onClick={handleExportBackup}
          disabled={backupLoading}
        >
          {backupLoading ? 'Exporting...' : 'Export Backup'}
        </Button>
        <Button
          variant="outlined"
          startIcon={<RestoreIcon />}
          onClick={() => setShowRestoreDialog(true)}
          disabled={restoreLoading}
        >
          {restoreLoading ? 'Restoring...' : 'Import Backup'}
        </Button>
      </Box>

      {backupStats && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📊 Backup Preview
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Created: {new Date(backupStats.timestamp).toLocaleString()}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="primary">
                  Inventory Items
                </Typography>
                <Typography variant="h6">
                  {backupStats.inventory}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="primary">
                  Categories
                </Typography>
                <Typography variant="h6">
                  {backupStats.categories}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="primary">
                  Sales Orders
                </Typography>
                <Typography variant="h6">
                  {backupStats.orders}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="primary">
                  Users
                </Typography>
                <Typography variant="h6">
                  {backupStats.users}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Restore Dialog */}
      <Dialog open={showRestoreDialog} onClose={() => setShowRestoreDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon color="warning" />
            Import Backup Data
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Warning:</strong> This will replace all current data with the backup data.
              This action cannot be undone. Make sure you have a current backup before proceeding.
            </Typography>
          </Alert>
          <Typography variant="body2" gutterBottom>
            Select a backup file to restore:
          </Typography>
          <input
            accept=".json"
            style={{ display: 'none' }}
            id="backup-file-input"
            type="file"
            onChange={handleImportBackup}
          />
          <label htmlFor="backup-file-input">
            <Button
              variant="outlined"
              component="span"
              startIcon={<UploadIcon />}
              fullWidth
              sx={{ mt: 1 }}
            >
              Choose Backup File
            </Button>
          </label>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Only .json backup files are supported
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRestoreDialog(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const Settings = () => {
  const { user, isAdmin } = useAuth();
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [generalSettings, setGeneralSettings] = useState({
    companyName: 'MMH Hardware',
    currency: 'PHP',
    dateFormat: 'MM/DD/YYYY',
    emailNotifications: true,
    backupFrequency: 'daily'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settings = await settingsService.getGeneralSettings();
      setGeneralSettings(settings);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error loading settings: ' + error.message,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      await settingsService.updateGeneralSettings(generalSettings, user?.uid);
      setSnackbar({
        open: true,
        message: 'Settings saved successfully!',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error saving settings: ' + error.message,
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUserSuccess = () => {
    setShowCreateUser(false);
    setSnackbar({
      open: true,
      message: 'User created successfully!',
      severity: 'success'
    });
  };

  const handleCreateUserError = (message) => {
    setSnackbar({
      open: true,
      message: `Error: ${message}`,
      severity: 'error'
    });
  };

  const handleBackupSuccess = (message) => {
    setSnackbar({
      open: true,
      message: message,
      severity: 'success'
    });
  };

  const handleBackupError = (message) => {
    setSnackbar({
      open: true,
      message: message,
      severity: 'error'
    });
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 3, color: '#3b82f6' }}>
        Settings
      </Typography>

      {/* User Management Section - Admin Only */}
      {isAdmin() && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                👥 User Management
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowCreateUser(true)}
              >
                Create New User
              </Button>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Manage user accounts, roles, and permissions. Only administrators can access this section.
            </Typography>

            {/* Sample Users List */}
            <List>
              <ListItem>
                <ListItemIcon>
                  <PersonIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={user?.email}
                  secondary="Current User"
                />
                <Chip label="ADMIN" color="primary" size="small" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <PersonIcon color="action" />
                </ListItemIcon>
                <ListItemText
                  primary="staff@example.com"
                  secondary="Staff Member"
                />
                <Chip label="STAFF" color="default" size="small" />
                <Box sx={{ ml: 1 }}>
                  <IconButton size="small" color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </ListItem>
            </List>
          </CardContent>
        </Card>
      )}

      {/* General Settings */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <div>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                ⚙️ General Settings
              </Typography>
              <Typography variant="body2" color="text.secondary">
                General system settings and configuration options.
              </Typography>
            </div>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveSettings}
              disabled={saving || loading}
              startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" gutterBottom>
                Company Name
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={generalSettings.companyName}
                onChange={(e) => setGeneralSettings({ ...generalSettings, companyName: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" gutterBottom>
                Currency
              </Typography>
              <TextField
                fullWidth
                size="small"
                select
                value={generalSettings.currency}
                onChange={(e) => setGeneralSettings({ ...generalSettings, currency: e.target.value })}
              >
                <MenuItem value="PHP">PHP - Philippine Peso</MenuItem>
                <MenuItem value="USD">USD - US Dollar</MenuItem>
              </TextField>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" gutterBottom>
                Date Format
              </Typography>
              <TextField
                fullWidth
                size="small"
                select
                value={generalSettings.dateFormat}
                onChange={(e) => setGeneralSettings({ ...generalSettings, dateFormat: e.target.value })}
              >
                <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" gutterBottom>
                Backup Frequency
              </Typography>
              <TextField
                fullWidth
                size="small"
                select
                value={generalSettings.backupFrequency}
                onChange={(e) => setGeneralSettings({ ...generalSettings, backupFrequency: e.target.value })}
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={generalSettings.emailNotifications}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, emailNotifications: e.target.checked })}
                  />
                }
                label="Email Notifications"
              />
            </Grid>
          </Grid>
          )}
        </CardContent>
      </Card>

      {/* Backup Management Section - Admin Only */}
      {isAdmin() && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <div>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  💾 Data Backup & Restore
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Export and import all system data including inventory, sales, and settings.
                </Typography>
              </div>
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Note:</strong> Backup includes all inventory items, categories, sales orders, user accounts, and system settings.
                Restore will replace all current data with the backup data.
              </Typography>
            </Alert>

            <BackupManagement
              onSuccess={handleBackupSuccess}
              onError={handleBackupError}
            />
          </CardContent>
        </Card>
      )}

      {/* Create User Dialog */}
      <Dialog open={showCreateUser} onClose={() => setShowCreateUser(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          <AdminUserManagement
            onSuccess={handleCreateUserSuccess}
            onError={handleCreateUserError}
          />
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

export default Settings;
