"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  Grid,
  Select,
  MenuItem,
  Input,
  InputLabel,
  FormControl,
  Drawer,
  IconButton,
  Typography,
} from "@mui/material";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import { Menu as MenuIcon, Close as CloseIcon } from "@mui/icons-material";
import styles from './page.module.css';

const CreateByExcel = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [data, setData] = useState([]);
  const [error, setError] = useState("");
  const [formValues, setFormValues] = useState({
    proid: "",
    status_stock: "",
    into_stock: "",
    out_stock: "",
    price: "",
    brand: "",
    model: "",
    purchase: "",
    project: "",
  });

  const [editableData, setEditableData] = useState([]);
  const [openSidebar, setOpenSidebar] = useState(false);
  const [sidebarData, setSidebarData] = useState({
    proid: "",
    brand: "",
    model: "",
  });

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn');
    if (!loggedIn) { window.location.href = "/"; return; }
    setIsLoggedIn(true);
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    // ตรวจสอบส่วนขยายไฟล์
    const validExtensions = ['xlsx', 'xls'];
    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
      setError("Invalid file type. Please upload an Excel file.");
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const filteredData = jsonData.map((row) => ({
          serial: row.Serial || "",
          mac: row.MAC_ || "",
          proid: formValues.proid,
          brand: formValues.brand,
          model: formValues.model,
          purchase: formValues.purchase,
          project: formValues.project,
        }));

        setEditableData(filteredData);
        setError("");
      } catch (error) {
        console.error("Error reading file:", error);
        setError("Error reading file. Please ensure it is a valid Excel file.");
      }
    };

    reader.readAsArrayBuffer(file);
  };


  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormValues({
      ...formValues,
      [name]: value,
    });
  };

  const handleSubmit = () => {
    const updatedData = editableData.map((row) => ({
      ...row,
      status_stock: row.status_stock || "in stock",  // บังคับค่าเริ่มต้นก่อน submit
      ...formValues,
    }));
    console.log("updateData", updatedData)
    setEditableData(updatedData);
  };

  const handleEditChange = (index, event) => {
    const { name, value } = event.target;
    const newData = [...editableData];
    newData[index] = {
      ...newData[index],
      [name]: value,
    };
    setEditableData(newData);
  };

  const handleOpenSidebar = () => {
    setOpenSidebar(true);
  };

  const handleCloseSidebar = () => {
    setOpenSidebar(false);
  };

  const handleSidebarInputChange = (event) => {
    const { name, value } = event.target;
    setSidebarData({
      ...sidebarData,
      [name]: value,
    });
  };

  const fetchDataFromAPI = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/create/get1stforcreate/${sidebarData.proid}`
      );
      const result = await response.json();
      console.log("Result from API:", result);

      if (result && result.length > 0) {
        const data = result[0]; // เข้าถึงออบเจ็กต์ตัวแรกในอาร์เรย์
        setFormValues({
          ...formValues,
          proid: data.proid || "",
          brand: data.brand || "",
          model: data.model || "",
        });
        setSidebarData({
          proid: data.proid || "",
          brand: data.brand || "",
          model: data.model || "",
        });
        console.log("Updated form values:", formValues);
      }
      handleCloseSidebar();
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleRecord = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editableData),
      });

      const result = await response.json();
      if (response.ok) {
        console.log("Data recorded successfully:", result);
        alert("Data recorded successfully!");
        window.location.reload();
      } else {
        console.error("Failed to record data:", result);
        alert("Failed to record data.");
      }
    } catch (error) {
      console.error("Error recording data:", error);
      alert("Error recording data.");
    }
  };

  const handleDelete = (index) => {
    const newData = editableData.filter((_, i) => i !== index);
    setEditableData(newData);
  };

  if (!isLoggedIn) return null;

  return (
    <>
      <Box sx={{ padding: 10 }}>
        <Box sx={{ padding: 5, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Paper
            elevation={3}
            sx={{
              padding: 4,
              textAlign: "center",
              borderStyle: "dashed",
              borderColor: "#cccccc",
              maxWidth: 400,
              width: '100%',
              backgroundColor: '#f9f9f9',
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Button
                variant="contained"
                component="label"
                sx={{
                  marginBottom: 2,
                  padding: 2,
                  backgroundColor: "#007bff",
                  color: "#fff",
                  '&:hover': {
                    backgroundColor: "#0056b3",
                  },
                }}
              >
                Choose File
                <Input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  sx={{
                    display: "none",
                  }}
                />
              </Button>
              <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#555' }}>
                Click to select an Excel file
              </Typography>
              {error && (
                <Typography variant="body2" color="error" sx={{ marginTop: 1 }}>
                  {error}
                </Typography>
              )}
            </Box>
          </Paper>
        </Box>

        <Button
          variant="contained"
          color="primary"
          onClick={handleOpenSidebar}
          sx={{
            marginTop: 2,
            padding: "10px 20px",
            fontSize: "16px",
            backgroundColor: "#007bff",
            "&:hover": {
              backgroundColor: "#0056b3",
            },
          }}
        >
          Seach Product ID
        </Button>


        <Drawer
          anchor="right"
          open={openSidebar}
          onClose={handleCloseSidebar}
          PaperProps={{
            sx: {
              width: 300,
              padding: 3,
              backgroundColor: "#f5f5f5",
              position: "relative",
            },
          }}
        >
          <Box>
            {/* Close button */}
            <IconButton
              onClick={handleCloseSidebar}
              sx={{
                position: "absolute",
                top: 10,
                right: 10,
                color: "#555",
              }}
            >
              <CloseIcon />
            </IconButton>

            {/* TextField for ProID input */}
            <TextField
              label="ProID"
              name="proid"
              value={sidebarData.proid}
              onChange={handleSidebarInputChange}
              fullWidth
              sx={{
                marginBottom: 3,
                backgroundColor: "#ffffff",
                "& .MuiInputBase-root": {
                  fontSize: "14px",
                },
                "& .MuiInputLabel-root": {
                  fontSize: "14px",
                  color: "#777",
                },
              }}
            />

            {/* Button to fetch data */}
            <Button
              variant="contained"
              color="primary"
              onClick={fetchDataFromAPI}
              sx={{
                marginBottom: 2,
                padding: "10px 20px",
                fontSize: "16px",
                backgroundColor: "#007bff",
                "&:hover": {
                  backgroundColor: "#0056b3",
                },
              }}
            >
              Search
            </Button>
          </Box>
        </Drawer>

        <Box sx={{ marginTop: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={3}>
              <TextField
                label="ProID"
                name="proid"
                value={formValues.proid}
                onChange={handleInputChange}
                fullWidth
                sx={{ backgroundColor: "#ffffff", borderRadius: 1 }}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="Brand"
                name="brand"
                value={formValues.brand}
                onChange={handleInputChange}
                fullWidth
                sx={{ backgroundColor: "#ffffff", borderRadius: 1 }}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="Model"
                name="model"
                value={formValues.model}
                onChange={handleInputChange}
                fullWidth
                sx={{ backgroundColor: "#ffffff", borderRadius: 1 }}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="Into Stock"
                name="into_stock"
                type="date"
                value={formValues.into_stock}
                onChange={handleInputChange}
                InputLabelProps={{
                  shrink: true,
                }}
                fullWidth
                sx={{ backgroundColor: "#ffffff", borderRadius: 1 }}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="Out Stock"
                name="out_stock"
                type="date"
                value={formValues.out_stock}
                onChange={handleInputChange}
                InputLabelProps={{
                  shrink: true,
                }}
                fullWidth
                sx={{ backgroundColor: "#ffffff", borderRadius: 1 }}
              />
            </Grid>
            <Grid item xs={3}>
              <FormControl fullWidth sx={{ backgroundColor: "#ffffff", borderRadius: 1 }}>
                <InputLabel>Status Stock</InputLabel>
                <Select
                  name="status_stock"
                  value={formValues.status_stock}
                  onChange={handleInputChange}
                >
                  <MenuItem value="in stock">In Stock</MenuItem>
                  <MenuItem value="sold out">Sold Out</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="Price"
                name="price"
                type="number"
                value={formValues.price}
                onChange={handleInputChange}
                fullWidth
                sx={{ backgroundColor: "#ffffff", borderRadius: 1 }}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="Purchase"
                name="purchase"
                value={formValues.purchase}
                onChange={handleInputChange}
                fullWidth
                sx={{ backgroundColor: "#ffffff", borderRadius: 1 }}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="Project"
                name="project"
                value={formValues.project}
                onChange={handleInputChange}
                fullWidth
                sx={{ backgroundColor: "#ffffff", borderRadius: 1 }}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                sx={{
                  marginTop: 2,
                  padding: "10px 20px",
                  backgroundColor: "#007bff",
                  "&:hover": {
                    backgroundColor: "#0056b3",
                  },
                  borderRadius: 1,
                }}
              >
                Submit
              </Button>
            </Grid>
          </Grid>
        </Box>

      </Box>

      <TableContainer component={Paper} sx={{ marginTop: 2, boxShadow: 3, borderRadius: 2 }} className={styles.tableContainer}>
        <Table sx={{ minWidth: 650 }} className={styles.table}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }} className={styles.tableCell}>Serial</TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }} className={styles.tableCell}>MAC</TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }} className={styles.tableCell}>ProID</TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }} className={styles.tableCell}>Brand</TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }} className={styles.tableCell}>Model</TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }} className={styles.tableCell}>Into Stock</TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }} className={styles.tableCell}>Out Stock</TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }} className={styles.tableCell}>Status Stock</TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }} className={styles.tableCell}>Price</TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }} className={styles.tableCell}>Purchase</TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }} className={styles.tableCell}>Project</TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }} className={styles.tableCell}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {editableData.map((row, index) => (
              <TableRow key={index} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell className={styles.tableCell}>
                  <TextField
                    name="serial"
                    value={row.serial || ""}
                    onChange={(event) => handleEditChange(index, event)}
                    fullWidth
                    className={styles.tableCellInput}
                    variant="outlined"
                    size="small"
                    sx={{ backgroundColor: '#fff', borderRadius: 1 }}
                  />
                </TableCell>
                <TableCell className={styles.tableCell}>
                  <TextField
                    name="mac"
                    value={row.mac || ""}
                    onChange={(event) => handleEditChange(index, event)}
                    fullWidth
                    className={styles.tableCellInput}
                    variant="outlined"
                    size="small"
                    sx={{ backgroundColor: '#fff', borderRadius: 1 }}
                  />
                </TableCell>
                <TableCell className={styles.tableCell}>
                  <TextField
                    name="proid"
                    value={row.proid || ""}
                    onChange={(event) => handleEditChange(index, event)}
                    fullWidth
                    className={styles.tableCellInput}
                    variant="outlined"
                    size="small"
                    sx={{ backgroundColor: '#fff', borderRadius: 1 }}
                  />
                </TableCell>
                <TableCell className={styles.tableCell}>
                  <TextField
                    name="brand"
                    value={row.brand || ""}
                    onChange={(event) => handleEditChange(index, event)}
                    fullWidth
                    className={styles.tableCellInput}
                    variant="outlined"
                    size="small"
                    sx={{ backgroundColor: '#fff', borderRadius: 1 }}
                  />
                </TableCell>
                <TableCell className={styles.tableCell}>
                  <TextField
                    name="model"
                    value={row.model || ""}
                    onChange={(event) => handleEditChange(index, event)}
                    fullWidth
                    className={styles.tableCellInput}
                    variant="outlined"
                    size="small"
                    sx={{ backgroundColor: '#fff', borderRadius: 1 }}
                  />
                </TableCell>
                <TableCell className={styles.tableCell}>
                  <TextField
                    name="into_stock"
                    type="date"
                    value={row.into_stock || ""}
                    onChange={(event) => handleEditChange(index, event)}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    fullWidth
                    variant="outlined"
                    size="small"
                    sx={{ backgroundColor: '#fff', borderRadius: 1 }}
                  />
                </TableCell>
                <TableCell className={styles.tableCell}>
                  <TextField
                    name="out_stock"
                    type="date"
                    value={row.out_stock || ""}
                    onChange={(event) => handleEditChange(index, event)}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    fullWidth
                    variant="outlined"
                    size="small"
                    sx={{ backgroundColor: '#fff', borderRadius: 1 }}
                  />
                </TableCell>
                <TableCell className={styles.tableCell} >
                  <FormControl fullWidth>
                    <Select
                      name="status_stock"
                      value={row.status_stock || "in stock"}  // กำหนดค่าเริ่มต้นที่ปลอดภัย
                      onChange={(event) => handleEditChange(index, event)}
                      displayEmpty
                      inputProps={{ "aria-label": "Without label" }}
                      variant="outlined"
                      size="small"
                      sx={{ backgroundColor: '#fff', borderRadius: 1 }}
                    >
                      <MenuItem value="in stock">In Stock</MenuItem>
                      <MenuItem value="sold out">Sold Out</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>


                <TableCell className={styles.tableCell}>
                  <TextField
                    name="price"
                    type="number"
                    value={row.price || ""}
                    onChange={(event) => handleEditChange(index, event)}
                    fullWidth
                    className={styles.tableCellInput}
                    variant="outlined"
                    size="small"
                    sx={{ backgroundColor: '#fff', borderRadius: 1 }}
                  />
                </TableCell>
                <TableCell className={styles.tableCell}>
                  <TextField
                    name="purchase"
                    value={row.purchase || ""}
                    onChange={(event) => handleEditChange(index, event)}
                    fullWidth
                    className={styles.tableCellInput}
                    variant="outlined"
                    size="small"
                    sx={{ backgroundColor: '#fff', borderRadius: 1 }}
                  />
                </TableCell>
                <TableCell className={styles.tableCell}>
                  <TextField
                    name="project"
                    value={row.project || ""}
                    onChange={(event) => handleEditChange(index, event)}
                    fullWidth
                    className={styles.tableCellInput}
                    variant="outlined"
                    size="small"
                    sx={{ backgroundColor: '#fff', borderRadius: 1 }}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => handleDelete(index)}
                    sx={{ marginLeft: 1, backgroundColor: '#ff4d4d', '&:hover': { backgroundColor: '#ff3333' } }}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Button
        variant="contained"
        color="primary"
        onClick={handleRecord}
        sx={{
          marginTop: 2,
          paddingX: 4,
          paddingY: 1,
          fontSize: '1rem',
          backgroundColor: '#1976d2',
          '&:hover': { backgroundColor: '#115293' },
          borderRadius: 2,
          boxShadow: 3
        }}
      >
        Record
      </Button>
    </>
  );
};

export default CreateByExcel;
