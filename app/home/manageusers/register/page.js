"use client";
import { useState, useEffect } from 'react';
import { Button, Typography, TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import Link from 'next/link';

export default function RegisterPage() {
  const [formData, setFormData] = useState({ username:'', email:'', password:'', priority:'user' });
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn');
    if (!loggedIn) { window.location.href = "/"; return; }
    setIsLoggedIn(true);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await r.json();
      if (r.ok) {
        setMessage(data.message || 'ลงทะเบียนสำเร็จ');
        setSuccess(true);
        setFormData({ username:'', email:'', password:'', priority:'user' });
      } else {
        setMessage(data.error || 'เกิดข้อผิดพลาด');
        setSuccess(false);
      }
    } catch {
      setMessage('เกิดข้อผิดพลาดในการเชื่อมต่อ');
      setSuccess(false);
    }
  };

  if (!isLoggedIn) return null;

  return (
    <div className="page-wrapper" style={{ maxWidth: 520, margin: '0 auto' }}>

      <div className="form-card-header">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
          <div>
            <Typography style={{ fontSize:'1.3rem', fontWeight:800, color:'white', letterSpacing:'-0.3px' }}>
              👤 เพิ่มผู้ใช้งานใหม่
            </Typography>
            <p style={{ margin:'4px 0 0', color:'rgba(255,255,255,0.7)', fontSize:'0.875rem' }}>
              กรอกข้อมูลผู้ใช้ที่ต้องการเพิ่มเข้าระบบ
            </p>
          </div>
          <Link href="/home/manageusers">
            <Button style={{ background:'rgba(255,255,255,0.18)', color:'white', border:'1.5px solid rgba(255,255,255,0.4)', borderRadius:9, textTransform:'none', fontWeight:600, whiteSpace:'nowrap' }}>
              ← กลับ
            </Button>
          </Link>
        </div>
      </div>

      <div className="form-card-body">
        {message && (
          <div className={success ? 'alert-success' : 'alert-error'} style={{ marginBottom:20 }}>
            {success ? '✅' : '❌'} {message}
          </div>
        )}
        {success && (
          <div style={{ marginBottom:20 }}>
            <Link href="/home/manageusers">
              <Button variant="contained" fullWidth
                style={{ background:'linear-gradient(135deg,#4f46e5,#7c3aed)', color:'white', textTransform:'none', fontWeight:700, borderRadius:9 }}>
                ← กลับไปหน้าจัดการผู้ใช้
              </Button>
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <TextField size="small" label="Username *" name="username"
            value={formData.username} onChange={handleChange} required fullWidth
            autoComplete="off" />
          <TextField size="small" label="Email *" name="email" type="email"
            value={formData.email} onChange={handleChange} required fullWidth />
          <TextField size="small" label="Password *" name="password" type="password"
            value={formData.password} onChange={handleChange} required fullWidth
            autoComplete="new-password" />
          <FormControl size="small" fullWidth>
            <InputLabel>Priority *</InputLabel>
            <Select name="priority" value={formData.priority} onChange={handleChange} label="Priority *" required>
              <MenuItem value="admin">👑 Admin</MenuItem>
              <MenuItem value="user">👤 User</MenuItem>
              <MenuItem value="guest">👁 Guest</MenuItem>
            </Select>
          </FormControl>

          <Button type="submit" variant="contained" fullWidth
            style={{ background:'linear-gradient(135deg,#4f46e5,#7c3aed)', color:'white', padding:'12px', fontWeight:700, fontSize:'1rem', borderRadius:12, textTransform:'none', boxShadow:'0 4px 16px rgba(79,70,229,0.35)', marginTop:4 }}>
            ➕ ลงทะเบียนผู้ใช้
          </Button>
        </form>
      </div>
    </div>
  );
}
