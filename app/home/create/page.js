"use client"
import React, { useState, useEffect } from 'react';
import { Button, TextField, FormControl, InputLabel, Select, MenuItem, Drawer, Typography } from '@mui/material';

const initialForm = {
  proid: '', serial: '', mac: '', status_stock: 'in stock',
  into_stock: '', out_stock: '', price: '', brand: '', model: '', purchase: '', project: '',
};

export default function CreatePage() {
  const [formData, setFormData] = useState(initialForm);
  const [repeat, setRepeat] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lookupProid, setLookupProid] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn');
    if (!loggedIn) { window.location.href = "/"; return; }
    setIsLoggedIn(true);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLookup = async (e) => {
    e.preventDefault();
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/create/get1stforcreate/${lookupProid}`);
      const data = await r.json();
      if (data?.length > 0) {
        const { proid, brand, model } = data[0];
        setFormData(prev => ({ ...prev, proid, brand, model }));
        setDrawerOpen(false);
      } else {
        alert('ไม่พบข้อมูลสำหรับรหัสนี้');
      }
    } catch {
      alert('เกิดข้อผิดพลาดในการค้นหา');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus('');
    const rows = Array.from({ length: repeat }, () => ({ ...formData }));
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rows),
      });
      if (!r.ok) throw new Error();
      setSubmitStatus('success');
      setTimeout(() => { window.location.href = '/home'; }, 1200);
    } catch {
      setSubmitStatus('error');
    }
  };

  if (!isLoggedIn) return null;

  const noEnter = (e) => { if (e.key === 'Enter') e.preventDefault(); };

  const fieldSx = { marginBottom: 0 };

  return (
    <div className="page-wrapper" style={{ maxWidth: 700, margin: '0 auto' }}>

      {/* Header */}
      <div className="form-card-header" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <Typography style={{ fontSize:'1.3rem', fontWeight:800, color:'white', letterSpacing:'-0.3px' }}>
            ➕ เพิ่มข้อมูลอุปกรณ์
          </Typography>
          <p style={{ margin:0, color:'rgba(255,255,255,0.7)', fontSize:'0.875rem', marginTop:4 }}>
            กรอกข้อมูลอุปกรณ์ที่ต้องการเพิ่มเข้าระบบ
          </p>
        </div>
        <Button onClick={() => setDrawerOpen(true)}
          style={{ background:'rgba(255,255,255,0.18)', color:'white', border:'1.5px solid rgba(255,255,255,0.35)', borderRadius:10, textTransform:'none', fontWeight:600, padding:'8px 16px', whiteSpace:'nowrap' }}>
          🔍 ดึงข้อมูลอัตโนมัติ
        </Button>
      </div>

      {/* Form Body */}
      <div className="form-card-body">

        {submitStatus === 'success' && (
          <div className="alert-success" style={{ marginBottom: 20 }}>
            ✅ บันทึกสำเร็จ! กำลังกลับหน้าหลัก...
          </div>
        )}
        {submitStatus === 'error' && (
          <div className="alert-error" style={{ marginBottom: 20 }}>
            ❌ บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <TextField size="small" label="รหัสครุภัณฑ์ *" name="proid"
              value={formData.proid} onChange={handleChange} onKeyDown={noEnter} required sx={fieldSx} />
            <TextField size="small" label="Brand *" name="brand"
              value={formData.brand} onChange={handleChange} onKeyDown={noEnter} required sx={fieldSx} />
            <TextField size="small" label="Model" name="model"
              value={formData.model} onChange={handleChange} onKeyDown={noEnter} sx={fieldSx} />
            <TextField size="small" label="Serial" name="serial"
              value={formData.serial} onChange={handleChange} onKeyDown={noEnter} sx={fieldSx} />
            <TextField size="small" label="MAC Address" name="mac"
              value={formData.mac} onChange={handleChange} onKeyDown={noEnter} sx={fieldSx} />
            <TextField size="small" label="Price *" type="number" name="price"
              value={formData.price} onChange={handleChange} onKeyDown={noEnter} required sx={fieldSx} />
            <TextField size="small" label="Purchase (ซื้อมาจาก)" name="purchase"
              value={formData.purchase} onChange={handleChange} onKeyDown={noEnter} sx={fieldSx} />
            <TextField size="small" label="Project (โครงการ)" name="project"
              value={formData.project} onChange={handleChange} onKeyDown={noEnter} sx={fieldSx} />
            <TextField size="small" label="วันซื้อ (Into Stock) *" type="date" name="into_stock"
              value={formData.into_stock} onChange={handleChange} onKeyDown={noEnter}
              InputLabelProps={{ shrink: true }} required sx={fieldSx} />
            <TextField size="small" label="วันขาย (Out Stock)" type="date" name="out_stock"
              value={formData.out_stock} onChange={handleChange} onKeyDown={noEnter}
              InputLabelProps={{ shrink: true }} sx={fieldSx} />
            <FormControl size="small" sx={fieldSx}>
              <InputLabel>Status Stock</InputLabel>
              <Select name="status_stock" value={formData.status_stock} onChange={handleChange} label="Status Stock">
                <MenuItem value="in stock">In Stock</MenuItem>
                <MenuItem value="sold out">Sold Out</MenuItem>
              </Select>
            </FormControl>
            <TextField size="small" label="จำนวนที่ต้องการเพิ่ม *" type="number" name="repeat"
              value={repeat} onChange={e => setRepeat(Math.max(1, parseInt(e.target.value)||1))}
              onKeyDown={noEnter} inputProps={{ min:1 }} required sx={fieldSx} />
          </div>

          <div style={{ marginTop: 24, padding:'16px 20px', background:'#f8fafc', borderRadius:12, border:'1px solid #e2e8f0', marginBottom:20 }}>
            <p style={{ margin:0, fontSize:'0.85rem', color:'#64748b' }}>
              จะเพิ่ม <strong style={{ color:'#4f46e5' }}>{repeat}</strong> รายการ
              {formData.brand && <> · <strong>{formData.brand}</strong></>}
              {formData.model && <> {formData.model}</>}
            </p>
          </div>

          <Button type="submit" variant="contained" fullWidth
            style={{ background:'linear-gradient(135deg,#4f46e5,#7c3aed)', color:'white', padding:'12px', fontWeight:700, fontSize:'1rem', borderRadius:12, textTransform:'none', boxShadow:'0 4px 16px rgba(79,70,229,0.35)' }}>
            ➕ เพิ่มข้อมูล ({repeat} รายการ)
          </Button>
        </form>
      </div>

      {/* Lookup Drawer */}
      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <div style={{ width: 300, padding: 24, display:'flex', flexDirection:'column', gap:16 }}>
          <Typography style={{ fontWeight:800, fontSize:'1.1rem', color:'#0f172a' }}>
            🔍 ดึงข้อมูลจาก Proid
          </Typography>
          <p style={{ color:'#64748b', fontSize:'0.875rem', margin:0, lineHeight:1.6 }}>
            ระบุรหัสครุภัณฑ์เพื่อดึง Brand และ Model โดยอัตโนมัติ
          </p>
          <form onSubmit={handleLookup} style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <TextField size="small" label="รหัสครุภัณฑ์" value={lookupProid}
              onChange={e => setLookupProid(e.target.value)} required fullWidth />
            <Button type="submit" variant="contained" fullWidth
              style={{ background:'linear-gradient(135deg,#4f46e5,#7c3aed)', color:'white', textTransform:'none', fontWeight:700, borderRadius:9 }}>
              ดึงข้อมูล
            </Button>
            <Button variant="outlined" onClick={() => setDrawerOpen(false)} fullWidth
              style={{ textTransform:'none', borderRadius:9 }}>
              ยกเลิก
            </Button>
          </form>
        </div>
      </Drawer>

      <style jsx>{`
        @media (max-width: 640px) {
          form > div[style*="grid"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
