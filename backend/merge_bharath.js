const mongoose = require('mongoose');
const connectDB = require('./db');
const User = require('./models/User');

async function run() {
    try {
        await connectDB();
        
        // Find existing Student account
        const studentAccount = await User.findOne({ email: 'bharathguguloth735@gmail.com' });
        
        if (studentAccount) {
            console.log('Found existing Student account. Upgrading to Unified Command Account...');
            
            studentAccount.name = 'Guguloth Bharath';
            studentAccount.role = 'Admin'; // Admin has all powers (Staff + Student)
            studentAccount.department = 'Advanced Systems';
            
            await studentAccount.save();
            console.log('SUCCESS: Bharath G (Student) has been upgraded to Guguloth Bharath (Admin/Staff).');
        } else {
            console.log('Account bharathguguloth735@gmail.com not found. Creating new Unified Account...');
            const newUser = new User({
                name: 'Guguloth Bharath',
                email: 'bharathguguloth735@gmail.com',
                password: 'InitialPassword123!', // This will likely be overridden by OAuth
                role: 'Admin',
                department: 'Advanced Systems'
            });
            await newUser.save();
            console.log('SUCCESS: New Unified account created for Guguloth Bharath.');
        }

        console.log('--- UPDATED REGISTRY ---');
        const users = await User.find({ email: 'bharathguguloth735@gmail.com' });
        users.forEach(u => console.log(`ID: ${u._id} | Name: ${u.name} | Role: ${u.role} | Email: ${u.email}`));
        
    } catch (error) {
        console.error('ERROR during merge:', error);
    } finally {
        process.exit();
    }
}

run();
