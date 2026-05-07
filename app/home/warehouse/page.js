"use client"
import React, { useEffect, useState } from 'react';
import {
  Button, Select, MenuItem, TextField, Drawer, Typography, TableSortLabel,
} from '@mui/material';
import * as XLSX from 'xlsx';
import Link from 'next/link';
import Image from 'next/image';

const Warehouse = () => {
  const [data, setData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [priority, setPriority] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sortOrder, setSortOrder] = useState('asc');
  const [sortBy, setSortBy] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterType, setFilterType] = useState('All');
  const [filterInput, setFilterInput] = useState('');

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn');
    if (!loggedIn) { window.location.href = "/"; return; }
    setIsLoggedIn(true);
    setPriority(localStorage.getItem('priority') || '');
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mywarehouse`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(result => { setData(result); setOriginalData(result); })
      .catch(() => {});
  }, [isLoggedIn]);

  // Fix A: numeric sort for in_stock, sold_out, total_model
  const handleSort = (column) => {
    const isAsc = sortBy === column && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortBy(column);
    setData(prev => [...prev].sort((a, b) => {
      const numericCols = ['in_stock', 'sold_out', 'total_model'];
      if (numericCols.includes(column)) {
        const nA = Number(a[column]) || 0, nB = Number(b[column]) || 0;
        return isAsc ? nB - nA : nA - nB;
      }
      const vA = String(a[column] || ''), vB = String(b[column] || '');
      return isAsc ? vB.localeCompare(vA) : vA.localeCompare(vB);
    }));
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data.map(e => ({
      ยี่ห้อ: e.brand, โมเดล: e.model, ชนิดอุปกรณ์: e.device_type,
      ในคลัง: e.in_stock, ขายแล้ว: e.sold_out, ทั้งหมด: e.total_model,
    })));
    ws["!cols"] = [15, 20, 15, 12, 12, 12].map(w => ({ width: w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Warehouse");
    XLSX.writeFile(wb, "WarehouseData.xlsx");
  };

  const applyFilter = () => {
    if (filterType === 'All') setData(originalData);
    else setData(originalData.filter(item =>
      (item[filterType] || '').toLowerCase().includes(filterInput.toLowerCase())
    ));
    setFilterOpen(false);
  };

  if (!isLoggedIn) return null;

  const canEdit = priority === 'admin' || priority === 'user';

  const sortLabelSx = {
    color: 'white !important',
    '& .MuiTableSortLabel-icon': { color: 'rgba(255,255,255,0.8) !important' },
    '&:hover': { color: 'rgba(255,255,255,0.85) !important' },
  };

  return (
    <div className="page-wrapper">

      <div className="page-header">
        <Typography className="page-title">🏭 คลังอุปกรณ์ (Warehouse)</Typography>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="record-count">{data.length} รายการ</span>
          {canEdit && (
            <>
              <Button className="btn-export" onClick={exportToExcel}>⬇ Export Excel</Button>
              <Link href="/home/warehouse/library">
                <Button className="btn-export" style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
                  📚 Library
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="toolbar-bar">
        <Button onClick={() => setFilterOpen(true)}
          style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: 'white', fontWeight: 600, borderRadius: 8, padding: '7px 16px', fontSize: '0.85rem', textTransform: 'none', whiteSpace: 'nowrap' }}>
          🔍 กรองข้อมูล
        </Button>
        {/* Fix B: also reset sortBy and sortOrder when resetting data */}
        <Button onClick={() => { setData(originalData); setFilterInput(''); setFilterType('All'); setSortBy(''); setSortOrder('asc'); }}
          variant="outlined" style={{ borderColor: '#e2e8f0', color: '#64748b', borderRadius: 8, padding: '7px 14px', fontSize: '0.85rem', textTransform: 'none', whiteSpace: 'nowrap' }}>
          รีเซ็ต
        </Button>
      </div>

      <div className="table-card">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th><TableSortLabel active={sortBy==='brand'} direction={sortBy==='brand'?sortOrder:'asc'} onClick={()=>handleSort('brand')} sx={sortLabelSx}>ยี่ห้อ</TableSortLabel></th>
                <th><TableSortLabel active={sortBy==='model'} direction={sortBy==='model'?sortOrder:'asc'} onClick={()=>handleSort('model')} sx={sortLabelSx}>โมเดล</TableSortLabel></th>
                <th style={{ textAlign:'center' }}>รูป</th>
                <th><TableSortLabel active={sortBy==='device_type'} direction={sortBy==='device_type'?sortOrder:'asc'} onClick={()=>handleSort('device_type')} sx={sortLabelSx}>ชนิด</TableSortLabel></th>
                <th style={{ textAlign:'center' }}>ในคลัง</th>
                <th style={{ textAlign:'center' }}>ขายแล้ว</th>
                <th style={{ textAlign:'center' }}>ทั้งหมด</th>
              </tr>
            </thead>
            <tbody>
              {data.map((eq, i) => (
                <tr key={`${eq.brand}-${eq.model}-${i}`}>
                  <td style={{ fontWeight: 500 }}>{eq.brand}</td>
                  <td>
                    <Link href={`/home/warehouse/${eq.model}/showdetail`}
                      style={{ color: '#4f46e5', fontWeight: 600, textDecoration: 'none' }}>
                      {eq.model}
                    </Link>
                  </td>
                  <td style={{ textAlign:'center', padding: '8px 12px' }}>
                    <Image
                      src={eq.model ? `/devicepic/${eq.model}.png` : '/devicepic/default.png'}
                      alt={eq.model || 'device'} width={54} height={54}
                      unoptimized
                      style={{ objectFit:'contain', borderRadius: 8, background:'#f8fafc', padding: 4 }}
                    />
                  </td>
                  <td style={{ color: '#64748b' }}>{eq.device_type}</td>
                  <td style={{ textAlign:'center' }}>
                    <Link href={`/home/warehouse/${eq.model}/instock`} style={{ textDecoration:'none' }}>
                      <span style={{ background:'#dcfce7', color:'#15803d', borderRadius:999, padding:'3px 12px', fontWeight:700, fontSize:'0.8rem', display:'inline-block' }}>
                        {eq.in_stock}
                      </span>
                    </Link>
                  </td>
                  <td style={{ textAlign:'center' }}>
                    <Link href={`/home/warehouse/${eq.model}/soldout`} style={{ textDecoration:'none' }}>
                      <span style={{ background:'#fee2e2', color:'#dc2626', borderRadius:999, padding:'3px 12px', fontWeight:700, fontSize:'0.8rem', display:'inline-block' }}>
                        {eq.sold_out}
                      </span>
                    </Link>
                  </td>
                  <td style={{ textAlign:'center' }}>
                    <Link href={`/home/warehouse/${eq.model}/allmodel`} style={{ textDecoration:'none' }}>
                      <span style={{ background:'#ede9fe', color:'#6d28d9', borderRadius:999, padding:'3px 12px', fontWeight:700, fontSize:'0.8rem', display:'inline-block' }}>
                        {eq.total_model}
                      </span>
                    </Link>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign:'center', padding:40, color:'#94a3b8' }}>ไม่พบข้อมูล</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Drawer anchor="right" open={filterOpen} onClose={() => setFilterOpen(false)}>
        <div style={{ width: 300, padding: 24, display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <Typography style={{ fontWeight: 800, fontSize:'1.1rem', color:'#0f172a' }}>🔍 กรองข้อมูล</Typography>
            <button onClick={() => setFilterOpen(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:'1.2rem' }}>✕</button>
          </div>
          <Select value={filterType} onChange={e => setFilterType(e.target.value)} fullWidth size="small">
            <MenuItem value="All">ทั้งหมด</MenuItem>
            <MenuItem value="brand">Brand</MenuItem>
            <MenuItem value="model">Model</MenuItem>
            <MenuItem value="device_type">Device Type</MenuItem>
          </Select>
          {filterType !== 'All' && (
            <TextField value={filterInput} onChange={e => setFilterInput(e.target.value)}
              label="ค้นหา..." size="small" fullWidth
              onKeyDown={e => e.key === 'Enter' && applyFilter()} />
          )}
          <Button variant="contained" onClick={applyFilter} fullWidth
            style={{ background:'linear-gradient(135deg,#4f46e5,#7c3aed)', color:'white', borderRadius:9, fontWeight:700, padding:'10px', textTransform:'none' }}>
            Apply Filter
          </Button>
        </div>
      </Drawer>
    </div>
  );
};

export default Warehouse;
