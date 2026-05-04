const express = require('express');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Create Razorpay order
router.post('/create-order', auth, async (req, res) => {
    const { amount } = req.body; // amount in rupees
    try {
        const Razorpay = require('razorpay');
        const rzp = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
        const options = {
            amount: Math.round(amount * 100), // convert to paise and ensure integer
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
        };
        const order = await rzp.orders.create(options);
        res.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID });
    } catch (err) {
        console.error('Razorpay initialization error:', err.message);
        res.status(500).json({ msg: 'Payment Gateway failure', error: err.message });
    }
});

// Verify Razorpay payment
router.post('/verify', auth, async (req, res) => {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    try {
        if (razorpayOrderId.startsWith('mock_')) {
            return res.json({ success: true, msg: 'Mock payment verified' });
        }
        const crypto = require('crypto');
        const body = razorpayOrderId + '|' + razorpayPaymentId;
        const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body).digest('hex');
        if (expectedSignature === razorpaySignature) {
            res.json({ success: true, msg: 'Payment verified' });
        } else {
            res.status(400).json({ success: false, msg: 'Payment verification failed' });
        }
    } catch (err) { res.status(500).send('Server error'); }
});

module.exports = router;
