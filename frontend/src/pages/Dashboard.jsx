import React, { useContext, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Download, Users, Database, Calendar, Clock, CheckCircle, XCircle, Mail, Edit2, Save, X, Search, ChevronLeft, ChevronRight, TrendingUp, AlertTriangle, LayoutDashboard, User, History, Shield, Zap, Trash2, Camera, GraduationCap, MapPin, Star, CreditCard, UserCheck, Microscope, Activity, RefreshCw } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { QRCodeSVG } from 'qrcode.react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#f97316'];

const Dashboard = () => {
    const { user, updateUser } = useContext(AuthContext);
    const { toast } = useToast();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [stats, setStats] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '', college: user?.college || '', bio: user?.bio || '' });
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const PER_PAGE = 5;
    const [userRatings, setUserRatings] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [dataLoading, setDataLoading] = useState(false);
    const qrRefs = useRef({});
    const [reviewModal, setReviewModal] = useState({ open: false, booking: null, rating: 5, performance: 5, cleanliness: 5, review: '' });

    const fetchData = React.useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token || !user) return;
        setDataLoading(true);

        try {
            const role = user.role?.toLowerCase();
            if (role === 'admin') {
                const [bRes, sRes] = await Promise.all([
                    axios.get('http://localhost:5000/api/bookings', { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get('http://localhost:5000/api/bookings/stats', { headers: { Authorization: `Bearer ${token}` } })
                ]);
                setBookings(Array.isArray(bRes.data) ? bRes.data : []); 
                setStats(sRes.data);
            } else if (role === 'staff' && user.department) {
                const encodedDept = encodeURIComponent(user.department);
                
                try {
                    const bRes = await axios.get(`http://localhost:5000/api/bookings/department/${encodedDept}`, { 
                        headers: { Authorization: `Bearer ${token}` },
                        timeout: 10000
                    });
                    setBookings(bRes.data || []);
                } catch (err) { 
                    console.error('DASHBOARD SYNC ERROR:', err.response?.data || err.message);
                }

                try {
                    const eRes = await axios.get(`http://localhost:5000/api/equipment`, { headers: { Authorization: `Bearer ${token}` } });
                    const assets = Array.isArray(eRes.data) ? eRes.data : [];
                    const deptAssets = assets.filter(e => e.category?.toLowerCase() === user.department?.toLowerCase()).length;
                    setStats(prev => ({ ...prev, deptAssets }));
                } catch (e) { console.error('Equipment Fetch Error:', e); }

                try {
                    const rRes = await axios.get('http://localhost:5000/api/ratings/my-all', { headers: { Authorization: `Bearer ${token}` } });
                    setUserRatings(rRes.data.map(r => r.equipmentId));
                } catch (e) { console.error('Ratings Fetch Error:', e); }

            } else {
                const [bRes, rRes] = await Promise.all([
                    axios.get('http://localhost:5000/api/bookings/my', { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get('http://localhost:5000/api/ratings/my-all', { headers: { Authorization: `Bearer ${token}` } })
                ]);
                setBookings(Array.isArray(bRes.data) ? bRes.data : []);
                setUserRatings(rRes.data.map(r => r.equipmentId));
            }
        } catch (err) {
            console.error('Core Mainframe Sync Error:', err);
            const errorMsg = err.response?.data?.msg || err.response?.data?.message || err.message || 'System synchronization delayed...';
            toast.error(`Sync Error: ${errorMsg}`);
        } finally {
            setDataLoading(false);
        }
    }, [user?.role, user?.department, toast]);

    useEffect(() => { 
        if (user) fetchData(); 
    }, [fetchData, user]);

    // Safety guard — must be after all hooks
    if (!user || dataLoading) return (
        <div style={{ textAlign: 'center', padding: '10rem 4rem', color: 'var(--text-muted)' }}>
            <RefreshCw className="animate-spin mb-4 mx-auto" size={48} />
            <div style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '0.1em' }}>SYNCHRONIZING MAINFRAME...</div>
            <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.6 }}>Establishing secure link with Departmental Protocol</div>
        </div>
    );

    const navItems = [
        { id: 'overview', label: user.role?.toLowerCase() === 'staff' ? `${user.department || 'Dept'} Intelligence` : 'Command Overview', icon: <LayoutDashboard size={18} /> },
        { id: 'attendance', label: user.role?.toLowerCase() === 'staff' ? `${user.department || 'Dept'} Attendance` : null, icon: <UserCheck size={18} /> },
        { id: 'history', label: user.role?.toLowerCase() === 'staff' ? `${user.department || 'Dept'} Personnel Logs` : 'History Log', icon: <History size={18} /> },
        ...(user.role?.toLowerCase() === 'student' ? [{ id: 'payments', label: 'Financial Records', icon: <CreditCard size={18} /> }] : []),
        { id: 'profile', label: 'Personnel Profile', icon: <User size={18} /> },
    ];

    const handleCancel = async (id) => {
        try {
            await axios.put(`http://localhost:5000/api/bookings/${id}/cancel`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            toast.success('Booking cancelled successfully');
            fetchData();
        } catch { toast.error('Failed to cancel booking'); }
    };

    const handleAttendance = async (id) => {
        try {
            await axios.put(`http://localhost:5000/api/bookings/${id}/attend`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            toast.success('Attendance recorded successfully');
            fetchData();
        } catch { toast.error('Failed to record attendance'); }
    };

    const handleReportIssue = async (id) => {
        toast.info('Issue reported. Technicians have been notified.');
        // Optional backend implementation
    };



    const handleProfileSave = async () => {
        try {
            const res = await axios.put('http://localhost:5000/api/auth/profile', profileForm, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            updateUser(res.data);
            toast.success('Profile synchronized successfully!');
            setEditMode(false);
        } catch { toast.error('Failed to update profile'); }
    };

    const getValidity = (d) => {
        if (d === 1) return 2;
        if (d === 2) return 4;
        if (d === 4) return 6;
        if (d === 6) return 7;
        return d + 1;
    };

    const downloadReceipt = (b) => {
        const doc = new jsPDF();
        const qrValidity = getValidity(b.duration || 1);
        
        doc.setFontSize(18);
        doc.text('LABORATORY ACCESS PROTOCOL', 20, 20);
        doc.setFontSize(10);
        doc.text(`Transaction Reference: TXN_${b._id.slice(-6).toUpperCase()}`, 20, 30);
        doc.line(20, 35, 190, 35);
        
        doc.setFontSize(11);
        const rows = [
            ['Personnel', JSON.parse(localStorage.getItem('user')||'{}').name || 'N/A'],
            ['Asset Name', b.equipmentId?.name || 'N/A'],
            ['Time Window', `${b.startTime} - ${b.endTime}`],
            ['Scheduled Date', b.date],
            ['Amount', `Rs. ${b.amount}`],
            ['Purpose', b.purpose || 'N/A'],
            ['Booked On', new Date(b.createdAt).toLocaleDateString('en-IN')],
        ];
        rows.forEach(([k, v], i) => { doc.text(`${k}:`, 20, 52 + i * 9); doc.text(String(v), 80, 52 + i * 9); });
        const lastRowY = 50 + rows.length * 9;
        doc.line(20, lastRowY, 190, lastRowY);

        doc.setFontSize(10);
        doc.setTextColor(239, 68, 68);
        doc.text(`* AUTHENTICATION TOKEN VALID FOR ${qrValidity} HOURS FROM START TIME`, 20, lastRowY + 10);
        doc.setTextColor(0, 0, 0);

        if (b.paymentMethod === 'cash' && b.paymentStatus !== 'paid') {
            doc.setTextColor(239, 68, 68);
            doc.setFontSize(10);
            doc.text('PAYMENT PENDING: Please settle the amount at the Lab Counter.', 20, lastRowY + 20);
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(9);
            doc.text('Thank you for using Lab Smart Portal', 20, lastRowY + 30);
        } else {
            doc.setFontSize(9);
            doc.text('Thank you for using Lab Smart Portal', 20, lastRowY + 20);
        }
        
        // Grab QR code from DOM if it exists
        const qrContainer = qrRefs.current[b._id];
        if (qrContainer) {
            const svgElement = qrContainer.querySelector('svg');
            const svgData = new XMLSerializer().serializeToString(svgElement);
            const canvas = document.createElement("canvas");
            canvas.width = 200;
            canvas.height = 200;
            const ctx = canvas.getContext("2d");
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0, 200, 200);
                const pngFile = canvas.toDataURL("image/png");
                doc.addImage(pngFile, 'PNG', 140, 50, 40, 40);
                doc.text('Scan to Check-in', 142, 95);
                doc.save(`receipt_${b._id?.slice(-6)}.pdf`);
                toast.success('Receipt downloaded!');
            };
            img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
        } else {
            doc.save(`receipt_${b._id?.slice(-6)}.pdf`);
            toast.success('Receipt downloaded!');
        }
    };

    const now = new Date();
    const upcoming = bookings.filter(b => new Date(`${b.date}T${b.endTime}`) >= now && b.status === 'booked');
    const allFiltered = bookings.filter(b => {
        const q = search.toLowerCase();
        const matchQ = !q || (b.equipmentId?.name || '').toLowerCase().includes(q) || (b.userId?.name || '').toLowerCase().includes(q) || b.date.includes(q);
        const matchS = statusFilter === 'all' || b.status === statusFilter;
        return matchQ && matchS;
    });
    const totalPages = Math.ceil(allFiltered.length / PER_PAGE);
    const paged = allFiltered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const initials = (user.name || 'User').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
    const joinDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';
    const totalSpent = bookings.filter(b => b.paymentStatus === 'paid').reduce((s, b) => s + (b.amount || 0), 0);
    const cancelledCount = bookings.filter(b => b.status === 'cancelled').length;
    const roleColor = { Admin: '#ef4444', Staff: '#8b5cf6', Student: '#3b82f6' }[user.role] || '#3b82f6';



    const handleReviewSubmit = async () => {
        try {
            await axios.post('http://localhost:5000/api/ratings', {
                equipmentId: reviewModal.booking.equipmentId?._id,
                rating: reviewModal.rating,
                performance: reviewModal.performance,
                cleanliness: reviewModal.cleanliness,
                review: reviewModal.review
            }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            toast.success('Mission feedback submitted!');
            setUserRatings(prev => [...new Set([...prev, reviewModal.booking.equipmentId?._id])]);
            setReviewModal({ open: false, booking: null, rating: 5, performance: 5, cleanliness: 5, review: '' });
        } catch { toast.error('Failed to submit feedback'); }
    };

    const roleLower = user?.role?.toLowerCase() || 'student';

    return (
        <div className={`container py-8 role-theme-${roleLower}`} style={{ maxWidth: '1280px' }}>
            <header className="mb-10 flex justify-between items-end">
                <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '0.5rem' }}>
                        {user.role?.toLowerCase() === 'staff' ? 'Staff Command Suite' : 'Personal Progress Terminal'}
                    </div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                        {user.role?.toLowerCase() === 'staff' ? 'Staff Portal' : 'Student Terminal'}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></div>
                        <span style={{ color: '#10b981' }}>Mainframe Link: Established (Port 5000)</span>
                    </div>
                </div>
                <div className="flex gap-3">
                    {user.role?.toLowerCase() === 'student' && (
                        <button 
                            onClick={() => navigate('/equipment')} 
                            className="btn btn-primary" 
                            style={{ 
                                fontWeight: 900, 
                                fontSize: '0.75rem', 
                                padding: '0 1.5rem', 
                                height: '42px',
                                minWidth: '160px',
                                borderRadius: '4px',
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 15px rgba(59,130,246,0.3)'
                            }}
                        >
                            + New Mission
                        </button>
                    )}
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2.5rem', alignItems: 'start' }}>
                
                {/* Left Side: Tactical Sidebar Navigation */}
                <div className="flex flex-col gap-6">
                    {/* Navigation Menu */}
                    <div className="card" style={{ padding: '0.75rem' }}>
                        <div className="flex flex-col gap-1">
                            {navItems.filter(item => item.label !== null).map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className="protocol-btn w-full"
                                    style={{ 
                                        justifyContent: 'flex-start', 
                                        background: activeTab === item.id ? 'rgba(59,130,246,0.1)' : 'transparent',
                                        borderColor: activeTab === item.id ? 'var(--primary)' : 'transparent',
                                        color: activeTab === item.id ? '#fff' : 'var(--text-muted)',
                                        padding: '0.875rem 1.25rem'
                                    }}
                                >
                                    {item.icon} <span style={{ marginLeft: '8px' }}>{item.label}</span>
                                </button>
                            ))}
                            <div style={{ margin: '0.5rem 0', borderTop: '1px solid var(--border-color)', opacity: 0.5 }}></div>
                            <button onClick={() => navigate('/equipment')} className="protocol-btn w-full" style={{ justifyContent: 'flex-start', background: 'transparent', borderColor: 'transparent', color: 'var(--text-muted)' }}>
                                <Database size={18} /> <span style={{ marginLeft: '8px' }}>{user.role?.toLowerCase() === 'staff' ? `${user.department || 'Dept'} Asset Registry` : 'Equipment Registry'}</span>
                            </button>
                            {user.role?.toLowerCase() === 'staff' && (
                                <button onClick={() => navigate('/approvals')} className="protocol-btn w-full" style={{ justifyContent: 'flex-start', background: 'transparent', borderColor: 'transparent', color: 'var(--primary)', fontWeight: 700 }}>
                                    <Shield size={18} /> <span style={{ marginLeft: '8px' }}>{user.department || 'Dept'} Approvals</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Compact Profile Card (Sidebar Version) */}
                    <div 
                        className="card profile-sidebar-nav" 
                        onClick={() => setActiveTab('profile')}
                        style={{ 
                            padding: '1.25rem', 
                            background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)', 
                            border: '1px solid rgba(59,130,246,0.1)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <div className="flex items-center gap-4">
                            <div className="profile-avatar" style={{ width: '48px', height: '48px', margin: 0, fontSize: '1rem' }}>{initials}</div>
                            <div style={{ overflow: 'hidden' }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Personnel Status: Active</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Dynamic Content Display Area */}
                <div className="flex flex-col gap-8">
                    
                    {/* View 1: Command Overview (Stats & Charts) */}
                    {activeTab === 'overview' && (
                        <div className="animate-in">
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
                                {user.role?.toLowerCase() === 'admin' && stats ? (<>
                                    <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}><Users size={22} /></div><div><div className="stat-label">Total Users</div><div className="stat-value">{stats.totalUsers}</div></div></div>
                                    <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}><Database size={22} /></div><div><div className="stat-label">Equipment</div><div className="stat-value">{stats.totalEquipment}</div></div></div>
                                    <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}><Calendar size={22} /></div><div><div className="stat-label">Active Bookings</div><div className="stat-value">{stats.activeBookings}</div></div></div>
                                    <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}><TrendingUp size={22} /></div><div><div className="stat-label">Total Revenue</div><div className="stat-value" style={{ fontSize: '1.4rem' }}>₹{stats.totalRevenue || 0}</div></div></div>
                                </>) : user.role?.toLowerCase() === 'staff' ? (<>
                                    <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}><Users size={22} /></div><div><div className="stat-label">Laboratory Assets</div><div className="stat-value">{stats?.deptAssets || 0}</div></div></div>
                                    <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}><UserCheck size={22} /></div><div><div className="stat-label">Live Presence</div><div className="stat-value">{bookings.filter(b => b.attended).length}</div></div></div>
                                    <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}><Shield size={22} /></div><div><div className="stat-label">Pending Approvals</div><div className="stat-value">{bookings.filter(b => b.status === 'pending').length}</div></div></div>
                                    <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}><History size={22} /></div><div><div className="stat-label">Total Dept. Usage</div><div className="stat-value">{bookings.length}</div></div></div>
                                </>) : (<>
                                    <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}><Calendar size={22} /></div><div><div className="stat-label">Total Bookings</div><div className="stat-value">{bookings.length}</div></div></div>
                                    <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}><CheckCircle size={22} /></div><div><div className="stat-label">Upcoming Slots</div><div className="stat-value">{upcoming.length}</div></div></div>
                                    <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}><Zap size={22} /></div><div><div className="stat-label">Active Protocols</div><div className="stat-value">{upcoming.length}</div></div></div>
                                    <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}><Clock size={22} /></div><div><div className="stat-label">Total Spent</div><div className="stat-value" style={{ fontSize: '1.4rem' }}>₹{totalSpent}</div></div></div>
                                </>)}
                            </div>


                        </div>
                    )}

                    {activeTab === 'profile' && user.role?.toLowerCase() === 'student' && (
                        <div className="animate-in">
                            <div className="mb-8">
                                <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem' }}>Student Profile</h2>
                                <p className="text-muted">Manage your academic identity and personal details.</p>
                            </div>
                            <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
                                {/* Left: Avatar Card */}
                                <div style={{ width: '280px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div className="card" style={{ padding: 0, overflow: 'hidden', textAlign: 'center' }}>
                                        <div style={{ height: '100px', background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)' }}></div>
                                        <div style={{ marginTop: '-50px', padding: '0 1.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <div className="profile-avatar" style={{ width: '90px', height: '90px', fontSize: '2.2rem', border: '4px solid var(--card-bg)', background: '#334155', margin: 0 }}>{initials}</div>
                                            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '1rem' }}>{user.name}</h3>
                                            <div style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', padding: '0.25rem 0.75rem', borderRadius: '2rem', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.5rem' }}>STUDENT</div>
                                            <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.email}</div>
                                        </div>
                                    </div>
                                    {/* Quick Stats */}
                                    <div className="card" style={{ padding: '1.5rem' }}>
                                        <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '1rem' }}>Academic Stats</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Bookings</span>
                                                <span style={{ fontWeight: 800, color: '#60a5fa' }}>{bookings.length}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Upcoming</span>
                                                <span style={{ fontWeight: 800, color: '#34d399' }}>{upcoming.length}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Department</span>
                                                <span style={{ fontWeight: 800, color: '#fbbf24' }}>{user.department || '—'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Edit Form */}
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div className="card" style={{ padding: '2rem' }}>
                                        <div className="flex justify-between items-center mb-8">
                                            <div className="flex items-center gap-3">
                                                <div style={{ color: 'var(--primary)' }}><User size={20} /></div>
                                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Personal Information</h3>
                                            </div>
                                            <button onClick={() => setEditMode(!editMode)} className="btn btn-outline btn-sm flex items-center gap-2">
                                                <Edit2 size={14} /> {editMode ? 'Cancel' : 'Edit'}
                                            </button>
                                        </div>
                                        {editMode ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                                <div className="form-group"><label>Full Name</label><input className="form-control" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} /></div>
                                                <div className="form-group"><label>College / University</label><input className="form-control" value={profileForm.college || ''} onChange={e => setProfileForm({ ...profileForm, college: e.target.value })} placeholder="e.g. IIT Hyderabad" /></div>
                                                <div className="form-group">
                                                    <label>Department</label>
                                                    <select className="form-control" value={profileForm.department || ''} onChange={e => setProfileForm({ ...profileForm, department: e.target.value })}>
                                                        <option value="">Select Department</option>
                                                        {['Electronics', 'Mechanical', 'Chemical', 'Computing', 'Optics', 'Biology'].map(cat => (
                                                            <option key={cat} value={cat}>{cat}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="form-group"><label>Phone</label><input className="form-control" value={profileForm.phone || ''} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="+91 00000 00000" /></div>
                                                <div className="flex gap-3 mt-2">
                                                    <button onClick={handleProfileSave} className="btn btn-primary flex-1"><Save size={14} /> Save Changes</button>
                                                    <button onClick={() => setEditMode(false)} className="btn btn-outline flex-1">Cancel</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                                                {[
                                                    { label: 'Full Name', value: user.name },
                                                    { label: 'Email Address', value: user.email },
                                                    { label: 'College / University', value: user.college || 'Not set' },
                                                    { label: 'Department', value: user.department || 'Not assigned' },
                                                    { label: 'Phone', value: user.phone || 'Not set' },
                                                    { label: 'Account Role', value: 'Student' },
                                                ].map(field => (
                                                    <div key={field.label}>
                                                        <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.4rem', letterSpacing: '0.1em' }}>{field.label}</div>
                                                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{field.value}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'profile' && user.role?.toLowerCase() === 'staff' && (
                        <div className="animate-in">
                            <div className="mb-8">
                                <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem' }}>Staff Profile</h2>
                                <p className="text-muted">Your administrative identity and departmental jurisdiction.</p>
                            </div>
                            <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
                                {/* Left: Authority Card */}
                                <div style={{ width: '280px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div className="card" style={{ padding: 0, overflow: 'hidden', textAlign: 'center' }}>
                                        <div style={{ height: '100px', background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' }}></div>
                                        <div style={{ marginTop: '-50px', padding: '0 1.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <div className="profile-avatar" style={{ width: '90px', height: '90px', fontSize: '2.2rem', border: '4px solid var(--card-bg)', background: '#4c1d95', margin: 0 }}>{initials}</div>
                                            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '1rem' }}>{user.name}</h3>
                                            <div style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa', padding: '0.25rem 0.75rem', borderRadius: '2rem', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.5rem' }}>STAFF AUTHORITY</div>
                                            <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.email}</div>
                                        </div>
                                    </div>
                                    {/* Jurisdiction Card */}
                                    <div className="card" style={{ padding: '1.5rem', border: '1px solid rgba(139,92,246,0.2)' }}>
                                        <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: '#a78bfa', letterSpacing: '0.12em', marginBottom: '1rem' }}>Jurisdiction</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Department</span>
                                                <span style={{ fontWeight: 800, color: '#a78bfa' }}>{user.department || '—'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Overseen Labs</span>
                                                <span style={{ fontWeight: 800, color: '#34d399' }}>{bookings.length > 0 ? [...new Set(bookings.map(b => b.equipmentId?.name).filter(Boolean))].length : 0}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Active Sessions</span>
                                                <span style={{ fontWeight: 800, color: '#fbbf24' }}>{bookings.filter(b => b.attended).length}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Info Panel */}
                                <div style={{ flex: 1 }}>
                                    <div className="card" style={{ padding: '2rem' }}>
                                        <div className="flex items-center gap-3 mb-8">
                                            <div style={{ color: '#a78bfa' }}><Shield size={20} /></div>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Authority Record</h3>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                                            {[
                                                { label: 'Full Name', value: user.name },
                                                { label: 'Email Address', value: user.email },
                                                { label: 'Assigned Department', value: user.department || 'Not assigned' },
                                                { label: 'Authorization Level', value: 'Staff' },
                                                { label: 'Phone', value: user.phone || 'Not set' },
                                                { label: 'Status', value: 'Active' },
                                            ].map(field => (
                                                <div key={field.label}>
                                                    <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.4rem', letterSpacing: '0.1em' }}>{field.label}</div>
                                                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{field.value}</div>
                                                </div>
                                            ))}
                                        </div>
                                        <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(139,92,246,0.08)', borderRadius: '0.75rem', border: '1px solid rgba(139,92,246,0.15)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            <Shield size={14} style={{ display: 'inline', marginRight: '6px', color: '#a78bfa' }} />
                                            Staff profiles are managed by the system administrator. Contact Admin to update department or authority level.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}


                    {/* View: Financial Records (Payments) */}
                    {activeTab === 'payments' && (
                        <div className="animate-in">
                            <div className="card">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Financial Audit Trail</h3>
                                    <div style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--primary)', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 700 }}>
                                        Total Cumulative Expenditure: ₹{totalSpent}
                                    </div>
                                </div>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ borderCollapse: 'separate', borderSpacing: '0 0.5rem', width: '100%' }}>
                                        <thead>
                                            <tr style={{ background: 'transparent' }}>
                                                <th style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', padding: '1rem', textAlign: 'left' }}>Txn ID</th>
                                                <th style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', padding: '1rem', textAlign: 'left' }}>Asset</th>
                                                <th style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', padding: '1rem', textAlign: 'left' }}>Amount</th>
                                                <th style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', padding: '1rem', textAlign: 'left' }}>Method</th>
                                                <th style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', padding: '1rem', textAlign: 'left' }}>Payment Status</th>
                                                <th style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', padding: '1rem', textAlign: 'left' }}>Timestamp</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {bookings.length === 0 ? (
                                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '4rem' }}><p className="text-muted">No financial records found.</p></td></tr>
                                            ) : bookings.map(b => (
                                                <tr key={b._id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)' }}>
                                                    <td style={{ padding: '1.25rem', fontFamily: 'monospace', fontWeight: 800, color: 'var(--primary)' }}>TXN_{b._id.slice(-6).toUpperCase()}</td>
                                                    <td style={{ padding: '1.25rem', fontWeight: 600 }}>{b.equipmentId?.name || 'Asset Deleted'}</td>
                                                    <td style={{ padding: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>₹{b.amount}</td>
                                                    <td style={{ padding: '1.25rem' }}>
                                                        <div className="flex items-center gap-2" style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700 }}>
                                                            {b.paymentMethod === 'cash' ? 'Lab Counter' : (b.paymentMethod?.toUpperCase() || 'UNKNOWN')}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '1.25rem' }}>
                                                        <span className={`badge ${b.paymentStatus === 'paid' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.65rem' }}>
                                                            {b.paymentStatus === 'paid' ? 'SUCCESS' : 'PENDING'}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '1.25rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(b.createdAt).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'attendance' && user.role?.toLowerCase() === 'staff' && (
                        <div className="animate-in">
                            <div className="card">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                        {user.department || 'Department'} Daily Attendance Manifest
                                    </h3>
                                    <div className="flex items-center gap-2" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '0.4rem 1rem', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: 800 }}>
                                        <Activity size={14} className="animate-pulse" /> LIVE TRACKING ACTIVE
                                    </div>
                                </div>
                                
                                <div className="table-responsive">
                                    <table className="w-full">
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <th style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', padding: '1rem' }}>Researcher</th>
                                                <th style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', padding: '1rem' }}>Assigned Asset</th>
                                                <th style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', padding: '1rem' }}>Session Window</th>
                                                <th style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', padding: '1rem' }}>Verification</th>
                                                <th style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', padding: '1rem' }}>Timestamp</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {bookings.filter(b => b.date === format(now, 'yyyy-MM-dd')).length === 0 ? (
                                                <tr>
                                                    <td colSpan="5" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                                                        <div className="flex flex-col items-center gap-4">
                                                            <UserCheck size={48} opacity={0.2} />
                                                            <p style={{ fontStyle: 'italic' }}>No research sessions scheduled for today in this sector.</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                bookings.filter(b => b.date === format(now, 'yyyy-MM-dd')).map(b => (
                                                    <tr key={b._id} style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                        <td style={{ padding: '1.25rem' }}>
                                                            <div className="flex items-center gap-3">
                                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem' }}>
                                                                    {b.userId?.name?.charAt(0) || 'R'}
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{b.userId?.name || 'Anonymous Researcher'}</div>
                                                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{b.userId?.college || 'No Institutional ID'}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '1.25rem' }}>
                                                            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{b.equipmentId?.name || 'Asset Retired'}</div>
                                                        </td>
                                                        <td style={{ padding: '1.25rem' }}>
                                                            <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{b.startTime} - {b.endTime}</div>
                                                        </td>
                                                        <td style={{ padding: '1.25rem' }}>
                                                            {b.attended ? (
                                                                <span style={{ color: '#10b981', fontSize: '0.65rem', fontWeight: 900, background: 'rgba(16,185,129,0.1)', padding: '0.3rem 0.6rem', borderRadius: '4px', border: '1px solid rgba(16,185,129,0.2)' }}>PRESENT</span>
                                                            ) : (
                                                                <span style={{ color: '#ef4444', fontSize: '0.65rem', fontWeight: 900, background: 'rgba(239,68,68,0.1)', padding: '0.3rem 0.6rem', borderRadius: '4px', border: '1px solid rgba(239,68,68,0.2)' }}>ABSENT</span>
                                                            )}
                                                        </td>
                                                        <td style={{ padding: '1.25rem' }}>
                                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                                                {b.attendanceTime ? format(new Date(b.attendanceTime), 'hh:mm a') : '---'}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* View 3: Mission History (Logs & Actions) */}
                    {activeTab === 'history' && (
                        <div className="animate-in">
                            <div className="card">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                        {user.role?.toLowerCase() === 'staff' ? `${user.department || 'Dept'} Research Enrollment` : 'Laboratory Session Logs'}
                                    </h3>
                                    <div className="flex gap-2">
                                        <div className="flex items-center gap-2" style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', padding: '0 0.75rem' }}>
                                            <Search size={14} color="var(--text-muted)" />
                                            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Filter logs..." style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-main)', padding: '0.5rem 0', fontSize: '0.85rem' }} />
                                        </div>
                                    </div>
                                </div>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
                                        <thead>
                                            <tr style={{ background: 'transparent' }}>
                                                <th style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', padding: '1rem' }}>Entry ID</th>
                                                {user.role?.toLowerCase() === 'staff' && <th style={{ fontSize: '0.65rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.15em', padding: '1rem' }}>Researcher</th>}
                                                <th style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', padding: '1rem' }}>Asset Designation</th>
                                                <th style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', padding: '1rem' }}>Operational Window</th>
                                                <th style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', padding: '1rem' }}>Auth Token</th>
                                                <th style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', padding: '1rem' }}>Attendance</th>
                                                <th style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', padding: '1rem' }}>Status Protocol</th>
                                                <th style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', padding: '1rem' }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paged.length === 0 ? (
                                                <tr>
                                                    <td colSpan={user.role?.toLowerCase() === 'staff' ? "8" : "7"} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                                                        <div className="flex flex-col items-center gap-4">
                                                            <History size={48} opacity={0.2} />
                                                            <p style={{ fontStyle: 'italic', fontSize: '0.9rem' }}>No historical entries found in the central mainframe.</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : paged.map(b => {
                                                const isUpcoming = new Date(`${b.date}T${b.endTime}:00`) >= now && b.status === 'booked';
                                                const statusMap = {
                                                    'booked': { label: 'AUTHORIZED', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
                                                    'cancelled': { label: 'ABORTED', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
                                                    'completed': { label: 'TERMINATED', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' }
                                                };
                                                const s = statusMap[b.status] || { label: (b.status || 'UNKNOWN').toUpperCase(), color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.05)' };

                                                return (
                                                    <tr key={b._id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)' }} className="log-row">
                                                        <td style={{ padding: '1.25rem', verticalAlign: 'middle' }}>
                                                            <div style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--primary)', fontSize: '0.85rem' }}>{b._id.slice(-8).toUpperCase()}</div>
                                                        </td>
                                                        {user.role?.toLowerCase() === 'staff' && (
                                                            <td style={{ padding: '1.25rem', verticalAlign: 'middle' }}>
                                                                <div className="flex items-center gap-3">
                                                                    <div className="profile-avatar" style={{ width: '32px', height: '32px', fontSize: '0.7rem', margin: 0 }}>{b.userId?.name?.charAt(0) || 'U'}</div>
                                                                    <div>
                                                                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{b.userId?.name || 'N/A'}</div>
                                                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{b.userId?.college || 'No Institution'}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        )}
                                                        <td style={{ padding: '1.25rem', verticalAlign: 'middle' }}>
                                                            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{b.equipmentId?.name || 'UNKNOWN_ASSET'}</div>
                                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.25rem' }}>{b.equipmentId?.department || 'General Research'}</div>
                                                        </td>
                                                        <td style={{ padding: '1.25rem', verticalAlign: 'middle' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                                <Calendar size={14} color="var(--primary)" />
                                                                <span style={{ fontWeight: 600 }}>{b.date}</span>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                                <Clock size={14} />
                                                                <span>{b.startTime} – {b.endTime}</span>
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '1.25rem', verticalAlign: 'middle' }}>
                                                            {b.status === 'booked' ? (
                                                                <div className="group relative cursor-pointer" ref={el => qrRefs.current[b._id] = el} style={{ width: '42px', height: '42px', background: '#fff', padding: '3px', borderRadius: '6px', boxShadow: '0 0 15px rgba(59,130,246,0.2)' }}>
                                                                    <QRCodeSVG value={JSON.stringify({ id: b._id })} size={36} />
                                                                </div>
                                                            ) : <Shield size={20} color="rgba(255,255,255,0.1)" />}
                                                        </td>
                                                        <td style={{ padding: '1.25rem', verticalAlign: 'middle' }}>
                                                            {b.attended ? (
                                                                <div style={{ color: '#10b981', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                    <CheckCircle size={14} /> VERIFIED
                                                                </div>
                                                            ) : (
                                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                    <Clock size={14} /> PENDING
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td style={{ padding: '1.25rem', verticalAlign: 'middle' }}>
                                                            <div style={{ 
                                                                display: 'inline-flex', 
                                                                alignItems: 'center', 
                                                                gap: '0.5rem', 
                                                                padding: '0.4rem 0.8rem', 
                                                                borderRadius: '2rem', 
                                                                background: s.bg, 
                                                                color: s.color, 
                                                                fontSize: '0.7rem', 
                                                                fontWeight: 800,
                                                                border: `1px solid ${s.color}22`,
                                                                letterSpacing: '0.05em'
                                                            }}>
                                                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.color }}></div>
                                                                {s.label}
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '1.25rem', verticalAlign: 'middle' }}>
                                                            <div className="flex gap-2">
                                                                <button onClick={() => downloadReceipt(b)} className="protocol-btn" style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)' }} title="Download Protocol Receipt"><Download size={15} /></button>
                                                                {user.role?.toLowerCase() === 'student' && isUpcoming && !b.attended && (() => {
                                                                    const now = new Date();
                                                                    const bDate = new Date(b.date);
                                                                    const [h, m] = b.startTime.split(':').map(Number);
                                                                    const startTime = new Date();
                                                                    startTime.setHours(h, m, 0, 0);
                                                                    const thirtyMinsAfter = new Date(startTime.getTime() + 30 * 60000);
                                                                    const isWindowOpen = now.toDateString() === bDate.toDateString() && now >= startTime && now <= thirtyMinsAfter;
                                                                    
                                                                    return (
                                                                        <button 
                                                                            disabled={!isWindowOpen}
                                                                            onClick={() => handleAttendance(b._id)} 
                                                                            className="protocol-btn" 
                                                                            style={{ 
                                                                                padding: '0.5rem', 
                                                                                background: isWindowOpen ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.02)', 
                                                                                color: isWindowOpen ? '#10b981' : 'var(--text-muted)', 
                                                                                borderColor: isWindowOpen ? 'rgba(16,185,129,0.2)' : 'transparent',
                                                                                opacity: isWindowOpen ? 1 : 0.4,
                                                                                cursor: isWindowOpen ? 'pointer' : 'not-allowed'
                                                                            }} 
                                                                            title={isWindowOpen ? "Mark Attendance" : "Check-in window: First 30 mins of slot"}
                                                                        >
                                                                            <UserCheck size={15} />
                                                                        </button>
                                                                    );
                                                                })()}
                                                                {isUpcoming ? (
                                                                    <button onClick={() => handleCancel(b._id)} className="protocol-btn" style={{ padding: '0.5rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }} title="Abort Session">
                                                                        <XCircle size={15} />
                                                                    </button>
                                                                ) : b.status === 'booked' && (
                                                                    <button 
                                                                        onClick={() => setReviewModal({ open: true, booking: b, rating: 5, performance: 5, cleanliness: 5, review: '' })} 
                                                                        className="protocol-btn" 
                                                                        style={{ 
                                                                            padding: '0.5rem', 
                                                                            background: userRatings.includes(b.equipmentId?._id) ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)', 
                                                                            color: userRatings.includes(b.equipmentId?._id) ? '#10b981' : 'var(--primary)', 
                                                                            borderColor: userRatings.includes(b.equipmentId?._id) ? '#10b981' : 'var(--primary)' 
                                                                        }} 
                                                                        title={userRatings.includes(b.equipmentId?._id) ? "Review Completed" : "Rate Mission"}
                                                                    >
                                                                        <Star size={15} fill={userRatings.includes(b.equipmentId?._id) ? '#10b981' : 'none'} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                {totalPages > 1 && (
                                    <div className="flex justify-center gap-2 mt-8">
                                        <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} className="btn btn-outline btn-sm"><ChevronLeft size={14} /></button>
                                        <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages} className="btn btn-outline btn-sm"><ChevronRight size={14} /></button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {/* Mission Review Modal (High-Fidelity Tactical Version) */}
                    {reviewModal.open && reviewModal.booking && (
                        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', backdropFilter: 'blur(8px)' }}>
                            <div className="card animate-in" style={{ width: '100%', maxWidth: '500px', padding: '2.5rem', boxShadow: '0 0 50px rgba(59,130,246,0.2)' }}>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '1.25rem' }}>Mission Feedback</h3>
                                    <button onClick={() => setReviewModal({ ...reviewModal, open: false })} className="text-muted hover:text-white transition-colors"><X size={24} /></button>
                                </div>
                                
                                <p className="text-muted mb-8" style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
                                    Mission status: <strong>COMPLETED</strong>. Please provide a tactical performance review for asset <strong>{reviewModal.booking.equipmentId?.name || 'Asset'}</strong>.
                                </p>
 
                                <div className="form-group mb-8">
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                        <div>
                                            <label style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '0.75rem', display: 'block' }}>Asset Performance</label>
                                            <div className="flex gap-2">
                                                {[1, 2, 3, 4, 5].map(s => (
                                                    <Star key={s} size={18} fill={reviewModal.performance >= s ? 'var(--primary)' : 'none'} className={reviewModal.performance >= s ? 'text-primary' : 'text-muted'} style={{ cursor: 'pointer' }} onClick={() => setReviewModal({ ...reviewModal, performance: s })} />
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '0.75rem', display: 'block' }}>Bay Cleanliness</label>
                                            <div className="flex gap-2">
                                                {[1, 2, 3, 4, 5].map(s => (
                                                    <Star key={s} size={18} fill={reviewModal.cleanliness >= s ? 'var(--primary)' : 'none'} className={reviewModal.cleanliness >= s ? 'text-primary' : 'text-muted'} style={{ cursor: 'pointer' }} onClick={() => setReviewModal({ ...reviewModal, cleanliness: s })} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
 
                                <div className="form-group mb-8">
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.1em', marginBottom: '0.75rem', display: 'block' }}>Technical Review</label>
                                    <textarea 
                                        className="form-control" 
                                        rows={4} 
                                        placeholder="Enter performance observations or technical anomalies..."
                                        value={reviewModal.review}
                                        onChange={e => setReviewModal({ ...reviewModal, review: e.target.value })}
                                        style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem' }}
                                    ></textarea>
                                </div>
 
                                <button onClick={handleReviewSubmit} className="btn btn-primary w-full btn-lg" style={{ height: '3.75rem', fontWeight: 900, fontSize: '0.95rem', letterSpacing: '0.05em' }}>TRANSMIT FEEDBACK</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
