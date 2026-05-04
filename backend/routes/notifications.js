const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');

// Get user notifications
router.get('/', auth, async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(20);
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// Mark notification as read
router.put('/:id/read', auth, async (req, res) => {
    try {
        await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { isRead: true }
        );
        res.json({ msg: 'Marked as read' });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// Mark all as read
router.put('/read-all', auth, async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user.id, isRead: false },
            { isRead: true }
        );
        res.json({ msg: 'All marked as read' });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
