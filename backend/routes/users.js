const express = require('express');
const User = require('../models/User');
const Booking = require('../models/Booking');
const { adminAuth } = require('../middleware/auth');
const router = express.Router();

// Get all users (Admin)
router.get('/', adminAuth, async (req, res) => {
    try {
        const users = await User.find().select('-password -resetToken -resetTokenExpiry').sort('-createdAt');
        res.json(users);
    } catch (err) { res.status(500).send('Server error'); }
});

// Get user stats (Admin)
router.get('/:id/stats', adminAuth, async (req, res) => {
    try {
        const bookings = await Booking.find({ userId: req.params.id });
        res.json({
            totalBookings: bookings.length,
            activeBookings: bookings.filter(b => b.status === 'booked').length,
            totalSpent: bookings.filter(b => b.paymentStatus === 'paid').reduce((s, b) => s + (b.amount || 0), 0),
        });
    } catch (err) { res.status(500).send('Server error'); }
});

// Toggle user active status (Admin)
router.put('/:id/toggle-active', adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });
        user.isActive = !user.isActive;
        await user.save();
        res.json({ msg: `User ${user.isActive ? 'activated' : 'deactivated'}`, isActive: user.isActive });
    } catch (err) { res.status(500).send('Server error'); }
});

// Change user role (Admin)
router.put('/:id/role', adminAuth, async (req, res) => {
    try {
        const { role } = req.body;
        if (!['Student', 'Staff', 'Admin'].includes(role)) return res.status(400).json({ msg: 'Invalid role' });
        const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
        res.json(user);
    } catch (err) { res.status(500).send('Server error'); }
});

// Delete user (Admin)
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ msg: 'User deleted' });
    } catch (err) { res.status(500).send('Server error'); }
});

module.exports = router;
