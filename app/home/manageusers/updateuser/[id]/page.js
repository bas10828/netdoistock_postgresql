"use client";
import React, { useState, useEffect } from 'react';
import { Button, TextField, Grid, Paper, Typography, MenuItem, Select, InputLabel, FormControl } from '@mui/material';
import Link from 'next/link';

export default function UpdateUserPage({ params }) {
  const { id } = params;
  const [formData, setFormData] = useState({
    id: '',
    username: '',
    email: '',
    priority: '',
    password: ''  // เพิ่มฟิลด์ password
  });
  const [loading, setLoading] = useState(true);
  const [updateSuccess, setUpdateSuccess] = useState(false);  // สถานะสำหรับเช็คว่าการอัพเดตสำเร็จหรือไม่
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn');
    if (!loggedIn) {
      setIsLoggedIn(false);
      window.location.href = "/";
    } else {
      setIsLoggedIn(true);
    }
    const getData = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/get_user_by_id/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const userData = await response.json();
        console.log(userData)
        if (userData && userData.id) {
          const { id, username, email, priority } = userData;
          setFormData({
            id: id,
            username: username,
            email: email,
            priority: priority || '',
            password: ''
          });
          setLoading(false);
        } else {
          console.error('No data found for the given id');
        }


      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (id) {
      getData();
    }
  }, [id]);

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/updateuser`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      if (!response.ok) {
        throw new Error('Failed to update user');
      }
      setUpdateSuccess(true);  // ตั้งค่าสถานะว่าการอัพเดตสำเร็จ
      alert('User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <Grid container justifyContent="center" alignItems="center" style={{ height: '100vh' }}>
      <Grid item xs={10} sm={8} md={6} lg={4}>
        <Paper elevation={3} style={{ padding: '20px' }}>
          <Typography variant="h4" gutterBottom>
            Edit User ID: {formData.id}
          </Typography>
          <form onSubmit={handleFormSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="username"
                  name="username"
                  label="Username"
                  variant="outlined"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="email"
                  name="email"
                  label="Email"
                  type="email"
                  variant="outlined"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth variant="outlined" required>
                  <InputLabel id="priority-label">Priority</InputLabel>
                  <Select
                    labelId="priority-label"
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    label="Priority"
                  >
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="user">User</MenuItem>
                    <MenuItem value="guest">Guest</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="password"
                  name="password"
                  label="Password"
                  type="password"
                  variant="outlined"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </Grid>
            </Grid>
            <Button type="submit" variant="contained" color="primary" style={{ marginTop: '20px' }}>
              Update User
            </Button>
          </form>
          {updateSuccess && (
            <Link href="/home/manageusers">
              <Button variant="contained" color="secondary" style={{ marginTop: '20px' }}>
                Back to Manage Users
              </Button>
            </Link>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
}
