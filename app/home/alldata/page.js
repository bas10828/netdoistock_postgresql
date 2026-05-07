"use client"
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Box, Button, Pagination, Typography } from '@mui/material';
import * as XLSX from 'xlsx';

const Alldata = () => {
  const [data, setData] = useState([]);
  const [priority, setPriority] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [retryCount, setRetryCount] = useState(0);
  const LIMIT = 50;

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn');
    if (!loggedIn) { window.location.href = "/"; return; }
    setIsLoggedIn(true);
    setPriority(localStorage.getItem('priority') || '');
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    setError('');
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/data?page=${page}&limit=${LIMIT}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(json => { setData(json.data); setTotalPages(json.pagination.totalPages); })
      .catch(() => setError('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่'));
  }, [isLoggedIn, page, retryCount]);

  const exportToExcel = async () => {
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/data?all=true`);
      if (!r.ok) throw new Error();
      const allData = await r.json();
      const ws = XLSX.utils.json_to_sheet(allData.map(e => ({
        ID:e.id, รหัสครุภัณฑ์:e.proid, BRAND:e.brand, MODEL:e.model, SERIAL:e.serial,
        MAC:e.mac, ราคา:e.price, ซื้อมาจาก:e.purchase, STATUS:e.status_stock,
        วันซื้อ:e.into_stock, วันขาย:e.out_stock, โครงการ:e.project,
      })));
      ws["!cols"] = [10,20,15,15,20,20,10,20,10,15,15,20].map(w=>({width:w}));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Alldata");
      XLSX.writeFile(wb, "Alldata.xlsx");
    } catch { alert('ไม่สามารถ export ได้ กรุณาลองใหม่'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('ต้องการลบรายการนี้?')) return;
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/delete/${id}`, { method:'DELETE' });
      if (!r.ok) throw new Error();
      setData(d => d.filter(item => item.id !== id));
    } catch { alert('ลบไม่สำเร็จ กรุณาลองใหม่'); }
  };

  if (!isLoggedIn) return null;

  if (error) {
    return (
      <div className="page-wrapper" style={{ textAlign:'center', paddingTop:60 }}>
        <div style={{ fontSize:'2.5rem', marginBottom:12 }}>⚠️</div>
        <Typography color="error" gutterBottom style={{ marginBottom:16 }}>{error}</Typography>
        <Button variant="outlined" onClick={() => setRetryCount(c => c+1)}>ลองใหม่</Button>
      </div>
    );
  }

  const canEdit = priority === 'user' || priority === 'admin';

  return (
    <div className="page-wrapper">

      <div className="page-header">
        <Typography className="page-title">🗂 ข้อมูลทั้งหมด (All Data)</Typography>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          {canEdit && (
            <Button className="btn-export" onClick={exportToExcel}>⬇ Export Excel</Button>
          )}
          <span className="record-count">หน้า {page} / {totalPages}</span>
        </div>
      </div>

      <div className="table-card">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th><th>รหัสครุภัณฑ์</th><th>Brand</th><th>Model</th>
                <th>Serial</th><th>MAC</th><th>ราคา</th><th>ซื้อมาจาก</th>
                <th>Status</th><th>วันซื้อ</th><th>วันขาย</th><th>โครงการ</th>
                {canEdit && <><th style={{ textAlign:'center' }}>แก้ไข</th><th style={{ textAlign:'center' }}>ลบ</th></>}
              </tr>
            </thead>
            <tbody>
              {data.map(eq => (
                <tr key={eq.id}>
                  <td style={{ color:'#94a3b8', fontSize:'0.82rem' }}>{eq.id}</td>
                  <td style={{ fontWeight:500 }}>{eq.proid}</td>
                  <td>{eq.brand}</td>
                  <td>{eq.model}</td>
                  <td style={{ color:'#64748b' }}>{eq.serial}</td>
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
                        <Link href={`/home/alldata/update/${eq.id}`}>
                          <Button variant="outlined" className="btn-edit">แก้ไข</Button>
                        </Link>
                      </td>
                      <td style={{ textAlign:'center' }}>
                        <Button variant="outlined" color="error" className="btn-delete" onClick={() => handleDelete(eq.id)}>ลบ</Button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={canEdit?14:12} style={{ textAlign:'center', padding:40, color:'#94a3b8' }}>ไม่พบข้อมูล</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <Box sx={{ display:'flex', justifyContent:'center', mt:3 }}>
          <Pagination count={totalPages} page={page} onChange={(_,v) => setPage(v)}
            color="primary" shape="rounded" />
        </Box>
      )}
    </div>
  );
};

export default Alldata;
