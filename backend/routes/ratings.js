const express = require('express');
const Rating = require('../models/Rating');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Add/update rating
router.post('/', auth, async (req, res) => {
    const { equipmentId, rating, performance, cleanliness, review } = req.body;
    try {
        const existing = await Rating.findOne({ userId: req.user.id, equipmentId });
        if (existing) {
            existing.rating = rating;
            existing.performance = performance || 5;
            existing.cleanliness = cleanliness || 5;
            existing.review = review;
            await existing.save();
            return res.json(existing);
        }
        const r = await Rating.create({ 
            userId: req.user.id, 
            equipmentId, 
            rating, 
            performance: performance || 5,
            cleanliness: cleanliness || 5,
            review 
        });
        res.json(r);
    } catch (err) { res.status(500).send('Server error'); }
});

// Get all my ratings
router.get('/my-all', auth, async (req, res) => {
    try {
        const ratings = await Rating.find({ userId: req.user.id });
        res.json(ratings);
    } catch (err) { res.status(500).send('Server error'); }
});

// Get my rating for an equipment
router.get('/my/:equipmentId', auth, async (req, res) => {
    try {
        const r = await Rating.findOne({ userId: req.user.id, equipmentId: req.params.equipmentId });
        res.json(r || null);
    } catch (err) { res.status(500).send('Server error'); }
});

// Get ratings for an equipment
router.get('/:equipmentId', async (req, res) => {
    try {
        const ratings = await Rating.find({ equipmentId: req.params.equipmentId }).populate('userId', 'name');
        const avg = ratings.length ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1) : 0;
        res.json({ ratings, average: parseFloat(avg), count: ratings.length });
    } catch (err) { res.status(500).send('Server error'); }
});

module.exports = router;
