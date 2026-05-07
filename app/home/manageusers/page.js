"use client"
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Typography } from '@mui/material';

const priorityConfig = {
  admin: { bg: '#fef9c3', color: '#92400e', label: '👑 Admin' },
  user:  { bg: '#dbeafe', color: '#1d4ed8', label: '👤 User'  },
};

const Page = () => {
  const [data, setData] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn');
    if (!loggedIn) { window.location.href = "/"; return; }
    setIsLoggedIn(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setData)
      .catch(() => {});
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('ต้องการลบผู้ใช้นี้?')) return;
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/delete/${id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error();
      setData(d => d.filter(u => u.id !== id));
    } catch {
      alert('ลบไม่สำเร็จ กรุณาลองใหม่');
    }
  };

  if (!isLoggedIn) return null;

  return (
    <div className="page-wrapper">

      <div className="page-header">
        <Typography className="page-title">👥 จัดการผู้ใช้ (Users)</Typography>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <span className="record-count">{data.length} ผู้ใช้</span>
          <Link href="/home/manageusers/register">
            <Button variant="contained"
              style={{ background:'linear-gradient(135deg,#10b981,#059669)', color:'white', fontWeight:700, borderRadius:9, textTransform:'none', padding:'8px 18px', boxShadow:'0 3px 10px rgba(16,185,129,0.3)' }}>
              + เพิ่มผู้ใช้
            </Button>
          </Link>
        </div>
      </div>

      <div className="table-card">
        <div className="table-scroll">
          <table className="data-table" style={{ minWidth: 520 }}>
            <thead>
              <tr>
                <th style={{ width:56 }}>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th style={{ textAlign:'center' }}>Priority</th>
                <th style={{ textAlign:'center' }}>แก้ไข</th>
                <th style={{ textAlign:'center' }}>ลบ</th>
              </tr>
            </thead>
            <tbody>
              {data.map(user => {
                const cfg = priorityConfig[user.priority] || { bg:'#f1f5f9', color:'#475569', label: user.priority };
                return (
                  <tr key={user.id}>
                    <td style={{ color:'#94a3b8', fontWeight:600, fontSize:'0.82rem' }}>{user.id}</td>
                    <td style={{ fontWeight:600 }}>{user.username}</td>
                    <td style={{ color:'#64748b' }}>{user.email}</td>
                    <td style={{ textAlign:'center' }}>
                      <span style={{ background:cfg.bg, color:cfg.color, borderRadius:999, padding:'4px 12px', fontWeight:700, fontSize:'0.78rem', display:'inline-block' }}>
                        {cfg.label}
                      </span>
                    </td>
                    <td style={{ textAlign:'center' }}>
                      <Link href={`/home/manageusers/updateuser/${user.id}`}>
                        <Button variant="outlined" className="btn-edit">แก้ไข</Button>
                      </Link>
                    </td>
                    <td style={{ textAlign:'center' }}>
                      <Button variant="outlined" color="error" className="btn-delete" onClick={() => handleDelete(user.id)}>ลบ</Button>
                    </td>
                  </tr>
                );
              })}
              {data.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign:'center', padding:40, color:'#94a3b8' }}>ไม่พบข้อมูล</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Page;
