const mongoose = require('mongoose');
const connectDB = require('./db');
const User = require('./models/User');

async function run() {
    await connectDB();
    
    // Update all Staff to Electronics
    await User.updateMany({ role: 'Staff' }, { department: 'Electronics' });
    
    // Update all Admins to Electronics
    await User.updateMany({ role: 'Admin' }, { department: 'Electronics' });
    
    // Specifically find and update Bharath G
    await User.updateOne({ name: 'Bharath G' }, { department: 'Computing' });

    console.log('--- DATABASE ALIGNMENT COMPLETE ---');
    console.log('All Staff & Admins synchronized to [Electronics]');
    console.log('Bharath G synchronized to [Computing]');
    console.log('-----------------------------------');
    process.exit();
}

run();
