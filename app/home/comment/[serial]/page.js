"use client";
import React, { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
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
  Button,
  TextField,
  Slide,
} from '@mui/material';
import moment from 'moment-timezone'; // Import moment-timezone for time zone conversion
import styles from './page.module.css'; // Import your CSS file

function ProjectPage({ params }) {
  const { serial } = params;
  const decodedProject = decodeURIComponent(serial);
  const [data, setData] = useState([]);
  const [priority, setPriority] = useState('');
  const [newComment, setNewComment] = useState('');
  const [updateComment, setUpdateComment] = useState('');
  const [storedUsername, setStoredUsername] = useState('');
  const [editingId, setEditingId] = useState(null); // State to track which comment is being edited
  const [slideOpenUpdate, setSlideOpenUpdate] = useState(false); // State to control Slide bar for Update Comment

  // Fetch priority and username from localStorage on initial render
  useEffect(() => {
    const storedPriority = localStorage.getItem('priority');
    if (storedPriority) setPriority(storedPriority);

    const username = localStorage.getItem('username');
    if (username) setStoredUsername(username);
  }, []);

  // Fetch data based on serial
  useEffect(() => {
    getData(serial);
  }, [serial]);

  const getData = (serial) => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/comment/${serial}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch data');
        console.log(res)
        return res.json();
      })
      .then(data => {
        if (data.length === 0) notFound();
        else setData(data);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  };

  const handleDelete = async (id) => {
    if (window.confirm('ต้องการลบรายการนี้?')) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/comment/delete/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) throw new Error('Failed to delete data');

        setData(data.filter(item => item.id !== id));
      } catch (error) {
        console.error('Error deleting data:', error);
      }
    }
  };

  const handleEditComment = (id) => {
    const commentToEdit = data.find(comment => comment.id === id);
    if (commentToEdit) {
      setUpdateComment(commentToEdit.comment_text);
      setEditingId(id); // Set the id of the comment being edited
      setSlideOpenUpdate(true); // Open Slide bar for Update Comment
    }
  };

  const handleUpdateComment = async () => {
    try {
      const updatedComment = { user: storedUsername, comment_text: updateComment, serial: serial }; // Replace with actual updated data
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/comment/update/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedComment),
      });

      if (!response.ok) throw new Error('Failed to update comment');

      setData(prevData => prevData.map(comment => comment.id === editingId ? updatedComment : comment));
      setEditingId(null); // Reset editing state
      setSlideOpenUpdate(false); // Close Slide bar after successful update
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/comment/postcomment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          serial,
          user: storedUsername,
          comment_text: newComment
        })
      });

      if (!response.ok) throw new Error('Failed to add comment');

      const newCommentData = await response.json();
      setData(prevData => [...prevData, newCommentData]);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const convertToThaiTime = (utcDate) => {
    const thaiTime = moment.utc(utcDate).tz('Asia/Bangkok').format('YYYY-MM-DD HH:mm:ss');
    return thaiTime;
  };

  return (
    <Box sx={{ width: '100%', padding: '100px' }} className={styles['fullscreen-container']}>
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
        Device Serial : {decodedProject}
      </Typography>

      <TableContainer component={Paper} className={styles['table-container']}>
        <Table className={styles.table}>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              {/* <TableCell>Serial</TableCell> */}
              <TableCell>User</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Comment Text</TableCell>
              {priority === 'user' || priority === 'admin' ? (
                <>
                  <TableCell>แก้ไข</TableCell>
                  
                </>
              ) : null}
              {priority === 'admin' ? (
                <>                  
                  <TableCell>ลบ</TableCell>
                </>
              ) : null}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((equipment) => (
              <TableRow key={equipment.id}>
                <TableCell>{equipment.id}</TableCell>
                {/* <TableCell>{equipment.serial}</TableCell> */}
                <TableCell>{equipment.user}</TableCell>
                <TableCell>{convertToThaiTime(equipment.timestamp)}</TableCell>
                <TableCell>{equipment.comment_text}</TableCell>
                {priority === 'user' || priority === 'admin' ? (
                  <>
                    <TableCell>
                      <Button variant="outlined" onClick={() => handleEditComment(equipment.id)}>แก้ไข</Button>
                    </TableCell>                    
                  </>
                ) : null}
                {priority === 'admin' ? (
                  <>
                    <TableCell>
                      <Button variant="outlined" color="error" onClick={() => handleDelete(equipment.id)}>ลบ</Button>
                    </TableCell>
                  </>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Slide direction="left" in={slideOpenUpdate} mountOnEnter unmountOnExit>
        <Box
          className={styles['slide-container']} // เปลี่ยนเป็นใช้ className แทน sx
        >
          <TextField
            label="Update Comment"
            variant="outlined"
            value={updateComment}
            onChange={(e) => setUpdateComment(e.target.value)}
            className={styles['text-field']} // เปลี่ยนเป็นใช้ className แทน sx
          />
          <Button variant="contained" color="primary" onClick={handleUpdateComment} className={styles['button']}>
            Update
          </Button>
          <Button variant="contained" color="secondary" onClick={() => setSlideOpenUpdate(false)} className={styles['button']}>
            Close
          </Button>
        </Box>
      </Slide>
      {priority === 'user' || priority === 'admin' ? (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginTop: '20px',
          padding: '10px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
        }}
      >
        <Typography
          variant="h6"
          gutterBottom
          sx={{
            color: '#007acc',
            marginBottom: '10px',
          }}
        >
          Add New Comment
        </Typography>
        <TextField
          label="New Comment"
          variant="outlined"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className={styles['text-field']} // เปลี่ยนเป็นใช้ className แทน sx
        />
        <Button variant="contained" color="primary" onClick={handleAddComment} className={styles['button']}>
          Add Comment
        </Button>
      </Box>
      ) : null}
    </Box>
  );
}

export default ProjectPage;
