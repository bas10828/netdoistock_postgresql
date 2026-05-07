"use client";
import React, { useState, useEffect } from 'react';
import { Button, Typography, TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import Link from 'next/link';

export default function UpdateUserPage({ params }) {
  const { id } = params;
  const [formData, setFormData] = useState({ id:'', username:'', email:'', priority:'', password:'' });
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn');
    if (!loggedIn) { window.location.href = "/"; return; }
    setIsLoggedIn(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/get_user_by_id/${id}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => {
        if (data?.id) {
          setFormData({ id:data.id, username:data.username, email:data.email, priority:data.priority||'', password:'' });
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('');
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/updateuser`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!r.ok) throw new Error();
      setStatus('success');
    } catch { setStatus('error'); }
  };

  if (!isLoggedIn) return null;

  if (loading) {
    return (
      <div className="page-wrapper" style={{ maxWidth:520, margin:'0 auto', textAlign:'center', paddingTop:60 }}>
        <div style={{ fontSize:'2rem', marginBottom:8 }}>⏳</div>
        <Typography style={{ color:'#64748b' }}>กำลังโหลดข้อมูล...</Typography>
      </div>
    );
  }

  return (
    <div className="page-wrapper" style={{ maxWidth:520, margin:'0 auto' }}>

      <div className="form-card-header">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
          <div>
            <Typography style={{ fontSize:'1.3rem', fontWeight:800, color:'white', letterSpacing:'-0.3px' }}>
              ✏️ แก้ไขข้อมูลผู้ใช้
            </Typography>
            <p style={{ margin:'4px 0 0', color:'rgba(255,255,255,0.7)', fontSize:'0.875rem' }}>
              ID: {formData.id} · {formData.username}
            </p>
          </div>
          <Link href="/home/manageusers">
            <Button style={{ background:'rgba(255,255,255,0.18)', color:'white', border:'1.5px solid rgba(255,255,255,0.4)', borderRadius:9, textTransform:'none', fontWeight:600 }}>
              ← กลับ
            </Button>
          </Link>
        </div>
      </div>

      <div className="form-card-body">
        {status === 'success' && (
          <div className="alert-success" style={{ marginBottom:20 }}>
            ✅ อัปเดตสำเร็จแล้ว
            <Link href="/home/manageusers" style={{ marginLeft:12, color:'#15803d', fontWeight:700 }}>← กลับ</Link>
          </div>
        )}
        {status === 'error' && (
          <div className="alert-error" style={{ marginBottom:20 }}>
            ❌ อัปเดตไม่สำเร็จ กรุณาลองใหม่
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <TextField size="small" label="Username *" name="username"
            value={formData.username} onChange={handleChange} required fullWidth />
          <TextField size="small" label="Email *" name="email" type="email"
            value={formData.email} onChange={handleChange} required fullWidth />
          <FormControl size="small" fullWidth>
            <InputLabel>Priority *</InputLabel>
            <Select name="priority" value={formData.priority} onChange={handleChange} label="Priority *" required>
              <MenuItem value="admin">👑 Admin</MenuItem>
              <MenuItem value="user">👤 User</MenuItem>
              <MenuItem value="guest">👁 Guest</MenuItem>
            </Select>
          </FormControl>
          <TextField size="small" label="Password ใหม่ (เว้นว่างถ้าไม่ต้องการเปลี่ยน)" name="password" type="password"
            value={formData.password} onChange={handleChange} fullWidth autoComplete="new-password" />

          <Button type="submit" variant="contained" fullWidth
            style={{ background:'linear-gradient(135deg,#4f46e5,#7c3aed)', color:'white', padding:'12px', fontWeight:700, fontSize:'1rem', borderRadius:12, textTransform:'none', boxShadow:'0 4px 16px rgba(79,70,229,0.35)', marginTop:4 }}>
            💾 บันทึกการเปลี่ยนแปลง
          </Button>
        </form>
      </div>
    </div>
  );
}
