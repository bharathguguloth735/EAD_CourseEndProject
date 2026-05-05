import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Plus, Edit, Trash2, LayoutGrid, List, Search, MapPin, Clock, Star, Bell, X, Microscope, Cpu, Cog, FlaskConical, Database, Activity, ShieldCheck, Zap, AlertTriangle, Shield, Users, Settings } from 'lucide-react';

const CATEGORIES = ['All', 'Electronics', 'Mechanical', 'Chemical', 'Computing', 'Optics', 'Biology'];

const categoryColor = { Electronics: '#3b82f6', Mechanical: '#10b981', Chemical: '#f59e0b', Computing: '#8b5cf6', Optics: '#f97316', Biology: '#ef4444' };

const EquipmentList = () => {
    const { user } = useContext(AuthContext);
    const { toast } = useToast();
    const [equipment, setEquipment] = useState([]);
    const [ratings, setRatings] = useState({});
    
    // Modals
    const [showEqModal, setShowEqModal] = useState(false);
    const [showWaitlistModal, setShowWaitlistModal] = useState(null);
    const [showRateModal, setShowRateModal] = useState(null);
    const [showProcedureModal, setShowProcedureModal] = useState(null);
    
    // Forms
    const [formData, setFormData] = useState({ 
        name: '', description: '', status: 'available', category: 'Electronics', 
        pricePerHour: 50, totalSlots: 5, labNumber: 1, condition: 'Good', 
        location: 'Lab A', experimentSteps: '', moreDescription: '', 
        toolType: '', aim: '', requiredMaterials: '', formula: '', 
        conclusion: '', theory: '', safetyPrecautions: '', 
        observationsTable: '', vivaQuestions: '', homePrep: '' 
    });
    const [waitlistForm, setWaitlistForm] = useState({ date: '', startTime: '', endTime: '' });
    const [rateForm, setRateForm] = useState({ rating: 5, review: '' });
    
    const [editId, setEditId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterCategory, setFilterCategory] = useState('All');
    const [viewMode, setViewMode] = useState('grid');
    const [sortBy, setSortBy] = useState('name');

    const fetchEquipment = async () => {
        try { 
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/equipment', { headers: { Authorization: `Bearer ${token}` } });
            const eqData = Array.isArray(res.data) ? res.data : [];
            setEquipment(eqData);
            
            // Fetch ratings for all equipment
            const ratingsMap = {};
            await Promise.all(eqData.map(async (eq) => {
                try {
                    const rRes = await axios.get(`http://localhost:5000/api/ratings/${eq._id}`, { headers: { Authorization: `Bearer ${token}` } });
                    ratingsMap[eq._id] = rRes.data;
                } catch (e) {
                    ratingsMap[eq._id] = { average: 0, count: 0 };
                }
            }));
            setRatings(ratingsMap);
        }
        catch (err) { toast.error('Error fetching equipment matrix'); }
    };

    useEffect(() => { 
        if (user) fetchEquipment(); 
    }, [user]);

    const handleEqSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            // Format array fields: split by newline and filter empty
            const formattedData = {
                ...formData,
                experimentSteps: formData.experimentSteps.split('\n').filter(s => s.trim()),
                requiredMaterials: formData.requiredMaterials.split('\n').filter(m => m.trim()),
                safetyPrecautions: formData.safetyPrecautions.split('\n').filter(p => p.trim()),
                vivaQuestions: formData.vivaQuestions.split('\n').filter(q => q.trim()),
                homePrep: formData.homePrep.split('\n').filter(h => h.trim())
            };

            if (editId) { await axios.put(`http://localhost:5000/api/equipment/${editId}`, formattedData, config); }
            else { await axios.post('http://localhost:5000/api/equipment', formattedData, config); }
            setShowEqModal(false);
            toast.success('Asset registry updated');
            fetchEquipment();
        } catch (err) { toast.error('Failed to update asset registry'); }
    };

    const handleEqEdit = (eq) => {
        setFormData({ 
            name: eq.name, 
            description: eq.description, 
            status: eq.status, 
            category: eq.category || 'Electronics', 
            pricePerHour: eq.pricePerHour || 50, 
            totalSlots: eq.totalSlots || 5, 
            labNumber: eq.labNumber || 1, 
            condition: eq.condition || 'Good', 
            location: eq.location || 'Lab A',
            experimentSteps: (eq.experimentSteps || []).join('\n'),
            moreDescription: eq.moreDescription || '',
            toolType: eq.toolType || '',
            aim: eq.aim || '',
            requiredMaterials: (eq.requiredMaterials || []).join('\n'),
            formula: eq.formula || '',
            conclusion: eq.conclusion || '',
            theory: eq.theory || '',
            safetyPrecautions: (eq.safetyPrecautions || []).join('\n'),
            observationsTable: eq.observationsTable || '',
            vivaQuestions: (eq.vivaQuestions || []).join('\n'),
            homePrep: (eq.homePrep || []).join('\n')
        });
        setEditId(eq._id);
        setShowEqModal(true);
    };

    const handleEqDelete = async (id) => {
        if (!window.confirm('Initiate asset decommissioning? This action is irreversible.')) return;
        try { 
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/equipment/${id}`, { headers: { Authorization: `Bearer ${token}` } }); 
            toast.success('Asset decommissioned'); 
            fetchEquipment(); 
        }
        catch (err) { toast.error('Decommissioning protocol failed'); }
    };
    
    const joinWaitlist = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/waitlist', {
                equipmentId: showWaitlistModal._id, ...waitlistForm
            }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            toast.success('Queue position secured');
            setShowWaitlistModal(null);
            setWaitlistForm({ date: '', startTime: '', endTime: '' });
        } catch (err) { toast.error(err.response?.data?.msg || 'Queue allocation failed'); }
    };

    const submitRating = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/ratings', {
                equipmentId: showRateModal._id, ...rateForm
            }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            toast.success('Evaluation recorded');
            setShowRateModal(null);
            fetchEquipment();
        } catch (err) { toast.error('Evaluation transmission failed'); }
    };

    const openRateModal = async (eq) => {
        try {
            const res = await axios.get(`http://localhost:5000/api/ratings/my/${eq._id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            if (res.data) setRateForm({ rating: res.data.rating, review: res.data.review });
            else setRateForm({ rating: 5, review: '' });
            setShowRateModal(eq);
        } catch { toast.error('Error retrieving evaluation history'); }
    };

    if (!user) return <div className="text-center py-8">Synchronizing session...</div>;

    const filtered = (equipment || [])
        .filter(eq => {
            if (!eq) return false;
            if (user?.role?.toLowerCase() === 'staff' && user?.department) {
                if (eq.category?.toLowerCase() !== user.department?.toLowerCase()) return false;
            }
            const s = searchTerm.toLowerCase();
            const matchSearch = eq.name.toLowerCase().includes(s) || (eq.description || '').toLowerCase().includes(s);
            const matchStatus = filterStatus === 'all' || eq.status === filterStatus;
            const matchCat = filterCategory === 'All' || eq.category === filterCategory;
            return matchSearch && matchStatus && matchCat;
        })
        .sort((a, b) => {
            if (sortBy === 'price') return (a.pricePerHour || 0) - (b.pricePerHour || 0);
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            if (sortBy === 'department') return (a.category || '').localeCompare(b.category || '');
            return 0;
        });

    const statusBadge = { available: 'badge-success', unavailable: 'badge-danger', maintenance: 'badge-warning' };

    return (
        <div className="equipment-page">
            <div className="glass-panel mb-10 p-8" style={{ borderBottom: '1px solid var(--primary)' }}>
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                    <div>
                        <div className="hero-badge mb-3">
                            <Zap size={14} fill="currentColor" /> Strategic Registry
                        </div>
                        <h1 className="text-4xl font-black tracking-tighter" style={{ textTransform: 'uppercase' }}>
                            {user.role === 'Staff' ? `${user.department} Inventory` : 'Asset Matrix'}
                        </h1>
                        <p className="text-muted text-sm font-bold tracking-widest uppercase mt-1 opacity-60">Protocol: Resource Allocation & Real-time Monitoring</p>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        {user.role === 'Admin' && (
                            <button onClick={() => { setEditId(null); setFormData({ name: '', description: '', status: 'available', category: 'Electronics', pricePerHour: 50, totalSlots: 5, labNumber: 1, condition: 'Good', location: 'Lab A' }); setShowEqModal(true); }} className="btn btn-primary" style={{ height: '48px', padding: '0 1.5rem', fontWeight: 800 }}>
                                <Plus size={20} strokeWidth={3} /> REGISTER ASSET
                            </button>
                        )}
                    </div>
                </div>

                <div className="mt-16 flex flex-col gap-24">
                    {/* Level 1: Search & Navigation */}
                    <div className="flex gap-6 items-center">
                        <div className="search-pill flex-1">
                            <Search size={20} className="text-primary" />
                            <input type="text" placeholder="Search mission assets by name, location, or tag..." className="bg-transparent border-none outline-none w-full text-sm font-medium placeholder:text-slate-600" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                        <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} className="protocol-btn" style={{ minWidth: '55px', height: '52px', justifyContent: 'center' }}>
                            {viewMode === 'grid' ? <List size={22} /> : <LayoutGrid size={22} />}
                        </button>
                    </div>

                    {/* Level 2: Industrial Department Selectors */}
                    <div className="flex flex-wrap gap-8 py-6 border-y border-white/5">
                        {CATEGORIES.map(cat => {
                            const Icon = {
                                All: LayoutGrid,
                                Electronics: Cpu,
                                Mechanical: Settings,
                                Chemical: FlaskConical,
                                Computing: Database,
                                Optics: Zap,
                                Biology: Microscope
                            }[cat] || Activity;

                            return (
                                <button 
                                    key={cat}
                                    onClick={() => setFilterCategory(cat)}
                                    className={`category-box ${filterCategory === cat ? 'active' : ''}`}
                                >
                                    <Icon size={20} />
                                    <span>{cat}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Level 3: Tactical Sorting Suite */}
                    <div className="flex justify-center items-center gap-20 pt-4">
                        <div className="control-group" style={{ minWidth: '220px' }}>
                            <div className="pl-4 text-primary"><Shield size={18} /></div>
                            <select className="control-select" style={{ fontSize: '0.85rem', padding: '0.8rem 1rem' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                                <option value="all">ALL OPERATIONAL STATUS</option>
                                <option value="available">AVAILABLE UNITS</option>
                                <option value="unavailable">OCCUPIED ASSETS</option>
                                <option value="maintenance">UNDER MAINTENANCE</option>
                            </select>
                        </div>

                        <div className="control-group" style={{ minWidth: '220px' }}>
                            <div className="pl-4 text-primary"><Settings size={18} /></div>
                            <select className="control-select" style={{ fontSize: '0.85rem', padding: '0.8rem 1rem' }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
                                <option value="name">SORT: ALPHABETICAL</option>
                                <option value="price">SORT: ACCESSIBILITY FEE</option>
                                <option value="department">SORT: DEPARTMENT</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {viewMode === 'grid' ? (
                <div className="grid-responsive-3" style={{ marginTop: '2rem' }}>
                    {filtered.map(eq => (
                        <div key={eq._id} className="equip-card p-0 flex flex-col group">
                            <div className="p-6 border-b border-white/5 relative">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-[0.65rem] font-black tracking-widest text-primary/60 group-hover:text-primary transition-colors">#{eq._id.slice(-6).toUpperCase()}</span>
                                    <span className={`badge ${statusBadge[eq.status]} border border-current opacity-80`} style={{ fontSize: '0.6rem' }}>{eq.status.toUpperCase()}</span>
                                </div>
                                <h3 className="font-extrabold text-xl mb-1 tracking-tight group-hover:text-primary transition-colors">{eq.name}</h3>
                                <div className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-widest mb-3">{eq.toolType || 'Standard Equipment'}</div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[0.65rem] px-2.5 py-1 rounded-full bg-white/5 text-slate-400 border border-white/10 font-bold uppercase tracking-wider">{eq.category}</span>
                                    {ratings[eq._id]?.count > 0 && (
                                        <div className="flex items-center gap-1.5 ml-auto">
                                            <div className="flex gap-0.5">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} size={8} fill={i < Math.round(ratings[eq._id].average) ? "currentColor" : "none"} className={i < Math.round(ratings[eq._id].average) ? "text-yellow-500" : "text-slate-700"} />
                                                ))}
                                            </div>
                                            <span className="text-[0.7rem] font-bold text-slate-400">{ratings[eq._id].average}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="p-6 flex-1 bg-gradient-to-b from-transparent to-black/20">
                                <div className="mb-4">
                                    <div className="text-[0.55rem] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <div className="w-4 h-px bg-slate-700"></div> Scientific Abstract
                                    </div>
                                    <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed italic">
                                        {eq.aim || eq.description || 'Precision-engineered asset maintained for high-stakes research and industrial protocols.'}
                                    </p>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex flex-col gap-1">
                                        <label className="text-[0.55rem] text-primary font-black uppercase tracking-widest">Bay Location</label>
                                        <div className="text-sm font-bold flex items-center gap-2 text-slate-200"><MapPin size={14} className="text-primary" /> {eq.location}</div>
                                    </div>
                                    <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex flex-col gap-1">
                                        <label className="text-[0.55rem] text-primary font-black uppercase tracking-widest">Access Fee</label>
                                        <div className="text-sm font-bold text-slate-200">₹{eq.pricePerHour}<span className="text-[0.6rem] text-slate-500 ml-1">/HR</span></div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center py-3 px-4 bg-primary/5 rounded-xl border border-primary/20">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                                        <span className="text-[0.65rem] font-bold text-primary uppercase tracking-widest">Operational Capacity</span>
                                    </div>
                                    <span className="text-sm font-black text-slate-200">{eq.totalSlots} UNITS</span>
                                </div>
                            </div>

                            <div className="p-4 bg-white/5 border-t border-white/5 flex flex-col gap-4">
                                {eq.status === 'available' ? (
                                    <div className="flex flex-col gap-3">
                                        {user.role === 'Student' ? (
                                            <>
                                                <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 rounded-lg border border-green-500/20">
                                                    <Zap size={14} className="text-green-500" />
                                                    <span className="text-[0.6rem] font-black text-green-500 uppercase tracking-widest">Instant Booking Available</span>
                                                </div>
                                                <Link to={`/book/${eq._id}`} className="btn btn-primary w-full text-[0.7rem] font-black tracking-widest shadow-lg shadow-primary/20 h-12 flex items-center justify-center gap-2">
                                                    <Zap size={16} fill="currentColor" /> INITIALIZE MISSION BOOKING
                                                </Link>
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg border border-primary/20">
                                                    <ShieldCheck size={14} className="text-primary" />
                                                    <span className="text-[0.6rem] font-black text-primary uppercase tracking-widest">Manual Review Required</span>
                                                </div>
                                                <Link to={`/experiment/${eq._id}`} className="btn btn-primary w-full text-[0.7rem] font-black tracking-widest shadow-lg shadow-primary/20 h-12 flex items-center justify-center gap-2">
                                                    <Microscope size={16} /> EXPLORE EXPERIMENT MANUAL
                                                </Link>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <button onClick={() => setShowWaitlistModal(eq)} className="btn btn-outline w-full text-[0.7rem] font-black tracking-widest h-12 border-slate-700 flex items-center justify-center gap-2">
                                        <Clock size={16} /> ENTER WAITING QUEUE
                                    </button>
                                )}
                                <div className="flex gap-2 border-t border-white/5 pt-3">
                                    <button onClick={() => openRateModal(eq)} className="protocol-btn flex-1 h-10 justify-center border-slate-800 text-[0.6rem] font-bold gap-2" title="Rate Asset">
                                        <Star size={14} /> EVALUATE
                                    </button>
                                    {user.role === 'Admin' && (
                                        <>
                                            <button onClick={() => handleEqEdit(eq)} className="protocol-btn p-0 w-10 h-10 justify-center border-slate-800" title="Edit Registry"><Edit size={14} /></button>
                                            <button onClick={() => handleEqDelete(eq._id)} className="protocol-btn p-0 w-10 h-10 justify-center border-danger/20 text-danger" title="Decommission"><Trash2 size={14} /></button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="glass-panel overflow-hidden">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-white/5">
                                <th className="p-5 border-b border-white/10 font-black tracking-widest uppercase text-[0.65rem] text-primary">Mission Resource</th>
                                <th className="p-5 border-b border-white/10 font-black tracking-widest uppercase text-[0.65rem] text-primary">Department</th>
                                <th className="p-5 border-b border-white/10 font-black tracking-widest uppercase text-[0.65rem] text-primary">Status</th>
                                <th className="p-5 border-b border-white/10 font-black tracking-widest uppercase text-[0.65rem] text-primary">Fee (HR)</th>
                                <th className="p-5 border-b border-white/10 font-black tracking-widest uppercase text-[0.65rem] text-primary text-right">Operational Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(eq => (
                                <tr key={eq._id} className="border-t border-white/5 hover:bg-white/5 transition-all group">
                                    <td className="p-5">
                                        <div className="font-extrabold text-slate-200 group-hover:text-primary transition-colors">{eq.name}</div>
                                        <div className="text-[0.65rem] text-slate-500 font-bold uppercase tracking-wider">{eq.toolType || 'Standard Asset'} • {eq.location}</div>
                                    </td>
                                    <td className="p-5">
                                        <span className="text-[0.6rem] px-2.5 py-1 rounded-full bg-white/5 border border-white/10 font-black text-slate-400 uppercase tracking-widest">{eq.category}</span>
                                    </td>
                                    <td className="p-5">
                                        <span className={`badge ${statusBadge[eq.status]} border border-current opacity-80`} style={{ fontSize: '0.6rem' }}>{eq.status.toUpperCase()}</span>
                                    </td>
                                    <td className="p-5 font-black text-slate-200">₹{eq.pricePerHour}</td>
                                    <td className="p-5 text-right">
                                        <div className="flex gap-2 justify-end">
                                            {eq.status === 'available' ? (
                                                <Link to={`/experiment/${eq._id}`} className="btn btn-primary btn-sm px-4 font-black text-[0.65rem] tracking-widest uppercase">Procedure</Link>
                                            ) : (
                                                <button onClick={() => setShowWaitlistModal(eq)} className="btn btn-outline btn-sm px-4 font-black text-[0.65rem] tracking-widest border-slate-700">QUEUE</button>
                                            )}
                                            {user.role === 'Admin' && (
                                                <button onClick={() => handleEqEdit(eq)} className="protocol-btn p-2" title="Edit"><Edit size={14} /></button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modals are unchanged but included for completeness */}
            {showEqModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
                    <div className="card w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold">Asset Registry Protocol</h3>
                            <button onClick={() => setShowEqModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleEqSubmit} className="space-y-4">
                            <div className="form-group">
                                <label>Asset Name</label>
                                <input type="text" className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label>Tool Type / Specialization</label>
                                <input type="text" className="form-control" value={formData.toolType} onChange={e => setFormData({...formData, toolType: e.target.value})} placeholder="e.g. Lathe Machine, Reagent, Laser" />
                            </div>
                            <div className="form-group">
                                <label>Protocol Description</label>
                                <textarea className="form-control" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label>Category</label>
                                    <select className="form-control" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                                        {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select className="form-control" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                                        <option value="available">Available</option>
                                        <option value="unavailable">Occupied</option>
                                        <option value="maintenance">Maintenance</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Cost / Hr</label>
                                    <input type="number" className="form-control" value={formData.pricePerHour} onChange={e => setFormData({...formData, pricePerHour: Number(e.target.value)})} />
                                </div>
                                <div className="form-group">
                                    <label>Total Units</label>
                                    <input type="number" className="form-control" value={formData.totalSlots} onChange={e => setFormData({...formData, totalSlots: Number(e.target.value)})} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Detailed Experiment Procedure (One step per line)</label>
                                <textarea className="form-control" rows={5} value={formData.experimentSteps} onChange={e => setFormData({...formData, experimentSteps: e.target.value})} placeholder="Step 1: Calibrate...&#10;Step 2: Connect..." />
                            </div>
                            <div className="form-group">
                                <label>Advanced Asset Specifications</label>
                                <textarea className="form-control" rows={3} value={formData.moreDescription} onChange={e => setFormData({...formData, moreDescription: e.target.value})} placeholder="Additional technical details, safety warnings, etc." />
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="form-group">
                                    <label>Experiment Aim</label>
                                    <textarea className="form-control" value={formData.aim} onChange={e => setFormData({...formData, aim: e.target.value})} placeholder="Primary objective of the lab mission..." />
                                </div>
                                <div className="form-group">
                                    <label>Required Materials (One per line)</label>
                                    <textarea className="form-control" value={formData.requiredMaterials} onChange={e => setFormData({...formData, requiredMaterials: e.target.value})} placeholder="Standard Lab Kit&#10;Safety Gear..." />
                                </div>
                                <div className="form-group">
                                    <label>Mathematical Formula</label>
                                    <input type="text" className="form-control" value={formData.formula} onChange={e => setFormData({...formData, formula: e.target.value})} placeholder="e.g. F = m × a" />
                                </div>
                                <div className="form-group">
                                    <label>Conclusion / Inference Template</label>
                                    <textarea className="form-control" value={formData.conclusion} onChange={e => setFormData({...formData, conclusion: e.target.value})} placeholder="Expected outcome or analytical summary..." />
                                </div>
                                <div className="form-group">
                                    <label>Theoretical Foundation</label>
                                    <textarea className="form-control" rows={3} value={formData.theory} onChange={e => setFormData({...formData, theory: e.target.value})} placeholder="Underlying scientific principles..." />
                                </div>
                                <div className="form-group">
                                    <label>Safety Precautions (One per line)</label>
                                    <textarea className="form-control" value={formData.safetyPrecautions} onChange={e => setFormData({...formData, safetyPrecautions: e.target.value})} placeholder="Wear Goggles&#10;Check grounding..." />
                                </div>
                                <div className="form-group">
                                    <label>Observations Table Template</label>
                                    <textarea className="form-control font-mono" rows={3} value={formData.observationsTable} onChange={e => setFormData({...formData, observationsTable: e.target.value})} placeholder="SL | VAR A | VAR B | RES..." />
                                </div>
                                <div className="form-group">
                                    <label>Viva-Voce Questions (One per line)</label>
                                    <textarea className="form-control" value={formData.vivaQuestions} onChange={e => setFormData({...formData, vivaQuestions: e.target.value})} placeholder="Why use this sensor?&#10;Define precision..." />
                                </div>
                                <div className="form-group">
                                    <label>Home Preparation Kit (One per line)</label>
                                    <textarea className="form-control" value={formData.homePrep} onChange={e => setFormData({...formData, homePrep: e.target.value})} placeholder="White Lab Coat&#10;Observation Notebook..." />
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary w-full py-3 font-bold mt-4">EXECUTE UPDATE</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Procedure Modal */}
            {showProcedureModal && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[110] p-4 backdrop-blur-md">
                    <div className="card w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border-primary/30 shadow-2xl shadow-primary/10">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-primary/5">
                            <div>
                                <div className="text-[0.6rem] text-primary font-black uppercase tracking-[0.2em] mb-1">Operational Protocol</div>
                                <h2 className="text-2xl font-black text-slate-100">{showProcedureModal.name}</h2>
                            </div>
                            <button onClick={() => setShowProcedureModal(null)} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><X size={24} /></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <div className="space-y-8">
                                {/* Overview */}
                                <div>
                                    <h4 className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <div className="w-4 h-1 bg-primary"></div> Executive Summary
                                    </h4>
                                    <p className="text-slate-300 leading-relaxed text-sm">
                                        {showProcedureModal.moreDescription || showProcedureModal.description || 'No advanced description available for this asset designation.'}
                                    </p>
                                </div>

                                {/* Steps */}
                                <div>
                                    <h4 className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <div className="w-4 h-1 bg-primary"></div> Procedural Workflow
                                    </h4>
                                    <div className="space-y-4">
                                        {showProcedureModal.experimentSteps && showProcedureModal.experimentSteps.length > 0 ? (
                                            showProcedureModal.experimentSteps.map((step, index) => (
                                                <div key={index} className="flex gap-4 p-4 bg-white/5 rounded-xl border border-white/5 group hover:border-primary/20 transition-colors">
                                                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                                                        {index + 1}
                                                    </div>
                                                    <div className="text-sm text-slate-200 leading-relaxed pt-1">{step}</div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-6 bg-white/5 rounded-xl border border-dashed border-white/10 text-center italic text-slate-500 text-sm">
                                                Standard operating procedures pending administrative authorization.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Logistics */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                                        <div className="text-[0.55rem] text-primary font-black uppercase tracking-widest mb-1">Supervisor</div>
                                        <div className="text-xs font-bold text-slate-300">{showProcedureModal.facultyInCharge || 'Dept Head'}</div>
                                    </div>
                                    <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                                        <div className="text-[0.55rem] text-primary font-black uppercase tracking-widest mb-1">Technical Support</div>
                                        <div className="text-xs font-bold text-slate-300">{showProcedureModal.labAssistant || 'On-call Staff'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-white/5 border-t border-white/5 flex gap-4">
                            <button onClick={() => setShowProcedureModal(null)} className="btn btn-outline flex-1 h-12 font-black tracking-widest text-[0.7rem] border-slate-700">CLOSE PROTOCOL</button>
                            <Link to={`/book/${showProcedureModal._id}`} className="btn btn-primary flex-[1.5] h-12 font-black tracking-widest text-[0.7rem] shadow-lg shadow-primary/20">
                                <Zap size={16} fill="currentColor" /> INITIALIZE MISSION ALLOCATION
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EquipmentList;
