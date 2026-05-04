const express = require('express');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Equipment = require('../models/Equipment');
const { auth, adminAuth } = require('../middleware/auth');
const { Parser } = require('json2csv');
const { sendBookingEmail } = require('../utils/mailer');
const Notification = require('../models/Notification');

const router = express.Router();

// Helper to check for overlapping bookings
const isOverlapping = async (equipmentId, date, startTime, endTime, excludeBookingId = null) => {
    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) return false;

    const query = {
        equipmentId,
        date,
        status: { $in: ['booked', 'pending_approval'] },
        $or: [
            { $and: [{ startTime: { $lt: endTime } }, { endTime: { $gt: startTime } }] }
        ]
    };
    if (excludeBookingId) {
        query._id = { $ne: excludeBookingId };
    }
    
    const count = await Booking.countDocuments(query);
    return count >= (equipment.totalSlots || 1);
};

// Book equipment
router.post('/', auth, async (req, res) => {
    const { equipmentId, date, startTime, endTime, purpose, paymentMethod, paymentStatus, amount } = req.body;
    try {
        if (await isOverlapping(equipmentId, date, startTime, endTime)) {
            return res.status(400).json({ msg: 'Time slot overlaps with an existing booking' });
        }
        
        const newBooking = new Booking({
            userId: req.user.id,
            equipmentId,
            date,
            startTime,
            endTime,
            purpose: purpose || '',
            paymentMethod: paymentMethod || 'cash',
            paymentStatus: paymentStatus || 'pending',
            amount: amount || 0,
        });
        const booking = await newBooking.save();
        
        // Respond immediately to the client to ensure UX stability
        res.json(booking);

        // Perform non-critical background notifications
        (async () => {
            try {
                const equipment = await Equipment.findById(equipmentId);
                
                // Create Database Notification
                const notification = new Notification({
                    userId: req.user.id,
                    title: 'Mission Confirmed',
                    message: `Booking for ${equipment?.name || 'Equipment'} on ${date} is secured.`,
                    type: 'booking'
                });
                await notification.save();

                // Emit Real-time Socket Alert
                if (req.io) {
                    req.io.to(req.user.id).emit('notification', {
                        title: 'Mission Confirmed',
                        message: `Protocol #${booking._id.toString().slice(-6).toUpperCase()} initiated.`,
                        type: 'booking'
                    });
                }

                // Send email notification
                const user = await User.findById(req.user.id);
                if (user && equipment) {
                    await sendBookingEmail(user.email, { 
                        id: booking._id.toString().slice(-6).toUpperCase(),
                        equipmentName: equipment.name, 
                        date, 
                        startTime, 
                        endTime 
                    }, 'created');
                }
            } catch (notifyErr) {
                console.error('Background Notification Failure:', notifyErr.message);
            }
        })();
    } catch (err) {
        console.error('Booking Creation Error:', err);
        res.status(500).json({ msg: `Server error: ${err.message}` });
    }
});

// Get user bookings
router.get('/my', auth, async (req, res) => {
    try {
        const bookings = await Booking.find({ userId: req.user.id }).populate('equipmentId');
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ msg: `Server error: ${err.message}` });
    }
});

// Get bookings for a specific department (for Staff Oversight)
router.get('/department/:dept', auth, async (req, res) => {
    try {
        const rawDept = req.params.dept;
        if (!rawDept || rawDept === 'null' || rawDept === 'undefined' || rawDept.trim() === '') {
            return res.json([]); // No dept set yet, return empty silently
        }
        
        const deptName = String(rawDept).trim();
        
        // Find equipment in this department
        const equipment = await Equipment.find({ 
            category: { $regex: new RegExp(deptName, 'i') } 
        });
        
        if (!equipment || equipment.length === 0) {
            return res.json([]);
        }

        const eqIds = equipment.map(e => e._id);
        const bookings = await Booking.find({ equipmentId: { $in: eqIds } })
            .populate({
                path: 'equipmentId',
                select: 'name category department'
            })
            .populate({
                path: 'userId',
                select: 'name email college phone'
            })
            .sort({ createdAt: -1 });
            
        res.json(bookings || []);
    } catch (err) {
        console.error('CRITICAL OVERSIGHT ERROR:', err);
        res.status(500).json({ message: 'Internal Server Error during departmental synchronization' });
    }
});

