import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Switch, Alert, Snackbar, CircularProgress, Paper, Avatar, Chip,
} from '@mui/material';
import {
  Save as SaveIcon, Backup as BackupIcon, Restore as RestoreIcon,
  Download as DownloadIcon, Upload as UploadIcon, Warning as WarningIcon,
  Settings as SettingsIcon, Business as BusinessIcon, Notifications as NotifIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext.js';
import { settingsService } from '../services/settingsService.js';

// ─── Backup Management Component ──────────────────────────────────────────────
const BackupManagement = ({ onSuccess, onError }) => {
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [backupStats, setBackupStats] = useState(null);
  const { user } = useAuth();

  const handleExportBackup = async () => {
    setBackupLoading(true);
    try {
      await settingsService.exportBackup();
      onSuccess('Backup exported successfully! Check your downloads folder.');
    } catch (error) {
      onError('Failed to export backup: ' + error.message);
    } finally { setBackupLoading(false); }
  };

  const handleImportBackup = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setRestoreLoading(true);
    try {
      const result = await settingsService.importBackup(file, user?.uid);
      if (result.success) {
        setShowRestoreDialog(false);
        onSuccess('Backup restored successfully!');
      } else {
        onError('Failed to restore: ' + result.message);
      }
    } catch (error) {
      onError('Failed to restore backup: ' + error.message);
    } finally { setRestoreLoading(false); event.target.value = ''; }
  };

  const handlePreviewBackup = async () => {
    setBackupLoading(true);
    try {
      const backupData = await settingsService.backupAllData();
      setBackupStats({
        inventory: backupData.collections.inventory?.length || 0,
        categories: backupData.collections.categories?.length || 0,
        orders: backupData.collections.orders?.length || 0,
        users: backupData.collections.users?.length || 0,
        timestamp: backupData.timestamp,
      });
    } catch (error) {
      onError('Failed to preview backup: ' + error.message);
    } finally { setBackupLoading(false); }
  };

  return (
    <Box>
      {/* Action Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 3 }}>
        {[
          { label: 'Preview Backup', sub: 'Check what will be exported', icon: <DownloadIcon />, color: '#3b82f6', bg: '#eff6ff', action: handlePreviewBackup, loading: backupLoading, loadLabel: 'Loading…' },
          { label: 'Export Backup', sub: 'Download all data as JSON', icon: <BackupIcon />, color: '#10b981', bg: '#f0fdf4', action: handleExportBackup, loading: backupLoading, loadLabel: 'Exporting…' },
          { label: 'Import Backup', sub: 'Restore from a backup file', icon: <RestoreIcon />, color: '#f59e0b', bg: '#fffbeb', action: () => setShowRestoreDialog(true), loading: restoreLoading, loadLabel: 'Restoring…' },
        ].map(({ label, sub, icon, color, bg, action, loading, loadLabel }) => (
          <Paper key={label} elevation={0} onClick={!loading ? action : undefined} sx={{
            p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', cursor: loading ? 'default' : 'pointer',
            transition: 'all 0.15s', '&:hover': { borderColor: color, boxShadow: `0 0 0 2px ${color}22` },
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ bgcolor: bg, color, borderRadius: 2, p: 1, display: 'flex' }}>{icon}</Box>
              <Box>
                <Typography variant="body2" fontWeight={700} color={loading ? '#94a3b8' : '#1e293b'}>{loading ? loadLabel : label}</Typography>
                <Typography variant="caption" color="text.secondary">{sub}</Typography>
              </Box>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* Backup Stats Preview */}
      {backupStats && (
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#f8fafc', mb: 2 }}>
          <Typography variant="caption" fontWeight={700} color="#475569" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Backup Preview</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
            Snapshot from {new Date(backupStats.timestamp).toLocaleString()}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {[['Inventory', backupStats.inventory, '#3b82f6'], ['Categories', backupStats.categories, '#8b5cf6'], ['Orders', backupStats.orders, '#10b981'], ['Users', backupStats.users, '#f59e0b']].map(([label, val, color]) => (
              <Box key={label} sx={{ textAlign: 'center', px: 2, py: 1, bgcolor: '#fff', borderRadius: 2, border: '1px solid #e2e8f0', minWidth: 80 }}>
                <Typography variant="h6" fontWeight={800} color={color}>{val}</Typography>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      {/* Restore Dialog */}
      <Dialog open={showRestoreDialog} onClose={() => setShowRestoreDialog(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        <Box sx={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.25)', border: '2px solid rgba(255,255,255,0.4)' }}><WarningIcon /></Avatar>
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#fff' }}>Import Backup Data</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>This will overwrite all current data</Typography>
          </Box>
        </Box>
        <DialogContent sx={{ p: 3 }}>
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
            <strong>Warning:</strong> This will replace all current data with the backup. This action cannot be undone.
          </Alert>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>Select a .json backup file to restore:</Typography>
          <input accept=".json" style={{ display: 'none' }} id="backup-file-input" type="file" onChange={handleImportBackup} />
          <label htmlFor="backup-file-input">
            <Button variant="outlined" component="span" startIcon={<UploadIcon />} fullWidth
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, borderColor: '#f59e0b', color: '#d97706' }}>
              Choose Backup File
            </Button>
          </label>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setShowRestoreDialog(false)} variant="outlined"
            sx={{ borderRadius: 2, textTransform: 'none', borderColor: '#e2e8f0', color: '#64748b' }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ─── Main Settings Component ───────────────────────────────────────────────────
const Settings = () => {
  const { user, isAdmin } = useAuth();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [generalSettings, setGeneralSettings] = useState({
    companyName: 'MMH Hardware',
    currency: 'PHP',
    dateFormat: 'MM/DD/YYYY',
    emailNotifications: true,
    backupFrequency: 'daily',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settings = await settingsService.getGeneralSettings();
      setGeneralSettings(settings);
    } catch (error) {
      setSnackbar({ open: true, message: 'Error loading settings: ' + error.message, severity: 'error' });
    } finally { setLoading(false); }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      await settingsService.updateGeneralSettings(generalSettings, user?.uid);
      setSnackbar({ open: true, message: 'Settings saved successfully!', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Error saving settings: ' + error.message, severity: 'error' });
    } finally { setSaving(false); }
  };

  const handleBackupSuccess = (msg) => setSnackbar({ open: true, message: msg, severity: 'success' });
  const handleBackupError = (msg) => setSnackbar({ open: true, message: msg, severity: 'error' });

  const sectionHeader = (icon, title, subtitle, accentColor, chip, action) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box sx={{ bgcolor: accentColor + '18', color: accentColor, borderRadius: 2, p: 1.2, display: 'flex' }}>{icon}</Box>
      <Box sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle1" fontWeight={700} color="#1e293b">{title}</Typography>
          {chip && <Chip label={chip} size="small" sx={{ bgcolor: accentColor + '18', color: accentColor, fontWeight: 700, fontSize: '0.7rem' }} />}
        </Box>
        <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
      </Box>
      {action && action}
    </Box>
  );

  const fieldLabel = (text) => (
    <Typography variant="caption" fontWeight={700} color="#475569"
      sx={{ textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.5, display: 'block' }}>{text}</Typography>
  );
  const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#f8fafc' } };

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', p: 3 }}>
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} color="#3b82f6">Settings</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>System preferences and configuration</Typography>
      </Box>

      {/* General Settings Card */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', mb: 2.5, overflow: 'hidden' }}>
        <Box sx={{ p: 2.5, borderBottom: '1px solid #f1f5f9' }}>
          {sectionHeader(
            <SettingsIcon sx={{ fontSize: 22 }} />,
            'General Settings',
            'Configure company information and system preferences',
            '#3b82f6',
            null,
            <Button variant="contained" onClick={handleSaveSettings} disabled={saving || loading}
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 2.5, bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' }, boxShadow: 'none', whiteSpace: 'nowrap' }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          )}
        </Box>
        <Box sx={{ p: 2.5 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={32} /></Box>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2.5 }}>
              <Box>
                {fieldLabel('Company Name')}
                <TextField fullWidth size="small" value={generalSettings.companyName}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, companyName: e.target.value })}
                  sx={inputSx} />
              </Box>
              <Box>
                {fieldLabel('Currency')}
                <TextField fullWidth size="small" select value={generalSettings.currency}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, currency: e.target.value })}
                  sx={inputSx}>
                  <MenuItem value="PHP">PHP — Philippine Peso</MenuItem>
                  <MenuItem value="USD">USD — US Dollar</MenuItem>
                </TextField>
              </Box>
              <Box>
                {fieldLabel('Date Format')}
                <TextField fullWidth size="small" select value={generalSettings.dateFormat}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, dateFormat: e.target.value })}
                  sx={inputSx}>
                  <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                  <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                  <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                </TextField>
              </Box>
              <Box>
                {fieldLabel('Auto Backup Frequency')}
                <TextField fullWidth size="small" select value={generalSettings.backupFrequency}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, backupFrequency: e.target.value })}
                  sx={inputSx}>
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                </TextField>
              </Box>
              {/* Email Notifications toggle */}
              <Box sx={{ gridColumn: '1 / -1' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ bgcolor: '#fef9c3', color: '#ca8a04', borderRadius: 1.5, p: 0.8, display: 'flex' }}><NotifIcon sx={{ fontSize: 18 }} /></Box>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>Email Notifications</Typography>
                      <Typography variant="caption" color="text.secondary">Receive system alerts and activity reports via email</Typography>
                    </Box>
                  </Box>
                  <Switch checked={generalSettings.emailNotifications}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, emailNotifications: e.target.checked })} />
                </Box>
              </Box>
            </Box>
          )}


        </Box>
      </Paper>

      {/* Backup & Restore Card — Admin Only */}
      {isAdmin() && (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <Box sx={{ p: 2.5, borderBottom: '1px solid #f1f5f9' }}>
            {sectionHeader(<StorageIcon sx={{ fontSize: 22 }} />, 'Data Backup & Restore', 'Export and import all system data including inventory, sales, and settings', '#10b981', 'Admin Only')}
          </Box>
          <Box sx={{ p: 2.5 }}>
            <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2, '& .MuiAlert-message': { fontSize: '0.85rem' } }}>
              Backup includes all inventory items, categories, sales orders, users, and settings. Restore will replace all current data.
            </Alert>
            <BackupManagement onSuccess={handleBackupSuccess} onError={handleBackupError} />
          </Box>
        </Paper>
      )}

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;
