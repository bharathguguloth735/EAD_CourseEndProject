import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

const Register = () => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'Student' });
    const [error, setError] = useState('');
    const { register, googleLogin } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await register(formData.name, formData.email, formData.password, formData.role);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.msg || 'Registration failed');
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '4rem auto' }}>
            <div className="card">
                <h2 className="mb-4 text-center">Create Account</h2>
                {error && <div className="badge badge-danger mb-4" style={{ display: 'block', textAlign: 'center' }}>{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Name</label>
                        <input type="text" className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" className="form-control" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input type="password" className="form-control" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
                    </div>
                    <div className="form-group">
                        <label>Role</label>
                        <select className="form-control" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                            <option value="Student">Student</option>
                            <option value="Staff">Staff</option>
                        </select>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem' }}>Register</button>
                    
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
                                    const storedUser = JSON.parse(localStorage.getItem('user'));
                                    if (storedUser?.needsRoleSelection) {
                                        navigate('/select-role');
                                    } else {
                                        navigate('/dashboard');
                                    }
                                } catch (err) {
                                    setError('Google registration failed');
                                }
                            }}
                            onError={() => setError('Google Sign-in Failed')}
                            useOneTap
                            theme="filled_blue"
                            shape="pill"
                        />
                    </div>
                </form>
                
                <p className="mt-4 text-center text-muted" style={{ fontSize: '0.875rem' }}>
                    Already have an account? <Link to="/login">Login here</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