// Get all bookings (Admin only)
router.get('/', adminAuth, async (req, res) => {
    try {
        const bookings = await Booking.find().populate('userId', 'name email').populate('equipmentId', 'name');
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ msg: `Server error: ${err.message}` });
    }
});

// Cancel booking (User or Admin)
router.put('/:id/cancel', auth, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ msg: 'Booking not found' });
        
        if (booking.userId.toString() !== req.user.id && req.user.role !== 'Admin') {
            return res.status(401).json({ msg: 'Not authorized' });
        }
        
        booking.status = 'cancelled';
        await booking.save();

        // Create Database Notification
        const equipment = await Equipment.findById(booking.equipmentId);
        const notification = new Notification({
            userId: booking.userId,
            title: 'Protocol Terminated',
            message: `Booking for ${equipment?.name || 'Equipment'} has been cancelled.`,
            type: 'alert'
        });
        await notification.save();

        // Emit Socket Alert
        if (req.io) {
            req.io.to(booking.userId.toString()).emit('notification', {
                title: 'Protocol Terminated',
                message: `Booking for ${equipment?.name || 'Equipment'} cancelled.`,
                type: 'alert'
            });
        }

        // Send email notification
        const user = await User.findById(booking.userId);
        if (user && equipment) {
            sendBookingEmail(user.email, { 
                id: booking._id.toString().slice(-6).toUpperCase(),
                equipmentName: equipment.name, 
                date: booking.date, 
                startTime: booking.startTime, 
                endTime: booking.endTime 
            }, 'cancelled');
        }

        res.json(booking);
    } catch (err) {
        res.status(500).json({ msg: `Server error: ${err.message}` });
    }
});

// Middleware that accepts token from query string (for browser export links)
const exportAuth = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1] || req.query.token;
    if (!token) return res.status(401).json({ msg: 'No token' });
    const jwt = require('jsonwebtoken');
    const { JWT_SECRET } = require('../middleware/auth');
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'Admin') return res.status(403).json({ msg: 'Admin only' });
        req.user = decoded;
        next();
    } catch { res.status(401).json({ msg: 'Invalid token' }); }
};

// Export records to CSV (Admin only)
router.get('/export/csv', exportAuth, async (req, res) => {
    try {
        const bookings = await Booking.find().populate('userId', 'name email').populate('equipmentId', 'name');
        const data = bookings.map(b => ({
            ID: b._id,
            User: b.userId?.name,
            Email: b.userId?.email,
            Equipment: b.equipmentId?.name,
            Date: b.date,
            Start: b.startTime,
            End: b.endTime,
            Status: b.status
        }));
        
        const json2csvParser = new Parser();
        const csv = json2csvParser.parse(data);
        
        res.header('Content-Type', 'text/csv');
        res.attachment('bookings.csv');
        return res.send(csv);
    } catch (err) {
        res.status(500).json({ msg: `Server error: ${err.message}` });
    }
});

// Export records to JSON (Admin only)
router.get('/export/json', exportAuth, async (req, res) => {
    try {
        const bookings = await Booking.find().populate('userId', 'name email').populate('equipmentId', 'name');
        res.header('Content-Type', 'application/json');
        res.attachment('bookings.json');
        return res.send(JSON.stringify(bookings, null, 2));
    } catch (err) {
        res.status(500).json({ msg: `Server error: ${err.message}` });
    }
});

