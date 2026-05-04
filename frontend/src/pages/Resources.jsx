import React from 'react';
import { ShieldAlert, BookOpen, Headset, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

const Resources = () => {
    return (
        <div className="container py-8">
            <header className="mb-12 text-center">
                <h1 className="section-title">Lab Resources & Guidelines</h1>
                <p className="section-subtitle">Everything you need to know about conducting safe and efficient experiments at Private Lab Limited.</p>
            </header>

            <div className="grid-3">
                {/* Lab Safety Rules */}
                <div className="card feature-card feature-card-red" id="safety">
                    <div className="feature-icon-wrap feature-icon-red">
                        <ShieldAlert size={24} />
                    </div>
                    <h3>Lab Safety Rules</h3>
                    <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
                        <li className="flex gap-2 mb-3"><AlertTriangle size={16} color="var(--danger)" /> Wear Personal Protective Equipment (PPE) at all times.</li>
                        <li className="flex gap-2 mb-3"><AlertTriangle size={16} color="var(--danger)" /> No food or drinks are allowed inside the laboratory area.</li>
                        <li className="flex gap-2 mb-3"><AlertTriangle size={16} color="var(--danger)" /> Know the location of fire extinguishers and first-aid kits.</li>
                        <li className="flex gap-2 mb-3"><AlertTriangle size={16} color="var(--danger)" /> Report all spills or accidents immediately to the supervisor.</li>
                    </ul>
                </div>

                {/* Usage Guidelines */}
                <div className="card feature-card feature-card-blue" id="usage">
                    <div className="feature-icon-wrap feature-icon-blue">
                        <BookOpen size={24} />
                    </div>
                    <h3>Usage Guidelines</h3>
                    <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
                        <li className="flex gap-2 mb-3"><CheckCircle2 size={16} color="var(--primary)" /> Arrive 5 minutes before your scheduled booking slot.</li>
                        <li className="flex gap-2 mb-3"><CheckCircle2 size={16} color="var(--primary)" /> Log in to the equipment console before starting your work.</li>
                        <li className="flex gap-2 mb-3"><CheckCircle2 size={16} color="var(--primary)" /> Clean and reset all apparatus to their original state after use.</li>
                        <li className="flex gap-2 mb-3"><Clock size={16} color="var(--primary)" /> Maximum extension permitted is 15 mins (if slot is free).</li>
                    </ul>
                </div>

                {/* Contact Admin */}
                <div className="card feature-card feature-card-purple" id="contact">
                    <div className="feature-icon-wrap feature-icon-purple">
                        <Headset size={24} />
                    </div>
                    <h3>Contact Administration</h3>
                    <p className="text-muted mb-4">For technical support, equipment malfunction, or urgent booking changes.</p>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '0.5rem' }}>
                        <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>Emergency Helpline:</p>
                        <p style={{ color: 'var(--primary)', fontSize: '1.1rem', fontWeight: 700 }}>+91 93921-XXXXX</p>
                        <p className="mt-2" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Admin Email:</p>
                        <p style={{ color: 'var(--primary)' }}>admin-support@privatelab.com</p>
                    </div>
                </div>
            </div>

            <section className="mt-12 card" style={{ padding: '3rem', textAlign: 'center', background: 'linear-gradient(rgba(59,130,246,0.1), transparent)' }}>
                <h3 className="mb-4">Need a specific manual?</h3>
                <p className="text-muted mb-6">If you are looking for the technical manual or operating procedure for a specific machine, please check the "Equipment" page and click on the individual equipment details.</p>
                <button className="btn btn-primary" onClick={() => window.location.href='/equipment'}>Browse Equipment</button>
            </section>
        </div>
    );
};

export default Resources;
