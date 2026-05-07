"use client"
import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography, Button, FormControl, InputLabel, Select, MenuItem,
  TextField, IconButton, Drawer,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CommentOutlinedIcon from '@mui/icons-material/CommentOutlined';
import Link from 'next/link';
import * as XLSX from 'xlsx';

const searchTypeLabel = {
  proid: 'รหัสครุภัณฑ์', brand: 'Brand', model: 'Model',
  serial: 'Serial', purchase: 'Purchase', project: 'Project',
};

export default function FindDeviceNumber() {
  const [searchType, setSearchType] = useState('proid');
  const [searchValue, setSearchValue] = useState('');
  const [data, setData] = useState([]);
  const [error, setError] = useState('');
  const [priority, setPriority] = useState('');
  const [cart, setCart] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [project, setProject] = useState('');
  const [statusStock, setStatusStock] = useState('sold out');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [commentCounts, setCommentCounts] = useState([]);

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn');
    if (!loggedIn) { window.location.href = "/"; return; }
    setIsLoggedIn(true);
    setPriority(localStorage.getItem('priority') || '');
  }, []);

  useEffect(() => {
    if (cart.length > 0) setProject(cart[0].project || '');
    else setProject('');
  }, [cart]);

  const fetchCommentCounts = useCallback(async () => {
    const counts = [];
    for (const eq of data) {
      if (!eq.serial) { counts.push(null); continue; }
      try {
        const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/comment/countcomment/${eq.serial}`);
        const result = await r.json();
        counts.push(result[0]?.count || 0);
      } catch { counts.push(null); }
    }
    setCommentCounts(counts);
  }, [data]);

  useEffect(() => {
    if (data.length > 0) fetchCommentCounts();
  }, [data, fetchCommentCounts]);

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!searchValue) { setError('กรุณาระบุค่าที่ต้องการค้นหา'); return; }
    setError('');
    setCommentCounts([]);
    const endpoints = {
      proid:'findproid', brand:'findbrand', model:'findmodel',
      serial:'findserial', purchase:'findpurchase', project:'findproject',
    };
    const ep = endpoints[searchType];
    if (!ep) { setError('ประเภทค้นหาไม่ถูกต้อง'); return; }
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/${ep}/${searchValue}`);
      if (!r.ok) throw new Error();
      setData(await r.json());
    } catch { setError('เกิดข้อผิดพลาดในการค้นหา'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('ต้องการลบรายการนี้?')) return;
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/delete/${id}`, { method:'DELETE' });
      if (!r.ok) throw new Error();
      setData(d => d.filter(item => item.id !== id));
    } catch { alert('ลบไม่สำเร็จ กรุณาลองใหม่'); }
  };

  const addToCart = (eq) => {
    if (!cart.some(item => item.id === eq.id)) setCart(c => [...c, eq]);
    else alert('สินค้านี้ถูกเพิ่มในตะกร้าแล้ว');
  };

  const removeFromCart = (id) => setCart(c => c.filter(item => item.id !== id));

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'exported_data.xlsx');
  };

  const handleCartSubmit = async (e) => {
    e.preventDefault();
    for (const item of cart) {
      try {
        await fetch(`/api/updateproject`, {
          method:'PUT',
          headers:{ 'Content-Type':'application/json' },
          body: JSON.stringify({ id:item.id, project, statusStock }),
        });
      } catch { /* silent */ }
    }
    setCart([]);
    setDrawerOpen(false);
    await handleSubmit(null);
  };

  if (!isLoggedIn) return null;

  const canEdit = priority === 'user' || priority === 'admin';

  const primaryBtnStyle = {
    background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color:'white',
    textTransform:'none', fontWeight:700, borderRadius:9,
  };

  return (
    <div className="page-wrapper">

      <div className="page-header">
        <Typography className="page-title">🔎 ค้นหาอุปกรณ์</Typography>
        <span className="record-count">{data.length} รายการ</span>
      </div>

      {/* Search toolbar */}
      <div className="toolbar-bar">
        <form onSubmit={handleSubmit}
          style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap', flex:1 }}>
          <FormControl size="small" sx={{ minWidth:170 }}>
            <InputLabel>ประเภทค้นหา</InputLabel>
            <Select value={searchType}
              onChange={e => { setSearchType(e.target.value); setSearchValue(''); }}
              label="ประเภทค้นหา">
              {Object.entries(searchTypeLabel).map(([v,l]) => (
                <MenuItem key={v} value={v}>{l}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField size="small" label={`ค้นหาด้วย ${searchTypeLabel[searchType]}`}
            value={searchValue} onChange={e => setSearchValue(e.target.value)}
            sx={{ flex:1, minWidth:180 }} required />
          <Button type="submit" variant="contained" style={{ ...primaryBtnStyle, padding:'8px 20px', whiteSpace:'nowrap' }}>
            ค้นหา
          </Button>
        </form>
        {data.length > 0 && (
          <Button className="btn-export" onClick={handleExportExcel}>⬇ Export Excel</Button>
        )}
        {canEdit && (
          <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setDrawerOpen(true)}
            style={{ borderColor:'#c7d2fe', color:'#4f46e5', borderRadius:9, textTransform:'none', fontWeight:600, whiteSpace:'nowrap' }}>
            🛒 ตะกร้า ({cart.length})
          </Button>
        )}
      </div>

      {error && (
        <div className="alert-error" style={{ marginBottom:14 }}>{error}</div>
      )}

      <div className="table-card">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>รหัสครุภัณฑ์</th>
                <th>Brand</th>
                <th>Model</th>
                <th>Serial</th>
                <th>MAC</th>
                <th>ราคา</th>
                <th>ซื้อมาจาก</th>
                <th>Status</th>
                <th>วันซื้อ</th>
                <th>วันขาย</th>
                <th>โครงการ</th>
                {canEdit && <><th style={{ textAlign:'center' }}>แก้ไข</th><th style={{ textAlign:'center' }}>ลบ</th><th style={{ textAlign:'center' }}>ตะกร้า</th></>}
              </tr>
            </thead>
            <tbody>
              {data.map((eq, i) => (
                <tr key={eq.id}>
                  <td style={{ fontWeight:500 }}>{eq.proid}</td>
                  <td>{eq.brand}</td>
                  <td>{eq.model}</td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:2 }}>
                      <span>{eq.serial}</span>
                      {commentCounts[i] != null && (
                        <Link href={`/home/comment/${eq.serial}`}>
                          <IconButton size="small" style={{ color:'#4f46e5', padding:3 }}>
                            <CommentOutlinedIcon sx={{ fontSize:15 }} />
                            <span style={{ fontSize:'0.7rem', marginLeft:1 }}>{commentCounts[i]}</span>
                          </IconButton>
                        </Link>
                      )}
                    </div>
                  </td>
                  <td style={{ color:'#64748b' }}>{eq.mac}</td>
                  <td>{eq.price?.toLocaleString()}</td>
                  <td>{eq.purchase}</td>
                  <td>
                    <span className={`badge ${eq.status_stock==='in stock'?'badge-instock':'badge-soldout'}`}>
                      {eq.status_stock==='in stock'?'● In Stock':'● Sold Out'}
                    </span>
                  </td>
                  <td style={{ color:'#64748b' }}>{eq.into_stock}</td>
                  <td style={{ color:'#64748b' }}>{eq.out_stock}</td>
                  <td style={{ fontWeight:500 }}>{eq.project}</td>
                  {canEdit && (
                    <>
                      <td style={{ textAlign:'center' }}>
                        <Link href={`/home/finddevicenumber/update/${eq.id}`}>
                          <Button variant="outlined" className="btn-edit">แก้ไข</Button>
                        </Link>
                      </td>
                      <td style={{ textAlign:'center' }}>
                        <Button variant="outlined" color="error" className="btn-delete" onClick={() => handleDelete(eq.id)}>ลบ</Button>
                      </td>
                      <td style={{ textAlign:'center' }}>
                        {cart.some(item => item.id === eq.id) ? (
                          <IconButton size="small" color="error" onClick={() => removeFromCart(eq.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        ) : (
                          <IconButton size="small" style={{ color:'#10b981' }} onClick={() => addToCart(eq)}>
                            <AddIcon fontSize="small" />
                          </IconButton>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={canEdit?14:11} style={{ textAlign:'center', padding:48, color:'#94a3b8' }}>
                    <div style={{ fontSize:'2rem', marginBottom:8 }}>🔍</div>
                    <div>ค้นหาอุปกรณ์ด้วยแถบค้นหาด้านบน</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cart Drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <div style={{ width:360, padding:24, display:'flex', flexDirection:'column', gap:16, height:'100%', overflowY:'auto' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <Typography style={{ fontWeight:800, fontSize:'1.1rem', color:'#0f172a' }}>
              🛒 ตะกร้าสินค้า ({cart.length})
            </Typography>
            <button onClick={() => setDrawerOpen(false)}
              style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:'1.3rem', lineHeight:1 }}>✕</button>
          </div>

          {cart.length === 0 ? (
            <div style={{ textAlign:'center', padding:'48px 0', color:'#94a3b8' }}>
              <div style={{ fontSize:'2.5rem', marginBottom:8 }}>🛒</div>
              <p style={{ margin:0 }}>ไม่มีสินค้าในตะกร้า</p>
            </div>
          ) : (
            <form onSubmit={handleCartSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div className="table-scroll">
                <table className="data-table" style={{ minWidth:280, fontSize:'0.8rem' }}>
                  <thead>
                    <tr>
                      <th>รหัส</th>
                      <th>Brand</th>
                      <th>Model</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map(item => (
                      <tr key={item.id}>
                        <td>{item.proid}</td>
                        <td>{item.brand}</td>
                        <td>{item.model}</td>
                        <td>
                          <IconButton size="small" color="error" onClick={() => removeFromCart(item.id)}>
                            <DeleteIcon sx={{ fontSize:16 }} />
                          </IconButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <TextField label="Project *" value={project} onChange={e => setProject(e.target.value)}
                fullWidth size="small" required />
              <FormControl fullWidth size="small">
                <InputLabel>Status Stock</InputLabel>
                <Select value={statusStock} onChange={e => setStatusStock(e.target.value)} label="Status Stock" required>
                  <MenuItem value="in stock">In Stock</MenuItem>
                  <MenuItem value="sold out">Sold Out</MenuItem>
                </Select>
              </FormControl>
              <Button type="submit" variant="contained" fullWidth
                style={{ ...primaryBtnStyle, padding:'10px', marginTop:4 }}>
                Submit
              </Button>
            </form>
          )}
        </div>
      </Drawer>
    </div>
  );
}
