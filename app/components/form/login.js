"use client"
import React, { useEffect, useState } from 'react';
import { Button, Checkbox, FormControlLabel, TextField } from "@mui/material";
import './login.css'; // เรียกใช้ไฟล์ CSS ที่สร้างขึ้น

export function Login() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [error, setError] = useState('');
    const username = React.useRef(null);
    const password = React.useRef(null);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('logout') === '1') {
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('username');
            localStorage.removeItem('email');
            localStorage.removeItem('priority');
            window.history.replaceState({}, '', '/');
            return;
        }
        const loggedIn = localStorage.getItem("isLoggedIn");
        if (loggedIn) {
            setIsLoggedIn(true);
            window.location.href = "/home";
        }
    }, []);

    useEffect(() => {
        if (isLoggedIn) {
            window.location.href = "/home";
        }
    }, [isLoggedIn]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const usernameValue = username.current.value;
        const passwordValue = password.current.value;

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                loginIdentifier: usernameValue,
                password: passwordValue
            })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("username", data.user.username);
            localStorage.setItem("email", data.user.email);
            localStorage.setItem("priority", data.user.priority);
            setIsLoggedIn(true);
        } else {
            const data = await response.json().catch(() => ({}));
            setError(data.message || 'Login failed');
        }
    };

    return (
        <div className="login-wrapper">
            <div className="login-card">
                <div className="login-header">
                    <div className="login-logo">N</div>
                    <p className="login-brand">NETDOI Stock</p>
                    <p className="login-subtitle">ระบบจัดการสินค้าคงคลัง</p>
                </div>
                <div className="login-body">
                    {error && <div className="error-box">⚠️ {error}</div>}
                    <form onSubmit={handleSubmit} className="login-form">
                        <TextField
                            inputRef={username}
                            label="Username หรือ Email"
                            variant="outlined"
                            fullWidth
                            size="medium"
                        />
                        <TextField
                            inputRef={password}
                            label="Password"
                            type={showPassword ? "text" : "password"}
                            variant="outlined"
                            fullWidth
                            size="medium"
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={showPassword}
                                    onChange={() => setShowPassword(!showPassword)}
                                    color="primary"
                                    size="small"
                                />
                            }
                            label="แสดงรหัสผ่าน"
                            className="show-password"
                        />
                        <Button type="submit" variant="contained" fullWidth className="login-button">
                            เข้าสู่ระบบ
                        </Button>
                    </form>
                    <p className="login-footer">NETDOI Technology © 2026</p>
                </div>
            </div>
        </div>
    );
}
