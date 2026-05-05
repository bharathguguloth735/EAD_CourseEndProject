import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Microscope, ArrowRight, Settings, Server, Cpu, CheckCircle, Clock, Shield, Zap, Users, Calendar, FlaskConical, Wrench, Database, ChevronRight, Headset } from 'lucide-react';

import { AuthContext } from '../context/AuthContext';

const Home = () => {
    const { user } = React.useContext(AuthContext);
    const [counts, setCounts] = useState({ equipment: 0, sessions: 0, users: 0 });

    useEffect(() => {
        const targets = { equipment: 50, sessions: 500, users: 200 };
        const steps = 60;
        let step = 0;
        const timer = setInterval(() => {
            step++;
            setCounts({
                equipment: Math.round((targets.equipment * step) / steps),
                sessions: Math.round((targets.sessions * step) / steps),
                users: Math.round((targets.users * step) / steps),
            });
            if (step >= steps) clearInterval(timer);
        }, 30);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="home-wrap">
            {/* Hero */}
            <div className="hero-section">
                <div className="hero-orb hero-orb-1"></div>
                <div className="hero-orb hero-orb-2"></div>
                <div className="hero-orb hero-orb-3"></div>
                <div className="hero-content">
                    <div className="hero-badge"><Zap size={13} /> Lab Smart Official Portal</div>
                    <h1 className="hero-title">Precision Engineering for <span className="gradient-text">Lab Smart Portal</span></h1>
                    <p className="hero-subtitle">Book, manage, and track laboratory equipment seamlessly. Prevent overbooking and ensure your experiments run on time.</p>
                    <div className="hero-actions">
                        {user ? (
                            <>
                                <Link to="/dashboard" className="btn btn-primary btn-lg">Enter Mission <ArrowRight size={18} /></Link>
                                <Link to="/equipment" className="btn btn-outline btn-lg">System Logs</Link>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="btn btn-primary btn-lg">Access Portal <ArrowRight size={18} /></Link>
                                <Link to="/register" className="btn btn-outline btn-lg">Request Access</Link>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* How it Works */}
            <div className="section">
                <div className="section-header">
                    <span className="section-tag">Simple Process</span>
                    <h2 className="section-title">How It Works</h2>
                    <p className="section-subtitle">Book lab equipment in 3 easy steps</p>
                </div>
                <div className="steps-grid">
                    {[
                        { step: '01', icon: <Users size={30} />, title: 'Create Account', desc: 'Register as Student, Staff, or request Admin access for your department.' },
                        { step: '02', icon: <Microscope size={30} />, title: 'Browse Equipment', desc: 'Explore available lab equipment with real-time availability, pricing, and category filters.' },
                        { step: '03', icon: <CheckCircle size={30} />, title: 'Book & Pay', desc: 'Select your time slot, complete a secure payment, and receive instant confirmation.' },
                    ].map((item, i) => (
                        <div key={i} className="step-card">
                            <div className="step-number">{item.step}</div>
                            <div className="step-icon">{item.icon}</div>
                            <h3>{item.title}</h3>
                            <p>{item.desc}</p>
                            {i < 2 && <ChevronRight className="step-arrow" size={22} />}
                        </div>
                    ))}
                </div>
            </div>

            {/* Features */}
            <div style={{ background: 'rgba(255,255,255,0.015)', padding: '5rem 0' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
                    <div className="section-header">
                        <span className="section-tag">Platform Features</span>
                        <h2 className="section-title">Everything You Need</h2>
                    </div>
                    <div className="features-grid">
                        {[
                            { icon: <Calendar size={26} />, c: 'blue', title: 'Real-time Booking', desc: 'Live availability checks with overlap prevention and instant confirmation.' },
                            { icon: <Shield size={26} />, c: 'purple', title: 'Role-Based Access', desc: 'Student, Staff, and Admin roles with tailored dashboards and permissions.' },
                            { icon: <Clock size={26} />, c: 'green', title: 'Smart Scheduling', desc: 'Calendar view with 7-day access: 8 AM–8 PM (Mon–Sat) and 9 AM–6 PM (Sun).' },
                            { icon: <Zap size={26} />, c: 'yellow', title: 'Secure Payments', desc: 'Integrated payment with Card, UPI, and Cash options. Per-hour pricing.' },
                            { icon: <Database size={26} />, c: 'orange', title: 'Asset Analytics', desc: 'Deep-dive telemetry and usage metrics for every piece of laboratory equipment.' },
                            { icon: <Server size={26} />, c: 'red', title: 'Email Alerts', desc: 'Automatic email notifications for booking confirmations and cancellations.' },
                        ].map((f, i) => (
                            <div key={i} className={`feature-card feature-card-${f.c}`}>
                                <div className={`feature-icon-wrap feature-icon-${f.c}`}>{f.icon}</div>
                                <h3>{f.title}</h3>
                                <p>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Equipment Categories */}
            <div className="section">
                <div className="section-header">
                    <span className="section-tag">Lab Inventory</span>
                    <h2 className="section-title">Equipment Categories</h2>
                    <p className="section-subtitle">Browse equipment by department</p>
                </div>
                <div className="categories-grid">
                    {[
                        { icon: <Cpu size={28} />, name: 'Electronics & IoT', count: '24 items', c: 'blue' },
                        { icon: <Settings size={28} />, name: 'Mechanical', count: '21 items', c: 'green' },
                        { icon: <Server size={28} />, name: 'Computing', count: '25 items', c: 'purple' },
                        { icon: <FlaskConical size={28} />, name: 'Chemical', count: '22 items', c: 'yellow' },
                        { icon: <Microscope size={28} />, name: 'Biology', count: '23 items', c: 'red' },
                        { icon: <Wrench size={28} />, name: 'Optics', count: '20 items', c: 'orange' },
                    ].map((cat, i) => (
                        <Link key={i} to="/equipment" className={`category-card category-card-${cat.c}`}>
                            <div className="category-icon">{cat.icon}</div>
                            <h4>{cat.name}</h4>
                            <span>{cat.count}</span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Working Hours Info */}
            <div style={{ background: 'rgba(255,255,255,0.015)', padding: '4rem 1.5rem' }}>
                <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.5rem' }}>
                    {[
                        { icon: '📅', title: 'Working Days', val: 'Monday – Sunday', sub: '7 Days Open (Sunday: 9 AM – 6 PM)' },
                        { icon: '⏰', title: 'Lab Hours', val: '8:00 AM – 8:00 PM', sub: '12 hours of access daily' },
                        { icon: '💰', title: 'Pricing', val: '₹30 – ₹500 / hr', sub: 'Varies by equipment type' },
                    ].map((item, i) => (
                        <div key={i} className="card" style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{item.icon}</div>
                            <p className="text-muted" style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>{item.title}</p>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{item.val}</h3>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{item.sub}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Resources Preview */}
            <div className="section" style={{ paddingTop: '0' }}>
                <div className="section-header">
                    <span className="section-tag">Essential Info</span>
                    <h2 className="section-title">Lab Resources</h2>
                    <p className="section-subtitle">Important documentation for all lab users</p>
                </div>
                <div className="grid-3">
                    <Link to="/resources#safety" className="card feature-card feature-card-red" style={{ textDecoration: 'none' }}>
                        <div className="feature-icon-wrap feature-icon-red"><Shield size={24} /></div>
                        <h3>Safety Rules</h3>
                        <p>Critical protocols for handling chemicals and equipment safely.</p>
                    </Link>
                    <Link to="/resources#usage" className="card feature-card feature-card-blue" style={{ textDecoration: 'none' }}>
                        <div className="feature-icon-wrap feature-icon-blue"><Clock size={24} /></div>
                        <h3>Usage Guidelines</h3>
                        <p>How to book slots, handle returns, and clean up after experiments.</p>
                    </Link>
                    <Link to="/resources#contact" className="card feature-card feature-card-purple" style={{ textDecoration: 'none' }}>
                        <div className="feature-icon-wrap feature-icon-purple"><Headset size={24} /></div>
                        <h3>Contact Admin</h3>
                        <p>Reach out for technical support or administrative assistance.</p>
                    </Link>
                </div>
            </div>

            {/* Authenticated Student Announcement */}
            {user && (
                <div className="section" style={{ paddingTop: '0' }}>
                    <div className="glass-panel p-8 flex flex-col lg:flex-row items-center gap-8 border-primary/20 bg-primary/5">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <Shield size={32} />
                        </div>
                        <div className="flex-1 text-center lg:text-left">
                            <div className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-primary mb-2">Student Prep Announcement</div>
                            <h3 className="text-2xl font-black text-slate-100 mb-2">Lab Coat & Safety Gear Availability</h3>
                            <p className="text-slate-400 text-sm max-w-2xl">
                                To ensure maximum safety during experiments, professional-grade **White Lab Coats** are now available for all students. 
                                Please visit the **Central Lab Counter** to settle the rental/purchase fee before your scheduled mission.
                            </p>
                        </div>
                        <div className="flex flex-col gap-2 min-w-[200px]">
                            <div className="px-4 py-2 bg-black/40 rounded-xl border border-white/5 flex items-center gap-3">
                                <CheckCircle size={14} className="text-primary" />
                                <span className="text-[0.65rem] font-bold text-slate-300">Sizes Available (S–XXL)</span>
                            </div>
                            <div className="px-4 py-2 bg-black/40 rounded-xl border border-white/5 flex items-center gap-3">
                                <Zap size={14} className="text-yellow-500" />
                                <span className="text-[0.65rem] font-bold text-slate-300">Counter Payment Only</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CTA Banner */}
            <div className="cta-banner">
                <h2>{user ? "Ready for Your Next Experiment?" : "Ready to Book Your Experiment?"}</h2>
                <p>{user ? `Welcome back, ${user.name.split(' ')[0]}. Your terminal is ready.` : "Join hundreds of students and researchers using Lab Smart Portal."}</p>
                <div className="flex gap-4 justify-center">
                    {user ? (
                        <>
                            <Link to="/dashboard" className="btn btn-primary btn-lg" style={{ minWidth: '220px', gap: '0.75rem' }}>
                                <Zap size={20} fill="currentColor" /> Launch Console
                            </Link>
                            <Link to="/equipment" className="btn btn-outline-white btn-lg" style={{ minWidth: '220px', gap: '0.75rem' }}>
                                <Database size={20} /> View Inventory
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link to="/register" className="btn btn-primary btn-lg">Get Started Free</Link>
                            <Link to="/login" className="btn btn-outline-white btn-lg">Sign In</Link>
                        </>
                    )}
                </div>
            </div>

            {/* Footer */}
            <footer className="site-footer">
                <div className="footer-grid">
                    <div>
                        <div className="footer-brand"><Microscope size={22} color="#3b82f6" /> Lab Smart Portal</div>
                        <p className="footer-desc">Lab Smart Equipment Management System. Streamlining lab access for students and researchers.</p>
                    </div>
                    <div>
                        <h5>Quick Links</h5>
                        <ul><li><Link to="/">Home</Link></li><li><Link to="/login">Login</Link></li><li><Link to="/register">Register</Link></li></ul>
                    </div>
                    <div>
                        <h5>Resources</h5>
                        <ul>
                            <li><Link to="/resources#safety">Lab Safety Rules</Link></li>
                            <li><Link to="/resources#usage">Usage Guidelines</Link></li>
                            <li><Link to="/resources#contact">Contact Admin</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h5>Global Impact</h5>
                        <div className="flex gap-2 mt-4">
                            <div className="sdg-badge" title="SDG 8: Decent Work and Economic Growth">
                                <div style={{ background: '#a21942', color: 'white', padding: '0.4rem 0.6rem', borderRadius: '0.25rem', fontSize: '0.65rem', fontWeight: 900 }}>SDG 8</div>
                            </div>
                            <div className="sdg-badge" title="SDG 9: Industry, Innovation and Infrastructure">
                                <div style={{ background: '#f36d25', color: 'white', padding: '0.4rem 0.6rem', borderRadius: '0.25rem', fontSize: '0.65rem', fontWeight: 900 }}>SDG 9</div>
                            </div>
                        </div>
                        <p className="footer-desc mt-3" style={{ fontSize: '0.7rem', opacity: 0.6, lineHeight: 1.4 }}>Supporting sustainable growth & innovation through digitized lab infrastructure.</p>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>© {new Date().getFullYear()} Lab Smart Portal. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default Home;
