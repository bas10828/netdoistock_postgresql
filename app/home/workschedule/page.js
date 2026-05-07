"use client"
import React, { useEffect, useState, useCallback } from 'react';
import { Button, Drawer, TextField, Typography } from '@mui/material';
import * as XLSX from 'xlsx';
import moment from 'moment-timezone';

const formatDate = (iso) => moment(iso, ['YYYY-MM-DD', moment.ISO_8601]).format('DD/MM/YYYY');

const loadSchedule = (type) => {
  const url = type === 'all'
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/schedule`
    : `${process.env.NEXT_PUBLIC_API_URL}/api/schedule/today`;
  return fetch(url)
    .then(r => { if (!r.ok) throw new Error(); return r.json(); })
    .then(data => data.map(item => ({
      ...item,
      timestamp: moment(item.timestamp).tz('Asia/Bangkok').format('DD/MM/YY HH:mm'),
      date_start: formatDate(item.date_start),
      date_end: formatDate(item.date_end),
    })));
};

const emptyForm = { details: '', project: '', date_start: '', date_end: '', user: '' };

const Page = () => {
  const [data, setData] = useState([]);
  const [priority, setPriority] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [displayType, setDisplayType] = useState('today');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentEditId, setCurrentEditId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [isFindDrawerOpen, setIsFindDrawerOpen] = useState(false);
  const [isFindDetailsDrawerOpen, setIsFindDetailsDrawerOpen] = useState(false);
  const [findDate, setFindDate] = useState('');
  const [findDetails, setFindDetails] = useState('');

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn');
    if (!loggedIn) { window.location.href = "/"; return; }
    setIsLoggedIn(true);
    setPriority(localStorage.getItem('priority') || '');
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    loadSchedule(displayType).then(setData).catch(() => {});
  }, [isLoggedIn, displayType]);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('ต้องการลบรายการนี้?')) return;
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schedule/delete/${id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error();
      setData(d => d.filter(item => item.id !== id));
    } catch {
      alert('ลบไม่สำเร็จ กรุณาลองใหม่');
    }
  }, []);

  const openDrawer = useCallback((editData = null) => {
    if (editData) {
      setEditMode(true);
      setCurrentEditId(editData.id);
      setFormData({
        details: editData.details,
        project: editData.project,
        date_start: moment(editData.date_start, 'DD/MM/YYYY').isValid()
          ? moment(editData.date_start, 'DD/MM/YYYY').format('YYYY-MM-DD') : '',
        date_end: moment(editData.date_end, 'DD/MM/YYYY').isValid()
          ? moment(editData.date_end, 'DD/MM/YYYY').format('YYYY-MM-DD') : '',
        user: localStorage.getItem('username') || '',
      });
    } else {
      setEditMode(false);
      setCurrentEditId(null);
      setFormData({ ...emptyForm, user: localStorage.getItem('username') || '' });
    }
    setIsDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setCurrentEditId(null);
    setFormData(emptyForm);
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = async () => {
    try {
      const url = editMode
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/schedule/update/${currentEditId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/schedule/create`;
      const r = await fetch(url, {
        method: editMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!r.ok) throw new Error();
      const updated = await r.json();
      if (editMode) setData(d => d.map(item => item.id === currentEditId ? updated : item));
      else setData(d => [...d, updated]);
      closeDrawer();
    } catch {
      alert('บันทึกไม่สำเร็จ กรุณาลองใหม่');
    }
  };

  const handleFindDate = async () => {
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schedule/finddate/${findDate}`);
      if (!r.ok) throw new Error();
      const d = await r.json();
      setData(d.map(item => ({
        ...item,
        timestamp: moment(item.timestamp).tz('Asia/Bangkok').format('DD/MM/YY HH:mm'),
        date_start: formatDate(item.date_start),
        date_end: formatDate(item.date_end),
      })));
      setIsFindDrawerOpen(false);
    } catch { alert('ค้นหาไม่สำเร็จ'); }
  };

  const handleFindDetails = async () => {
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schedule/finddetail/${findDetails}`);
      if (!r.ok) throw new Error();
      const d = await r.json();
      setData(d.map(item => ({
        ...item,
        timestamp: moment(item.timestamp).tz('Asia/Bangkok').format('DD/MM/YY HH:mm'),
        date_start: formatDate(item.date_start),
        date_end: formatDate(item.date_end),
      })));
      setIsFindDetailsDrawerOpen(false);
    } catch { alert('ค้นหาไม่สำเร็จ'); }
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data.map(e => ({
      ID: e.id, Timestamp: e.timestamp, User: e.user,
      Project: e.project, 'Date Start': e.date_start, 'Date End': e.date_end, Details: e.details,
    })));
    ws["!cols"] = [8,18,10,20,13,13,35].map(w => ({ width: w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "WorkSchedule");
    XLSX.writeFile(wb, "Work_Schedule.xlsx");
  };

  if (!isLoggedIn) return null;

  const canEdit = priority === 'user' || priority === 'admin';
  const canDelete = priority === 'admin';

  const toggleBtnStyle = (active) => ({
    textTransform: 'none', fontWeight: 600, fontSize: '0.82rem', borderRadius: 8,
    padding: '6px 14px', whiteSpace: 'nowrap',
    ...(active
      ? { background: '#4f46e5', color: 'white', border: '1.5px solid #4f46e5' }
      : { background: 'white', color: '#4f46e5', border: '1.5px solid #c7d2fe' }),
  });

  const drawerBody = { width: 320, padding: 24, display:'flex', flexDirection:'column', gap:14 };
  const drawerTitle = { fontWeight:800, fontSize:'1.1rem', color:'#0f172a' };
  const actionBtnStyle = { background:'linear-gradient(135deg,#4f46e5,#7c3aed)', color:'white', textTransform:'none', fontWeight:700, borderRadius:9 };

  return (
    <div className="page-wrapper">

      <div className="page-header">
        <Typography className="page-title">📅 ตารางงาน (Work Schedule)</Typography>
        <span className="record-count">{data.length} รายการ</span>
      </div>

      <div className="toolbar-bar">
        <button style={toggleBtnStyle(displayType==='today')} onClick={() => setDisplayType('today')}>📌 วันนี้</button>
        <button style={toggleBtnStyle(displayType==='all')} onClick={() => setDisplayType('all')}>📋 ทั้งหมด</button>
        <button style={{ ...toggleBtnStyle(false), borderColor:'#e2e8f0', color:'#475569' }} onClick={() => setIsFindDrawerOpen(true)}>🗓 ค้นหาเดือน</button>
        <button style={{ ...toggleBtnStyle(false), borderColor:'#e2e8f0', color:'#475569' }} onClick={() => setIsFindDetailsDrawerOpen(true)}>🔍 ค้นหา Details</button>
        {canEdit && (
          <>
            <Button className="btn-export" style={{ background:'linear-gradient(135deg,#10b981,#059669)', marginLeft:'auto' }} onClick={() => openDrawer()}>
              + เพิ่มรายการ
            </Button>
            <Button className="btn-export" onClick={exportToExcel}>⬇ Export Excel</Button>
          </>
        )}
      </div>

      <div className="table-card">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Details</th>
                <th>Project</th>
                <th>วันเริ่ม</th>
                <th>วันสิ้นสุด</th>
                <th>User</th>
                <th>Timestamp</th>
                {canEdit && <th style={{ textAlign:'center' }}>แก้ไข</th>}
                {canDelete && <th style={{ textAlign:'center' }}>ลบ</th>}
              </tr>
            </thead>
            <tbody>
              {data.map(eq => (
                <tr key={eq.id}>
                  <td style={{ color:'#94a3b8', width:48, fontSize:'0.8rem' }}>{eq.id}</td>
                  <td style={{ maxWidth:240, overflow:'hidden', textOverflow:'ellipsis' }}>{eq.details}</td>
                  <td style={{ fontWeight:500, color:'#4f46e5' }}>{eq.project}</td>
                  <td>{eq.date_start}</td>
                  <td>{eq.date_end}</td>
                  <td style={{ color:'#64748b' }}>{eq.user}</td>
                  <td style={{ color:'#94a3b8', fontSize:'0.8rem' }}>{eq.timestamp}</td>
                  {canEdit && (
                    <td style={{ textAlign:'center' }}>
                      <Button variant="outlined" className="btn-edit" onClick={() => openDrawer(eq)}>แก้ไข</Button>
                    </td>
                  )}
                  {canDelete && (
                    <td style={{ textAlign:'center' }}>
                      <Button variant="outlined" color="error" className="btn-delete" onClick={() => handleDelete(eq.id)}>ลบ</Button>
                    </td>
                  )}
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={canDelete?9:canEdit?8:7} style={{ textAlign:'center', padding:40, color:'#94a3b8' }}>
                    ไม่พบข้อมูล
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Drawer */}
      <Drawer anchor="right" open={isDrawerOpen} onClose={closeDrawer}>
        <div style={drawerBody}>
          <Typography style={drawerTitle}>{editMode ? '✏️ แก้ไขรายการ' : '➕ เพิ่มรายการ'}</Typography>
          <TextField label="Details *" name="details" value={formData.details} onChange={handleInputChange}
            fullWidth required multiline rows={3} size="small" />
          <TextField label="Project" name="project" value={formData.project} onChange={handleInputChange}
            fullWidth size="small" />
          <TextField label="วันเริ่ม" name="date_start" type="date" value={formData.date_start}
            onChange={handleInputChange} fullWidth size="small" InputLabelProps={{ shrink:true }} />
          <TextField label="วันสิ้นสุด" name="date_end" type="date" value={formData.date_end}
            onChange={handleInputChange} fullWidth size="small" InputLabelProps={{ shrink:true }} />
          <TextField label="User" name="user" value={formData.user}
            fullWidth size="small" InputProps={{ readOnly:true }} />
          <div style={{ display:'flex', gap:8, marginTop:4 }}>
            <Button variant="contained" onClick={handleSubmit} fullWidth style={actionBtnStyle}>
              {editMode ? 'อัปเดต' : 'บันทึก'}
            </Button>
            <Button variant="outlined" onClick={closeDrawer} fullWidth style={{ textTransform:'none', borderRadius:9 }}>ยกเลิก</Button>
          </div>
        </div>
      </Drawer>

      {/* Find Month/Year Drawer */}
      <Drawer anchor="right" open={isFindDrawerOpen} onClose={() => setIsFindDrawerOpen(false)}>
        <div style={drawerBody}>
          <Typography style={drawerTitle}>🗓 ค้นหาตามเดือน/ปี</Typography>
          <TextField label="เดือน/ปี" type="month" value={findDate} onChange={e => setFindDate(e.target.value)}
            fullWidth size="small" InputLabelProps={{ shrink:true }} />
          <div style={{ display:'flex', gap:8, marginTop:4 }}>
            <Button variant="contained" onClick={handleFindDate} fullWidth style={actionBtnStyle}>ค้นหา</Button>
            <Button variant="outlined" onClick={() => setIsFindDrawerOpen(false)} fullWidth style={{ textTransform:'none', borderRadius:9 }}>ยกเลิก</Button>
          </div>
        </div>
      </Drawer>

      {/* Find Details Drawer */}
      <Drawer anchor="right" open={isFindDetailsDrawerOpen} onClose={() => setIsFindDetailsDrawerOpen(false)}>
        <div style={drawerBody}>
          <Typography style={drawerTitle}>🔍 ค้นหา Details</Typography>
          <TextField label="คำค้นหา" value={findDetails} onChange={e => setFindDetails(e.target.value)}
            fullWidth size="small" InputLabelProps={{ shrink:true }}
            onKeyDown={e => e.key==='Enter' && handleFindDetails()} />
          <div style={{ display:'flex', gap:8, marginTop:4 }}>
            <Button variant="contained" onClick={handleFindDetails} fullWidth style={actionBtnStyle}>ค้นหา</Button>
            <Button variant="outlined" onClick={() => setIsFindDetailsDrawerOpen(false)} fullWidth style={{ textTransform:'none', borderRadius:9 }}>ยกเลิก</Button>
          </div>
        </div>
      </Drawer>

    </div>
  );
};

export default Page;
