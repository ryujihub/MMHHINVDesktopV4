import React from 'react';
import { Box } from '@mui/material';

const Layout = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', height: '100vh',overflow: 'hidden' }}>
      {children}
    </Box>
  );
};

export default Layout;
