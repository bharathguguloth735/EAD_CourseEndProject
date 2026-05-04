const mongoose = require('mongoose');
const connectDB = require('./db');
const User = require('./models/User');

async function run() {
    await connectDB();
    const users = await User.find();
    console.log('--- GLOBAL PERSONNEL REGISTRY ---');
    users.forEach(u => {
        console.log(`ID: ${u._id} | Name: ${u.name} | Role: ${u.role} | Email: ${u.email} | Dept: [${u.department}]`);
    });
    console.log('---------------------------------');
    process.exit();
}

run();
