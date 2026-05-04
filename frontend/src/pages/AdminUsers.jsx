import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, Shield, UserCheck, UserX, Trash2, RefreshCw } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const ROLE_COLORS = { Admin: '#ef4444', Staff: '#8b5cf6', Student: '#3b82f6' };

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const { toast } = useToast();

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        try { const res = await axios.get('http://localhost:5000/api/users'); setUsers(res.data); }
        catch { toast.error('Failed to load users'); }
    };

    const toggleActive = async (id, name, isActive) => {
        try {
            await axios.put(`http://localhost:5000/api/users/${id}/toggle-active`);
            toast.success(`${name} has been ${isActive ? 'deactivated' : 'activated'}`);
            fetchUsers();
        } catch { toast.error('Failed to update user'); }
    };

    const changeRole = async (id, name, newRole) => {
        try {
            await axios.put(`http://localhost:5000/api/users/${id}/role`, { role: newRole });
            toast.success(`${name}'s role changed to ${newRole}`);
            fetchUsers();
        } catch { toast.error('Failed to change role'); }
    };

    const deleteUser = async (id, name) => {
        if (!window.confirm(`Delete user ${name}?`)) return;
        try {
            await axios.delete(`http://localhost:5000/api/users/${id}`);
            toast.success(`${name} deleted`);
            fetchUsers();
        } catch { toast.error('Failed to delete user'); }
    };

    const filtered = users.filter(u => {
        const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
        const matchRole = roleFilter === 'all' || u.role === roleFilter;
        return matchSearch && matchRole;
    });

    const counts = { total: users.length, Admin: users.filter(u => u.role === 'Admin').length, Staff: users.filter(u => u.role === 'Staff').length, Student: users.filter(u => u.role === 'Student').length };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div><h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>👥 User Management</h2>
                    <p className="text-muted">Manage all registered users</p></div>
                <button onClick={fetchUsers} className="btn btn-outline flex items-center gap-2"><RefreshCw size={15} /> Refresh</button>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                {[{ label: 'Total Users', val: counts.total, icon: <Users size={20} />, color: '#3b82f6' },
                  { label: 'Admins', val: counts.Admin, icon: <Shield size={20} />, color: '#ef4444' },
                  { label: 'Staff', val: counts.Staff, icon: <UserCheck size={20} />, color: '#8b5cf6' },
                  { label: 'Students', val: counts.Student, icon: <Users size={20} />, color: '#10b981' },
                ].map((s, i) => (
                    <div key={i} className="stat-card">
                        <div className="stat-icon" style={{ background: `${s.color}22`, color: s.color }}>{s.icon}</div>
                        <div><div className="stat-label">{s.label}</div><div className="stat-value">{s.val}</div></div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="card mb-4 flex gap-3 items-center">
                <input className="form-control flex-1" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
                <select className="form-control" style={{ width: 'auto' }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                    <option value="all">All Roles</option>
                    <option value="Admin">Admin</option>
                    <option value="Staff">Staff</option>
                    <option value="Student">Student</option>
                </select>
            </div>

            {/* Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table>
                    <thead><tr><th>User</th><th>Role</th><th>Department</th><th>Joined</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        {filtered.map(u => (
                            <tr key={u._id}>
                                <td>
                                    <div className="flex items-center gap-3">
                                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${ROLE_COLORS[u.role]}33`, color: ROLE_COLORS[u.role], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem', flexShrink: 0 }}>
                                            {u.name.slice(0, 2).toUpperCase()}
                                        </div>
                                        <div><div style={{ fontWeight: 600 }}>{u.name}</div><div className="text-muted" style={{ fontSize: '0.78rem' }}>{u.email}</div></div>
                                    </div>
                                </td>
                                <td>
                                    <select value={u.role} onChange={e => changeRole(u._id, u.name, e.target.value)}
                                        style={{ background: `${ROLE_COLORS[u.role]}22`, color: ROLE_COLORS[u.role], border: `1px solid ${ROLE_COLORS[u.role]}55`, borderRadius: '0.375rem', padding: '0.25rem 0.5rem', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                                        <option value="Student">Student</option>
                                        <option value="Staff">Staff</option>
                                        <option value="Admin">Admin</option>
                                    </select>
                                </td>
                                <td style={{ fontSize: '0.85rem' }}>{u.department || '—'}</td>
                                <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                                <td><span className={`badge ${u.isActive !== false ? 'badge-success' : 'badge-danger'}`}>{u.isActive !== false ? 'Active' : 'Inactive'}</span></td>
                                <td>
                                    <div className="flex gap-2">
                                        <button onClick={() => toggleActive(u._id, u.name, u.isActive !== false)} className={`btn btn-sm ${u.isActive !== false ? 'btn-outline' : 'btn-success'}`} title={u.isActive !== false ? 'Deactivate' : 'Activate'}>
                                            {u.isActive !== false ? <UserX size={14} /> : <UserCheck size={14} />}
                                        </button>
                                        <button onClick={() => deleteUser(u._id, u.name)} className="btn btn-danger btn-sm"><Trash2 size={14} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && <tr><td colSpan={6} className="text-center text-muted py-4">No users found.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminUsers;
