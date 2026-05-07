"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import Image from 'next/image';
import styles from './page.module.css';

export default function ShowdetailPage({ params }) {
  const { model } = params;
  const decodedProject = decodeURIComponent(model);
  const [data, setData] = useState([]);
  const [priority, setPriority] = useState('');
  // Fix B: auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // Fix C: replace notFound() in Promise with state flag
  const [notFoundState, setNotFoundState] = useState(false);

  function getData(model) {
    return fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mywarehouse/library/${model}`, {
      headers: {
        'loggedIn': localStorage.getItem('isLoggedIn') === 'true' ? 'true' : 'false'
      }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch data');
        }
        return res.json();
      });
  }

  // Fix B: auth check in first useEffect
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
        console.log(result);
        if (!Array.isArray(result)) {
          result = [result];
        }
        // Fix C: set notFoundState instead of calling notFound()
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

  // Fix B: guard render until auth is confirmed
  if (!isLoggedIn) return null;

  // Fix C: render not-found message instead of calling notFound()
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
    <Box className={styles['fullscreen-container']}>
      {Array.isArray(data) && data.length > 0 ? (
        data.map((equipment) => (
          <Card key={equipment.id} className={styles.card}>
            <Box className={styles.cardImageContainer}>
              <Image
                src={`/devicepic/${equipment.model}.png`}
                alt={equipment.model}
                width={500}
                height={300}
                className={styles.cardImage}
              />
            </Box>
            <CardContent className={styles.cardContent}>
              <Typography className={styles.cardTitle} variant="h5" component="div">
                {equipment.model}
              </Typography>
              <Typography className={styles.cardSubtitle} color="text.secondary">
                {equipment.device_type}
              </Typography>
              <Typography className={styles.cardText} variant="body2">
                {/* Fix A: guard against null detail */}
                {(equipment.detail || '').split('\n').map((line, index) => (
                  <span key={index}>
                    {line}
                    <br />
                  </span>
                ))}
              </Typography>
            </CardContent>
          </Card>
        ))
      ) : (
        <Typography align="center" className={styles.noData}>
          No data available
        </Typography>
      )}
      <Box className={styles.buttonBack}>
        <Link href="/home/warehouse">
          <Button variant="contained" className={styles.buttonContained}>
            Back to Warehouse
          </Button>
        </Link>
      </Box>
    </Box>
  );
}
