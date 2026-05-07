"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Button
} from '@mui/material';
import * as XLSX from 'xlsx';
import styles from './page.module.css';

function getData(model) {
  return fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mywarehouse/soldout/${model}`)
    .then(res => {
      if (!res.ok) {
        throw new Error('Failed to fetch data');
      }
      return res.json();
    });
}

export default function ProjectPage({ params }) {
  const { model } = params;
  const decodedProject = decodeURIComponent(model);
  const [data, setData] = useState([]);
  const [priority, setPriority] = useState('');
  // Fix A: auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // Fix B: replace notFound() in Promise with state flag
  const [notFoundState, setNotFoundState] = useState(false);

  // Fix A: auth check in first useEffect
  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn');
    if (!loggedIn) { window.location.href = "/"; return; }
    setIsLoggedIn(true);
    const storedPriority = localStorage.getItem('priority');
    if (storedPriority) setPriority(storedPriority);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    getData(model)
      .then(result => {
        // Fix B: set notFoundState instead of calling notFound()
        if (result.length === 0) {
          setNotFoundState(true);
          return;
        }
        setData(result);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  }, [model, isLoggedIn]);

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, `${decodedProject}.xlsx`);
  };

  const handleDelete = async (id) => {
    if (window.confirm('ต้องการลบรายการนี้?')) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/delete/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete data');
        }

        setData(data.filter(item => item.id !== id));
      } catch (error) {
        console.error('Error deleting data:', error);
      }
    }
  };

  // Fix A: guard render until auth is confirmed
  if (!isLoggedIn) return null;

  // Fix B: render not-found message instead of calling notFound()
  if (notFoundState) {
    return (
      <Box sx={{ pt: '80px', px: 2, textAlign: 'center' }}>
        <Typography variant="h5" color="text.secondary">ไม่พบข้อมูลสำหรับ model นี้</Typography>
        <Box mt={2}>
          <Link href="/home/warehouse">
            <Button variant="contained">Back to Warehouse</Button>
          </Link>
        </Box>
      </Box>
    );
  }

  return (
    // Fix C: padding: '100px' -> pt: '80px', px: 2
    <Box sx={{ width: '100%', pt: '80px', px: 2 }} className={styles['fullscreen-container']}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          textAlign: 'center',
          color: '#007acc',
          padding: '10px',
          backgroundColor: '#e0f7ff',
          borderRadius: '8px',
          marginBottom: '20px',
        }}
      >
        Sold Out : {decodedProject}
      </Typography>
      <Box className={styles['button-container']}>
        <Button className={styles.customButton} onClick={handleExportExcel}>
          export excel
        </Button>
      </Box>
      <TableContainer component={Paper} className={styles['table-container']}>
        <Table className={styles.table}>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>รหัสครุภัณฑ์</TableCell>
              <TableCell>brand</TableCell>
              <TableCell>model</TableCell>
              <TableCell>serial</TableCell>
              <TableCell>mac</TableCell>
              <TableCell>ราคา</TableCell>
              <TableCell>ซื้อมาจาก</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>วันซื้อ</TableCell>
              <TableCell>วันขาย</TableCell>
              <TableCell>โครงการ</TableCell>
              {priority === 'user' || priority === 'admin' ? (
                <>
                  <TableCell>แก้ไข</TableCell>
                  <TableCell>ลบ</TableCell>
                </>
              ) : null}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((equipment) => (
              <TableRow key={equipment.id}>
                <TableCell>{equipment.id}</TableCell>
                <TableCell>{equipment.proid}</TableCell>
                <TableCell>{equipment.brand}</TableCell>
                <TableCell>{equipment.model}</TableCell>
                <TableCell>{equipment.serial}</TableCell>
                <TableCell>{equipment.mac}</TableCell>
                <TableCell>{equipment.price}</TableCell>
                <TableCell>{equipment.purchase}</TableCell>
                <TableCell>{equipment.status_stock}</TableCell>
                <TableCell>{equipment.into_stock}</TableCell>
                <TableCell>{equipment.out_stock}</TableCell>
                <TableCell>{equipment.project}</TableCell>
                {priority === 'user' || priority === 'admin' ? (
                  <>
                    <TableCell>
                      <Link href={`/home/warehouse/${equipment.model}/update/${equipment.id}`} passHref>
                        <Button variant="outlined">แก้ไข</Button>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Button variant="outlined" color="error" onClick={() => handleDelete(equipment.id)}>
                        ลบ
                      </Button>
                    </TableCell>
                  </>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
