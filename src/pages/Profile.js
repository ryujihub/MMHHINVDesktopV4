import React from 'react';
import { Box, Paper, Typography, Avatar, Grid, Divider } from '@mui/material';
import { useAuth } from '../contexts/AuthContext.js';

const Profile = () => {
  const { user } = useAuth();

  // Debug logging
  console.log('Profile - User data:', user);
  console.log('Profile - createdAt:', user?.createdAt);
  console.log('Profile - lastLogin:', user?.lastLogin);
  console.log('Profile - loginCount:', user?.loginCount);

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Grid container spacing={4}>
          {/* Profile Header */}
          <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar 
              sx={{ 
                width: 100, 
                height: 100, 
                bgcolor: '#3b82f6',
                fontSize: '2.5rem'
              }}
            >
              {user?.name?.charAt(0) || 'U'}
            </Avatar>
            <Box>
              <Typography variant="h4" gutterBottom>
                {user?.name || 'User'}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {user?.role === 'admin' ? 'Administrator' : 'Staff Member'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Profile Details */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Profile Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Role
                </Typography>
                <Typography variant="body1">
                  {user?.role === 'admin' ? 'Administrator' : 'Staff Member'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1">
                  {user?.email}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Join Date
                </Typography>
                <Typography variant="body1">
                  {user?.createdAt && user.createdAt !== 'N/A'
                    ? (() => {
                        try {
                          // Handle Firestore Timestamp objects
                          let dateValue;
                          if (user.createdAt && typeof user.createdAt === 'object' && user.createdAt.seconds) {
                            // Firestore Timestamp object
                            dateValue = new Date(user.createdAt.seconds * 1000);
                          } else if (typeof user.createdAt === 'string') {
                            // ISO string
                            dateValue = new Date(user.createdAt);
                          } else {
                            // Other format
                            dateValue = new Date(user.createdAt);
                          }

                          return isNaN(dateValue.getTime())
                            ? 'Invalid Date'
                            : dateValue.toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              });
                        } catch (error) {
                          console.error('Error formatting join date:', error);
                          return 'Invalid Date';
                        }
                      })()
                    : 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Last Login
                </Typography>
                <Typography variant="body1">
                  {user?.lastLogin && user.lastLogin !== 'N/A'
                    ? (() => {
                        try {
                          // Handle Firestore Timestamp objects
                          let dateValue;
                          if (user.lastLogin && typeof user.lastLogin === 'object' && user.lastLogin.seconds) {
                            // Firestore Timestamp object
                            dateValue = new Date(user.lastLogin.seconds * 1000);
                          } else if (typeof user.lastLogin === 'string') {
                            // ISO string
                            dateValue = new Date(user.lastLogin);
                          } else {
                            // Other format
                            dateValue = new Date(user.lastLogin);
                          }

                          return isNaN(dateValue.getTime())
                            ? 'N/A'
                            : dateValue.toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              });
                        } catch (error) {
                          console.error('Error formatting last login:', error);
                          return 'N/A';
                        }
                      })()
                    : 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Login Count
                </Typography>
                <Typography variant="body1">
                  {user?.loginCount && user.loginCount > 0 ? `${user.loginCount} times` : 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default Profile;
