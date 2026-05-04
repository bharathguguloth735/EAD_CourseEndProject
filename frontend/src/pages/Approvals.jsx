import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Approvals = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => { fetchPending(); }, []);

    const fetchPending = async () => {
        setLoading(true);
        try { const res = await axios.get('http://localhost:5000/api/bookings/pending'); setBookings(res.data); }
        catch { toast.error('Failed to load pending bookings'); }
        setLoading(false);
    };

    const handleAction = async (id, action, name) => {
        try {
            await axios.put(`http://localhost:5000/api/bookings/${id}/approve`, { action });
            toast.success(`Booking ${action === 'approve' ? 'approved' : 'rejected'} for ${name}`);
            fetchPending();
        } catch { toast.error('Action failed'); }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div><h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>📋 Booking Approvals</h2>
                    <p className="text-muted">Review and approve student booking requests</p></div>
                <span className="badge badge-warning" style={{ fontSize: '0.875rem', padding: '0.4rem 0.9rem' }}>
                    <Clock size={14} style={{ marginRight: 4 }} />{bookings.length} Pending
                </span>
            </div>

            {loading ? <div className="card text-center py-4 text-muted">Loading...</div>
            : bookings.length === 0 ? (
                <div className="card text-center" style={{ padding: '3rem' }}>
                    <CheckCircle size={48} color="#10b981" style={{ margin: '0 auto 1rem' }} />
                    <h3>All Clear!</h3>
                    <p className="text-muted">No pending booking approvals.</p>
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table>
                        <thead><tr><th>Student</th><th>Equipment</th><th>Date</th><th>Time</th><th>Purpose</th><th>Amount</th><th>Actions</th></tr></thead>
                        <tbody>
                            {bookings.map(b => (
                                <tr key={b._id}>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{b.userId?.name}</div>
                                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{b.userId?.email}</div>
                                    </td>
                                    <td style={{ fontWeight: 600 }}>{b.equipmentId?.name}</td>
                                    <td>{b.date}</td>
                                    <td style={{ fontSize: '0.85rem' }}>{b.startTime} – {b.endTime}</td>
                                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '150px' }}>{b.purpose || '—'}</td>
                                    <td style={{ fontWeight: 700 }}>₹{b.amount}</td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleAction(b._id, 'approve', b.userId?.name)} className="btn btn-success btn-sm flex items-center gap-1">
                                                <CheckCircle size={14} /> Approve
                                            </button>
                                            <button onClick={() => handleAction(b._id, 'reject', b.userId?.name)} className="btn btn-danger btn-sm flex items-center gap-1">
                                                <XCircle size={14} /> Reject
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Approvals;
