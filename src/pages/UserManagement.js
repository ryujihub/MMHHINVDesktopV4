import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent,
  Table, TableBody, TableHead, TableRow, TableCell,
  TextField, MenuItem, Chip, Alert, Snackbar, IconButton, Tooltip,
  FormControlLabel, Switch, InputAdornment, CircularProgress, Avatar, Paper
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Search as SearchIcon, Visibility as VisibilityIcon, VisibilityOff as VisibilityOffIcon,
  Lock as LockIcon, Refresh as RefreshIcon,
  People as PeopleIcon, AdminPanelSettings as AdminIcon,
  Badge as BadgeIcon, CheckCircle as ActiveIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext.js';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, setDoc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';
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
  const [formData, setFormData] = useState({ name: '', email: '', role: 'staff', isActive: true });
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (isAdmin()) {
      loadUsers();
      const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
        const usersData = snapshot.docs.map(d => ({
          id: d.id, ...d.data(),
          lastLogin: d.data().lastLogin ? new Date(d.data().lastLogin) : null
        }));
        setUsers(usersData);
      }, (error) => { console.error('Error in users real-time listener:', error); });
      return () => unsubscribe();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, 'users'));
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data(), lastLogin: d.data().lastLogin?.toDate?.() || null })));
    } catch (error) {
      setSnackbar({ open: true, message: 'Error loading users: ' + error.message, severity: 'error' });
    } finally { setLoading(false); }
  };

  const generateSecurePassword = () => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) password += charset.charAt(Math.floor(Math.random() * charset.length));
    setGeneratedPassword(password);
    return password;
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' && user.isActive !== false) || (statusFilter === 'inactive' && user.isActive === false);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCreateUser = async () => {
    if (!formData.name || !formData.email) { setSnackbar({ open: true, message: 'Name and email are required', severity: 'error' }); return; }
    if (!generatedPassword || generatedPassword.length < 8) { setSnackbar({ open: true, message: 'Please generate a secure password', severity: 'error' }); return; }
    setFormLoading(true);
    try {
      const { createUserWithEmailAndPassword } = await import('firebase/auth');
      const { auth } = await import('../config/firebase.js');
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, generatedPassword);
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid, name: formData.name, email: formData.email, role: formData.role,
        isActive: formData.isActive, permissions: formData.role === 'admin' ? ['view', 'edit', 'delete', 'admin'] : ['view', 'edit'],
        createdBy: currentUser.uid, createdAt: serverTimestamp(), lastLogin: null, loginCount: 0
      });
      setSnackbar({ open: true, message: 'User created successfully!', severity: 'success' });
      setShowCreateDialog(false); resetForm(); loadUsers();
    } catch (error) {
      setSnackbar({ open: true, message: 'Error creating user: ' + error.message, severity: 'error' });
    } finally { setFormLoading(false); }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser || !formData.name || !formData.email) { setSnackbar({ open: true, message: 'Name and email are required', severity: 'error' }); return; }
    setFormLoading(true);
    try {
      await updateDoc(doc(db, 'users', selectedUser.id), {
        name: formData.name, email: formData.email, role: formData.role, isActive: formData.isActive,
        permissions: formData.role === 'admin' ? ['view', 'edit', 'delete', 'admin'] : ['view', 'edit'],
        updatedBy: currentUser.uid, updatedAt: serverTimestamp()
      });
      setSnackbar({ open: true, message: 'User updated successfully!', severity: 'success' });
      setShowEditDialog(false); setSelectedUser(null); resetForm(); loadUsers();
    } catch (error) {
      setSnackbar({ open: true, message: 'Error updating user: ' + error.message, severity: 'error' });
    } finally { setFormLoading(false); }
  };

  const handleDeleteUser = async (userToDelete) => {
    if (userToDelete.id === currentUser.uid) { setSnackbar({ open: true, message: 'Cannot delete your own account!', severity: 'error' }); return; }
    if (window.confirm(`Delete user "${userToDelete.name}"? This cannot be undone.`)) {
      try {
        await deleteDoc(doc(db, 'users', userToDelete.id));
        setSnackbar({ open: true, message: 'User deleted successfully!', severity: 'success' });
        loadUsers();
      } catch (error) {
        setSnackbar({ open: true, message: 'Error deleting user: ' + error.message, severity: 'error' });
      }
    }
  };

  const resetForm = () => { setFormData({ name: '', email: '', role: 'staff', isActive: true }); setGeneratedPassword(''); setShowPassword(false); };

  const openEditDialog = (user) => {
    setSelectedUser(user);
    setFormData({ name: user.name || '', email: user.email || '', role: user.role || 'staff', isActive: user.isActive !== false });
    setShowEditDialog(true);
  };

  const getStatusBadge = (user) => {
    if (user.id === currentUser.uid) return 'You';
    if (user.isActive === false) return 'Inactive';
    if (user.lastLogin) {
      const days = Math.floor((Date.now() - user.lastLogin.getTime()) / (1000 * 60 * 60 * 24));
      if (days === 0) return 'Online';
      if (days <= 7) return 'Recent';
      return 'Away';
    }
    return 'Never';
  };

  if (!isAdmin()) {
    return <Box sx={{ p: 3 }}><Alert severity="error">Access Denied: Administrator privileges required.</Alert></Box>;
  }

  // Shared helpers
  const fieldLabel = (text) => (
    <Typography variant="caption" fontWeight={700} color="#475569" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.5, display: 'block' }}>{text}</Typography>
  );
  const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#f8fafc' } };

  const roleCards = (accentColor, bgColor) => [{ v: 'staff', l: 'Staff', desc: 'View & Edit' }, { v: 'admin', l: 'Administrator', desc: 'Full Access' }].map(({ v, l, desc }) => (
    <Box key={v} onClick={() => setFormData(prev => ({ ...prev, role: v }))} sx={{
      flex: 1, p: 1.5, borderRadius: 2, cursor: 'pointer', border: '2px solid',
      borderColor: formData.role === v ? accentColor : '#e2e8f0',
      bgcolor: formData.role === v ? bgColor : '#fff',
      transition: 'all 0.15s',
    }}>
      <Typography variant="body2" fontWeight={700} color={formData.role === v ? accentColor : '#374151'}>{l}</Typography>
      <Typography variant="caption" color="text.secondary">{desc}</Typography>
    </Box>
  ));

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="#3b82f6">User Management</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>Manage user accounts and permissions</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowCreateDialog(true)}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' }, boxShadow: 'none' }}>
          Create New User
        </Button>
      </Box>

      {/* KPI Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 2.5 }}>
        {[
          { label: 'Total Users', value: users.length, icon: <PeopleIcon sx={{ fontSize: 28 }} />, bg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', sub: 'Registered accounts' },
          { label: 'Administrators', value: users.filter(u => u.role === 'admin').length, icon: <AdminIcon sx={{ fontSize: 28 }} />, bg: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', sub: 'Admin access' },
          { label: 'Staff Members', value: users.filter(u => u.role !== 'admin').length, icon: <BadgeIcon sx={{ fontSize: 28 }} />, bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', sub: 'Standard access' },
          { label: 'Active Users', value: users.filter(u => u.isActive !== false).length, icon: <ActiveIcon sx={{ fontSize: 28 }} />, bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', sub: 'Enabled accounts' },
        ].map((kpi) => (
          <Paper key={kpi.label} elevation={0} sx={{ p: 2.5, borderRadius: 3, background: kpi.bg, color: '#fff', position: 'relative', overflow: 'hidden' }}>
            <Box sx={{ position: 'absolute', right: -10, top: -10, opacity: 0.15, fontSize: 80 }}>{kpi.icon}</Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2, p: 1, display: 'flex' }}>{kpi.icon}</Box>
              <Box>
                <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1, color: '#fff' }}>{kpi.value}</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{kpi.label}</Typography>
              </Box>
            </Box>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', mt: 1, display: 'block' }}>{kpi.sub}</Typography>
          </Paper>
        ))}
      </Box>

      {/* Filter Bar */}
      <Paper elevation={0} sx={{ p: 2, mb: 2.5, border: '1px solid #e2e8f0', borderRadius: 3, background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField size="small" placeholder="Search users by name or email…" value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{ startAdornment: <SearchIcon sx={{ fontSize: 18, color: '#94a3b8', mr: 0.5 }} /> }}
            sx={{ flex: 1, minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: '#fff' } }} />
          <Box sx={{ display: 'flex', gap: 0.8 }}>
            {[{ v: 'all', l: 'All' }, { v: 'admin', l: 'Admin' }, { v: 'staff', l: 'Staff' }].map(({ v, l }) => (
              <Box key={v} onClick={() => setRoleFilter(v)} sx={{
                px: 1.5, py: 0.5, borderRadius: 20, cursor: 'pointer', fontSize: '0.8rem',
                fontWeight: roleFilter === v ? 700 : 500,
                bgcolor: roleFilter === v ? '#3b82f6' : '#fff',
                color: roleFilter === v ? '#fff' : '#64748b',
                border: '1px solid', borderColor: roleFilter === v ? '#3b82f6' : '#e2e8f0',
                transition: 'all 0.15s', userSelect: 'none',
              }}>{l}</Box>
            ))}
          </Box>
          <Box sx={{ display: 'flex', gap: 0.8 }}>
            {[{ v: 'all', l: 'All Status' }, { v: 'active', l: 'Active' }, { v: 'inactive', l: 'Inactive' }].map(({ v, l }) => (
              <Box key={v} onClick={() => setStatusFilter(v)} sx={{
                px: 1.5, py: 0.5, borderRadius: 20, cursor: 'pointer', fontSize: '0.8rem',
                fontWeight: statusFilter === v ? 700 : 500,
                bgcolor: statusFilter === v ? '#10b981' : '#fff',
                color: statusFilter === v ? '#fff' : '#64748b',
                border: '1px solid', borderColor: statusFilter === v ? '#10b981' : '#e2e8f0',
                transition: 'all 0.15s', userSelect: 'none',
              }}>{l}</Box>
            ))}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>{filteredUsers.length} / {users.length} users</Typography>
            <Tooltip title="Refresh">
              <IconButton size="small" onClick={loadUsers} disabled={loading}
                sx={{ bgcolor: '#fff', border: '1px solid #e2e8f0', borderRadius: 2, '&:hover': { bgcolor: '#eff6ff', borderColor: '#3b82f6' } }}>
                <RefreshIcon fontSize="small" sx={{ color: '#64748b' }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* Users Table */}
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={32} /></Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                {['User', 'Role', 'Status', 'Last Login', 'Logins', 'Actions'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, color: '#374151', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '2px solid #e2e8f0', py: 1.5 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((user, idx) => {
                const statusLabel = getStatusBadge(user);
                const isMe = user.id === currentUser.uid;
                const isInactive = user.isActive === false;
                return (
                  <TableRow key={user.id} sx={{ bgcolor: idx % 2 === 0 ? '#fff' : '#fafafa', '&:hover': { bgcolor: '#eff6ff' }, transition: 'background 0.15s' }}>
                    <TableCell sx={{ py: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 36, height: 36, fontSize: '0.9rem', fontWeight: 700, bgcolor: user.role === 'admin' ? '#dbeafe' : '#f1f5f9', color: user.role === 'admin' ? '#1e40af' : '#475569' }}>
                          {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600} color="#1e293b">{user.name || 'No Name'}</Typography>
                          <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Chip label={user.role?.toUpperCase() || 'STAFF'} size="small"
                        sx={user.role === 'admin' ? { bgcolor: '#dbeafe', color: '#1e40af', fontWeight: 700, fontSize: '0.7rem' } : { bgcolor: '#f1f5f9', color: '#475569', fontWeight: 600, fontSize: '0.7rem' }} />
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Chip label={statusLabel} size="small" sx={{
                        fontWeight: 600, fontSize: '0.7rem',
                        bgcolor: isMe ? '#dbeafe' : isInactive ? '#fef2f2' : statusLabel === 'Never' ? '#f0fdf4' : '#fefce8',
                        color: isMe ? '#1e40af' : isInactive ? '#dc2626' : statusLabel === 'Never' ? '#15803d' : '#92400e',
                      }} />
                    </TableCell>
                    <TableCell sx={{ py: 1.5, color: '#64748b', fontSize: '0.85rem' }}>{user.lastLogin ? user.lastLogin.toLocaleDateString() : '—'}</TableCell>
                    <TableCell sx={{ py: 1.5, color: '#64748b', fontSize: '0.85rem' }}>{user.loginCount || 0}</TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title={isMe ? 'Cannot edit own account' : 'Edit user'}>
                          <span>
                            <IconButton size="small" onClick={() => openEditDialog(user)} disabled={isMe}
                              sx={{ color: '#3b82f6', '&:hover': { bgcolor: '#dbeafe' }, borderRadius: 1.5 }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title={isMe ? 'Cannot delete own account' : 'Delete user'}>
                          <span>
                            <IconButton size="small" onClick={() => handleDeleteUser(user)} disabled={isMe}
                              sx={{ color: '#ef4444', '&:hover': { bgcolor: '#fef2f2' }, borderRadius: 1.5 }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredUsers.length === 0 && (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6, color: '#94a3b8' }}>No users found matching the current filters.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onClose={() => { setShowCreateDialog(false); resetForm(); }} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        <Box sx={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 52, height: 52, bgcolor: 'rgba(255,255,255,0.25)', fontSize: '1.6rem', fontWeight: 700, border: '2px solid rgba(255,255,255,0.4)' }}>+</Avatar>
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#fff', lineHeight: 1.2 }}>Create New User</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>Add a new account to the system</Typography>
          </Box>
        </Box>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>{fieldLabel('Full Name')}<TextField fullWidth size="small" placeholder="e.g. Juan Dela Cruz" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} sx={inputSx} /></Box>
            <Box>{fieldLabel('Email Address')}<TextField fullWidth size="small" type="email" placeholder="e.g. juan@mmhh.com" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} sx={inputSx} /></Box>
            <Box>
              {fieldLabel('Role')}
              <Box sx={{ display: 'flex', gap: 1 }}>{roleCards('#1e40af', '#eff6ff')}</Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
              <Box><Typography variant="body2" fontWeight={600}>Account Active</Typography><Typography variant="caption" color="text.secondary">User can log in immediately</Typography></Box>
              <Switch checked={formData.isActive} onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))} />
            </Box>
            <Box sx={{ bgcolor: '#f8fafc', borderRadius: 2, p: 2, border: '1px solid #e2e8f0' }}>
              {fieldLabel('Password')}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField fullWidth size="small" type={showPassword ? 'text' : 'password'} value={generatedPassword}
                  onChange={(e) => setGeneratedPassword(e.target.value)} placeholder="Click Generate for a secure password"
                  InputProps={{ endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}</IconButton></InputAdornment> }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fff' } }} />
                <Button variant="contained" onClick={generateSecurePassword} startIcon={<LockIcon />}
                  sx={{ whiteSpace: 'nowrap', borderRadius: 2, textTransform: 'none', fontWeight: 600, bgcolor: '#475569', '&:hover': { bgcolor: '#334155' }, boxShadow: 'none' }}>
                  Generate
                </Button>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5, pt: 1 }}>
              <Button fullWidth variant="contained" onClick={handleCreateUser} disabled={formLoading || !generatedPassword}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, py: 1.2, bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' }, boxShadow: 'none' }}>
                {formLoading ? 'Creating…' : 'Create User'}
              </Button>
              <Button fullWidth variant="outlined" onClick={() => { setShowCreateDialog(false); resetForm(); }}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, py: 1.2, borderColor: '#e2e8f0', color: '#64748b' }}>
                Cancel
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onClose={() => { setShowEditDialog(false); setSelectedUser(null); resetForm(); }} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        <Box sx={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 52, height: 52, bgcolor: 'rgba(255,255,255,0.25)', fontSize: '1.4rem', fontWeight: 800, border: '2px solid rgba(255,255,255,0.4)' }}>
            {formData.name?.charAt(0)?.toUpperCase() || '?'}
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#fff', lineHeight: 1.2 }}>{formData.name || 'Edit User'}</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>{formData.email}</Typography>
          </Box>
        </Box>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>{fieldLabel('Full Name')}<TextField fullWidth size="small" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} sx={inputSx} /></Box>
            <Box>{fieldLabel('Email Address')}<TextField fullWidth size="small" type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} sx={inputSx} /></Box>
            <Box>
              {fieldLabel('Role')}
              <Box sx={{ display: 'flex', gap: 1 }}>{roleCards('#6d28d9', '#f5f3ff')}</Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
              <Box><Typography variant="body2" fontWeight={600}>Account Active</Typography><Typography variant="caption" color="text.secondary">User can log in to the system</Typography></Box>
              <Switch checked={formData.isActive} onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))} />
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5, pt: 1 }}>
              <Button fullWidth variant="contained" onClick={handleUpdateUser} disabled={formLoading}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, py: 1.2, bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' }, boxShadow: 'none' }}>
                {formLoading ? 'Saving…' : 'Save Changes'}
              </Button>
              <Button fullWidth variant="outlined" onClick={() => { setShowEditDialog(false); setSelectedUser(null); resetForm(); }}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, py: 1.2, borderColor: '#e2e8f0', color: '#64748b' }}>
                Cancel
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserManagement;
