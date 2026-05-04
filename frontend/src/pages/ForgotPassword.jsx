import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, ArrowLeft } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
            setSent(true);
            toast.success('Reset link generated successfully!');
            // In dev: show the token for testing
            if (res.data.token) console.log('Reset link:', res.data.resetLink);
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Failed to send reset link');
        }
        setLoading(false);
    };

    return (
        <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <div className="card" style={{ width: '100%', maxWidth: '420px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ width: 60, height: 60, background: 'rgba(59,130,246,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                        <Mail size={28} color="#60a5fa" />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Forgot Password?</h2>
                    <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Enter your email to receive a reset link.</p>
                </div>

                {sent ? (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '1.5rem' }}>
                            <p style={{ color: '#34d399', fontWeight: 600 }}>✅ Reset link sent!</p>
                            <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Check your email inbox. The link expires in 1 hour.</p>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>(Dev mode: check browser console for reset link)</p>
                        </div>
                        <Link to="/login" className="btn btn-primary w-full">Back to Login</Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="form-group"><label>Email Address</label>
                            <input type="email" className="form-control" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
                        </div>
                        <button type="submit" className="btn btn-primary w-full" disabled={loading}>{loading ? 'Sending...' : 'Send Reset Link'}</button>
                        <p className="text-center mt-4" style={{ fontSize: '0.875rem' }}>
                            <Link to="/login" className="flex items-center justify-center gap-1"><ArrowLeft size={14} /> Back to Login</Link>
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
