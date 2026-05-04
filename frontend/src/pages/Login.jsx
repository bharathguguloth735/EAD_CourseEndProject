import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Microscope, User as UserIcon, GraduationCap, ShieldCheck } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [roleTab, setRoleTab] = useState('Student');
    const [error, setError] = useState('');
    const { login, googleLogin } = useContext(AuthContext);
    const { toast } = useToast();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await login(email, password);
            toast.success('Welcome back!');
            navigate('/dashboard');
        } catch (err) {
            const msg = err.response?.data?.msg || 'Login failed';
            setError(msg);
            toast.error(msg);
        }
    };

    const handleTabClick = (role, demoEmail) => {
        setRoleTab(role);
        setEmail(demoEmail);
        setPassword('admin123'); // auto fill for demo
    };

    return (
        <div style={{ display: 'flex', minHeight: '80vh', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            
            {/* Left Panel - Branding */}
            <div style={{ flex: 1, backgroundColor: 'var(--primary)', padding: '3rem', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', backgroundImage: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)' }} className="hide-on-mobile">
                <Microscope size={64} color="white" className="mb-4" />
                <h1 style={{ fontSize: '3rem', marginBottom: '1rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Lab Smart Portal</h1>
                <h2 style={{ fontSize: '1rem', opacity: 0.7, marginBottom: '2rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Unified Research Terminal</h2>
                <p style={{ fontSize: '1.1rem', opacity: 0.8, lineHeight: 1.8, maxWidth: '450px' }}>
                    Access the Lab Smart central mainframe. Securely manage equipment and monitor mission protocols in real-time.
                </p>
                
                <div style={{ marginTop: 'auto' }}>
                    <div className="flex gap-4" style={{ marginTop: '2rem' }}>
                        <div style={{ background: 'rgba(255,255,255,0.08)', padding: '1.25rem', borderRadius: '1rem', flex: 1, border: '1px solid rgba(255,255,255,0.1)' }}>
                            <h3 style={{ fontSize: '1.75rem', fontWeight: 800 }}>80+</h3>
                            <p style={{ fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase' }}>Precision Matrix</p>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.08)', padding: '1.25rem', borderRadius: '1rem', flex: 1, border: '1px solid rgba(255,255,255,0.1)' }}>
                            <h3 style={{ fontSize: '1.75rem', fontWeight: 800 }}>99.9%</h3>
                            <p style={{ fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase' }}>Uptime Protocol</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div style={{ flex: 1, backgroundColor: 'var(--card-bg)', padding: '3rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h2 style={{ fontSize: '1.875rem', marginBottom: '0.5rem' }}>Welcome Back</h2>
                <p className="text-muted mb-8">Please login to your account to continue.</p>

                {/* Role Tabs for Demo */}
                <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '0.35rem', borderRadius: '0.75rem', marginBottom: '2.5rem', border: '1px solid var(--border-color)' }}>
                    <button 
                        type="button"
                        onClick={() => handleTabClick('Student', 'student@lab.com')}
                        style={{ flex: 1, padding: '0.75rem', border: 'none', background: roleTab === 'Student' ? 'var(--primary)' : 'transparent', color: roleTab === 'Student' ? 'white' : 'var(--text-muted)', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', transition: 'all 0.3s', fontWeight: 700, fontSize: '0.85rem' }}
                    >
                        <GraduationCap size={16} /> STUDENT
                    </button>
                    <button 
                        type="button"
                        onClick={() => handleTabClick('Staff', 'staff@lab.com')}
                        style={{ flex: 1, padding: '0.75rem', border: 'none', background: roleTab === 'Staff' ? '#8b5cf6' : 'transparent', color: roleTab === 'Staff' ? 'white' : 'var(--text-muted)', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', transition: 'all 0.3s', fontWeight: 700, fontSize: '0.85rem' }}
                    >
                        <UserIcon size={16} /> STAFF
                    </button>
                </div>

                {error && <div className="badge badge-danger mb-4" style={{ display: 'block', textAlign: 'center', padding: '0.75rem' }}>{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group mb-4">
                        <label style={{ fontWeight: 500, color: 'var(--text-main)' }}>Email Address</label>
                        <input 
                            type="email" 
                            className="form-control" 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            required 
                            style={{ padding: '0.75rem', fontSize: '1rem', backgroundColor: 'rgba(0,0,0,0.2)' }}
                            placeholder="Enter your email"
                        />
                    </div>
                    <div className="form-group mb-6">
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                             <label style={{ fontWeight: 500, color: 'var(--text-main)' }}>Password</label>
                             <Link to="/forgot-password" style={{ fontSize: '0.875rem' }}>Forgot password?</Link>
                        </div>
                        <input 
                            type="password" 
                            className="form-control" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            required 
                            style={{ padding: '0.75rem', fontSize: '1rem', backgroundColor: 'rgba(0,0,0,0.2)' }}
                            placeholder="Enter your password"
                        />
                    </div>
                    
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
                        Sign In as {roleTab}
                    </button>
                    
                    <div className="flex items-center gap-4 mb-4">
                        <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
                        <span className="text-muted" style={{ fontSize: '0.875rem' }}>OR</span>
                        <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <GoogleLogin
                            onSuccess={async (credentialResponse) => {
                                try {
                                    await googleLogin(credentialResponse.credential);
                                    toast.success('Google Sign-in successful!');
                                    
                                    // Get the user from local storage to check for needsRoleSelection
                                    const storedUser = JSON.parse(localStorage.getItem('user'));
                                    if (storedUser?.needsRoleSelection) {
                                        navigate('/select-role');
                                    } else {
                                        navigate('/dashboard');
                                    }
                                } catch (err) {
                                    toast.error(err.response?.data?.msg || 'Google login failed');
                                }
                            }}
                            onError={() => toast.error('Google Sign-in Failed')}
                            useOneTap
                            theme="filled_blue"
                            shape="pill"
                        />
                    </div>
                </form>
                
                <p className="mt-8 text-center text-muted">
                    Don't have an account? <Link to="/register" style={{ fontWeight: 600 }}>Register here</Link>
                </p>
            </div>
            
            <style jsx>{`
                @media (max-width: 768px) {
                    .hide-on-mobile { display: none !important; }
                }
            `}</style>
        </div>
    );
};

export default Login;
