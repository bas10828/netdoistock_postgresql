"use client";
import React, { useState, useEffect } from 'react';
import { Button, Typography, TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import Link from 'next/link';

export default function UpdateEquipmentPage({ params }) {
  const { id } = params;
  const [formData, setFormData] = useState({
    id:'', proid:'', serial:'', mac:'', status_stock:'',
    into_stock:'', price:'', brand:'', model:'', project:'', out_stock:'', purchase:'',
  });
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn');
    if (!loggedIn) { window.location.href = "/"; return; }
    setIsLoggedIn(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/find_by_id/${id}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => { if (data?.length > 0) { setFormData(data[0]); setLoading(false); } })
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
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/update`, {
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
      <div className="page-wrapper" style={{ maxWidth:660, margin:'0 auto', textAlign:'center', paddingTop:60 }}>
        <div style={{ fontSize:'2rem', marginBottom:8 }}>⏳</div>
        <Typography style={{ color:'#64748b' }}>กำลังโหลดข้อมูล...</Typography>
      </div>
    );
  }

  const fieldSx = { marginBottom: 0 };

  return (
    <div className="page-wrapper" style={{ maxWidth:660, margin:'0 auto' }}>

      <div className="form-card-header">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div>
            <Typography style={{ fontSize:'1.3rem', fontWeight:800, color:'white', letterSpacing:'-0.3px' }}>
              ✏️ แก้ไขข้อมูลอุปกรณ์
            </Typography>
            <p style={{ margin:'4px 0 0', color:'rgba(255,255,255,0.7)', fontSize:'0.875rem' }}>
              ID: {formData.id} · {formData.brand} {formData.model}
            </p>
          </div>
          <Link href="/home/finddevicenumber">
            <Button style={{ background:'rgba(255,255,255,0.18)', color:'white', border:'1.5px solid rgba(255,255,255,0.4)', borderRadius:9, textTransform:'none', fontWeight:600 }}>
              ← ค้นหาอุปกรณ์
            </Button>
          </Link>
        </div>
      </div>

      <div className="form-card-body">
        {status === 'success' && (
          <div className="alert-success" style={{ marginBottom:20 }}>
            ✅ อัปเดตสำเร็จแล้ว
            <Link href="/home/finddevicenumber" style={{ marginLeft:12, color:'#15803d', fontWeight:700 }}>← กลับ</Link>
          </div>
        )}
        {status === 'error' && (
          <div className="alert-error" style={{ marginBottom:20 }}>
            ❌ อัปเดตไม่สำเร็จ กรุณาลองใหม่อีกครั้ง
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <TextField size="small" label="รหัสครุภัณฑ์" name="proid"
              value={formData.proid} onChange={handleChange} sx={fieldSx} />
            <TextField size="small" label="Brand" name="brand"
              value={formData.brand} onChange={handleChange} sx={fieldSx} />
            <TextField size="small" label="Model" name="model"
              value={formData.model} onChange={handleChange} sx={fieldSx} />
            <TextField size="small" label="Serial" name="serial"
              value={formData.serial} onChange={handleChange} sx={fieldSx} />
            <TextField size="small" label="MAC" name="mac"
              value={formData.mac} onChange={handleChange} sx={fieldSx} />
            <TextField size="small" label="Price" type="number" name="price"
              value={formData.price} onChange={handleChange} sx={fieldSx} />
            <TextField size="small" label="Purchase (ซื้อมาจาก)" name="purchase"
              value={formData.purchase} onChange={handleChange} sx={fieldSx} />
            <TextField size="small" label="Project (โครงการ)" name="project"
              value={formData.project} onChange={handleChange} sx={fieldSx} />
            <TextField size="small" label="วันซื้อ (Into Stock)" type="date" name="into_stock"
              value={formData.into_stock} onChange={handleChange}
              InputLabelProps={{ shrink:true }} sx={fieldSx} />
            <TextField size="small" label="วันขาย (Out Stock)" type="date" name="out_stock"
              value={formData.out_stock} onChange={handleChange}
              InputLabelProps={{ shrink:true }} sx={fieldSx} />
            <FormControl size="small" sx={fieldSx} style={{ gridColumn:'1 / -1' }}>
              <InputLabel>Status Stock</InputLabel>
              <Select name="status_stock" value={formData.status_stock} onChange={handleChange} label="Status Stock">
                <MenuItem value="in stock">In Stock</MenuItem>
                <MenuItem value="sold out">Sold Out</MenuItem>
              </Select>
            </FormControl>
          </div>

          <Button type="submit" variant="contained" fullWidth
            style={{ marginTop:20, background:'linear-gradient(135deg,#4f46e5,#7c3aed)', color:'white', padding:'12px', fontWeight:700, fontSize:'1rem', borderRadius:12, textTransform:'none', boxShadow:'0 4px 16px rgba(79,70,229,0.35)' }}>
            💾 บันทึกการเปลี่ยนแปลง
          </Button>
        </form>
      </div>
    </div>
  );
}
