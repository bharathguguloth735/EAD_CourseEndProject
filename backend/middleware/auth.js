require('dotenv').config();
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'private_lab_super_secret_key_2026';

const auth = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch { res.status(401).json({ msg: 'Token is not valid' }); }
};

const adminAuth = (req, res, next) => {
    auth(req, res, () => {
        if (req.user.role !== 'Admin') return res.status(403).json({ msg: 'Access denied. Admin only.' });
        next();
    });
};

const staffAuth = (req, res, next) => {
    auth(req, res, () => {
        if (!['Admin', 'Staff'].includes(req.user.role)) return res.status(403).json({ msg: 'Staff or Admin required.' });
        next();
    });
};

module.exports = { auth, adminAuth, staffAuth, JWT_SECRET };