// Get usage statistics (Admin only)
router.get('/stats', adminAuth, async (req, res) => {
    try {
        const totalUsers = await require('../models/User').countDocuments();
        const totalEquipment = await Equipment.countDocuments();
        const totalBookings = await Booking.countDocuments();
        const activeBookings = await Booking.countDocuments({ status: 'booked' });
        const totalRevenue = await Booking.aggregate([{ $match: { paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
        
        // Revenue by Equipment
        const eqRevenue = await Booking.aggregate([
            { $match: { paymentStatus: 'paid' } },
            { $group: { _id: '$equipmentId', revenue: { $sum: '$amount' }, count: { $sum: 1 } } },
            { $lookup: { from: 'equipments', localField: '_id', foreignField: '_id', as: 'eq' } },
            { $unwind: '$eq' },
            { $project: { name: '$eq.name', revenue: 1, count: 1 } }
        ]);

        res.json({ 
            totalUsers, totalEquipment, totalBookings, activeBookings, 
            totalRevenue: totalRevenue[0]?.total || 0,
            chartData: eqRevenue 
        });
    } catch (err) {
        res.status(500).json({ msg: `Server error: ${err.message}` });
    }
});

// Approve or reject booking (Staff/Admin)
router.put('/:id/approve', require('../middleware/auth').staffAuth, async (req, res) => {
    try {
        const { action } = req.body; // 'approve' or 'reject'
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ msg: 'Booking not found' });
        booking.approvalStatus = action === 'approve' ? 'approved' : 'rejected';
        booking.status = action === 'approve' ? 'booked' : 'rejected';
        booking.approvedBy = req.user.id;
        await booking.save();

        // Create Database Notification for User
        const equipment = await Equipment.findById(booking.equipmentId);
        const notification = new Notification({
            userId: booking.userId,
            title: action === 'approve' ? 'Protocol Authorized' : 'Protocol Rejected',
            message: `Your booking for ${equipment?.name || 'Equipment'} has been ${action === 'approve' ? 'approved' : 'rejected'}.`,
            type: action === 'approve' ? 'booking' : 'alert'
        });
        await notification.save();

        // Emit Real-time Socket Alert
        if (req.io) {
            req.io.to(booking.userId.toString()).emit('notification', {
                title: action === 'approve' ? 'Protocol Authorized' : 'Protocol Rejected',
                message: `Your mission for ${equipment?.name || 'Equipment'} was ${action === 'approve' ? 'approved' : 'rejected'}.`,
                type: action === 'approve' ? 'booking' : 'alert'
            });
        }

        res.json(booking);
    } catch (err) {
        res.status(500).json({ msg: `Server error: ${err.message}` });
    }
});

// Get pending approvals (Staff/Admin)
router.get('/pending', require('../middleware/auth').staffAuth, async (req, res) => {
    try {
        const bookings = await Booking.find({ approvalStatus: 'pending' }).populate('userId', 'name email').populate('equipmentId', 'name');
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ msg: `Server error: ${err.message}` });
    }
});

// Get bookings for a specific equipment (availability calendar)
router.get('/equipment/:id', require('../middleware/auth').auth, async (req, res) => {
    try {
        const bookings = await Booking.find({ 
            equipmentId: req.params.id, 
            status: { $in: ['booked', 'pending_approval'] } 
        }).populate('userId', 'name');
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ msg: `Server error: ${err.message}` });
    }
});

// Search bookings with pagination (Admin)
router.get('/search', adminAuth, async (req, res) => {
    try {
        const { q = '', status = 'all', page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        let bookings = await Booking.find().populate('userId', 'name email').populate('equipmentId', 'name');
        if (q) bookings = bookings.filter(b => b.userId?.name?.toLowerCase().includes(q.toLowerCase()) || b.equipmentId?.name?.toLowerCase().includes(q.toLowerCase()));
        if (status !== 'all') bookings = bookings.filter(b => b.status === status);
        const total = bookings.length;
        const paged = bookings.slice((pageNum - 1) * limitNum, pageNum * limitNum);
        res.json({ bookings: paged, total, pages: Math.ceil(total / limitNum), page: pageNum });
    } catch (err) {
        res.status(500).json({ msg: `Server error: ${err.message}` });
    }
});

// Mark attendance
router.put('/:id/attend', auth, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.userId.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });

        const now = new Date();
        const bDate = new Date(booking.date);
        
        // Date Check
        if (now.toLocaleDateString() !== bDate.toLocaleDateString()) {
            return res.status(400).json({ message: 'Attendance can only be marked on the day of the session.' });
        }

        // Time window check (First 30 minutes)
        const [h, m] = booking.startTime.split(':').map(Number);
        const startTime = new Date();
        startTime.setHours(h, m, 0, 0);

        const thirtyMinsAfter = new Date(startTime.getTime() + 30 * 60000);

        if (now < startTime) {
            return res.status(400).json({ message: 'Protocol Error: Session has not started yet.' });
        }

        if (now > thirtyMinsAfter) {
            return res.status(400).json({ message: 'Protocol Error: The 30-minute check-in window has expired.' });
        }

        booking.attended = true;
        booking.attendanceTime = now;
        await booking.save();
        res.json(booking);
    } catch (err) {
        res.status(500).json({ msg: `Server error: ${err.message}` });
    }
});

module.exports = router;

