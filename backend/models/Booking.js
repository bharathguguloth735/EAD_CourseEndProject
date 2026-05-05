const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    equipmentId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', required: true },
    date:          { type: String, required: true },
    startTime:     { type: String, required: true },
    endTime:       { type: String, required: true },
    purpose:       { type: String, required: true },
    status:        { type: String, enum: ['pending_approval', 'booked', 'cancelled', 'rejected'], default: 'booked' },
    approvalStatus:{ type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
    approvedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
    paymentMethod: { type: String, enum: ['card', 'upi', 'cash', 'razorpay'], default: 'cash' },
    razorpayOrderId:   { type: String },
    razorpayPaymentId: { type: String },
    amount:        { type: Number, default: 0 },
    isRecurring:   { type: Boolean, default: false },
    recurrenceType:{ type: String, enum: ['none', 'weekly', 'daily'], default: 'none' },
    recurrenceEnd: { type: String },
    parentBookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    attended:      { type: Boolean, default: false },
    attendanceTime:{ type: Date },
    staffRating:   { type: Number, min: 1, max: 5 },
    staffReview:   { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);
