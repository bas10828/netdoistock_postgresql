"use client";
import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Box, Button, TextField, Drawer, Dialog, DialogTitle, DialogContent,
  IconButton, Typography, Chip, CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import Image from "next/image";

export const generateKey = () => uuidv4();

const Library = () => {
  const [data, setData] = useState([]);
  const [priority, setPriority] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [newModel, setNewModel] = useState("");
  const [newDeviceType, setNewDeviceType] = useState("");
  const [newDetail, setNewDetail] = useState("");
  const [newImageFile, setNewImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imgTimestamp, setImgTimestamp] = useState(null);

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn");
    if (!loggedIn) { window.location.href = "/"; return; }
    setIsLoggedIn(true);
    const storedPriority = localStorage.getItem("priority");
    if (storedPriority) setPriority(storedPriority);
  }, []);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_API_URL) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mywarehouse/library`, {
      headers: { loggedIn: localStorage.getItem("isLoggedIn") === "true" ? "true" : "false" },
    })
      .then(r => { if (!r.ok) throw new Error("fetch failed"); return r.json(); })
      .then(result => setData(result))
      .catch(err => console.error("Error fetching data:", err));
  }, []);

  const resetForm = () => {
    setNewModel(""); setNewDeviceType(""); setNewDetail("");
    setNewImageFile(null); setImagePreview(null);
    setEditMode(false); setEditId(null); setShowForm(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setNewImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (model, file) => {
    const fd = new FormData();
    fd.append("model", model);
    fd.append("file", file);
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mywarehouse/library/upload`, {
      method: "POST",
      body: fd,
    });
  };

  const handleAdd = async () => {
    setSaving(true);
    try {
      const newEquipment = { id: generateKey(), model: newModel, device_type: newDeviceType, detail: newDetail };
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mywarehouse/library`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          loggedIn: localStorage.getItem("isLoggedIn") === "true" ? "true" : "false",
        },
        body: JSON.stringify(newEquipment),
      });
      const result = await r.json();
      if (newImageFile) await uploadImage(newModel, newImageFile);
      setData(prev => [...prev, result]);
      setImgTimestamp(Date.now());
      resetForm();
    } catch (err) {
      console.error("Error adding data:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (id) => {
    const item = data.find(i => i.id === id);
    if (!item) return;
    setEditId(id);
    setNewModel(item.model);
    setNewDeviceType(item.device_type);
    setNewDetail(item.detail);
    setNewImageFile(null);
    setImagePreview(null);
    setEditMode(true);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!editMode) { handleAdd(); return; }
    setSaving(true);
    try {
      const updated = { id: editId, model: newModel, device_type: newDeviceType, detail: newDetail };
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mywarehouse/library`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          loggedIn: localStorage.getItem("isLoggedIn") === "true" ? "true" : "false",
        },
        body: JSON.stringify(updated),
      });
      const result = await r.json();
      if (newImageFile) await uploadImage(newModel, newImageFile);
      setData(prev => prev.map(item => item.id === editId ? result : item));
      setImgTimestamp(Date.now());
      resetForm();
    } catch (err) {
      console.error("Error updating data:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    if (!window.confirm("ต้องการลบรายการนี้?")) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mywarehouse/library`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        loggedIn: localStorage.getItem("isLoggedIn") === "true" ? "true" : "false",
      },
      body: JSON.stringify({ id }),
    })
      .then(r => { if (!r.ok) throw new Error("delete failed"); return r.json(); })
      .then(() => setData(prev => prev.filter(item => item.id !== id)))
      .catch(err => console.error("Error deleting data:", err));
  };

  const handleImageClick = (imageUrl) => { setSelectedImage(imageUrl); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setSelectedImage(null); };

  const canEdit = priority === "admin" || priority === "user";

  if (!isLoggedIn) return null;

  return (
    <Box sx={{ width: "100%", pt: "80px", px: 2 }}>
      <Typography variant="h4" gutterBottom sx={{
        textAlign: "center", color: "#007acc", padding: "10px",
        backgroundColor: "#e0f7ff", borderRadius: "8px", mb: 2,
      }}>
        คลังอุปกรณ์ (Library)
      </Typography>

      {canEdit && (
        <Box mb={2}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => { resetForm(); setShowForm(true); }}
            sx={{ background: "linear-gradient(135deg, #007acc, #00bfff)", borderRadius: 2 }}
          >
            เพิ่มอุปกรณ์
          </Button>
        </Box>
      )}

      {/* Add/Edit Drawer */}
      <Drawer anchor="right" open={showForm} onClose={resetForm}>
        <Box sx={{ width: 340, p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ color: "#007acc" }}>
            {editMode ? "แก้ไขอุปกรณ์" : "เพิ่มอุปกรณ์ใหม่"}
          </Typography>

          <TextField label="Model" value={newModel} onChange={e => setNewModel(e.target.value)} fullWidth margin="normal" />
          <TextField label="Device Type" value={newDeviceType} onChange={e => setNewDeviceType(e.target.value)} fullWidth margin="normal" />
          <TextField
            label="Detail"
            value={newDetail}
            onChange={e => setNewDetail(e.target.value)}
            fullWidth multiline rows={8} margin="normal"
          />

          {/* Image upload section */}
          <Box sx={{ mt: 2, p: 2, border: "1px dashed #aaa", borderRadius: 2, backgroundColor: "#f9f9f9" }}>
            <Typography variant="body2" color="text.secondary" mb={1} fontWeight="bold">รูปภาพอุปกรณ์</Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
              {/* preview: show selected file preview, or current image if editing */}
              <Box sx={{
                width: 80, height: 80, border: "1px solid #ddd", borderRadius: 2,
                overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
                backgroundColor: "#fff",
              }}>
                {imagePreview ? (
                  <img src={imagePreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                ) : editMode && newModel ? (
                  <Image
                    src={`/devicepic/${newModel}.png`}
                    alt={newModel}
                    width={80} height={80}
                    style={{ objectFit: "contain" }}
                  />
                ) : (
                  <PhotoCameraIcon sx={{ color: "#ccc", fontSize: 36 }} />
                )}
              </Box>
              <Box>
                <Button variant="outlined" component="label" startIcon={<PhotoCameraIcon />} size="small">
                  {imagePreview ? "เปลี่ยนรูป" : "เลือกรูป"}
                  <input type="file" hidden accept="image/*" onChange={handleImageChange} />
                </Button>
                {newImageFile && (
                  <Typography variant="caption" display="block" color="success.main" mt={0.5}>
                    {newImageFile.name}
                  </Typography>
                )}
              </Box>
            </Box>
            <Typography variant="caption" color="text.secondary">
              รูปจะถูกบันทึกเป็น {newModel ? `${newModel}.png` : "{model}.png"}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
            <Button
              variant="contained" onClick={handleSave} sx={{ flex: 1 }}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {editMode ? "อัปเดต" : "บันทึก"}
            </Button>
            <Button variant="outlined" onClick={resetForm} sx={{ flex: 1 }}>ยกเลิก</Button>
          </Box>
        </Box>
      </Drawer>

      {/* Table */}
      <TableContainer component={Paper} sx={{ overflowX: "auto", borderRadius: 2, boxShadow: 3 }}>
        <Table sx={{ minWidth: 700 }}>
          <TableHead>
            <TableRow sx={{ background: "linear-gradient(135deg, #007acc, #00bfff)" }}>
              <TableCell sx={{ color: "#fff", fontWeight: "bold", whiteSpace: "nowrap" }}>ID</TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: "bold", whiteSpace: "nowrap" }}>Model</TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: "bold", whiteSpace: "nowrap" }}>ประเภทอุปกรณ์</TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: "bold", whiteSpace: "nowrap" }}>รูปภาพ</TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: "bold", whiteSpace: "nowrap" }}>รายละเอียด</TableCell>
              {canEdit && (
                <>
                  <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>แก้ไข</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>ลบ</TableCell>
                </>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((equipment, idx) => (
              <TableRow key={equipment.id} sx={{
                backgroundColor: idx % 2 === 0 ? "#f5fbff" : "#e0f7ff",
                "&:hover": { backgroundColor: "#b3e5fc" },
                transition: "background-color 0.2s",
              }}>
                <TableCell sx={{ color: "#888", fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                  {equipment.id}
                </TableCell>
                <TableCell>
                  <Typography fontWeight="bold" color="#007acc" noWrap>{equipment.model}</Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={equipment.device_type || "-"}
                    size="small"
                    sx={{ backgroundColor: "#e0f0ff", color: "#0066aa", fontWeight: "bold" }}
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
                    <Box
                      sx={{
                        cursor: "zoom-in",
                        display: "inline-block",
                        transition: "transform 0.2s",
                        "&:hover": { transform: "scale(1.08)" },
                      }}
                      onClick={() => handleImageClick(`/devicepic/${equipment.model}.png${imgTimestamp ? `?t=${imgTimestamp}` : ""}`)}
                    >
                      <Image
                        src={`${equipment.model ? `/devicepic/${equipment.model}.png` : "/devicepic/default.png"}${imgTimestamp ? `?t=${imgTimestamp}` : ""}`}
                        alt={equipment.model || "device"}
                        width={80} height={80}
                        unoptimized
                        style={{ objectFit: "contain", borderRadius: 4, display: "block" }}
                      />
                    </Box>
                  </Box>
                </TableCell>
                <TableCell sx={{
                  maxWidth: 280,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontSize: "0.85rem",
                  color: "#003366",
                }}>
                  {equipment.detail || ""}
                </TableCell>
                {canEdit && (
                  <>
                    <TableCell>
                      <Button
                        variant="outlined" size="small"
                        onClick={() => handleEdit(equipment.id)}
                        sx={{ borderColor: "#007acc", color: "#007acc", "&:hover": { backgroundColor: "#e0f0ff" } }}
                      >
                        แก้ไข
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button variant="outlined" size="small" color="error" onClick={() => handleDelete(equipment.id)}>
                        ลบ
                      </Button>
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Image zoom modal */}
      <Dialog open={isModalOpen} onClose={closeModal} maxWidth="sm">
        <DialogTitle sx={{ m: 0, p: 1 }}>
          <IconButton onClick={closeModal} sx={{ position: "absolute", right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: "#111", display: "flex", justifyContent: "center", p: 2 }}>
          {selectedImage && (
            <Image
              src={selectedImage}
              alt="Enlarged"
              width={400} height={400}
              style={{ objectFit: "contain", maxWidth: "100%", height: "auto" }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Library;
