"use client";
import React, { useEffect, useState } from 'react';
import {
  Button, FormControl, InputLabel, Select, MenuItem, TextField, Typography, TableSortLabel,
} from '@mui/material';
import * as XLSX from 'xlsx';
import Link from 'next/link';

const Page = () => {
  const [data, setData] = useState([]);
  const [priority, setPriority] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sortDirection, setSortDirection] = useState('asc');
  const [sortBy, setSortBy] = useState('brand');
  const [sortedData, setSortedData] = useState([]);
  const [filterColumn, setFilterColumn] = useState('brand');
  const [filterValue, setFilterValue] = useState('');

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn');
    if (!loggedIn) { window.location.href = "/"; return; }
    setIsLoggedIn(true);
    setPriority(localStorage.getItem('priority') || '');
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/instock`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setData)
      .catch(() => {});
  }, [isLoggedIn]);

  useEffect(() => {
    const filtered = data.filter(item =>
      filterValue === '' || (item[filterColumn]?.toString().toLowerCase().includes(filterValue.toLowerCase()))
    );
    const sorted = [...filtered].sort((a, b) => {
      const vA = a[sortBy]||'', vB = b[sortBy]||'';
      return sortDirection === 'asc'
        ? vA.toString().localeCompare(vB.toString())
        : vB.toString().localeCompare(vA.toString());
    });
    setSortedData(sorted);
  }, [sortDirection, sortBy, data, filterColumn, filterValue]);

  const handleSort = (field) => {
    if (field === sortBy) setSortDirection(d => d==='asc'?'desc':'asc');
    else { setSortBy(field); setSortDirection('asc'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('ต้องการลบรายการนี้?')) return;
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/delete/${id}`, { method:'DELETE' });
      if (!r.ok) throw new Error();
      setData(d => d.filter(item => item.id !== id));
    } catch { alert('ลบไม่สำเร็จ กรุณาลองใหม่'); }
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(sortedData.map(e => ({
      ID:e.id, รหัสครุภัณฑ์:e.proid, BRAND:e.brand, MODEL:e.model, SERIAL:e.serial,
      MAC:e.mac, ราคา:e.price, ซื้อมาจาก:e.purchase, STATUS:e.status_stock,
      วันซื้อ:e.into_stock, วันขาย:e.out_stock, โครงการ:e.project,
    })));
    ws["!cols"] = [10,20,15,15,20,20,10,20,10,15,15,20].map(w=>({width:w}));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Instock");
    XLSX.writeFile(wb, "Instock.xlsx");
  };

  if (!isLoggedIn) return null;

  const canEdit = priority === 'user' || priority === 'admin';
  const sortLabelSx = {
    color:'white !important',
    '& .MuiTableSortLabel-icon':{ color:'rgba(255,255,255,0.8) !important' },
    '&:hover':{ color:'rgba(255,255,255,0.85) !important' },
  };

  return (
    <div className="page-wrapper">

      <div className="page-header">
        <Typography className="page-title">📦 สินค้าในคลัง (In Stock)</Typography>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {canEdit && (
            <Button className="btn-export" onClick={exportToExcel}>⬇ Export Excel</Button>
          )}
          <span className="record-count">{sortedData.length} รายการ</span>
        </div>
      </div>

      <div className="toolbar-bar">
        <FormControl size="small" sx={{ minWidth:150 }}>
          <InputLabel>กรองตาม</InputLabel>
          <Select value={filterColumn} onChange={e => setFilterColumn(e.target.value)} label="กรองตาม">
            <MenuItem value="proid">รหัสครุภัณฑ์</MenuItem>
            <MenuItem value="brand">Brand</MenuItem>
            <MenuItem value="model">Model</MenuItem>
            <MenuItem value="serial">Serial</MenuItem>
            <MenuItem value="mac">MAC</MenuItem>
            <MenuItem value="purchase">ซื้อมาจาก</MenuItem>
            <MenuItem value="project">โครงการ</MenuItem>
          </Select>
        </FormControl>
        <TextField
          size="small" label="🔍 ค้นหา..." variant="outlined"
          value={filterValue} onChange={e => setFilterValue(e.target.value)}
          sx={{ flex:1, minWidth:180 }}
        />
      </div>

      <div className="table-card">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>รหัสครุภัณฑ์</th>
                <th><TableSortLabel active={sortBy==='brand'} direction={sortBy==='brand'?sortDirection:'asc'} onClick={()=>handleSort('brand')} sx={sortLabelSx}>Brand</TableSortLabel></th>
                <th><TableSortLabel active={sortBy==='model'} direction={sortBy==='model'?sortDirection:'asc'} onClick={()=>handleSort('model')} sx={sortLabelSx}>Model</TableSortLabel></th>
                <th>Serial</th>
                <th>MAC</th>
                <th>ราคา</th>
                <th>ซื้อมาจาก</th>
                <th>Status</th>
                <th>วันซื้อ</th>
                <th>วันขาย</th>
                <th>โครงการ</th>
                {canEdit && <><th style={{ textAlign:'center' }}>แก้ไข</th><th style={{ textAlign:'center' }}>ลบ</th></>}
              </tr>
            </thead>
            <tbody>
              {sortedData.map(eq => (
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
                        <Link href={`/home/instock/update/${eq.id}`}>
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
              {sortedData.length === 0 && (
                <tr>
                  <td colSpan={canEdit?14:12} style={{ textAlign:'center', padding:40, color:'#94a3b8' }}>ไม่พบข้อมูล</td>
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
