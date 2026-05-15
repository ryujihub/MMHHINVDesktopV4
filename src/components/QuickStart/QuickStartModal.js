import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  FormControlLabel
} from '@mui/material';

const STORAGE_KEY = 'mmh_quickstart_seen';

const QuickStartModal = () => {
  const [open, setOpen] = useState(false);
  const [dontShow, setDontShow] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (!seen) setOpen(true);
    } catch (e) {
      // ignore localStorage errors
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    if (dontShow) {
      try {
        localStorage.setItem(STORAGE_KEY, '1');
      } catch (e) {
        // ignore
      }
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Welcome — Quick Start</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body1" gutterBottom>
          A few quick steps to get you started with MMH Inventory.
        </Typography>

        <List>
          <ListItem>
            <ListItemText primary="1. Add categories" secondary="Go to Categories → Add Category to organize your products (e.g., Tools, Paint, Hardware)." />
          </ListItem>
          <ListItem>
            <ListItemText primary="2. Add products" secondary="Go to Products → Add Product. Enter name, price, SKU, category, and starting stock." />
          </ListItem>
          <ListItem>
            <ListItemText primary="3. Monitor your dashboard" secondary="Check low stock alerts, total value, and quick actions from the Dashboard." />
          </ListItem>
          <ListItem>
            <ListItemText primary="4. View reports" secondary="Admins can access Reports & Analytics for inventory and business insights." />
          </ListItem>
        </List>

        <Typography variant="body2" color="text.secondary">
          Need help? Open Guide & Manual from the sidebar or the user menu (top-right avatar).
        </Typography>
      </DialogContent>
      <DialogActions>
        <FormControlLabel
          control={<Checkbox checked={dontShow} onChange={(e) => setDontShow(e.target.checked)} />}
          label="Don't show this again"
        />
        <Button onClick={handleClose} variant="contained" color="primary">Got it</Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuickStartModal;
