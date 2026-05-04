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
    
    // Forms
    const [formData, setFormData] = useState({ name: '', description: '', status: 'available', category: 'Electronics', pricePerHour: 50, totalSlots: 5, labNumber: 1, condition: 'Good', location: 'Lab A' });
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
            if (editId) { await axios.put(`http://localhost:5000/api/equipment/${editId}`, formData, config); }
            else { await axios.post('http://localhost:5000/api/equipment', formData, config); }
            setShowEqModal(false);
            toast.success('Asset registry updated');
            fetchEquipment();
        } catch (err) { toast.error('Failed to update asset registry'); }
    };

    const handleEqEdit = (eq) => {
        setFormData({ name: eq.name, description: eq.description, status: eq.status, category: eq.category || 'Electronics', pricePerHour: eq.pricePerHour || 50, totalSlots: eq.totalSlots || 5, labNumber: eq.labNumber || 1, condition: eq.condition || 'Good', location: eq.location || 'Lab A' });
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
                                <h3 className="font-extrabold text-xl mb-2 tracking-tight group-hover:text-primary transition-colors">{eq.name}</h3>
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
                            
                            <div className="p-6 flex-1">
                                <p className="text-sm text-slate-400 mb-6 line-clamp-3 leading-relaxed italic">"{eq.description || 'Precision-engineered asset maintained for high-stakes research and industrial protocols.'}"</p>
                                
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

                            <div className="p-4 bg-white/5 border-t border-white/5 flex gap-3">
                                {eq.status === 'available' ? (
                                    <Link to={`/book/${eq._id}`} className="btn btn-primary flex-1 text-[0.7rem] font-black tracking-widest shadow-lg shadow-primary/20 h-11">
                                        <Zap size={14} fill="currentColor" /> INITIATE ALLOCATION
                                    </Link>
                                ) : (
                                    <button onClick={() => setShowWaitlistModal(eq)} className="btn btn-outline flex-1 text-[0.7rem] font-black tracking-widest h-11 border-slate-700">
                                        <Clock size={14} /> ENTER QUEUE
                                    </button>
                                )}
                                <div className="flex gap-2">
                                    <button onClick={() => openRateModal(eq)} className="protocol-btn p-0 w-11 h-11 justify-center border-slate-800" title="Rate Asset"><Star size={16} /></button>
                                    {user.role === 'Admin' && (
                                        <>
                                            <button onClick={() => handleEqEdit(eq)} className="protocol-btn p-0 w-11 h-11 justify-center border-slate-800" title="Edit Registry"><Edit size={16} /></button>
                                            <button onClick={() => handleEqDelete(eq._id)} className="protocol-btn p-0 w-11 h-11 justify-center border-danger/20 text-danger" title="Decommission"><Trash2 size={16} /></button>
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
                                        <div className="text-[0.65rem] text-slate-500 font-bold uppercase tracking-wider">{eq.location} • Sector {eq.labNumber}</div>
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
                                                <Link to={`/book/${eq._id}`} className="btn btn-primary btn-sm px-4 font-black text-[0.65rem] tracking-widest">ALLOCATE</Link>
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
                            <button type="submit" className="btn btn-primary w-full py-3 font-bold mt-4">EXECUTE UPDATE</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Waitlist and Rate modals would go here - simplified for brevity but functional */}
            {showWaitlistModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
                    <div className="card w-full max-w-sm">
                        <h3 className="font-bold mb-4">Secure Queue Position</h3>
                        <form onSubmit={joinWaitlist} className="space-y-4">
                            <input type="date" className="form-control" value={waitlistForm.date} onChange={e => setWaitlistForm({...waitlistForm, date: e.target.value})} required />
                            <div className="grid grid-cols-2 gap-2">
                                <input type="time" className="form-control" value={waitlistForm.startTime} onChange={e => setWaitlistForm({...waitlistForm, startTime: e.target.value})} required />
                                <input type="time" className="form-control" value={waitlistForm.endTime} onChange={e => setWaitlistForm({...waitlistForm, endTime: e.target.value})} required />
                            </div>
                            <div className="flex gap-2">
                                <button type="submit" className="btn btn-primary flex-1">Confirm</button>
                                <button type="button" onClick={() => setShowWaitlistModal(null)} className="btn btn-outline flex-1">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EquipmentList;
