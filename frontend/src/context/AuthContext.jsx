import React, { useState, useEffect, createContext } from 'react';
import axios from 'axios';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifyAuth = async () => {
            const token = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');
            
            if (token && storedUser) {
                try {
                    const userObj = JSON.parse(storedUser);
                    setUser(userObj);
                    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    
                    // Optional: verify token validity with backend
                    try {
                        const res = await axios.get('http://localhost:5000/api/auth/me');
                        setUser(res.data);
                        localStorage.setItem('user', JSON.stringify(res.data));
                    } catch (err) {
                        console.error('Token verification failed:', err.message);
                        if (err.response?.status === 401) {
                            logout();
                        }
                    }
                } catch (e) {
                    console.error('Failed to parse stored user');
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
        };
        verifyAuth();
    }, []);

    const login = async (email, password) => {
        const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
    };

    const register = async (name, email, password, role) => {
        const res = await axios.post('http://localhost:5000/api/auth/register', { name, email, password, role });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
    };

    const googleLogin = async (credential) => {
        const res = await axios.post('http://localhost:5000/api/auth/google', { token: credential });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
    };

    const selectRole = async (role) => {
        const res = await axios.put('http://localhost:5000/api/auth/select-role', { role });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
    };

    const selectDepartment = async (department) => {
        const res = await axios.put('http://localhost:5000/api/auth/profile', { department }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        const updated = { ...stored, department: res.data.department };
        localStorage.setItem('user', JSON.stringify(updated));
        setUser(updated);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
    };

    const updateUser = (data) => {
        const updatedUser = { ...user, ...data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, googleLogin, selectRole, selectDepartment, logout, updateUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
