import React, { useContext, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { User, GraduationCap, ArrowRight, ShieldCheck } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const RoleSelection = () => {
    const { user, selectRole } = useContext(AuthContext);
    const { toast } = useToast();
    const [selected, setSelected] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    if (!user) return <Navigate to="/login" />;
    if (!user.needsRoleSelection) return <Navigate to="/dashboard" />;

    const handleProceed = async () => {
        if (!selected) {
            toast.error('Please select a profile type');
            return;
        }

        setIsSubmitting(true);
        try {
            await selectRole(selected);
            toast.success(`Welcome aboard, ${selected}!`);
            navigate('/dashboard');
        } catch (err) {
            toast.error('Failed to update role. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="role-selection-page">
            <div className="role-container">
                <div className="role-header">
                    <div className="icon-badge">
                        <ShieldCheck size={32} />
                    </div>
                    <h1>Complete Your Profile</h1>
                    <p>Welcome, <span>{user.name}</span>. Please identify your role to tailor your experience within the Lab Ecosystem.</p>
                </div>

                <div className="role-cards">
                    <div 
                        className={`role-card ${selected === 'Student' ? 'active' : ''}`}
                        onClick={() => setSelected('Student')}
                    >
                        <div className="role-card-icon">
                            <GraduationCap size={48} />
                        </div>
                        <h3>Student</h3>
                        <p>Book equipment, manage your projects, and track your lab history.</p>
                        <div className="selection-indicator"></div>
                    </div>

                    <div 
                        className={`role-card ${selected === 'Staff' ? 'active' : ''}`}
                        onClick={() => setSelected('Staff')}
                    >
                        <div className="role-card-icon">
                            <User size={48} />
                        </div>
                        <h3>Faculty / Staff</h3>
                        <p>Approve bookings, oversee lab resources, and manage inventory.</p>
                        <div className="selection-indicator"></div>
                    </div>
                </div>

                <button 
                    className={`btn-proceed ${selected ? 'ready' : ''}`}
                    onClick={handleProceed}
                    disabled={!selected || isSubmitting}
                >
                    {isSubmitting ? 'Finalizing...' : 'Get Started'}
                    <ArrowRight size={20} />
                </button>

                <p className="role-footer">
                    This selection is permanent and determines your access level.
                </p>
            </div>

            <style>{`
                .role-selection-page {
                    min-height: calc(100vh - 80px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 2rem;
                    background: radial-gradient(circle at top right, rgba(var(--primary-rgb), 0.05), transparent),
                                radial-gradient(circle at bottom left, rgba(var(--primary-rgb), 0.05), transparent);
                }

                .role-container {
                    width: 100%;
                    max-width: 800px;
                    text-align: center;
                    animation: fadeIn 0.8s ease-out;
                }

                .role-header {
                    margin-bottom: 3rem;
                }

                .icon-badge {
                    width: 64px;
                    height: 64px;
                    background: var(--primary);
                    color: white;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 1.5rem;
                    box-shadow: 0 10px 25px -5px rgba(var(--primary-rgb), 0.4);
                }

                .role-header h1 {
                    font-size: 2.5rem;
                    font-weight: 800;
                    margin-bottom: 1rem;
                    letter-spacing: -1px;
                }

                .role-header p {
                    color: var(--text-muted);
                    font-size: 1.1rem;
                    max-width: 500px;
                    margin: 0 auto;
                }

                .role-header span {
                    color: var(--primary);
                    font-weight: 600;
                }

                .role-cards {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 2rem;
                    margin-bottom: 3rem;
                }

                .role-card {
                    background: var(--bg-card);
                    border: 2px solid var(--border-color);
                    border-radius: 24px;
                    padding: 2.5rem 2rem;
                    cursor: pointer;
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    position: relative;
                    overflow: hidden;
                }

                .role-card:hover {
                    transform: translateY(-10px);
                    border-color: var(--primary);
                    box-shadow: 0 20px 40px -15px rgba(0,0,0,0.1);
                }

                .role-card.active {
                    border-color: var(--primary);
                    background: rgba(var(--primary-rgb), 0.02);
                    box-shadow: 0 20px 40px -15px rgba(var(--primary-rgb), 0.15);
                }

                .role-card-icon {
                    width: 80px;
                    height: 80px;
                    background: var(--bg-secondary);
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 1.5rem;
                    color: var(--text-muted);
                    transition: all 0.3s ease;
                }

                .role-card.active .role-card-icon {
                    background: var(--primary);
                    color: white;
                }

                .role-card h3 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin-bottom: 1rem;
                }

                .role-card p {
                    color: var(--text-muted);
                    line-height: 1.6;
                    font-size: 0.95rem;
                }

                .selection-indicator {
                    position: absolute;
                    top: 1.5rem;
                    right: 1.5rem;
                    width: 24px;
                    height: 24px;
                    border: 2px solid var(--border-color);
                    border-radius: 50%;
                    transition: all 0.3s ease;
                }

                .role-card.active .selection-indicator {
                    border-color: var(--primary);
                    background: var(--primary);
                }

                .role-card.active .selection-indicator::after {
                    content: '✓';
                    color: white;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                }

                .btn-proceed {
                    background: var(--bg-secondary);
                    color: var(--text-muted);
                    border: none;
                    padding: 1.2rem 3rem;
                    border-radius: 16px;
                    font-size: 1.1rem;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin: 0 auto;
                    cursor: not-allowed;
                    transition: all 0.3s ease;
                }

                .btn-proceed.ready {
                    background: var(--primary);
                    color: white;
                    cursor: pointer;
                    box-shadow: 0 10px 20px -5px rgba(var(--primary-rgb), 0.4);
                }

                .btn-proceed.ready:hover {
                    transform: scale(1.05);
                    box-shadow: 0 15px 30px -5px rgba(var(--primary-rgb), 0.5);
                }

                .role-footer {
                    margin-top: 2rem;
                    color: var(--text-muted);
                    font-size: 0.85rem;
                    font-style: italic;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @media (max-width: 640px) {
                    .role-cards {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
};

export default RoleSelection;
