const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        if (process.env.MONGO_URI) {
            await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
            console.log('MongoDB connected to Atlas');
        } else {
            throw new Error('No MONGO_URI provided');
        }
    } catch (error) {
        console.warn('Atlas connection failed, falling back to local MongoDB:', error.message);
        try {
            await mongoose.connect('mongodb://127.0.0.1:27017/lab-booking');
            console.log('MongoDB connected to Local instance');
        } catch (localError) {
            console.error('Local MongoDB also failed:', localError.message);
            process.exit(1);
        }
    }
};

module.exports = connectDB;
