const express = require('express');
const Waitlist = require('../models/Waitlist');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Join waitlist
router.post('/', auth, async (req, res) => {
    const { equipmentId, date, startTime, endTime } = req.body;
    try {
        const existing = await Waitlist.findOne({ userId: req.user.id, equipmentId, date, status: 'waiting' });
        if (existing) return res.status(400).json({ msg: 'You are already on the waitlist for this slot' });
        const entry = await Waitlist.create({ userId: req.user.id, equipmentId, date, startTime, endTime });
        res.json(entry);
    } catch (err) { res.status(500).send('Server error'); }
});

// Get my waitlist entries
router.get('/my', auth, async (req, res) => {
    try {
        const entries = await Waitlist.find({ userId: req.user.id, status: 'waiting' }).populate('equipmentId', 'name');
        res.json(entries);
    } catch (err) { res.status(500).send('Server error'); }
});

// Remove from waitlist
router.delete('/:id', auth, async (req, res) => {
    try {
        await Waitlist.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Removed from waitlist' });
    } catch (err) { res.status(500).send('Server error'); }
});

module.exports = router;
