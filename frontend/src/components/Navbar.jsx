import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogOut, Menu, X, Bell, ArrowLeft, Microscope, Check, Info, AlertTriangle } from 'lucide-react';
import { io } from 'socket.io-client';
import axios from 'axios';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const socketRef = useRef();

    useEffect(() => {
        if (user) {
            // Fetch initial notifications
            const fetchNotifs = async () => {
                try {
                    const res = await axios.get('http://localhost:5000/api/notifications', {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                    setNotifications(res.data);
                    setUnreadCount(res.data.filter(n => !n.isRead).length);
                } catch (err) { console.error('Failed to fetch notifications'); }
            };
            fetchNotifs();

            // Connect Socket.io
            socketRef.current = io('http://localhost:5000');
            socketRef.current.emit('join', user.id);

            socketRef.current.on('notification', (notif) => {
                setNotifications(prev => [notif, ...prev]);
                setUnreadCount(prev => prev + 1);
                // Play subtle sound if desired
            });

            return () => socketRef.current.disconnect();
        }
    }, [user]);

    const markAllRead = async () => {
        try {
            await axios.put('http://localhost:5000/api/notifications/read-all', {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) { console.error('Failed to mark all as read'); }
    };

    const handleLogout = () => { logout(); navigate('/login'); setMobileOpen(false); };

    return (
        <>
            <nav className="navbar-premium">
                <div className="container" style={{ height: '5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    
                    {/* Left: Simplified Links */}
                    <div className="flex items-center" style={{ gap: '2.5rem' }}>
                        <Link to="/" className="navbar-brand" style={{ marginRight: '1rem' }}><Microscope size={22} color="#3b82f6" /> Lab Smart Portal</Link>
                        {!user?.needsRoleSelection && (
                            <>
                                <Link to="/" className="nav-link-caps">Home</Link>
                                <Link to="/resources" className="nav-link-caps">Resources</Link>
                                {user && (
                                    <>
                                        <Link to="/dashboard" className="nav-link-caps">
                                            {user.role?.toLowerCase() === 'staff' ? 'Staff Terminal' : user.role === 'Admin' ? 'Command Center' : 'Student Terminal'}
                                        </Link>
                                        <Link to="/equipment" className="nav-link-caps">Asset Registry</Link>
                                    </>
                                )}
                                {user?.role?.toLowerCase() === 'staff' && user.department && (
                                    <div style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', padding: '0.2rem 0.75rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 900, border: '1px solid rgba(139,92,246,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        {user.department} Dept
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-6">
                        {user ? (
                            <>
                                <button onClick={() => navigate(-1)} className="protocol-btn hide-mobile">
                                    <ArrowLeft size={14} /> Back Protocol
                                </button>
                                
                                <div style={{ position: 'relative' }}>
                                    <button 
                                        className={`bell-icon-wrap ${unreadCount > 0 ? 'has-unread' : ''}`}
                                        style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}
                                        onClick={() => { setShowNotifications(!showNotifications); if (!showNotifications) setUnreadCount(0); }}
                                    >
                                        <Bell size={18} />
                                        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                                    </button>

                                    {showNotifications && (
                                        <div className="notification-dropdown">
                                            <div className="notif-header">
                                                <span>Mission Alerts</span>
                                                <div className="flex gap-2">
                                                    <button onClick={markAllRead} style={{ fontSize: '0.7rem' }}>Mark all read</button>
                                                    <button onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}>
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="notif-list">
                                                {notifications.length === 0 ? (
                                                    <div className="notif-empty">No mission alerts</div>
                                                ) : (
                                                    notifications.map((n, i) => (
                                                        <div key={i} className={`notif-item ${!n.isRead ? 'unread' : ''}`}>
                                                            <div className="notif-icon">
                                                                {n.type === 'booking' ? <Check size={14} color="#10b981" /> : <Info size={14} color="#3b82f6" />}
                                                            </div>
                                                            <div className="notif-content">
                                                                <div className="notif-title">{n.title}</div>
                                                                <div className="notif-msg">{n.message}</div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button onClick={handleLogout} className="sign-out-btn" style={{ marginLeft: '1rem', color: '#f87171', background: 'rgba(239,68,68,0.1)', padding: '0.6rem 1.2rem', borderRadius: '0.75rem', border: '1px solid rgba(239,68,68,0.2)' }}>
                                    <LogOut size={16} /> SIGN OUT
                                </button>
                            </>
                        ) : (
                            <div className="flex items-center gap-6">
                                <Link to="/login" className="nav-link-caps">Sign In</Link>
                                <Link to="/register" className="protocol-btn" style={{ background: '#3b82f6', borderColor: '#3b82f6' }}>Join Lab</Link>
                            </div>
                        )}
                        
                        {/* Mobile hamburger */}
                        <button className="mobile-menu-btn ml-2" onClick={() => setMobileOpen(o => !o)}>
                            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile panel */}
            {mobileOpen && <div className="nav-mobile-overlay" onClick={() => setMobileOpen(false)} />}
            <div className={`nav-mobile-panel ${mobileOpen ? 'open' : ''}`} style={{ background: '#0a0e17', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                {!user?.needsRoleSelection ? (
                    <>
                        <Link to="/" className="nav-link-caps py-3" onClick={() => setMobileOpen(false)}>Home</Link>
                        <Link to="/resources" className="nav-link-caps py-3" onClick={() => setMobileOpen(false)}>Resources</Link>
                        {user && (
                            <>
                                <Link to="/dashboard" className="nav-link-caps py-3" onClick={() => setMobileOpen(false)}>
                                    {user.role === 'Staff' ? 'Staff' : 'Dashboard'}
                                </Link>
                                <button onClick={handleLogout} className="sign-out-btn py-3" style={{ border: 'none', background: 'none', paddingLeft: 0 }}>
                                    <LogOut size={16} /> Sign Out
                                </button>
                            </>
                        )}
                    </>
                ) : (
                    <button onClick={handleLogout} className="sign-out-btn py-3" style={{ border: 'none', background: 'none', paddingLeft: 0 }}>
                        <LogOut size={16} /> Sign Out
                    </button>
                )}
            </div>
        </>
    );
};

export default Navbar;
