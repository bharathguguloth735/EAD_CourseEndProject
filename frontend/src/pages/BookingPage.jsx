import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, MapPin, Clock, CheckCircle, Smartphone, CalendarDays, X, Shield, User, Info, ArrowRight, Wallet, Microscope, AlertTriangle } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { QRCodeSVG } from 'qrcode.react';
import { jsPDF } from 'jspdf';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const BookingPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const { toast } = useToast();
    const qrRef = useRef(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    const [equipment, setEquipment] = useState(null);
    const [step, setStep] = useState(1); // 1=Select Slot, 2=Review & Payment, 3=Success
    // Calculate current operational time for pre-fill using local time
    const getLocalDefaults = () => {
        const now = new Date();
        const nextHour = new Date(now);
        nextHour.setHours(now.getHours() + 1);
        nextHour.setMinutes(0);
        
        let h = nextHour.getHours();
        let d = new Date(now);
        
        if (h >= 20) { h = 8; d.setDate(d.getDate() + 1); }
        else if (h < 8) { h = 8; }

        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        
        // Calculate max date (2 months from now)
        const maxD = new Date(now);
        maxD.setMonth(maxD.getMonth() + 2);
        const maxDateStr = `${maxD.getFullYear()}-${String(maxD.getMonth() + 1).padStart(2, '0')}-${String(maxD.getDate()).padStart(2, '0')}`;
        
        const timeStr = `${String(h).padStart(2, '0')}:00`;
        return { dateStr, timeStr, maxDateStr };
    };

    const defaults = getLocalDefaults();

    const [formData, setFormData] = useState({
        date: defaults.dateStr,
        startTime: defaults.timeStr,
        duration: 1, // in hours
        purpose: '', 
        isRecurring: false, 
        recurrenceType: 'none', 
        recurrenceEnd: '' 
    });
    const [paymentMethod, setPaymentMethod] = useState('razorpay');
    const [loading, setLoading] = useState(false);
    const [bookingRef, setBookingRef] = useState('');
    const [fullBooking, setFullBooking] = useState(null);
    const [showCalendar, setShowCalendar] = useState(false);
    const [equipBookings, setEquipBookings] = useState([]);

    useEffect(() => {
        const fetchEquipment = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/equipment', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                const eq = res.data.find(e => e._id === id);
                if (eq) {
                    setEquipment(eq);
                } else {
                    setEquipment('NOT_FOUND');
                    toast.error('Strategic Asset not found in registry.');
                }
            } catch (err) { 
                toast.error('Failed to load equipment architecture.'); 
                setEquipment('NOT_FOUND');
            }
        };
        fetchEquipment();
    }, [id]);

    const fetchAvailability = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/bookings/equipment/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setEquipBookings(res.data);
            setShowCalendar(true);
        } catch { toast.error('Failed to load availability'); }
    };

    // Calculate end time and amount
    const calculateEndTime = () => {
        if (!formData.startTime) return '';
        const [h, m] = formData.startTime.split(':').map(Number);
        const endTotalMinutes = h * 60 + m + (formData.duration * 60);
        const eh = Math.floor(endTotalMinutes / 60);
        const em = endTotalMinutes % 60;
        return `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
    };

    const endTime = calculateEndTime();
    const recurrenceMultiplier = formData.recurrenceType === 'weekly' ? 4 : formData.recurrenceType === 'daily' ? 7 : 1;
    const baseAmount = Math.round(formData.duration * (equipment?.pricePerHour || 0)) * recurrenceMultiplier;
    const platformFee = 11.34;
    const amount = baseAmount + platformFee;

    const getValidity = (d) => {
        if (d === 1) return 2;
        if (d === 2) return 4;
        if (d === 4) return 6;
        if (d === 6) return 7;
        return d + 1;
    };
    const qrValidity = getValidity(formData.duration);

    const handleSlotNext = async () => {
        const day = new Date(formData.date).getDay();
        const [sh, sm] = formData.startTime.split(':').map(Number);
        const [eh, em] = endTime.split(':').map(Number);
        
        if (day === 0) { // Sunday
            if (sh < 9 || eh > 18 || (eh === 18 && em > 0)) {
                toast.error('Sunday Lab hours: 9:00 AM – 6:00 PM');
                return;
            }
        } else { // Mon-Sat
            if (sh < 8 || eh > 20 || (eh === 20 && em > 0)) {
                toast.error('Lab hours: 8:00 AM – 8:00 PM (Mon–Sat)');
                return;
            }
        }
        
        if (!formData.purpose || formData.purpose.trim() === '') {
            toast.error('Strategic Objective Required: Please state the purpose of your experiment.');
            return;
        }

        if (formData.isRecurring && !formData.recurrenceEnd) { toast.error('Select a recurrence end date.'); return; }

        // Proactive Overlap Check
        setLoading(true);
        try {
            const res = await axios.get(`http://localhost:5000/api/bookings/equipment/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const overlaps = res.data.some(b => {
                if (b.date !== formData.date) return false;
                // Treat both booked and pending_approval as occupied
                if (!['booked', 'pending_approval'].includes(b.status)) return false;
                
                const bStart = b.startTime;
                const bEnd = b.endTime;
                return (formData.startTime < bEnd && endTime > bStart);
            });

            if (overlaps) {
                toast.error('Temporal Conflict: This tactical window overlaps with an existing booking. Please Inspect Schedule.');
                setLoading(false);
                return;
            }
            setStep(2);
        } catch (err) {
            const status = err.response?.status ? `[${err.response.status}] ` : '';
            const msg = err.response?.data?.msg || err.response?.data?.message || err.message || 'Validation Failure';
            toast.error(`${status}Registry Check Failed: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    const processBooking = async (paymentDetails = {}) => {
        try {
            const res = await axios.post('http://localhost:5000/api/bookings', {
                equipmentId: id,
                ...formData,
                endTime, // explicitly send calculated end time
                paymentMethod,
                paymentStatus: paymentMethod === 'cash' ? 'pending' : 'paid',
                amount,
                ...paymentDetails
            }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            
            setBookingRef(res.data._id?.slice(-6).toUpperCase() || 'LAB001');
            setFullBooking(res.data);
            setStep(3);
            toast.success('Booking confirmed!');
        } catch (err) {
            console.error('Tactical Execution Failure:', err);
            const status = err.response?.status ? `[${err.response.status}] ` : '';
            const msg = err.response?.data?.msg || err.response?.data?.message || err.message || 'Unknown Protocol Error';
            toast.error(`${status}Mission Failure: ${msg}`);
        }
    };

    const handlePayment = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (paymentMethod === 'cash') {
            await processBooking();
            setLoading(false);
            return;
        }

        try {
            const orderRes = await axios.post('http://localhost:5000/api/payment/create-order', { amount }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            const options = {
                key: orderRes.data.keyId,
                amount: orderRes.data.amount,
                currency: orderRes.data.currency,
                name: "Private Lab Limited",
                description: `Booking for ${equipment.name}`,
                order_id: orderRes.data.orderId,
                handler: async (response) => {
                    try {
                        const verifyRes = await axios.post('http://localhost:5000/api/payment/verify', response, {
                            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                        });
                        if (verifyRes.data.success) {
                            await processBooking({
                                razorpayOrderId: response.razorpay_order_id,
                                razorpayPaymentId: response.razorpay_payment_id
                            });
                        } else { toast.error('Payment verification failed'); }
                    } catch (err) { toast.error('Payment verification error'); }
                },
                prefill: {
                    name: JSON.parse(localStorage.getItem('user')||'{}').name || "User",
                    email: JSON.parse(localStorage.getItem('user')||'{}').email || "email@example.com"
                },
                theme: { color: "#3b82f6" }
            };

            if (!window.Razorpay) {
                toast.error('Payment gateway could not be loaded. Please check your connection.');
                setLoading(false);
                return;
            }

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', (response) => toast.error(`Payment Failed: ${response.error.description}`));
            rzp.open();

        } catch (err) { 
            const status = err.response?.status ? `[${err.response.status}] ` : '';
            const msg = err.response?.data?.msg || err.response?.data?.message || err.message || 'Payment System Offline';
            toast.error(`${status}Strategic Error: ${msg}`); 
        }
        setLoading(false);
    };

    if (equipment === 'NOT_FOUND') return (
        <div className="text-center py-20">
            <AlertTriangle size={48} className="text-danger mb-4" style={{ margin: '0 auto' }} />
            <h2 style={{ fontWeight: 800 }}>RESOURCE NOT FOUND</h2>
            <p className="text-muted mb-8">The requested lab asset has been decommissioned or moved.</p>
            <button onClick={() => navigate('/equipment')} className="protocol-btn" style={{ margin: '0 auto' }}>RETURN TO REGISTRY</button>
        </div>
    );
    if (!equipment) return <div className="text-center py-12 text-muted">Loading equipment architecture...</div>;

    return (
        <div className="container" style={{ maxWidth: '1100px', padding: '3rem 1.5rem' }}>
            <div className="steps-indicator mb-10" style={{ justifyContent: 'center' }}>
                {[1, 2, 3].map((s, i) => (
                    <React.Fragment key={s}>
                        <div className={`step-dot ${step > s ? 'done' : step === s ? 'active' : ''}`}>
                            {step > s ? <CheckCircle size={14} /> : s}
                        </div>
                        {i < 2 && <div className={`step-line ${step > s ? 'done' : ''}`} style={{ width: '80px' }}></div>}
                    </React.Fragment>
                ))}
            </div>

            <div className="flex" style={{ gap: '3rem', alignItems: 'flex-start' }}>
                
                {/* Left Side: Progress & Steps (60% Width) */}
                <div style={{ flex: '1.4' }}>

                    <div className="card" style={{ padding: '2rem' }}>
                        {step === 1 && (
                            <div className="animate-in">
                                <div className="flex justify-between items-start mb-6">
                                    <h2 className="flex items-center gap-2" style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                                        <Calendar size={22} className="text-primary" /> Select Your Lab Slot
                                    </h2>
                                    <div className="flex flex-col items-end">
                                        <div className="flex items-center gap-2 text-slate-100 font-black tracking-tighter" style={{ fontSize: '1.1rem' }}>
                                            <div className="w-1 h-4 bg-primary rounded-full"></div>
                                            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div className="text-[0.55rem] font-black text-slate-500 uppercase tracking-widest">
                                            {currentTime.toLocaleDateString([], { weekday: 'short' })}, {currentTime.toLocaleDateString([], { day: '2-digit', month: 'short' })}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid-2 gap-4">
                                    <div className="form-group">
                                        <label>Preferred Date</label>
                                        <input type="date" className="form-control" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} min={defaults.dateStr} max={defaults.maxDateStr} />
                                    </div>
                                    <div className="form-group">
                                        <label>Start Time</label>
                                        <input type="time" className="form-control" value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} />
                                    </div>
                                </div>

                                <div className="form-group mt-2">
                                    <label className="flex justify-between items-center">
                                        <span>Experiment Duration</span>
                                        <span className="badge badge-info">{formData.duration} Hour(s)</span>
                                    </label>
                                    <div className="flex gap-2 mt-2">
                                        {[1, 2, 4, 6].map(h => (
                                            <button key={h} type="button" className={`btn ${formData.duration === h ? 'btn-primary' : 'btn-outline'} btn-sm`} style={{ flex: 1 }} onClick={() => setFormData({...formData, duration: h})}>
                                                {h}h
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Purpose of Experiment <span style={{ color: '#ef4444' }}>(Required)</span></label>
                                    <textarea className="form-control" placeholder="Briefly describe your objective (e.g. Research on Photonics)..." value={formData.purpose} onChange={e => setFormData({...formData, purpose: e.target.value})} rows={2} required></textarea>
                                </div>

                                <div className="form-group">
                                    <button 
                                        disabled={loading} 
                                        onClick={handleSlotNext} 
                                        className="btn btn-primary w-full btn-lg mt-4" 
                                        style={{ gap: '0.75rem', height: '3.5rem', fontWeight: 800 }}
                                    >
                                        {loading ? (
                                            <>Validating Tactical Window...</>
                                        ) : (
                                            <>Continue to Review <ArrowRight size={18} /></>
                                        )}
                                    </button>
                                </div>

                                <p className="text-center text-muted" style={{ fontSize: '0.75rem' }}>
                                    <Info size={12} /> Booking subject to equipment availability and maintenance checks.
                                </p>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="animate-in">
                                <h2 className="mb-6 flex items-center gap-2" style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                                    <Wallet size={22} className="text-primary" /> Review & Payment
                                </h2>

                                <div className="price-summary mb-6" style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid var(--border-color)', borderRadius: '1rem', padding: '1.5rem' }}>
                                    <div className="price-row"><span className="text-muted">Slot Assigned</span><strong style={{ color: '#fff' }}>{formData.date} | {formData.startTime} – {endTime}</strong></div>
                                    <div className="price-row"><span className="text-muted">Total Duration</span><span>{formData.duration} Hours</span></div>
                                    <div className="price-row"><span className="text-muted">Hourly Rate</span><span>₹{equipment.pricePerHour}</span></div>
                                    <div className="price-row"><span className="text-muted">Protocol Base</span><span>₹{baseAmount}</span></div>
                                    <div className="price-row"><span className="text-muted">Platform Fee (incl. GST)</span><span>₹{platformFee}</span></div>
                                    <div className="price-total mt-4 pt-4"><span style={{ fontWeight: 800, fontSize: '1.2rem' }}>Total Amount</span><span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#60a5fa' }}>₹{amount.toFixed(2)}</span></div>
                                    <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(239,68,68,0.1)', borderRadius: '0.5rem', fontSize: '0.7rem', color: '#f87171', fontWeight: 700, border: '1px dashed rgba(239,68,68,0.3)' }}>
                                        <AlertTriangle size={12} style={{ marginRight: '0.5rem' }} /> 
                                        QR Entry Token will be valid for <strong>{qrValidity} HOURS</strong> from the scheduled start time.
                                    </div>
                                </div>

                                <div className="payment-method-grid mb-6">
                                    <button type="button" className={`payment-method-btn ${paymentMethod === 'razorpay' ? 'selected' : ''}`} onClick={() => setPaymentMethod('razorpay')}>
                                        <div className="pm-icon">💳</div><div className="pm-label">Digital Payment</div>
                                    </button>
                                    <button type="button" className={`payment-method-btn ${paymentMethod === 'cash' ? 'selected' : ''}`} onClick={() => setPaymentMethod('cash')}>
                                        <div className="pm-icon">🏦</div><div className="pm-label">Lab Counter</div>
                                    </button>
                                </div>

                                <div className="flex gap-4">
                                    <button onClick={() => setStep(1)} className="btn btn-outline" style={{ flex: 1, height: '3.5rem', fontWeight: 700 }}>Modify Slot</button>
                                    <button onClick={handlePayment} className="btn btn-success" style={{ flex: 1, height: '3.5rem', fontWeight: 700 }}>
                                        {loading ? 'Initiating...' : `Secure Checkout (₹${amount.toFixed(2)})`}
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="text-center py-6 animate-in">
                                <div className="success-icon mb-4"><CheckCircle size={54} color="#10b981" /></div>
                                <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.75rem' }}>ALLOCATION SUCCESSFUL</h2>
                                <p className="text-muted mb-10" style={{ fontSize: '1.1rem' }}>Laboratory Entry Protocol #<strong>{bookingRef}</strong> has been initialized.</p>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2.5rem' }}>
                                    {/* Tactical QR Card */}
                                    <div className="card" style={{ padding: '2.5rem', background: 'white', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 0 40px rgba(59,130,246,0.3)', border: 'none' }}>
                                        <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                                            <div style={{ color: '#111', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.25rem', letterSpacing: '0.1em' }}>LABORATORY ENTRY TOKEN</div>
                                            <div style={{ color: '#ef4444', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>VALID FOR {qrValidity} HOURS</div>
                                        </div>
                                        <div style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '12px' }} ref={qrRef}>
                                            <QRCodeSVG value={JSON.stringify({ id: fullBooking?._id })} size={180} />
                                        </div>
                                        <div style={{ marginTop: '1.5rem', fontFamily: 'monospace', fontWeight: 900, fontSize: '1.1rem', color: '#1e293b', background: '#f1f5f9', padding: '0.4rem 1rem', borderRadius: '4px' }}>
                                            {bookingRef}
                                        </div>
                                    </div>

                                    <div className="card" style={{ width: '100%', maxWidth: '400px', textAlign: 'left', background: 'rgba(255,255,255,0.03)', padding: '1.5rem' }}>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.1em' }}>Operational Details</div>
                                        <div className="flex justify-between mb-3"><span className="text-muted">Target Asset</span> <strong>{equipment.name}</strong></div>
                                        <div className="flex justify-between mb-3"><span className="text-muted">Scheduled Date</span> <strong>{formData.date}</strong></div>
                                        <div className="flex justify-between mb-3"><span className="text-muted">Time Window</span> <strong>{formData.startTime} – {endTime}</strong></div>
                                        <div className="flex justify-between"><span className="text-muted">Bay Location</span> <strong className="text-primary">{equipment.location}</strong></div>
                                    </div>

                                    <div className="flex gap-4 w-full" style={{ maxWidth: '450px' }}>
                                        <button onClick={() => navigate('/dashboard')} className="protocol-btn" style={{ flex: 1, justifyContent: 'center' }}>COMMAND CENTER</button>
                                        <button onClick={() => {
                                            const doc = new jsPDF();
                                            doc.setFontSize(20);
                                            doc.text('Lab Smart Portal', 20, 25);
                                            doc.setFontSize(12);
                                            doc.text('ENTRY PROTOCOL TOKEN', 20, 35);
                                            doc.line(20, 40, 190, 40);
                                            doc.text(`Booking ID: ${fullBooking?._id}`, 20, 50);
                                            doc.text(`Equipment: ${equipment.name}`, 20, 60);
                                            doc.text(`Schedule: ${formData.date} | ${formData.startTime} - ${endTime}`, 20, 70);
                                            doc.text(`Location: ${equipment.location}`, 20, 80);
                                            
                                            if (paymentMethod === 'cash') {
                                                doc.setTextColor(239, 68, 68);
                                                doc.setFontSize(10);
                                                doc.text('PAYMENT PENDING: Please settle the amount at the Lab Counter.', 20, 92);
                                                doc.setTextColor(0, 0, 0);
                                                doc.setFontSize(12);
                                            }

                                            doc.text('Present this token at the laboratory entrance.', 20, 105);
                                            doc.setFontSize(10);
                                            doc.setTextColor(239, 68, 68);
                                            doc.text(`* AUTHENTICATION TOKEN VALID FOR ${qrValidity} HOURS FROM START TIME`, 20, 115);
                                            doc.setTextColor(0, 0, 0);
                                            doc.setFontSize(9);

                                            // Embed QR Code
                                            if (qrRef.current) {
                                                const svgElement = qrRef.current.querySelector('svg');
                                                const svgData = new XMLSerializer().serializeToString(svgElement);
                                                const canvas = document.createElement("canvas");
                                                canvas.width = 200;
                                                canvas.height = 200;
                                                const ctx = canvas.getContext("2d");
                                                const img = new Image();
                                                img.onload = () => {
                                                    ctx.drawImage(img, 0, 0, 200, 200);
                                                    const pngFile = canvas.toDataURL("image/png");
                                                    doc.addImage(pngFile, 'PNG', 140, 50, 40, 40);
                                                    doc.text('Scan for Access', 145, 95);
                                                    doc.save(`protocol_${bookingRef}.pdf`);
                                                    toast.success('Protocol Token downloaded!');
                                                };
                                                img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
                                            } else {
                                                doc.save(`protocol_${bookingRef}.pdf`);
                                                toast.success('Protocol Token downloaded!');
                                            }
                                        }} className="btn btn-primary" style={{ flex: 1, height: '3.5rem', fontWeight: 700 }}>DOWNLOAD TOKEN</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Equipment Card (40% Width) */}
                <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                        <div style={{ height: '160px', background: 'linear-gradient(135deg, #1e3a8a, #0f172a)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Microscope size={50} color="rgba(255,255,255,0.1)" style={{ position: 'absolute' }} />
                            <div style={{ position: 'absolute', bottom: '1.25rem', left: '1.25rem', right: '1.25rem' }}>
                                <span className="badge badge-purple mb-2" style={{ fontSize: '0.65rem' }}>{equipment.category}</span>
                                <h3 style={{ fontWeight: 800, fontSize: '1.25rem', lineHeight: 1.2 }}>{equipment.name}</h3>
                            </div>
                        </div>
                        
                        <div style={{ padding: '1.5rem' }}>
                            <div className="flex items-center gap-2 mb-4 text-muted" style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                                <MapPin size={16} className="text-primary" style={{ display: 'block' }} /> 
                                <span style={{ lineHeight: 1 }}>{equipment.location}</span>
                            </div>
                            
                            <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--text-muted)' }} className="mb-6">
                                {equipment.description || "High-precision laboratory equipment maintained for engineering and research protocols."}
                            </p>
                            
                            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div className="flex justify-between items-center">
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Condition</span>
                                    <span className="badge badge-success">Excellent</span>
                                </div>

                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ fontSize: '0.6rem', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.1em' }}>Personnel Oversight</div>
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center gap-3">
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Shield size={14} className="text-primary" />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                                                    {user.role?.toLowerCase() === 'staff' && user.department === equipment.category ? user.name : (equipment.facultyInCharge || 'Dr. Vikram Sarabhai')}
                                                </div>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Faculty In-Charge</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <User size={14} className="text-success" />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{equipment.labAssistant || 'Mr. Rajesh Gupta'}</div>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Lab Assistant</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <button onClick={fetchAvailability} className="btn btn-outline btn-sm w-full py-2.5" style={{ gap: '0.5rem', fontWeight: 800, borderRadius: '0.5rem', borderColor: 'var(--primary)', color: 'var(--primary)', background: 'rgba(59,130,246,0.05)' }}>
                                    <CalendarDays size={16} /> Inspect Schedule
                                </button>
                            </div>
                        </div>

                        {/* Integrated Safety Protocol */}
                        <div style={{ background: 'rgba(239,68,68,0.08)', borderTop: '1px solid rgba(239,68,68,0.15)', padding: '1.25rem' }}>
                            <div className="flex gap-3">
                                <Shield size={18} className="text-danger" style={{ marginTop: '2px', flexShrink: 0 }} />
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                                    <strong style={{ color: 'var(--text-main)' }}>Safety Protocol:</strong> Ensure you have completed the induction for this equipment before starting.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Availability Modal */}
            {showCalendar && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
                    <div className="card animate-in" style={{ width: '90%', maxWidth: '850px', height: '85vh', display: 'flex', flexDirection: 'column' }}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="flex items-center gap-3" style={{ fontWeight: 800 }}><CalendarDays size={24} className="text-primary" /> Availability Grid</h3>
                            <button onClick={() => setShowCalendar(false)} className="btn btn-outline btn-sm" style={{ minWidth: 'auto', padding: '0.5rem' }}><X size={20} /></button>
                        </div>
                        <div style={{ flex: 1, background: '#fff', color: '#111', borderRadius: '1rem', padding: '1rem', overflow: 'hidden' }}>
                            <BigCalendar
                                localizer={localizer}
                                events={equipBookings.map(b => ({ title: 'OCCUPIED', start: new Date(`${b.date}T${b.startTime}:00`), end: new Date(`${b.date}T${b.endTime}:00`) }))}
                                startAccessor="start" endAccessor="end"
                                views={['week','day']} defaultView="week"
                                min={new Date(2024,0,1,8,0,0)} max={new Date(2024,0,1,20,0,0)}
                                eventPropGetter={(e) => ({ style: { backgroundColor: '#ef4444', borderRadius: '6px', border: 'none', fontWeight: 700, fontSize: '0.7rem' } })}
                            />
                        </div>
                        <p className="mt-4 text-center text-muted" style={{ fontSize: '0.8rem' }}>Red blocks indicate existing bookings. Select a white space in the form behind to book.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingPage;
