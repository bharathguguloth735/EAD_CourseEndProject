const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name:         { type: String, required: true },
    email:        { type: String, required: true, unique: true },
    password:     { type: String, required: true },
    role:         { type: String, enum: ['Student', 'Staff', 'Admin'], default: 'Student' },
    phone:        { type: String, default: '' },
    department:   { type: String, default: '' },
    college:      { type: String, default: '' },
    bio:          { type: String, default: '' },
    profileImage: { type: String, default: '' },
    isActive:     { type: Boolean, default: true },
    needsRoleSelection: { type: Boolean, default: false },
    resetToken:        { type: String },
    resetTokenExpiry:  { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
