import React, { useState } from 'react';
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
  Typography,
  Collapse
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  Receipt as ReceiptIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  Store as StoreIcon,
  People as PeopleIcon,
  ExpandLess,
  ExpandMore
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
      { text: 'Reports & Analytics', icon: <AssessmentIcon />, path: '/reports', hasSubmenu: true, submenu: [
        { text: 'Full Business Report', icon: <AssessmentIcon />, path: '/reports/comprehensive' }
      ]}
    ]
  },
  {
    title: 'Management',
    items: [
      { text: 'User Management', icon: <PeopleIcon />, path: '/user-management' }
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
  const { user, isAdmin } = useAuth();
  const [openSubmenus, setOpenSubmenus] = useState({});

  const handleNavigation = (path) => {
    navigate(path);
  };

  const toggleSubmenu = (sectionTitle, itemIndex) => {
    const key = `${sectionTitle}-${itemIndex}`;
    setOpenSubmenus(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
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
          background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          color: 'white',
          borderRight: '2px solid transparent',
          borderImage: 'linear-gradient(180deg, #3b82f6, #1e293b, #3b82f6) 1',
          boxShadow: '4px 0 15px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s ease-in-out'
        }
      }}
    >
      <Box sx={{
        p: 2,
        borderBottom: '1px solid rgba(59, 130, 246, 0.3)',
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(30, 41, 59, 0.8))',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, #3b82f6, transparent, #3b82f6)'
        }
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            p: 1,
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <StoreIcon sx={{ fontSize: 20, color: 'white' }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{
              fontWeight: 'bold',
              color: 'white',
              fontSize: '0.9rem',
              lineHeight: 1.2
            }}>
              MMH Hardware
            </Typography>
            <Typography variant="caption" sx={{
              color: '#94a3b8',
              fontSize: '0.65rem',
              fontWeight: 500
            }}>
              Inventory Management
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{
        p: 2,
        borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
        background: 'rgba(30, 41, 59, 0.5)',
        backdropFilter: 'blur(10px)'
      }}>
        <Typography variant="body2" sx={{
          color: '#94a3b8',
          mb: 1,
          fontSize: '0.75rem',
          fontWeight: 500
        }}>
          Welcome back,
        </Typography>
        <Typography variant="subtitle2" sx={{
          color: 'white',
          fontWeight: 'bold',
          fontSize: '0.9rem',
          mb: 0.5
        }}>
          {user?.name || 'User'}
        </Typography>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <Box sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: user?.role === 'admin' ? '#10b981' : '#f59e0b',
            boxShadow: `0 0 6px ${user?.role === 'admin' ? '#10b981' : '#f59e0b'}`
          }} />
          <Typography variant="caption" sx={{
            color: '#64748b',
            fontSize: '0.7rem',
            fontWeight: 500
          }}>
            {user?.role === 'admin' ? 'Administrator' : 'Staff Member'}
          </Typography>
        </Box>
      </Box>

      <Box sx={{
        flexGrow: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: '#64748b',
          borderRadius: '3px',
          opacity: 0.7,
        },
        '&::-webkit-scrollbar-thumb:hover': {
          backgroundColor: '#94a3b8',
          opacity: 1,
        },
        // Firefox scrollbar styling
        scrollbarWidth: 'thin',
        scrollbarColor: '#64748b transparent',
      }}>
        {menuItems.map((section, sectionIndex) => {
          // Filter out admin-only sections for non-admin users
          if ((section.title === 'Reports' || section.title === 'Management') && !isAdmin()) {
            return null;
          }

          return (
            <Box key={sectionIndex}>
              <ListSubheader
                sx={{
                  backgroundColor: 'rgba(59, 130, 246, 0.05)',
                  color: '#3b82f6',
                  fontWeight: 'bold',
                  fontSize: '0.65rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  pt: 1.5,
                  pb: 1,
                  px: 1.5,
                  borderLeft: '3px solid #3b82f6',
                  mx: 1,
                  borderRadius: '0 4px 4px 0'
                }}
              >
                {section.title}
              </ListSubheader>
              <List dense>
                {section.items.map((item, itemIndex) => {
                  const isActive = location.pathname === item.path;
                  const key = `${section.title}-${itemIndex}`;
                  const isOpen = openSubmenus[key];
                  return (
                    <React.Fragment key={itemIndex}>
                      <ListItem disablePadding>
                        <ListItemButton
                          onClick={() => item.hasSubmenu ? toggleSubmenu(section.title, itemIndex) : handleNavigation(item.path)}
                          sx={{
                            mx: 1,
                            my: 0.2,
                            borderRadius: 1.5,
                            backgroundColor: isActive
                              ? 'linear-gradient(135deg, #3b82f6, #1e40af)'
                              : 'rgba(59, 130, 246, 0.05)',
                            color: isActive ? 'white' : '#e2e8f0',
                            transition: 'all 0.2s ease-in-out',
                            position: 'relative',
                            overflow: 'hidden',
                            '&::before': isActive ? {
                              content: '""',
                              position: 'absolute',
                              left: 0,
                              top: 0,
                              bottom: 0,
                              width: '3px',
                              background: 'linear-gradient(180deg, #60a5fa, #3b82f6)',
                              borderRadius: '0 2px 2px 0'
                            } : {},
                            '&:hover': {
                              backgroundColor: isActive
                                ? 'linear-gradient(135deg, #2563eb, #1e40af)'
                                : 'rgba(59, 130, 246, 0.15)',
                              transform: 'translateX(2px)',
                              '& .MuiListItemIcon-root': {
                                color: isActive ? 'white' : '#60a5fa'
                              }
                            },
                            '& .MuiListItemIcon-root': {
                              color: isActive ? 'white' : '#94a3b8',
                              transition: 'color 0.2s ease-in-out'
                            }
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 35 }}>
                            {item.icon}
                          </ListItemIcon>
                          <ListItemText
                            primary={item.text}
                            primaryTypographyProps={{
                              fontSize: '0.8rem',
                              fontWeight: isActive ? 600 : 500,
                              letterSpacing: '0.2px'
                            }}
                          />
                          {item.hasSubmenu && (isOpen ? <ExpandLess /> : <ExpandMore />)}
                        </ListItemButton>
                      </ListItem>
                      {item.hasSubmenu && (
                        <Collapse in={isOpen} timeout="auto" unmountOnExit>
                          <List component="div" disablePadding dense>
                            {item.submenu.map((subItem, subIndex) => {
                              const subIsActive = location.pathname === subItem.path;
                              return (
                                <ListItem key={subIndex} disablePadding>
                                  <ListItemButton
                                    onClick={() => handleNavigation(subItem.path)}
                                    sx={{
                                      pl: 4,
                                      mx: 1,
                                      my: 0.1,
                                      borderRadius: 1,
                                      backgroundColor: subIsActive
                                        ? 'linear-gradient(135deg, #3b82f6, #1e40af)'
                                        : 'rgba(59, 130, 246, 0.05)',
                                      color: subIsActive ? 'white' : '#e2e8f0',
                                      transition: 'all 0.2s ease-in-out',
                                      '&:hover': {
                                        backgroundColor: subIsActive
                                          ? 'linear-gradient(135deg, #2563eb, #1e40af)'
                                          : 'rgba(59, 130, 246, 0.15)',
                                        transform: 'translateX(2px)',
                                        '& .MuiListItemIcon-root': {
                                          color: subIsActive ? 'white' : '#60a5fa'
                                        }
                                      },
                                      '& .MuiListItemIcon-root': {
                                        color: subIsActive ? 'white' : '#94a3b8',
                                        transition: 'color 0.2s ease-in-out'
                                      }
                                    }}
                                  >
                                    <ListItemIcon sx={{ minWidth: 30 }}>
                                      {subItem.icon}
                                    </ListItemIcon>
                                    <ListItemText
                                      primary={subItem.text}
                                      primaryTypographyProps={{
                                        fontSize: '0.75rem',
                                        fontWeight: subIsActive ? 600 : 500,
                                        letterSpacing: '0.2px'
                                      }}
                                    />
                                  </ListItemButton>
                                </ListItem>
                              );
                            })}
                          </List>
                        </Collapse>
                      )}
                    </React.Fragment>
                  );
                })}
              </List>
              {sectionIndex < menuItems.length - 1 && (
                <Divider sx={{
                  borderColor: 'rgba(59, 130, 246, 0.2)',
                  mx: 1.5,
                  my: 1,
                  borderWidth: '1px'
                }} />
              )}
            </Box>
          );
        })}
      </Box>

      <Box sx={{
        p: 1.5,
        borderTop: '1px solid rgba(59, 130, 246, 0.2)',
        background: 'rgba(15, 23, 42, 0.8)',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent, #3b82f6, transparent)'
        }
      }}>
        <Typography variant="caption" sx={{
          color: '#64748b',
          textAlign: 'center',
          display: 'block',
          fontSize: '0.6rem',
          fontWeight: 500,
          letterSpacing: '0.3px'
        }}>
          © 2025 MMH Hardware • v1.0.0
        </Typography>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
