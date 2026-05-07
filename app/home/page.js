"use client"
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { TextField, Typography } from '@mui/material';

export default function Page() {
  const [data, setData] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn');
    if (!loggedIn) { window.location.href = "/"; return; }
    setIsLoggedIn(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/myproject`)
      .then(r => r.ok ? r.json() : [])
      .then(setData)
      .catch(() => {});
  }, []);

  if (!isLoggedIn) return null;

  const filtered = data.filter(d =>
    d.project?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-wrapper">

      {/* Dashboard Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 60%, #a855f7 100%)',
        borderRadius: 20,
        padding: '28px 32px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(79,70,229,0.3)',
      }}>
        <div style={{ position:'absolute', width:260, height:260, background:'rgba(255,255,255,0.06)', borderRadius:'50%', top:-80, right:-60 }} />
        <div style={{ position:'absolute', width:180, height:180, background:'rgba(255,255,255,0.04)', borderRadius:'50%', bottom:-60, left:-40 }} />
        <div style={{ position:'relative' }}>
          <p style={{ margin:0, color:'rgba(255,255,255,0.75)', fontSize:'0.875rem', marginBottom:6 }}>ยินดีต้อนรับสู่</p>
          <Typography style={{ fontSize:'1.8rem', fontWeight:900, color:'white', margin:0, letterSpacing:'-0.5px' }}>
            NETDOI Stock
          </Typography>
          <p style={{ margin:'6px 0 0', color:'rgba(255,255,255,0.7)', fontSize:'0.9rem' }}>ระบบจัดการสินค้าคงคลัง</p>
        </div>
        <div style={{ position:'relative', background:'rgba(255,255,255,0.15)', borderRadius:16, padding:'18px 28px', textAlign:'center', backdropFilter:'blur(4px)', border:'1px solid rgba(255,255,255,0.2)' }}>
          <p style={{ margin:0, color:'rgba(255,255,255,0.75)', fontSize:'0.78rem', textTransform:'uppercase', letterSpacing:1 }}>โครงการทั้งหมด</p>
          <p style={{ margin:0, fontSize:'2.5rem', fontWeight:900, color:'white', lineHeight:1.1 }}>{data.length}</p>
        </div>
      </div>

      {/* Header + Search */}
      <div className="page-header">
        <Typography className="page-title">🏗 โครงการทั้งหมด</Typography>
        <span className="record-count">{filtered.length} โครงการ</span>
      </div>

      <div className="toolbar-bar">
        <TextField
          size="small" label="🔍 ค้นหาโครงการ..." variant="outlined"
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          sx={{ flex: 1, minWidth: 180 }}
        />
      </div>

      <div className="table-card">
        <div className="table-scroll">
          <table className="data-table" style={{ minWidth: 400 }}>
            <thead>
              <tr>
                <th style={{ width: 60 }}>#</th>
                <th>ชื่อโครงการ</th>
                <th style={{ textAlign:'center', width: 140 }}>จำนวนอุปกรณ์</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map((item, i) => (
                <tr key={item.project}>
                  <td style={{ color:'#94a3b8', fontWeight:600, fontSize:'0.85rem' }}>{i + 1}</td>
                  <td>
                    <Link href={`/home/${item.project}`}
                      style={{ color:'#4f46e5', fontWeight:600, textDecoration:'none', fontSize:'0.95rem' }}>
                      {item.project}
                    </Link>
                  </td>
                  <td style={{ textAlign:'center' }}>
                    <span style={{ background:'#ede9fe', color:'#6d28d9', borderRadius:999, padding:'4px 14px', fontWeight:700, fontSize:'0.82rem', display:'inline-block' }}>
                      {item.countproject}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={3} style={{ textAlign:'center', padding:40, color:'#94a3b8' }}>
                    {searchTerm ? `ไม่พบโครงการที่ตรงกับ "${searchTerm}"` : 'ไม่พบข้อมูล'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
