"use client";
import { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  Drawer,
  IconButton,
  Box,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,

} from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import styles from "./page.module.css";

export default function CreateSerial() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [serial, setSerial] = useState("");
  const [serialList, setSerialList] = useState([]);

  // Add state for additional fields
  const [proid, setProid] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [mac, setMac] = useState("");
  const [status_stock, setStatusStock] = useState("");
  const [into_stock, setIntoStock] = useState("");
  const [out_stock, setOutStock] = useState("");
  const [price, setPrice] = useState("");
  const [purchase, setPurchase] = useState("");
  const [project, setProject] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarData, setSidebarData] = useState({ proid: "" });

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn');
    if (!loggedIn) { window.location.href = "/"; return; }
    setIsLoggedIn(true);
  }, []);

  const toggleDrawer = (open) => () => {
    setDrawerOpen(open);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && serial.trim()) {
      setSerialList([...serialList, { serial }]);
      setSerial(""); // Clear the input field after adding the serial to the list
    }
  };

  const handleSubmit = () => {
    const updatedSerialList = serialList.map((item) => ({
      ...item,
      proid,
      brand,
      model,
      mac,
      status_stock,
      into_stock,
      out_stock,
      price,
      purchase,
      project,
    }));
    setSerialList(updatedSerialList);
  };

  const handleEditCell = (index, field, value) => {
    const updatedSerialList = [...serialList];
    updatedSerialList[index][field] = value;
    setSerialList(updatedSerialList);
  };

  const handleRecord = async () => {
    try {
      // ตรวจสอบข้อมูลที่ต้องการบันทึก
      console.log("Data to be recorded:", serialList);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serialList), // ตรวจสอบว่าใช้ `serialList` หรือข้อมูลอื่นๆ ที่คุณต้องการ
      });

      const result = await response.json();

      if (response.ok) {
        console.log("Data recorded successfully:", result);
        alert("Data recorded successfully!");
        // อาจจะทำการรีเฟรชข้อมูล หรือจัดการ UI แทนการรีโหลดหน้า
        setSerialList([]); // ล้างรายการถ้าต้องการ
      } else {
        console.error("Failed to record data:", result);
        alert("Failed to record data.");
      }
    } catch (error) {
      console.error("Error recording data:", error);
      alert("Error recording data.");
    }
  };

  const handleFetchSidebarData = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/create/get1stforcreate/${sidebarData.proid}`);
      const data = await response.json();
      // console.log("Fetched data:", data[0].proid);

      if (response.ok) {
        setProid(data[0].proid || "");
        setBrand(data[0].brand || "");
        setModel(data[0].model || "");
        setMac(""); // หากไม่ต้องการค่า MAC จาก API, สามารถตั้งเป็นค่าว่าง
        setDrawerOpen(false);
      } else {
        alert("Failed to fetch data.");
      }
    } catch (error) {
      alert("Error fetching data.");
    }
  };

  const handleDeleteRow = (index) => {
    const updatedSerialList = serialList.filter((_, i) => i !== index);
    setSerialList(updatedSerialList);
  };



  if (!isLoggedIn) return null;

  return (
    <div className={styles.headerContainer}>
      <Container maxWidth="100%" className={styles.container}>
        <Typography variant="h4" component="h1" className={styles.headerTitle} gutterBottom>
          Create Serial
        </Typography>

        <Button
          variant="contained"
          className={styles.searchButton}
          onClick={toggleDrawer(true)}
        >
          Search Product ID
        </Button>

        <Drawer
          anchor="right"
          open={drawerOpen}
          onClose={toggleDrawer(false)}
          className={styles.drawer}
        >
          <Box className={styles.drawerBox} role="presentation">
            <Typography variant="h5" component="div" className={styles.drawerTitle}>
              Input Data
            </Typography>
            <Divider className={styles.drawerDivider} />
            <TextField
              label="Proid"
              fullWidth
              value={sidebarData.proid}
              onChange={(e) => setSidebarData({ ...sidebarData, proid: e.target.value })}
              margin="normal"
              InputProps={{
                className: styles.drawerTextField,
              }}
              InputLabelProps={{
                className: styles.drawerInputLabel,
              }}
            />
            <Button
              variant="contained"
              className={styles.drawerButton}
              onClick={handleFetchSidebarData}
            >
              Send
            </Button>
          </Box>
        </Drawer>

        {/* Additional Form Fields */}
        <Grid container spacing={2} className={styles.formContainer}>
          {[
            { label: "Proid", value: proid, setter: setProid },
            { label: "Brand", value: brand, setter: setBrand },
            { label: "Model", value: model, setter: setModel },
            // { label: "MAC", value: mac, setter: setMac },
            { label: "Status Stock", value: status_stock, setter: setStatusStock, select: true },
            { label: "Into Stock", value: into_stock, setter: setIntoStock },
            { label: "Out Stock", value: out_stock, setter: setOutStock },
            { label: "Price", value: price, setter: setPrice, type: "number", inputProps: { min: 0, step: 0.01 } }, // Specify the type and input restrictions here
            { label: "Purchase", value: purchase, setter: setPurchase },
            { label: "Project", value: project, setter: setProject },
          ].map((field, index) => (
            <Grid item xs={1.2} key={index} className={styles.formField}>
              {field.select ? (
                <FormControl fullWidth margin="normal">
                  <InputLabel>{field.label}</InputLabel>
                  <Select
                    value={field.value}
                    onChange={(e) => field.setter(e.target.value)}
                    label={field.label}
                  >
                    <MenuItem value="in stock">In Stock</MenuItem>
                    <MenuItem value="sold out">Sold Out</MenuItem>
                  </Select>
                </FormControl>
              ) : (
                <TextField
                  label={field.label}
                  type={field.type || (field.label.includes("Stock") ? "date" : "text")}
                  fullWidth
                  value={field.value}
                  onChange={(e) => field.setter(e.target.value)}
                  margin="normal"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  inputProps={field.inputProps || {}} // Add inputProps here
                />
              )}
            </Grid>
          ))}
        </Grid>

        <Button
          variant="contained"
          color="primary"
          className={styles.submitButton}
          onClick={handleSubmit}
        >
          Submit
        </Button>

        {/* Original Serial Input */}
        <TextField
          label="Enter Serial"
          fullWidth
          value={serial}
          onChange={(e) => setSerial(e.target.value)}
          onKeyDown={handleKeyPress}
          margin="normal"
        />

        {serialList.length > 0 && (
          <TableContainer component={Paper} className={styles.tableContainer}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Proid</TableCell>
                  <TableCell>Brand</TableCell>
                  <TableCell>Model</TableCell>
                  <TableCell>Serial</TableCell>
                  <TableCell>MAC</TableCell>
                  <TableCell>Status Stock</TableCell>
                  <TableCell>Into Stock</TableCell>
                  <TableCell>Out Stock</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Purchase</TableCell>
                  <TableCell>Project</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {serialList.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className={styles.tableCell}>
                      <TextField
                        value={item.proid || ""}
                        onChange={(e) => handleEditCell(index, "proid", e.target.value)}
                        className={styles.tableCellInput}
                        size="small"
                      />
                    </TableCell>
                    <TableCell className={styles.tableCell}>
                      <TextField
                        value={item.brand || ""}
                        onChange={(e) => handleEditCell(index, "brand", e.target.value)}
                        className={styles.tableCellInput}
                        size="small"
                      />
                    </TableCell>
                    <TableCell className={styles.tableCell}>
                      <TextField
                        value={item.model || ""}
                        onChange={(e) => handleEditCell(index, "model", e.target.value)}
                        className={styles.tableCellInput}
                        size="small"
                      />
                    </TableCell>
                    <TableCell className={styles.tableCell}>
                      <TextField
                        value={item.serial || ""}
                        onChange={(e) => handleEditCell(index, "serial", e.target.value)}
                        className={styles.tableCellInput}
                        size="small"
                      />
                    </TableCell>
                    <TableCell className={styles.tableCell}>
                      <TextField
                        value={item.mac || ""}
                        onChange={(e) => handleEditCell(index, "mac", e.target.value)}
                        className={styles.tableCellInput}
                        size="small"
                      />
                    </TableCell>
                    <TableCell className={styles.tableCell}>
                      <FormControl fullWidth>
                        <Select
                          value={item.status_stock || ""}
                          onChange={(e) => handleEditCell(index, "status_stock", e.target.value)}
                          className={styles.tableCellSelect}
                          size="small"
                        >
                          <MenuItem value="in stock">In Stock</MenuItem>
                          <MenuItem value="sold out">Sold Out</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell className={styles.tableCell}>
                      <TextField
                        type="date"
                        value={item.into_stock || ""}
                        onChange={(e) => handleEditCell(index, "into_stock", e.target.value)}
                        className={styles.tableCellInput}
                        size="small"
                      />
                    </TableCell>
                    <TableCell className={styles.tableCell}>
                      <TextField
                        type="date"
                        value={item.out_stock || ""}
                        onChange={(e) => handleEditCell(index, "out_stock", e.target.value)}
                        className={styles.tableCellInput}
                        size="small"
                      />
                    </TableCell>
                    <TableCell className={styles.tableCell}>
                      <TextField
                        value={item.price || ""}
                        onChange={(e) => handleEditCell(index, "price", e.target.value)}
                        className={styles.tableCellInput}
                        size="small"
                      />
                    </TableCell>
                    <TableCell className={styles.tableCell}>
                      <TextField
                        value={item.purchase || ""}
                        onChange={(e) => handleEditCell(index, "purchase", e.target.value)}
                        className={styles.tableCellInput}
                        size="small"
                      />
                    </TableCell>
                    <TableCell className={styles.tableCell}>
                      <TextField
                        value={item.project || ""}
                        onChange={(e) => handleEditCell(index, "project", e.target.value)}
                        className={styles.tableCellInput}
                        size="small"
                      />
                    </TableCell>
                    <TableCell className={styles.tableCell}>
                      <IconButton
                        color="secondary"
                        onClick={() => handleDeleteRow(index)}
                        className={styles.deleteButton}
                      >
                        <DeleteIcon /> {/* Or you can use a different icon, like a trash bin */}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

          </TableContainer>
        )}

        <Button
          variant="contained"
          color="secondary"
          onClick={handleRecord}
          className={styles.recordButton}
        >
          Record Data
        </Button>
      </Container>
    </div>
  );
}
