const mongoose = require('mongoose');
const connectDB = require('./backend/db');
const Equipment = require('./backend/models/Equipment');

async function run() {
    await connectDB();
    const categories = await Equipment.distinct('category');
    console.log('--- OFFICIAL CATEGORY LIST ---');
    console.log(categories);
    console.log('------------------------------');
    process.exit();
}

run();
