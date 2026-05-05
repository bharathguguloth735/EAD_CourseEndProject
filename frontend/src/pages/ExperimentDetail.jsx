import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
    ArrowLeft, 
    FlaskConical, 
    Target, 
    ListChecks, 
    Beaker, 
    SquareFunction, 
    ClipboardList, 
    CheckCircle2, 
    Microscope, 
    Calendar,
    ChevronRight,
    Zap,
    Download,
    Share2,
    Info,
    ShieldCheck,
    GraduationCap,
    Home,
    X,
    Clock
} from 'lucide-react';
import { jsPDF } from 'jspdf';

const categoryColor = { Electronics: '#3b82f6', Mechanical: '#10b981', Chemical: '#f59e0b', Computing: '#8b5cf6', Optics: '#f97316', Biology: '#ef4444' };

const ExperimentDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const { toast } = useToast();
    const [equipment, setEquipment] = useState(null);
    const [loading, setLoading] = useState(true);

    const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
    const themeColor = equipment ? (categoryColor[equipment.category] || '#3b82f6') : '#3b82f6';

    useEffect(() => {
        if (!id || id === 'undefined') {
            setLoading(false);
            return;
        }
        const fetchEquipment = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                // Try absolute then relative
                let res;
                try {
                    res = await axios.get(`http://localhost:5000/api/equipment/${id}`, {
                        headers: token ? { Authorization: `Bearer ${token}` } : {}
                    });
                } catch (e) {
                    res = await axios.get(`/api/equipment/${id}`, {
                        headers: token ? { Authorization: `Bearer ${token}` } : {}
                    });
                }
                setEquipment(res.data);
            } catch (err) {
                const msg = err.response?.data?.msg || 'Technical anomaly in protocol retrieval';
                toast.error(msg);
                console.error('PROTOCOL FETCH ERROR:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchEquipment();
    }, [id, toast]);

    const downloadProtocolPDF = () => {
        if (!equipment) return;

        try {
            const doc = new jsPDF();
        const margin = 20;
        let y = 20;

        // Header
        doc.setFontSize(22);
        doc.setTextColor(themeColor);
        doc.text('LAB SMART PORTAL', margin, y);
        y += 10;
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`DEPARTMENT: ${equipment.category?.toUpperCase() || 'GENERAL'} ENGINEERING`, margin, y);
        y += 15;

        doc.setDrawColor(themeColor);
        doc.setLineWidth(1);
        doc.line(margin, y, 190, y);
        y += 15;

        // Title
        doc.setFontSize(18);
        doc.setTextColor(0);
        doc.text((equipment.name || 'UNNAMED ASSET').toUpperCase(), margin, y);
        y += 15;

        // Aim
        doc.setFontSize(12);
        doc.setTextColor(themeColor);
        doc.text('AIM:', margin, y);
        y += 7;
        doc.setFontSize(10);
        doc.setTextColor(50);
        const aimText = equipment.aim || `To study and analyze the operational characteristics of the ${equipment.name || 'selected asset'} under standard laboratory conditions.`;
        const aimLines = doc.splitTextToSize(aimText, 170);
        doc.text(aimLines, margin, y);
        y += (aimLines.length * 5) + 10;

        // Materials
        doc.setFontSize(12);
        doc.setTextColor(themeColor);
        doc.text('REQUIRED MATERIALS:', margin, y);
        y += 7;
        doc.setFontSize(10);
        doc.setTextColor(50);
        const materials = equipment.requiredMaterials?.length > 0 ? equipment.requiredMaterials : ['Standard Lab Kit', 'Safety Gear', 'Measuring Instruments'];
        materials.forEach(item => {
            doc.text(`• ${item}`, margin + 5, y);
            y += 5;
        });
        y += 5;

        // Formula
        if (equipment.formula) {
            doc.setFontSize(12);
            doc.setTextColor(themeColor);
            doc.text('MATHEMATICAL FORMULA:', margin, y);
            y += 7;
            doc.setFontSize(11);
            doc.setTextColor(0);
            doc.setFont('courier', 'italic');
            doc.text(String(equipment.formula), margin + 10, y);
            doc.setFont('helvetica', 'normal');
            y += 15;
        }

        // Procedure
        doc.setFontSize(12);
        doc.setTextColor(themeColor);
        doc.text('STEP-BY-STEP PROCEDURE:', margin, y);
        y += 7;
        doc.setFontSize(10);
        doc.setTextColor(50);
        const steps = equipment.experimentSteps?.length > 0 ? equipment.experimentSteps : [
            `Initialize the ${equipment.name} and perform safety check.`,
            'Calibrate sensors according to protocol.',
            'Record baseline data points.'
        ];
        steps.forEach((step, i) => {
            const stepText = `${i + 1}. ${step}`;
            const stepLines = doc.splitTextToSize(stepText, 170);
            doc.text(stepLines, margin, y);
            y += (stepLines.length * 5) + 2;
        });
        y += 10;

        // Conclusion
        doc.setFontSize(12);
        doc.setTextColor(themeColor);
        doc.text('CONCLUSION:', margin, y);
        y += 7;
        doc.setFontSize(10);
        doc.setTextColor(50);
        const conclusionLines = doc.splitTextToSize(equipment.conclusion || "The experiment verifies the theoretical model within acceptable margins.", 170);
        doc.text(conclusionLines, margin, y);
        y += (conclusionLines.length * 5) + 10;

        // Theory
        if (equipment.theory) {
            if (y > 250) { doc.addPage(); y = 20; }
            doc.setFontSize(12);
            doc.setTextColor(themeColor);
            doc.text('THEORETICAL FOUNDATION:', margin, y);
            y += 7;
            doc.setFontSize(10);
            doc.setTextColor(50);
            const theoryLines = doc.splitTextToSize(equipment.theory, 170);
            doc.text(theoryLines, margin, y);
            y += (theoryLines.length * 5) + 10;
        }

        // Viva Questions
        if (equipment.vivaQuestions?.length > 0) {
            if (y > 230) { doc.addPage(); y = 20; }
            doc.setFontSize(12);
            doc.setTextColor(themeColor);
            doc.text('VIVA-VOCE PREPARATION:', margin, y);
            y += 7;
            doc.setFontSize(10);
            doc.setTextColor(50);
            equipment.vivaQuestions.forEach((q, i) => {
                const qLines = doc.splitTextToSize(`${i + 1}. ${q}`, 170);
                doc.text(qLines, margin, y);
                y += (qLines.length * 5) + 2;
            });
        }

        // Home Prep
        if (equipment.homePrep?.length > 0) {
            if (y > 230) { doc.addPage(); y = 20; }
            doc.setFontSize(12);
            doc.setTextColor(themeColor);
            doc.text('HOME PREPARATION KIT:', margin, y);
            y += 7;
            doc.setFontSize(10);
            doc.setTextColor(50);
            equipment.homePrep.forEach(item => {
                doc.text(`• ${item}`, margin + 5, y);
                y += 5;
            });
        }

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Page ${i} of ${pageCount} | Generated by Lab Smart Portal | Authorized Personnel Only`, 105, 285, { align: 'center' });
        }

        const fileName = `${(equipment.name || 'Lab_Asset').replace(/\s+/g, '_')}_Protocol.pdf`;
        doc.save(fileName);
        toast.success('Lab Protocol PDF downloaded successfully');
        } catch (err) {
            console.error('PDF GEN ERROR:', err);
            toast.error('Failed to generate PDF manual. Technical anomaly detected.');
        }
    };

    const shareProtocol = async () => {
        if (!equipment) return;
        
        const shareData = {
            title: `Lab Protocol: ${equipment.name}`,
            text: `Review the laboratory procedure for ${equipment.name} on the Lab Smart Portal.`,
            url: window.location.href
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
                toast.success('Protocol shared successfully');
            } else {
                await navigator.clipboard.writeText(window.location.href);
                toast.success('Protocol link copied to clipboard');
            }
        } catch (err) {
            console.error('SHARE ERROR:', err);
            if (err.name !== 'AbortError') {
                toast.error('Could not process sharing request');
            }
        }
    };

    const [showWaitlistModal, setShowWaitlistModal] = useState(false);
    const [waitlistForm, setWaitlistForm] = useState({ date: '', startTime: '', endTime: '' });

    const joinWaitlist = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_BASE}/api/waitlist`, {
                equipmentId: id, ...waitlistForm
            }, { headers: { Authorization: `Bearer ${token}` } });
            toast.success('Queue position secured. You will be notified via email.');
            setShowWaitlistModal(false);
            setWaitlistForm({ date: '', startTime: '', endTime: '' });
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Queue allocation failed');
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 font-black tracking-widest text-xs uppercase">Initializing Lab Protocol...</p>
        </div>
    );

    if (!equipment) return (
        <div className="container py-20 text-center">
            <h2 className="text-2xl font-black mb-4">PROTOCOL NOT FOUND</h2>
            <button onClick={() => navigate('/equipment')} className="btn btn-primary">Return to Registry</button>
        </div>
    );

    return (
        <div className="container py-10 max-w-5xl">
            {/* Header / Breadcrumbs */}
            <div className="flex items-center gap-4 mb-8">
                <button 
                    onClick={() => navigate(-1)}
                    className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-slate-300"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 text-[0.65rem] font-black uppercase tracking-widest" style={{ color: themeColor }}>
                        <span>Lab Registry</span>
                        <ChevronRight size={10} />
                        <span>{equipment.category}</span>
                        <ChevronRight size={10} />
                        <span className="text-slate-500">{equipment.toolType || 'Standard'}</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-100 tracking-tight">{equipment.name}</h1>
                </div>
                <div className="ml-auto flex gap-3">
                    <button 
                        onClick={downloadProtocolPDF}
                        className="protocol-btn py-2 px-4 border-slate-800 text-slate-400 hover:text-white"
                    >
                        <Download size={16} className="mr-2" /> PDF Manual
                    </button>
                    <button 
                        onClick={shareProtocol}
                        className="protocol-btn py-2 px-4 border-slate-800 text-slate-400 hover:text-white"
                    >
                        <Share2 size={16} className="mr-2" /> Share
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Aim Section */}
                    <section className="glass-panel p-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Target size={120} />
                        </div>
                        <h3 className="flex items-center gap-3 text-lg font-black text-slate-100 mb-6 uppercase tracking-wider">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${themeColor}20`, color: themeColor }}>
                                <Target size={20} />
                            </div>
                            Experiment Aim
                        </h3>
                        <p className="text-slate-300 leading-relaxed font-medium text-lg">
                            {equipment.aim || `To study and analyze the operational characteristics of the ${equipment.name} under specialized ${equipment.category} conditions.`}
                        </p>
                    </section>

                    {/* Materials & Formula */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <section className="glass-panel p-8">
                            <h3 className="flex items-center gap-3 text-sm font-black text-slate-100 mb-6 uppercase tracking-wider">
                                <Beaker size={18} style={{ color: themeColor }} /> Required Materials
                            </h3>
                            <ul className="space-y-3">
                                {(equipment.requiredMaterials?.length > 0 ? equipment.requiredMaterials : ['Standard Lab Kit', 'Safety Gear', 'Measuring Instruments']).map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-slate-400">
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: `${themeColor}60` }}></div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </section>
                        <section className="glass-panel p-8 border-l-4" style={{ borderLeftColor: `${themeColor}50` }}>
                            <h3 className="flex items-center gap-3 text-sm font-black text-slate-100 mb-6 uppercase tracking-wider">
                                <SquareFunction size={18} style={{ color: themeColor }} /> Formula & Logic
                            </h3>
                            <div className="p-6 bg-black/40 rounded-xl border border-white/5 font-mono text-center text-lg italic mb-4" style={{ color: themeColor }}>
                                {equipment.formula || 'F = m × a'}
                            </div>
                            <div className="text-[0.65rem] text-slate-500 uppercase font-black tracking-widest mb-2">Theoretical Base</div>
                            <p className="text-xs text-slate-400 leading-relaxed italic">
                                {equipment.theory || "Fundamental principles governing the operational dynamics of the asset in standard environments."}
                            </p>
                        </section>
                    </div>

                    {/* Detailed Procedure / Steps */}
                    <section className="glass-panel p-8">
                        <h3 className="flex items-center gap-3 text-lg font-black text-slate-100 mb-8 uppercase tracking-wider">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${themeColor}20`, color: themeColor }}>
                                <ClipboardList size={20} />
                            </div>
                            Step-by-Step Procedure
                        </h3>
                        <div className="space-y-6">
                            {(equipment.experimentSteps?.length > 0 ? equipment.experimentSteps : [
                                `Initialize the ${equipment.name} and verify structural integrity.`,
                                `Calibrate the ${equipment.category} sensors according to standard protocols.`,
                                'Record baseline data points before introducing test variables.',
                                'Execute the operational cycle and log real-time telemetry.'
                            ]).map((step, i) => (
                                <div key={i} className="flex gap-6 group">
                                    <div className="flex flex-col items-center">
                                        <div 
                                            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black text-slate-500 transition-all shrink-0"
                                            style={{ '--hover-border': themeColor, '--hover-text': themeColor }}
                                            onMouseEnter={e => { e.target.style.borderColor = themeColor; e.target.style.color = themeColor; }}
                                            onMouseLeave={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.color = 'rgb(100,116,139)'; }}
                                        >
                                            {String(i + 1).padStart(2, '0')}
                                        </div>
                                        {i < (equipment.experimentSteps?.length || 4) - 1 && (
                                            <div className="w-px flex-1 bg-white/5 my-2"></div>
                                        )}
                                    </div>
                                    <div className="pb-6">
                                        <p className="text-slate-300 leading-relaxed text-sm group-hover:text-slate-100 transition-colors">
                                            {step}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Observations & Conclusion */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <section className="glass-panel p-8">
                            <h3 className="flex items-center gap-3 text-sm font-black text-slate-100 mb-6 uppercase tracking-wider">
                                <ClipboardList size={18} style={{ color: themeColor }} /> Observation Matrix
                            </h3>
                            <div className="p-4 bg-black/40 rounded-xl border border-white/5 font-mono text-[0.65rem] text-slate-400 whitespace-pre-wrap leading-relaxed">
                                {equipment.observationsTable || "SL NO | VARIABLE A | VARIABLE B | RESULT\n---------------------------------------\n01    |          |          |       \n02    |          |          |       "}
                            </div>
                        </section>
                        <section className="glass-panel p-8 bg-white/5" style={{ borderTop: `2px solid ${themeColor}` }}>
                            <h3 className="flex items-center gap-3 text-sm font-black text-slate-100 mb-6 uppercase tracking-wider">
                                <CheckCircle2 size={18} style={{ color: themeColor }} /> Conclusion
                            </h3>
                            <div className="text-xs text-slate-300 leading-relaxed italic">
                                {equipment.conclusion || "Verification of the theoretical model through practical data analysis."}
                            </div>
                        </section>
                    </div>

                    {/* Viva Preparation */}
                    <section className="glass-panel p-8">
                        <h3 className="flex items-center gap-3 text-lg font-black text-slate-100 mb-8 uppercase tracking-wider">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${themeColor}20`, color: themeColor }}>
                                <GraduationCap size={20} />
                            </div>
                            Viva-Voce Diagnostic Questions
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {(equipment.vivaQuestions?.length > 0 ? equipment.vivaQuestions : [
                                "What are the primary sources of error in this experiment?",
                                "Explain the physical significance of the formula variables.",
                                "How does the environmental temperature affect the outcome?",
                                "Define the sensitivity of the measuring instruments used."
                            ]).map((q, i) => (
                                <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-primary/20 transition-all group">
                                    <div className="text-[0.6rem] font-black text-slate-500 mb-2 uppercase tracking-widest">Question {i+1}</div>
                                    <p className="text-sm text-slate-300 group-hover:text-slate-100 transition-colors font-medium">{q}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Sidebar Logistics */}
                <div className="space-y-8">
                    {/* Action Card */}
                    <div className="glass-panel p-6 shadow-2xl" style={{ borderColor: `${themeColor}30`, boxShadow: `0 25px 50px -12px ${themeColor}15` }}>
                        <div className="flex items-center justify-between mb-6">
                            <div className={`badge ${equipment.status === 'available' ? 'badge-success' : 'badge-danger'} px-3 py-1.5`}>
                                {equipment.status?.toUpperCase() || 'UNKNOWN'}
                            </div>
                            <div className="text-right">
                                <div className="text-[0.6rem] text-slate-500 font-black uppercase">Access Fee</div>
                                <div className="text-xl font-black text-slate-100">₹{equipment.pricePerHour}<span className="text-xs text-slate-500 ml-1">/HR</span></div>
                            </div>
                        </div>

                        {equipment.status === 'available' ? (
                            <Link 
                                to={`/book/${equipment._id}`} 
                                className="btn w-full py-4 font-black tracking-widest text-sm flex items-center justify-center gap-2 mb-4"
                                style={{ background: themeColor, color: 'white', boxShadow: `0 10px 20px -5px ${themeColor}40` }}
                            >
                                <Zap size={18} fill="currentColor" /> BOOK LABORATORY SLOT
                            </Link>
                        ) : (
                            <button 
                                onClick={() => setShowWaitlistModal(true)}
                                className="btn btn-outline w-full py-4 font-black tracking-widest text-sm flex items-center justify-center gap-2 mb-4 border-slate-700 hover:bg-slate-800 transition-all"
                            >
                                <Clock size={18} /> JOIN WAITING QUEUE
                            </button>
                        )}
                        
                        <p className="text-[0.65rem] text-center text-slate-500 font-bold uppercase tracking-tighter">
                            Authorized personnel only • Safety protocols mandatory
                        </p>
                    </div>

                    {/* Department / Logistics */}
                    <div className="glass-panel p-6 space-y-6">
                        <div>
                            <h4 className="text-[0.6rem] font-black uppercase tracking-[0.2em] mb-4" style={{ color: themeColor }}>Supervision Protocol</h4>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400">
                                        <Microscope size={20} />
                                    </div>
                                    <div>
                                        <div className="text-[0.6rem] text-slate-500 font-black uppercase">Department</div>
                                        <div className="text-sm font-extrabold text-slate-200">{equipment.category} Engineering</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400">
                                        <ClipboardList size={20} />
                                    </div>
                                    <div>
                                        <div className="text-[0.6rem] text-slate-500 font-black uppercase">Lead Faculty</div>
                                        <div className="text-sm font-extrabold text-slate-200">{equipment.facultyInCharge || 'Dr. Rajesh Kumar'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-white/5">
                            <h4 className="text-[0.6rem] font-black uppercase tracking-[0.2em] mb-4" style={{ color: themeColor }}>Asset Location</h4>
                            <div className="p-4 bg-black/40 rounded-xl border border-white/5 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${themeColor}20`, color: themeColor }}>
                                    <Beaker size={20} />
                                </div>
                                <div>
                                    <div className="text-xs font-black text-slate-200">Sector {equipment.labNumber} • {equipment.location}</div>
                                    <div className="text-[0.6rem] text-slate-500 font-bold uppercase">Main Laboratory Complex</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Safety Precautions */}
                    <div className="p-6 bg-amber-500/5 border border-amber-500/20 rounded-3xl">
                        <div className="flex items-center gap-2 text-amber-500 mb-4">
                            <ShieldCheck size={16} />
                            <span className="text-[0.65rem] font-black uppercase tracking-widest">Safety Protocols</span>
                        </div>
                        <ul className="space-y-3">
                            {(equipment.safetyPrecautions?.length > 0 ? equipment.safetyPrecautions : [
                                "Mandatory use of safety goggles and lab coats.",
                                "Ensure emergency cutoff is identified before power-on.",
                                "Maintain distance from moving parts/high-voltage zones."
                            ]).map((p, i) => (
                                <li key={i} className="flex gap-3 text-[0.7rem] text-amber-500/80 leading-relaxed font-medium">
                                    <div className="mt-1.5 w-1 h-1 rounded-full bg-amber-500 shrink-0"></div>
                                    {p}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Home Prep Kit */}
                    <div className="p-6 bg-blue-500/5 border border-blue-500/20 rounded-3xl">
                        <div className="flex items-center gap-2 text-blue-500 mb-4">
                            <Home size={16} />
                            <span className="text-[0.65rem] font-black uppercase tracking-widest">Home Preparation Kit</span>
                        </div>
                        <p className="text-[0.65rem] text-blue-400 mb-3 font-bold">Ensure these items are ready before your lab session:</p>
                        <div className="flex flex-wrap gap-2">
                            {(equipment.homePrep?.length > 0 ? equipment.homePrep : ["White Lab Coat (Mandatory)", "Observation Notebook", "Blue/Black Ink Pens", "Preliminary Research Notes"]).map((item, i) => (
                                <div key={i} className="px-3 py-1.5 bg-blue-500/10 rounded-lg text-[0.6rem] font-black text-blue-400 border border-blue-500/20 uppercase tracking-tighter">
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Waitlist Modal */}
            {showWaitlistModal && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[150] p-4 backdrop-blur-md">
                    <div className="glass-panel w-full max-w-md p-8 border-primary/30 shadow-2xl">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-xl font-black text-slate-100 uppercase tracking-tighter">Enter Waiting Queue</h3>
                                <p className="text-[0.6rem] text-slate-500 font-bold uppercase tracking-widest">Reserve a priority slot for the next session</p>
                            </div>
                            <button onClick={() => setShowWaitlistModal(false)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 transition-colors"><X size={20} /></button>
                        </div>

                        <form onSubmit={joinWaitlist} className="space-y-6">
                            <div className="form-group">
                                <label className="text-[0.65rem] font-black uppercase text-slate-400 mb-2 block">Requested Date</label>
                                <input 
                                    type="date" 
                                    className="form-control bg-black/40 border-white/10" 
                                    value={waitlistForm.date} 
                                    onChange={e => setWaitlistForm({...waitlistForm, date: e.target.value})} 
                                    required 
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="text-[0.65rem] font-black uppercase text-slate-400 mb-2 block">Start Time</label>
                                    <input 
                                        type="time" 
                                        className="form-control bg-black/40 border-white/10" 
                                        value={waitlistForm.startTime} 
                                        onChange={e => setWaitlistForm({...waitlistForm, startTime: e.target.value})} 
                                        required 
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="text-[0.65rem] font-black uppercase text-slate-400 mb-2 block">End Time</label>
                                    <input 
                                        type="time" 
                                        className="form-control bg-black/40 border-white/10" 
                                        value={waitlistForm.endTime} 
                                        onChange={e => setWaitlistForm({...waitlistForm, endTime: e.target.value})} 
                                        required 
                                    />
                                </div>
                            </div>
                            
                            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl mb-6">
                                <p className="text-[0.65rem] text-primary/80 leading-relaxed font-medium">
                                    Queue position is prioritized by submission timestamp. You will receive an automated email notification once a slot is allocated.
                                </p>
                            </div>

                            <button type="submit" className="btn btn-primary w-full py-4 font-black tracking-widest text-xs">
                                SECURE QUEUE POSITION
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExperimentDetail;
