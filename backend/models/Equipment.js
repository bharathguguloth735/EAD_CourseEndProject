const mongoose = require('mongoose');

const EquipmentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    category: {
        type: String,
        enum: ['Electronics', 'Mechanical', 'Chemical', 'Computing', 'Optics', 'Biology'],
        default: 'Electronics'
    },
    status: {
        type: String,
        enum: ['available', 'unavailable', 'maintenance'],
        default: 'available'
    },
    pricePerHour: { type: Number, default: 50 },
    totalSlots: { type: Number, default: 1 },
    facultyInCharge: { type: String, default: 'Dr. Rajesh Kumar' },
    labAssistant: { type: String, default: 'Mr. Amit Sharma' },
    labNumber: { type: Number, min: 1, max: 9, default: 1 },
    condition: { type: String, enum: ['Excellent', 'Good', 'Fair'], default: 'Good' },
    location: { type: String, default: 'Lab A' },
}, { timestamps: true });

module.exports = mongoose.model('Equipment', EquipmentSchema);
