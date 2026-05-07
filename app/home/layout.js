"use client";
import React, { useEffect, useState } from 'react';
import './layout.css';
import Link from 'next/link';
import {
  AppBar, Box, Toolbar, Button, IconButton, Drawer, List, ListItemButton, ListItemText,
  ListItemIcon, MenuItem, Select, Typography, Divider
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import TableChartIcon from '@mui/icons-material/TableChart';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import SearchIcon from '@mui/icons-material/Search';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MoveToInboxIcon from '@mui/icons-material/MoveToInbox';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import StorageIcon from '@mui/icons-material/Storage';
import AssessmentIcon from '@mui/icons-material/Assessment';
import QrCodeIcon from '@mui/icons-material/QrCode';
import DynamicFormIcon from '@mui/icons-material/DynamicForm';
import UploadFileIcon from '@mui/icons-material/UploadFile';

const menuItems = [
  { text: 'Create',            href: '/home/create',            icon: <AddCircleOutlineIcon fontSize="small" /> },
  { text: 'Createdynamic',     href: '/home/createdynamic',     icon: <DynamicFormIcon fontSize="small" /> },
  { text: 'Createbyexcel',     href: '/home/createbyexcel',     icon: <TableChartIcon fontSize="small" /> },
  { text: 'ImportInventory',   href: '/home/importinventory',   icon: <UploadFileIcon fontSize="small" /> },
  { text: 'Createserial',      href: '/home/createserial',      icon: <QrCodeIcon fontSize="small" /> },
  { text: 'Warehouse',         href: '/home/warehouse',         icon: <WarehouseIcon fontSize="small" /> },
  { text: 'FindDeviceNumber',  href: '/home/finddevicenumber',  icon: <SearchIcon fontSize="small" /> },
  { text: 'WorkSchedule',      href: '/home/workschedule',      icon: <CalendarMonthIcon fontSize="small" /> },
  { text: 'Instock',           href: '/home/instock',           icon: <MoveToInboxIcon fontSize="small" /> },
  { text: 'Soldout',           href: '/home/soldout',           icon: <ShoppingCartIcon fontSize="small" /> },
  { text: 'Alldata',           href: '/home/alldata',           icon: <StorageIcon fontSize="small" /> },
  { text: 'GenerateReport',    href: '/home/generatereport',    icon: <AssessmentIcon fontSize="small" /> },
];

export default function Layout({ children  }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [priority, setPriority] = useState('');
  const [selectedValue, setSelectedValue] = useState('');

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    const storedEmail = localStorage.getItem('email');
    const storedPriority = localStorage.getItem('priority');
    if (storedUsername) {
      setUsername(storedUsername);
    }
    if (storedEmail) {
      setEmail(storedEmail);
    }
    if (storedPriority) {
      setPriority(storedPriority);
    }
  }, []);

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    localStorage.removeItem('priority');
    setUsername('');
    setEmail('');
    setPriority('');
  };

  const handleSelectChange = (event) => {
    setSelectedValue(event.target.value);
  };

  return (
    <>
    <Box className="main-container">
      <AppBar className="app-bar" position="fixed">
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            className="menu-icon"
            onClick={toggleDrawer(true)}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" className="app-title">
            <Link href="/home" className="app-title-link">
              NETDOI
            </Link>
          </Typography>
          {username && (
            <Select
              value={selectedValue}
              onChange={handleSelectChange}
              displayEmpty
              inputProps={{ 'aria-label': 'Without label' }}
              className="select-user"
            >
              <MenuItem value="" disabled>
                {username} : {priority}
              </MenuItem>
              {priority === 'admin' && (
                <MenuItem component="a" value={username} href="/home/manageusers">
                  {username} : manage users
                </MenuItem>
              )}
            </Select>
          )}
          <Link href="/" passHref>
            <Button className="logout-button" onClick={handleLogout}>Logout</Button>
          </Link>
        </Toolbar>
      </AppBar>
    </Box>
    <Drawer
      className="drawer"
      anchor="left"
      open={drawerOpen}
      onClose={toggleDrawer(false)}
    >
      <Box role="presentation" onClick={toggleDrawer(false)} onKeyDown={toggleDrawer(false)}>
        <Box className="drawer-header">
          <div className="drawer-logo">N</div>
          <p className="drawer-brand">NETDOI Stock</p>
          <p className="drawer-version">ระบบจัดการสินค้าคงคลัง</p>
        </Box>
        <Divider />
        <List sx={{ pt: 1 }}>
          {menuItems.map(({ text, href, icon }) => (
            <ListItemButton key={text} component={Link} href={href} className="drawer-menu-item">
              <ListItemIcon className="drawer-menu-icon">{icon}</ListItemIcon>
              <ListItemText primary={text} />
            </ListItemButton>
          ))}
        </List>
      </Box>
    </Drawer>
    <Box className="content-container">
      {children}
    </Box>
  </>
  );
}
