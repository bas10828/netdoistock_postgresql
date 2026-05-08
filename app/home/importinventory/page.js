"use client";
import React, { useState, useEffect } from "react";
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TextField, Button, Grid, Select, MenuItem, FormControl, InputLabel,
  Input, Typography, Chip, Alert,
} from "@mui/material";
import * as XLSX from "xlsx";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import styles from "./page.module.css";

const getToday = () => new Date().toISOString().split("T")[0];

export default function ImportInventoryPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [rows, setRows] = useState([]);
  const [schoolName, setSchoolName] = useState("");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [username, setUsername] = useState("system");

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn');
    if (!loggedIn) { window.location.href = "/"; return; }
    setIsLoggedIn(true);
    setUsername(localStorage.getItem('username') || 'system');
  }, []);

  const [globalFields, setGlobalFields] = useState(() => ({
    proid: "",
    status_stock: "in stock",
    into_stock: getToday(),
    out_stock: getToday(),
    price: "",
    purchase: "",
    project: "",
  }));

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls"].includes(ext)) {
      setError("กรุณาอัปโหลดไฟล์ Excel (.xlsx, .xls) เท่านั้น");
      return;
    }
    setFileName(file.name);
    setError("");
    setSuccessMsg("");

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(new Uint8Array(evt.target.result), { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        // header:1 = raw array per row, defval="" so empty cells are ""
        const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

        // Row 0: "INVENTORY", Row 1: school/place name, Row 2: headers, Row 3: empty, Row 4+: data
        const school = String(raw[1]?.[0] || "");
        setSchoolName(school);

        // Auto-fill project with school name
        setGlobalFields((prev) => ({ ...prev, project: school }));

        const dataRows = raw.slice(4).filter((r) => r[0] !== "" && r[0] !== undefined);
        const mapped = dataRows.map((r) => ({
          no: r[0],
          device_type: r[1] || "",
          brand: r[2] || "",
          model: r[3] || "",
          serial: String(r[4] || ""),
          mac: r[5] || "",
          device_name: r[6] || "",
          ip: r[7] || "",
          location: r[8] || "",
          remark: r[9] || "",
          // DB fields — project defaults to school name, dates default to today
          proid: "",
          status_stock: "in stock",
          into_stock: getToday(),
          out_stock: getToday(),
          price: "",
          purchase: "",
          project: school,
        }));
        setRows(mapped);
      } catch {
        setError("เกิดข้อผิดพลาดในการอ่านไฟล์");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleGlobalChange = (e) => {
    const { name, value } = e.target;
    setGlobalFields((prev) => ({ ...prev, [name]: value }));
  };

  const applyGlobal = () => {
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        proid: globalFields.proid !== "" ? globalFields.proid : r.proid,
        status_stock: globalFields.status_stock,
        into_stock: globalFields.into_stock !== "" ? globalFields.into_stock : r.into_stock,
        out_stock: globalFields.out_stock !== "" ? globalFields.out_stock : r.out_stock,
        price: globalFields.price !== "" ? globalFields.price : r.price,
        purchase: globalFields.purchase !== "" ? globalFields.purchase : r.purchase,
        project: globalFields.project !== "" ? globalFields.project : r.project,
      }))
    );
  };

  const handleRowEdit = (idx, field, value) => {
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const handleDelete = (idx) => {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleRecord = async () => {
    if (rows.length === 0) return;
    const payload = rows.map((r) => ({
      proid: r.proid,
      serial: r.serial,
      mac: r.mac,
      status_stock: r.status_stock || "in stock",
      into_stock: r.into_stock || null,
      out_stock: r.out_stock || null,
      price: r.price !== "" ? Number(r.price) : null,
      brand: r.brand,
      model: r.model,
      project: r.project,
      purchase: r.purchase,
    }));
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        // Post remark as comment for items that have one
        const remarkedRows = rows.filter((r) => r.remark && r.remark.trim() !== "");
        await Promise.allSettled(
          remarkedRows.map((r) =>
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/comment/postcomment`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ serial: r.serial, user: username, comment_text: r.remark }),
            })
          )
        );
        const commentCount = remarkedRows.length;
        setSuccessMsg(`บันทึกข้อมูลสำเร็จ ${rows.length} รายการ${commentCount > 0 ? ` (บันทึก comment ${commentCount} รายการ)` : ""}`);
        setRows([]);
        setFileName("");
        setSchoolName("");
        setGlobalFields({ proid: "", status_stock: "in stock", into_stock: getToday(), out_stock: getToday(), price: "", purchase: "", project: "" });
      } else {
        setError("บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      }
    } catch {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
  };

  const handleClear = () => {
    setRows([]);
    setFileName("");
    setSchoolName("");
    setError("");
    setSuccessMsg("");
    setGlobalFields({ proid: "", status_stock: "in stock", into_stock: getToday(), out_stock: getToday(), price: "", purchase: "", project: "" });
  };

  // Table columns that match every field being sent to DB (so user can verify all values)
  const tableHeaders = [
    "NO.", "Device Type", "Brand", "Model",
    "Serial Number", "MAC Address",
    "Device Name", "IP Address", "Location",
    "ProID", "Status Stock", "Into Stock", "Out Stock", "Price", "Purchase", "Project",
    "Actions",
  ];

  if (!isLoggedIn) return null;

  return (
    <Box sx={{ pt: "80px", px: 3, pb: 4 }}>
      <Typography variant="h5" fontWeight="bold" mb={2}>
        Import Inventory
      </Typography>

      {/* Upload zone */}
      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 3,
          border: "2px dashed #90caf9",
          textAlign: "center",
          backgroundColor: "#f0f7ff",
        }}
      >
        <Button
          variant="contained"
          component="label"
          startIcon={<CloudUploadIcon />}
          sx={{ mb: 1 }}
        >
          เลือกไฟล์ Inventory (.xlsx)
          <Input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFile}
            sx={{ display: "none" }}
          />
        </Button>
        {fileName && (
          <Typography variant="body2" color="text.secondary" mt={1}>
            ไฟล์: <strong>{fileName}</strong>
            {schoolName && (
              <>&nbsp;|&nbsp; สถานที่: <strong>{schoolName}</strong></>
            )}
            {rows.length > 0 && (
              <>&nbsp;|&nbsp;<Chip size="small" label={`${rows.length} รายการ`} color="primary" /></>
            )}
          </Typography>
        )}
        {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
        {successMsg && <Alert severity="success" sx={{ mt: 1 }}>{successMsg}</Alert>}
      </Paper>

      {rows.length > 0 && (
        <>
          {/* Global fields — ต้องครบทุก field ที่จะส่งเข้า DB */}
          <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" mb={1.5}>
              กำหนดค่าสำหรับทุกรายการ
            </Typography>
            <Grid container spacing={2} alignItems="flex-end">
              <Grid item xs={6} sm={4} md={2}>
                <TextField
                  label="ProID"
                  name="proid"
                  value={globalFields.proid}
                  onChange={handleGlobalChange}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status Stock</InputLabel>
                  <Select
                    label="Status Stock"
                    name="status_stock"
                    value={globalFields.status_stock}
                    onChange={handleGlobalChange}
                  >
                    <MenuItem value="in stock">In Stock</MenuItem>
                    <MenuItem value="sold out">Sold Out</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <TextField
                  label="Into Stock"
                  name="into_stock"
                  type="date"
                  value={globalFields.into_stock}
                  onChange={handleGlobalChange}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <TextField
                  label="Out Stock"
                  name="out_stock"
                  type="date"
                  value={globalFields.out_stock}
                  onChange={handleGlobalChange}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <TextField
                  label="Price"
                  name="price"
                  type="number"
                  value={globalFields.price}
                  onChange={handleGlobalChange}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <TextField
                  label="Purchase"
                  name="purchase"
                  value={globalFields.purchase}
                  onChange={handleGlobalChange}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <TextField
                  label="Project"
                  name="project"
                  value={globalFields.project}
                  onChange={handleGlobalChange}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={applyGlobal}
                  fullWidth
                  sx={{ height: 40 }}
                >
                  Apply to All
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Preview table — แสดงครบทุก field ที่ส่งเข้า DB เพื่อตรวจสอบ */}
          <TableContainer component={Paper} elevation={2} className={styles.tableContainer}>
            <Table size="small" className={styles.table}>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#1976d2" }}>
                  {tableHeaders.map((h) => (
                    <TableCell
                      key={h}
                      sx={{ color: "#fff", fontWeight: "bold", whiteSpace: "nowrap", px: 1, py: 1 }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, idx) => (
                  <TableRow
                    key={idx}
                    hover
                    sx={{ "&:nth-of-type(odd)": { backgroundColor: "#fafafa" } }}
                  >
                    {/* Display-only: from Excel */}
                    <TableCell sx={{ px: 1, whiteSpace: "nowrap" }}>{row.no}</TableCell>
                    <TableCell sx={{ px: 1, whiteSpace: "nowrap" }}>{row.device_type}</TableCell>

                    {/* Editable: Brand */}
                    <TableCell sx={{ px: 1 }}>
                      <TextField
                        value={row.brand}
                        onChange={(e) => handleRowEdit(idx, "brand", e.target.value)}
                        size="small" variant="standard" sx={{ minWidth: 80 }}
                      />
                    </TableCell>

                    {/* Editable: Model */}
                    <TableCell sx={{ px: 1 }}>
                      <TextField
                        value={row.model}
                        onChange={(e) => handleRowEdit(idx, "model", e.target.value)}
                        size="small" variant="standard" sx={{ minWidth: 80 }}
                      />
                    </TableCell>

                    {/* Editable: Serial */}
                    <TableCell sx={{ px: 1 }}>
                      <TextField
                        value={row.serial}
                        onChange={(e) => handleRowEdit(idx, "serial", e.target.value)}
                        size="small" variant="standard" sx={{ minWidth: 130 }}
                      />
                    </TableCell>

                    {/* Editable: MAC */}
                    <TableCell sx={{ px: 1 }}>
                      <TextField
                        value={row.mac}
                        onChange={(e) => handleRowEdit(idx, "mac", e.target.value)}
                        size="small" variant="standard" sx={{ minWidth: 145 }}
                      />
                    </TableCell>

                    {/* Display-only: from Excel */}
                    <TableCell sx={{ px: 1, whiteSpace: "nowrap" }}>{row.device_name}</TableCell>
                    <TableCell sx={{ px: 1, whiteSpace: "nowrap" }}>{row.ip}</TableCell>
                    <TableCell
                      sx={{ px: 1, maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                      title={row.location}
                    >
                      {row.location}
                    </TableCell>

                    {/* Editable: ProID */}
                    <TableCell sx={{ px: 1 }}>
                      <TextField
                        value={row.proid}
                        onChange={(e) => handleRowEdit(idx, "proid", e.target.value)}
                        size="small" variant="standard" sx={{ minWidth: 80 }}
                      />
                    </TableCell>

                    {/* Editable: Status Stock */}
                    <TableCell sx={{ px: 1 }}>
                      <Select
                        value={row.status_stock || "in stock"}
                        onChange={(e) => handleRowEdit(idx, "status_stock", e.target.value)}
                        size="small" variant="standard" sx={{ minWidth: 90 }}
                      >
                        <MenuItem value="in stock">In Stock</MenuItem>
                        <MenuItem value="sold out">Sold Out</MenuItem>
                      </Select>
                    </TableCell>

                    {/* Editable: Into Stock */}
                    <TableCell sx={{ px: 1 }}>
                      <TextField
                        value={row.into_stock}
                        type="date"
                        onChange={(e) => handleRowEdit(idx, "into_stock", e.target.value)}
                        size="small" variant="standard"
                        InputLabelProps={{ shrink: true }}
                        sx={{ minWidth: 130 }}
                      />
                    </TableCell>

                    {/* Editable: Out Stock */}
                    <TableCell sx={{ px: 1 }}>
                      <TextField
                        value={row.out_stock}
                        type="date"
                        onChange={(e) => handleRowEdit(idx, "out_stock", e.target.value)}
                        size="small" variant="standard"
                        InputLabelProps={{ shrink: true }}
                        sx={{ minWidth: 130 }}
                      />
                    </TableCell>

                    {/* Editable: Price */}
                    <TableCell sx={{ px: 1 }}>
                      <TextField
                        value={row.price}
                        type="number"
                        onChange={(e) => handleRowEdit(idx, "price", e.target.value)}
                        size="small" variant="standard" sx={{ minWidth: 80 }}
                      />
                    </TableCell>

                    {/* Editable: Purchase */}
                    <TableCell sx={{ px: 1 }}>
                      <TextField
                        value={row.purchase}
                        onChange={(e) => handleRowEdit(idx, "purchase", e.target.value)}
                        size="small" variant="standard" sx={{ minWidth: 100 }}
                      />
                    </TableCell>

                    {/* Editable: Project */}
                    <TableCell sx={{ px: 1 }}>
                      <TextField
                        value={row.project}
                        onChange={(e) => handleRowEdit(idx, "project", e.target.value)}
                        size="small" variant="standard" sx={{ minWidth: 140 }}
                      />
                    </TableCell>

                    {/* Delete */}
                    <TableCell sx={{ px: 1 }}>
                      <Button
                        size="small" color="error" variant="outlined"
                        onClick={() => handleDelete(idx)}
                      >
                        Del
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 2, display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
            <Button
              variant="contained"
              color="success"
              size="large"
              startIcon={<CheckCircleOutlineIcon />}
              onClick={handleRecord}
            >
              บันทึกข้อมูล ({rows.length} รายการ)
            </Button>
            <Button variant="outlined" color="error" size="large" onClick={handleClear}>
              ยกเลิก
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}
