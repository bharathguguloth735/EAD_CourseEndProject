import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Lock } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirm) { toast.error('Passwords do not match'); return; }
        if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
        setLoading(true);
        try {
            await axios.post('http://localhost:5000/api/auth/reset-password', { token, newPassword: password });
            setDone(true);
            toast.success('Password reset successfully!');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) { toast.error(err.response?.data?.msg || 'Reset failed'); }
        setLoading(false);
    };

    return (
        <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <div className="card" style={{ width: '100%', maxWidth: '420px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ width: 60, height: 60, background: 'rgba(16,185,129,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                        <Lock size={28} color="#34d399" />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Reset Password</h2>
                </div>
                {done ? <div className="text-center"><p style={{ color: '#34d399' }}>✅ Done! Redirecting to login...</p></div>
                : (
                    <form onSubmit={handleSubmit}>
                        <div className="form-group"><label>New Password</label><input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} /></div>
                        <div className="form-group"><label>Confirm Password</label><input type="password" className="form-control" value={confirm} onChange={e => setConfirm(e.target.value)} required /></div>
                        <button type="submit" className="btn btn-primary w-full" disabled={loading}>{loading ? 'Resetting...' : 'Reset Password'}</button>
                        <p className="text-center mt-4"><Link to="/login">Back to Login</Link></p>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;
