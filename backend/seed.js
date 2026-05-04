const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Equipment = require('./models/Equipment');

const seedData = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/lab-booking');

        await User.deleteMany();
        await Equipment.deleteMany();

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        await User.create({ name: 'Admin User', email: 'admin@lab.com', password: hashedPassword, role: 'Admin' });
        await User.create({ name: 'Test Student', email: 'student@lab.com', password: hashedPassword, role: 'Student' });
        await User.create({ name: 'Dr. Smith', email: 'staff@lab.com', password: hashedPassword, role: 'Staff' });

        await Equipment.insertMany([
            { name: 'Microscope Olympus CX23', description: 'Binocular biological microscope for cell observation', category: 'Biology', status: 'available', pricePerHour: 80, condition: 'Excellent', location: 'Bio Lab A' },
            { name: 'Centrifuge 5424 R', description: 'Refrigerated microcentrifuge for sample separation', category: 'Biology', status: 'available', pricePerHour: 120, condition: 'Good', location: 'Bio Lab B' },
            { name: 'PCR Thermal Cycler', description: 'Gradient PCR machine for DNA amplification', category: 'Biology', status: 'available', pricePerHour: 200, condition: 'Excellent', location: 'Genomics Lab' },
            { name: 'Spectrophotometer UV-Vis', description: 'Measures absorbance of samples at various wavelengths', category: 'Optics', status: 'unavailable', pricePerHour: 150, condition: 'Fair', location: 'Optics Lab' },
            { name: 'Oscilloscope Keysight 2000X', description: '4-channel digital oscilloscope for signal analysis', category: 'Electronics', status: 'available', pricePerHour: 60, condition: 'Good', location: 'Electronics Lab' },
            { name: 'Arduino Mega IoT Kit', description: 'Complete IoT development kit with sensors and modules', category: 'Electronics', status: 'available', pricePerHour: 30, condition: 'Good', location: 'IoT Lab' },
            { name: 'CNC Milling Machine', description: 'High-precision 3-axis CNC for metal and plastic parts', category: 'Mechanical', status: 'available', pricePerHour: 350, condition: 'Good', location: 'Workshop A' },
            { name: '3D Printer Ultimaker S3', description: 'Dual extrusion FFF 3D printer for prototyping', category: 'Mechanical', status: 'available', pricePerHour: 100, condition: 'Excellent', location: 'Fabrication Lab' },
            { name: 'GPU Computing Server', description: 'NVIDIA A100 GPU cluster for ML training workloads', category: 'Computing', status: 'available', pricePerHour: 500, condition: 'Excellent', location: 'Server Room' },
            { name: 'FTIR Spectrometer', description: 'Fourier-transform infrared spectroscopy for chemical analysis', category: 'Chemical', status: 'available', pricePerHour: 250, condition: 'Good', location: 'Chem Lab A' },
            { name: 'Laser Cutter CO2 100W', description: 'High-power CO2 laser for cutting and engraving', category: 'Mechanical', status: 'maintenance', pricePerHour: 200, condition: 'Fair', location: 'Workshop B' },
            { name: 'NMR Spectrometer 400MHz', description: 'Nuclear magnetic resonance for molecular structure analysis', category: 'Chemical', status: 'available', pricePerHour: 400, condition: 'Good', location: 'Chem Lab B' },
        ]);

        console.log('✅ Data seeded successfully');
        console.log('Admin:   admin@lab.com / admin123');
        console.log('Staff:   staff@lab.com / admin123');
        console.log('Student: student@lab.com / admin123');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedData();
