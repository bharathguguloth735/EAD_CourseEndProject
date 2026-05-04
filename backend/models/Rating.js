const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema({
    userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    equipmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', required: true },
    rating:      { type: Number, min: 1, max: 5, required: true },
    performance: { type: Number, min: 1, max: 5, default: 5 },
    cleanliness: { type: Number, min: 1, max: 5, default: 5 },
    review:      { type: String, default: '' },
}, { timestamps: true });

RatingSchema.index({ userId: 1, equipmentId: 1 }, { unique: true });

module.exports = mongoose.model('Rating', RatingSchema);
