import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Divider,
  Box,
  Typography
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  Receipt as ReceiptIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  Store as StoreIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.js';

const drawerWidth = 170;

const menuItems = [
  {
    title: 'Main',
    items: [
      { text: 'Dashboard', icon: <DashboardIcon />, path: '/' }
    ]
  },
  {
    title: 'Inventory',
    items: [
      { text: 'Products', icon: <InventoryIcon />, path: '/products' },
      { text: 'Categories', icon: <CategoryIcon />, path: '/categories' }
    ]
  },
  {
    title: 'Reports',
    items: [
      { text: 'Reports & Analytics', icon: <AssessmentIcon />, path: '/reports' }
    ]
  },
  {
    title: 'System',
    items: [
      { text: 'Settings', icon: <SettingsIcon />, path: '/settings' }
    ]
  }
];

const Sidebar = ({ open, toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={open}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#1e293b',
          color: 'white',
          borderRight: '1px solid #334155'
        }
      }}
    >
      <Box sx={{ p: 2, borderBottom: '1px solid #334155' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <StoreIcon sx={{ fontSize: 32, color: '#3b82f6' }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white' }}>
              MMH Hardware
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              Inventory Management
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ p: 2, borderBottom: '1px solid #334155' }}>
        <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
          Welcome back,
        </Typography>
        <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 'bold' }}>
          {user?.name || 'User'}
        </Typography>
        <Typography variant="caption" sx={{ color: '#64748b' }}>
          {user?.role === 'admin' ? 'Administrator' : 'Staff Member'}
        </Typography>
      </Box>

      <Box sx={{ flexGrow: 1, overflow: '80vh' }}>
        {menuItems.map((section, sectionIndex) => (
          <Box key={sectionIndex}>
            <ListSubheader
              sx={{
                backgroundColor: 'transparent',
                color: '#64748b',
                fontWeight: 'bold',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                pt: 2,
                pb: 1
              }}
            >
              {section.title}
            </ListSubheader>
            <List dense>
              {section.items.map((item, itemIndex) => {
                const isActive = location.pathname === item.path;
                return (
                  <ListItem key={itemIndex} disablePadding>
                    <ListItemButton
                      onClick={() => handleNavigation(item.path)}
                      sx={{
                        mx: 1,
                        borderRadius: 2,
                        backgroundColor: isActive ? '#3b82f6' : 'transparent',
                        color: isActive ? 'white' : '#e2e8f0',
                        '&:hover': {
                          backgroundColor: isActive ? '#2563eb' : '#334155'
                        },
                        '& .MuiListItemIcon-root': {
                          color: isActive ? 'white' : '#94a3b8'
                        }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={item.text}
                        primaryTypographyProps={{
                          fontSize: '0.875rem',
                          fontWeight: isActive ? 600 : 400
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
            {sectionIndex < menuItems.length - 1 && (
              <Divider sx={{ borderColor: '#334155', mx: 2, my: 1 }} />
            )}
          </Box>
        ))}
      </Box>

      <Box sx={{ p: 2, borderTop: '1px solid #334155' }}>
        <Typography variant="caption" sx={{ color: '#64748b', textAlign: 'center', display: 'block' }}>
          Version 1.0.0
        </Typography>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
