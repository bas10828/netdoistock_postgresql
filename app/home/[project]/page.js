"use client";
import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Button, Typography, Checkbox, TextField, IconButton, Tooltip, Dialog, DialogContent } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { format } from 'date-fns';
import EditNoteIcon from '@mui/icons-material/EditNote';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import Image from 'next/image';
import * as XLSX from 'xlsx';

const datePickerSx = {
  minWidth: 155,
  '& .MuiInputBase-root': { color: 'white', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 1 },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#475569' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#94a3b8' },
  '& .MuiInputLabel-root': { color: '#94a3b8', fontSize: '0.85rem' },
  '& .MuiInputLabel-root.Mui-focused': { color: 'white' },
  '& .MuiSvgIcon-root': { color: '#94a3b8' },
};

export default function ProjectPage({ params }) {
  const { project } = params;
  const decodedProject = decodeURIComponent(project);
  const [data, setData]         = useState([]);
  const [priority, setPriority] = useState('');
  const [username, setUsername] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // bulk select
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [inDate, setInDate]     = useState(null);
  const [outDate, setOutDate]   = useState(new Date());
  const [bulkComment, setBulkComment] = useState('');

  // image preview
  const [imgModal, setImgModal] = useState('');

  // comments: { [serial]: { id, comment_text } }
  const [comments, setComments] = useState({});
  // inline edit: { serial, id (null if new), text }
  const [editComment, setEditComment] = useState(null);

  const loadComments = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/comment/byproject/${project}`);
      if (!res.ok) return;
      const rows = await res.json();
      const map = {};
      rows.forEach(r => { map[r.serial] = { id: r.id, comment_text: r.comment_text }; });
      setComments(map);
    } catch { /* silent */ }
  }, [project]);

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn');
    if (!loggedIn) { window.location.href = "/"; return; }
    setIsLoggedIn(true);
    setPriority(localStorage.getItem('priority') || '');
    setUsername(localStorage.getItem('username') || '');
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/myproject/${project}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(rows => { setData(rows); })
      .catch(() => {});
    loadComments();
  }, [project, loadComments]);

  // ── Comment inline edit ──────────────────────────────────────
  const startEdit = (serial) => {
    const existing = comments[serial];
    setEditComment({ serial, id: existing?.id ?? null, text: existing?.comment_text ?? '' });
  };

  const cancelEdit = () => setEditComment(null);

  const saveComment = async () => {
    if (!editComment) return;
    const { serial, id, text } = editComment;
    try {
      if (id) {
        // update existing
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/comment/update/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ serial, user: username, comment_text: text }),
        });
      } else {
        // create new
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/comment/postcomment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ serial, user: username, comment_text: text }),
        });
        const created = await res.json();
        setComments(prev => ({ ...prev, [serial]: { id: created.id, comment_text: text } }));
        setEditComment(null);
        return;
      }
      setComments(prev => ({ ...prev, [serial]: { id, comment_text: text } }));
      setEditComment(null);
    } catch { alert('บันทึก comment ไม่สำเร็จ'); }
  };
  // ─────────────────────────────────────────────────────────────

  const handleDelete = async (id) => {
    if (!window.confirm('ต้องการลบรายการนี้?')) return;
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/delete/${id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error();
      setData(d => d.filter(item => item.id !== id));
    } catch { alert('ลบไม่สำเร็จ กรุณาลองใหม่'); }
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, `${decodedProject}.xlsx`);
  };

  // ── Bulk select ──────────────────────────────────────────────
  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const allSelected  = data.length > 0 && selectedIds.size === data.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < data.length;

  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(data.map(d => d.id)));
  };

  const toStr = (d) => d ? format(d, 'yyyy-MM-dd') : null;

  const bulkUpdateStatus = async (status_stock, out_stock) => {
    if (selectedIds.size === 0) return;
    const label = status_stock === 'sold out' ? 'Sold Out' : 'In Stock';
    if (!window.confirm(`เปลี่ยนสถานะ ${selectedIds.size} รายการ เป็น ${label}?`)) return;
    try {
      const inStr  = toStr(inDate);
      const outStr = out_stock;
      const payload = { ids: Array.from(selectedIds), status_stock, out_stock: outStr };
      if (inStr) payload.into_stock = inStr;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bulkstatus`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      setData(prev => prev.map(item =>
        selectedIds.has(item.id)
          ? { ...item, status_stock, out_stock: outStr, ...(inStr && { into_stock: inStr }) }
          : item
      ));
      setSelectedIds(new Set());
    } catch { alert('อัพเดทไม่สำเร็จ กรุณาลองใหม่'); }
  };
  // ─────────────────────────────────────────────────────────────

  const handleBulkComment = async () => {
    if (selectedIds.size === 0 || !bulkComment.trim()) return;
    // get serials of selected equipment ids
    const serials = data.filter(d => selectedIds.has(d.id)).map(d => d.serial);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/comment/bulkcomment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serials, user: username, comment_text: bulkComment.trim() }),
      });
      if (!res.ok) throw new Error();
      // update local comments state
      const text = bulkComment.trim();
      setComments(prev => {
        const next = { ...prev };
        serials.forEach(serial => { next[serial] = { id: prev[serial]?.id ?? null, comment_text: text }; });
        return next;
      });
      setBulkComment('');
      setSelectedIds(new Set());
      // reload to get correct new comment ids
      loadComments();
    } catch { alert('บันทึก comment ไม่สำเร็จ'); }
  };

  if (!isLoggedIn) return null;

  const canEdit = priority === 'user' || priority === 'admin';
  const colSpan = canEdit ? 16 : 13;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className="page-wrapper">

        {/* Project Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
          borderRadius: 16, padding: '20px 28px',
          marginBottom: 16, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
          boxShadow: '0 6px 24px rgba(79,70,229,0.3)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', width: 200, height: 200, background: 'rgba(255,255,255,0.06)', borderRadius: '50%', top: -80, right: -60 }} />
          <div style={{ position: 'relative' }}>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>โครงการ</p>
            <Typography style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', letterSpacing: '-0.3px' }}>
              🏗 {decodedProject}
            </Typography>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', position: 'relative', flexWrap: 'wrap' }}>
            <span style={{ background: 'rgba(255,255,255,0.15)', color: 'white', borderRadius: 999, padding: '5px 14px', fontWeight: 700, fontSize: '0.82rem', border: '1px solid rgba(255,255,255,0.2)' }}>
              {data.length} รายการ
            </span>
            {canEdit && <Button className="btn-export" onClick={handleExportExcel}>⬇ Export Excel</Button>}
            {canEdit && (
              <Link href={`/home/${project}/createproject`}>
                <Button style={{ background: 'rgba(255,255,255,0.18)', color: 'white', border: '1.5px solid rgba(255,255,255,0.4)', borderRadius: 9, textTransform: 'none', fontWeight: 600, padding: '6px 14px', whiteSpace: 'nowrap' }}>
                  + เพิ่มอุปกรณ์
                </Button>
              </Link>
            )}
            {canEdit && (
              <Link href={`/home/${project}/createprojectdynamic`}>
                <Button style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: 9, textTransform: 'none', fontWeight: 600, padding: '6px 14px', whiteSpace: 'nowrap' }}>
                  + เพิ่มแบบ Dynamic
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Bulk Action Bar */}
        {canEdit && selectedIds.size > 0 && (
          <div style={{
            position: 'sticky', top: 64, zIndex: 100,
            background: '#1e293b', borderRadius: 12,
            padding: '10px 20px', marginBottom: 12,
            display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}>
            <span style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap' }}>
              ✓ เลือก {selectedIds.size} รายการ
            </span>
            <DatePicker
              label="วันซื้อ"
              value={inDate}
              onChange={setInDate}
              slotProps={{ textField: { size: 'small', sx: datePickerSx } }}
            />
            <DatePicker
              label="วันขาย"
              value={outDate}
              onChange={setOutDate}
              slotProps={{ textField: { size: 'small', sx: datePickerSx } }}
            />
            <Button
              onClick={() => bulkUpdateStatus('in stock', null)}
              style={{ background: '#22c55e', color: 'white', borderRadius: 8, fontWeight: 700, textTransform: 'none', padding: '6px 20px', whiteSpace: 'nowrap' }}
            >
              📥 In Stock
            </Button>
            <Button
              onClick={() => bulkUpdateStatus('sold out', toStr(outDate))}
              style={{ background: '#f59e0b', color: 'white', borderRadius: 8, fontWeight: 700, textTransform: 'none', padding: '6px 20px', whiteSpace: 'nowrap' }}
            >
              📤 Sold Out
            </Button>
            {/* Divider */}
            <div style={{ width: 1, height: 32, background: '#334155', flexShrink: 0 }} />

            {/* Bulk comment */}
            <TextField
              value={bulkComment}
              onChange={e => setBulkComment(e.target.value)}
              placeholder="Comment สำหรับทุกรายการที่เลือก…"
              size="small"
              sx={{
                minWidth: 260,
                '& .MuiInputBase-root': { color: 'white', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 1, fontSize: '0.85rem' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#475569' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#94a3b8' },
                '& input::placeholder': { color: '#64748b' },
              }}
              onKeyDown={e => { if (e.key === 'Enter') handleBulkComment(); }}
            />
            <Button
              onClick={handleBulkComment}
              disabled={!bulkComment.trim()}
              style={{ background: bulkComment.trim() ? '#6366f1' : '#334155', color: 'white', borderRadius: 8, fontWeight: 700, textTransform: 'none', padding: '6px 20px', whiteSpace: 'nowrap' }}
            >
              💬 บันทึก Comment
            </Button>

            <Button
              onClick={() => { setSelectedIds(new Set()); setBulkComment(''); }}
              style={{ background: 'transparent', color: '#94a3b8', border: '1px solid #475569', borderRadius: 8, textTransform: 'none', padding: '6px 14px' }}
            >
              ยกเลิก
            </Button>
          </div>
        )}

        <div className="table-card">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  {canEdit && (
                    <th style={{ width: 40, textAlign: 'center' }}>
                      <Checkbox
                        size="small"
                        checked={allSelected}
                        indeterminate={someSelected}
                        onChange={toggleSelectAll}
                        sx={{ color: '#94a3b8', '&.Mui-checked': { color: '#6366f1' }, '&.MuiCheckbox-indeterminate': { color: '#6366f1' }, p: 0 }}
                      />
                    </th>
                  )}
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
                  <th style={{ textAlign: 'center' }}>รูป</th>
                  <th>Comment</th>
                  {canEdit && <><th style={{ textAlign: 'center' }}>แก้ไข</th><th style={{ textAlign: 'center' }}>ลบ</th></>}
                </tr>
              </thead>
              <tbody>
                {data.map(eq => {
                  const cm = comments[eq.serial];
                  const isEditing = editComment?.serial === eq.serial;
                  return (
                    <tr key={eq.id} style={selectedIds.has(eq.id) ? { background: '#eff6ff' } : {}}>
                      {canEdit && (
                        <td style={{ textAlign: 'center' }}>
                          <Checkbox
                            size="small"
                            checked={selectedIds.has(eq.id)}
                            onChange={() => toggleSelect(eq.id)}
                            sx={{ color: '#94a3b8', '&.Mui-checked': { color: '#6366f1' }, p: 0 }}
                          />
                        </td>
                      )}
                      <td style={{ fontWeight: 500 }}>{eq.proid}</td>
                      <td>{eq.brand}</td>
                      <td>{eq.model}</td>
                      <td style={{ color: '#64748b' }}>{eq.serial}</td>
                      <td style={{ color: '#64748b' }}>{eq.mac}</td>
                      <td>{eq.price?.toLocaleString()}</td>
                      <td>{eq.purchase}</td>
                      <td>
                        <span className={`badge ${eq.status_stock === 'in stock' ? 'badge-instock' : 'badge-soldout'}`}>
                          {eq.status_stock === 'in stock' ? '● In Stock' : '● Sold Out'}
                        </span>
                      </td>
                      <td style={{ color: '#64748b' }}>{eq.into_stock}</td>
                      <td style={{ color: '#64748b' }}>{eq.out_stock}</td>
                      <td style={{ textAlign: 'center', padding: '8px 12px' }}>
                        <Image
                          src={`/devicepic/${eq.model}.png`}
                          alt={eq.model || 'device'}
                          width={48} height={48}
                          onClick={() => setImgModal(eq.model)}
                          style={{ objectFit: 'contain', borderRadius: 8, background: '#f8fafc', padding: 2, cursor: 'zoom-in', transition: 'transform .15s', }}
                          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
                          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        />
                      </td>

                      {/* Comment cell */}
                      <td style={{ minWidth: 220, maxWidth: 300, padding: '6px 10px' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <TextField
                              value={editComment.text}
                              onChange={e => setEditComment(prev => ({ ...prev, text: e.target.value }))}
                              size="small"
                              multiline
                              maxRows={3}
                              fullWidth
                              autoFocus
                              sx={{ '& .MuiInputBase-root': { fontSize: '0.8rem' } }}
                            />
                            <Tooltip title="บันทึก">
                              <IconButton size="small" color="success" onClick={saveComment}>
                                <CheckIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="ยกเลิก">
                              <IconButton size="small" onClick={cancelEdit}>
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </div>
                        ) : (
                          <div
                            style={{ display: 'flex', alignItems: 'flex-start', gap: 4, cursor: canEdit ? 'pointer' : 'default' }}
                            onClick={() => canEdit && startEdit(eq.serial)}
                          >
                            <span style={{
                              fontSize: '0.8rem', color: cm?.comment_text ? '#1e293b' : '#94a3b8',
                              flex: 1, lineHeight: 1.4,
                              display: '-webkit-box', WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical', overflow: 'hidden',
                            }}>
                              {cm?.comment_text || (canEdit ? 'คลิกเพื่อเพิ่ม comment…' : '—')}
                            </span>
                            {canEdit && (
                              <EditNoteIcon sx={{ fontSize: '1rem', color: '#94a3b8', flexShrink: 0, mt: '2px' }} />
                            )}
                          </div>
                        )}
                      </td>

                      {canEdit && (
                        <>
                          <td style={{ textAlign: 'center' }}>
                            <Link href={`/home/${eq.project}/update/${eq.id}`}>
                              <Button variant="outlined" className="btn-edit">แก้ไข</Button>
                            </Link>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <Button variant="outlined" color="error" className="btn-delete" onClick={() => handleDelete(eq.id)}>ลบ</Button>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={colSpan} style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>
                      <div style={{ fontSize: '2rem', marginBottom: 8 }}>📦</div>
                      <div>ไม่มีอุปกรณ์ในโครงการนี้</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Image preview modal */}
      <Dialog
        open={!!imgModal}
        onClose={() => setImgModal('')}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { background: '#0f172a', borderRadius: 3, p: 1 } }}
      >
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, p: 3 }}>
          <Image
            src={`/devicepic/${imgModal}.png`}
            alt={imgModal}
            width={400} height={400}
            style={{ objectFit: 'contain', borderRadius: 12, background: '#1e293b', padding: 16, width: '100%', height: 'auto' }}
          />
          <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 600, letterSpacing: 1 }}>
            {imgModal}
          </Typography>
          <Button
            onClick={() => setImgModal('')}
            variant="outlined"
            size="small"
            sx={{ color: '#94a3b8', borderColor: '#334155', '&:hover': { borderColor: '#94a3b8' } }}
          >
            ปิด
          </Button>
        </DialogContent>
      </Dialog>
    </LocalizationProvider>
  );
}
