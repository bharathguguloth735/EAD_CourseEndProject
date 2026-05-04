const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth, adminAuth, JWT_SECRET } = require('../middleware/auth');
const { OAuth2Client } = require('google-auth-library');
const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Register
router.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;
    const safeRole = ['Student', 'Staff'].includes(role) ? role : 'Student';
    try {
        if (await User.findOne({ email })) return res.status(400).json({ msg: 'User already exists' });
        const salt = await bcrypt.genSalt(10);
        const user = await User.create({ name, email, password: await bcrypt.hash(password, salt), role: safeRole });
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, college: user.college, createdAt: user.createdAt } });
    } catch (err) { res.status(500).send('Server error'); }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || !await bcrypt.compare(password, user.password)) return res.status(400).json({ msg: 'Invalid Credentials' });
        if (!user.isActive) return res.status(403).json({ msg: 'Account is deactivated. Contact admin.' });
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, department: user.department, college: user.college, bio: user.bio, profileImage: user.profileImage, createdAt: user.createdAt } });
    } catch (err) { res.status(500).send('Server error'); }
});

// Google OAuth Login
router.post('/google', async (req, res) => {
    try {
        const { token } = req.body;
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        
        // Find user by email or create new
        let user = await User.findOne({ email: payload.email });
        if (!user) {
            user = await User.create({
                name: payload.name,
                email: payload.email,
                password: await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10), // Random password for oauth
                role: 'Student',
                needsRoleSelection: true
            });
        }
        
        if (!user.isActive) return res.status(403).json({ msg: 'Account is deactivated. Contact admin.' });
        
        const jwtToken = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token: jwtToken, user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, department: user.department, college: user.college, bio: user.bio, profileImage: user.profileImage, needsRoleSelection: user.needsRoleSelection, createdAt: user.createdAt } });
    } catch (err) { res.status(500).json({ msg: 'Google Auth Failed' }); }
});

// Select Role (for first-time Google users)
router.put('/select-role', auth, async (req, res) => {
    const { role } = req.body;
    if (!['Student', 'Staff'].includes(role)) return res.status(400).json({ msg: 'Invalid role selection' });
    try {
        const user = await User.findByIdAndUpdate(req.user.id, { role, needsRoleSelection: false }, { new: true }).select('-password');
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user });
    } catch (err) { res.status(500).send('Server error'); }
});

// Get my profile
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password -resetToken -resetTokenExpiry');
        res.json(user);
    } catch (err) { res.status(500).send('Server error'); }
});

// Update profile
router.put('/profile', auth, async (req, res) => {
    const { name, phone, department, college, bio, profileImage } = req.body;
    try {
        const user = await User.findByIdAndUpdate(req.user.id, { name, phone, department, college, bio, profileImage }, { new: true }).select('-password');
        res.json({ id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, department: user.department, college: user.college, bio: user.bio, profileImage: user.profileImage, createdAt: user.createdAt });
    } catch (err) { res.status(500).send('Server error'); }
});

// Change password
router.put('/change-password', auth, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
        const user = await User.findById(req.user.id);
        if (!await bcrypt.compare(currentPassword, user.password)) return res.status(400).json({ msg: 'Current password is incorrect' });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();
        res.json({ msg: 'Password updated successfully' });
    } catch (err) { res.status(500).send('Server error'); }
});

// Forgot password - generate reset token
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ msg: 'No account with that email' });
        const token = crypto.randomBytes(32).toString('hex');
        user.resetToken = token;
        user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
        await user.save();
        // In production: send email with reset link
        res.json({ msg: 'Reset token generated', token, resetLink: `${process.env.CLIENT_URL}/reset-password/${token}` });
    } catch (err) { res.status(500).send('Server error'); }
});

// Reset password
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    try {
        const user = await User.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } });
        if (!user) return res.status(400).json({ msg: 'Invalid or expired reset token' });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        await user.save();
        res.json({ msg: 'Password reset successfully. You can now log in.' });
    } catch (err) { res.status(500).send('Server error'); }
});

module.exports = router;
