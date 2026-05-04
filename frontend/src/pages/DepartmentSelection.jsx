import React, { useContext, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Cpu, Cog, FlaskConical, Database, Zap, Activity, ArrowRight, Microscope } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const DepartmentSelection = () => {
    const { user, selectDepartment } = useContext(AuthContext);
    const { toast } = useToast();
    const [selected, setSelected] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    // Only for Staff who haven't selected a department yet
    if (!user) return <Navigate to="/login" />;
    if (user.role !== 'Staff') return <Navigate to="/dashboard" />;
    if (user.department) return <Navigate to="/dashboard" />;

    const departments = [
        { id: 'Electronics', icon: <Cpu size={40} />, desc: 'Semiconductors, Circuitry, and Embedded Systems' },
        { id: 'Mechanical', icon: <Cog size={40} />, desc: 'Robotics, Thermodynamics, and Material Science' },
        { id: 'Chemical', icon: <FlaskConical size={40} />, desc: 'Synthesis, Titration, and Organic Compounds' },
        { id: 'Computing', icon: <Database size={40} />, desc: 'Mainframes, Neural Networks, and Data Storage' },
        { id: 'Optics', icon: <Zap size={40} />, desc: 'Lasers, Lenses, and Fiber Optic Research' },
        { id: 'Biology', icon: <Activity size={40} />, desc: 'Microscopy, Genetics, and Bio-Engineering' },
    ];

    const handleProceed = async () => {
        if (!selected) {
            toast.error('Please select your laboratory department');
            return;
        }

        setIsSubmitting(true);
        try {
            await selectDepartment(selected);
            toast.success(`Departmental Oversight Established: ${selected}`);
            navigate('/dashboard');
        } catch (err) {
            toast.error('Failed to establish oversight. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="dept-selection-page">
            <div className="dept-container">
                <div className="dept-header">
                    <div className="icon-badge">
                        <Microscope size={32} />
                    </div>
                    <h1>Establish Oversight</h1>
                    <p>Welcome, <span>{user.name}</span>. Select your laboratory department to initialize your management protocols.</p>
                </div>

                <div className="dept-grid">
                    {departments.map(dept => (
                        <div 
                            key={dept.id}
                            className={`dept-card ${selected === dept.id ? 'active' : ''}`}
                            onClick={() => setSelected(dept.id)}
                        >
                            <div className="dept-card-icon">
                                {dept.icon}
                            </div>
                            <h3>{dept.id}</h3>
                            <p>{dept.desc}</p>
                            <div className="selection-indicator"></div>
                        </div>
                    ))}
                </div>

                <button 
                    className={`btn-proceed ${selected ? 'ready' : ''}`}
                    onClick={handleProceed}
                    disabled={!selected || isSubmitting}
                >
                    {isSubmitting ? 'Initializing...' : 'Establish Oversight'}
                    <ArrowRight size={20} />
                </button>

                <p className="dept-footer">
                    This selection will lock your portal to the chosen department's inventory.
                </p>
            </div>

            <style>{`
                .dept-selection-page {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 4rem 2rem;
                    background: #0f172a;
                    color: white;
                }

                .dept-container {
                    width: 100%;
                    max-width: 1000px;
                    text-align: center;
                }

                .dept-header {
                    margin-bottom: 4rem;
                }

                .icon-badge {
                    width: 64px;
                    height: 64px;
                    background: #8b5cf6;
                    color: white;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 1.5rem;
                    box-shadow: 0 10px 25px rgba(139, 92, 246, 0.4);
                }

                .dept-header h1 {
                    font-size: 3rem;
                    font-weight: 900;
                    margin-bottom: 1rem;
                    letter-spacing: -0.02em;
                }

                .dept-header p {
                    color: #94a3b8;
                    font-size: 1.1rem;
                }

                .dept-header span {
                    color: #8b5cf6;
                    font-weight: 700;
                }

                .dept-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1.5rem;
                    margin-bottom: 4rem;
                }

                .dept-card {
                    background: #1e293b;
                    border: 2px solid #334155;
                    border-radius: 20px;
                    padding: 2.5rem 1.5rem;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                }

                .dept-card:hover {
                    border-color: #8b5cf6;
                    transform: translateY(-8px);
                    background: #253347;
                }

                .dept-card.active {
                    border-color: #8b5cf6;
                    background: rgba(139, 92, 246, 0.05);
                    box-shadow: 0 20px 40px rgba(139, 92, 246, 0.1);
                }

                .dept-card-icon {
                    color: #94a3b8;
                    margin-bottom: 1.5rem;
                    transition: color 0.3s ease;
                }

                .dept-card.active .dept-card-icon {
                    color: #8b5cf6;
                }

                .dept-card h3 {
                    font-size: 1.4rem;
                    font-weight: 800;
                    margin-bottom: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .dept-card p {
                    color: #64748b;
                    font-size: 0.85rem;
                    line-height: 1.5;
                }

                .selection-indicator {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    width: 20px;
                    height: 20px;
                    border: 2px solid #334155;
                    border-radius: 50%;
                }

                .dept-card.active .selection-indicator {
                    background: #8b5cf6;
                    border-color: #8b5cf6;
                }

                .btn-proceed {
                    background: #1e293b;
                    color: #64748b;
                    border: none;
                    padding: 1.25rem 3.5rem;
                    border-radius: 12px;
                    font-size: 1.1rem;
                    font-weight: 800;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin: 0 auto;
                    cursor: not-allowed;
                    transition: all 0.3s ease;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                }

                .btn-proceed.ready {
                    background: #8b5cf6;
                    color: white;
                    cursor: pointer;
                    box-shadow: 0 10px 30px rgba(139, 92, 246, 0.3);
                }

                .btn-proceed.ready:hover {
                    transform: scale(1.05);
                }

                .dept-footer {
                    margin-top: 2.5rem;
                    color: #475569;
                    font-size: 0.85rem;
                    font-style: italic;
                }

                @media (max-width: 900px) {
                    .dept-grid { grid-template-columns: repeat(2, 1fr); }
                }

                @media (max-width: 600px) {
                    .dept-grid { grid-template-columns: 1fr; }
                    .dept-header h1 { font-size: 2.2rem; }
                }
            `}</style>
        </div>
    );
};

export default DepartmentSelection;
