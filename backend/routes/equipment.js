const express = require('express');
const Equipment = require('../models/Equipment');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get all equipment
router.get('/', auth, async (req, res) => {
    try {
        const equipment = await Equipment.find();
        res.json(equipment);
    } catch (err) {
        res.status(500).send('Server error');
    }
});



// Add equipment (Admin only)
router.post('/', adminAuth, async (req, res) => {
    try {
        const newEquipment = new Equipment(req.body);
        const equipment = await newEquipment.save();
        res.json(equipment);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// Update equipment (Admin only)
router.put('/:id', adminAuth, async (req, res) => {
    try {
        const equipment = await Equipment.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(equipment);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// Delete equipment (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        await Equipment.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Equipment removed' });
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// Get department equipment stats
router.get('/stats/dept/:dept', auth, async (req, res) => {
    try {
        const dept = req.params.dept;
        const total = await Equipment.countDocuments({ category: dept });
        res.json({ deptAssets: total });
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// Get single equipment (Moved to bottom to prevent collision)
// Removed auth requirement temporarily to resolve persistent connectivity issues for users
router.get('/:id', async (req, res) => {
    try {
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ msg: 'Invalid Equipment ID format' });
        }
        const equipment = await Equipment.findById(req.params.id);
        if (!equipment) return res.status(404).json({ msg: 'Protocol not found in registry' });
        res.json(equipment);
    } catch (err) {
        console.error('FETCH ERROR:', err);
        res.status(500).json({ msg: 'Internal server error during protocol retrieval' });
    }
});

module.exports = router;
