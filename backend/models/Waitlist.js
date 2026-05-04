const mongoose = require('mongoose');

const WaitlistSchema = new mongoose.Schema({
    userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    equipmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', required: true },
    date:        { type: String, required: true },
    startTime:   { type: String, required: true },
    endTime:     { type: String, required: true },
    status:      { type: String, enum: ['waiting', 'notified', 'expired'], default: 'waiting' },
}, { timestamps: true });

module.exports = mongoose.model('Waitlist', WaitlistSchema);
