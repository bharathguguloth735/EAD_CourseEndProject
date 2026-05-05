require('dotenv').config();
const mongoose = require('mongoose');
const Equipment = require('./models/Equipment');

const categories = ['Electronics', 'Mechanical', 'Chemical', 'Computing', 'Optics', 'Biology'];

const itemNames = {
    'Electronics': [
        'Mixed Signal Oscilloscope', 'RF Spectrum Analyzer', 'Arbitrary Waveform Generator', 'Precision DC Power Supply',
        'Digital Multimeter (6.5 Digit)', 'Advanced Soldering Station', 'Logic Analyzer (32 Channel)', 'Handheld LCR Meter',
        'Desktop PCB Milling Machine', 'Vector Network Analyzer', 'Semiconductor Parameter Analyzer', 'FLIR Thermal Imaging Camera',
        'ESD Validation Station', 'Frequency Counter (3GHz)', 'Programmable Pulse Generator', 'Analog Discovery Kit',
        'In-Circuit Emulator', 'Spectrum Monitoring Receiver', 'Power Quality Analyzer', 'High-Voltage Probe Set'
    ],
    'Mechanical': [
        'Universal Testing Machine', 'CNC Precision Lathe', 'Professional 3D Printer (Metal)', '5-Axis CNC Router',
        'Heavy Duty Drill Press', 'Industrial Band Saw', 'Hydraulic Press Array', 'Charpy Impact Tester',
        'Rockwell Hardness Tester', 'Granite Surface Plate', 'Digital Micrometer Set', 'Subsonic Wind Tunnel',
        'Engine Dynamometer Rig', 'Torsion Testing Machine', 'Automated Welding Robot', 'CO2 Laser Cutter',
        'Industrial Plasma Cutter', 'Vibration Shaker Table', 'Fatigue Testing System', 'Coordinate Measuring Machine'
    ],
    'Chemical': [
        'Gas Chromatograph (GC-MS)', 'High-Performance Liquid Chromatograph', 'NMR Spectrometer (400MHz)', 'UV-Vis Spectrophotometer',
        'FTIR Spectrometer', 'High-Speed Refrigerated Centrifuge', 'Automated Rotary Evaporator', 'Precision pH/Ion Meter',
        'Automatic Potentiometric Titrator', 'Climate Controlled Incubator', 'High-Efficiency Fume Hood', 'Analytical Balance (0.1mg)',
        'Magnetic Stirrer Matrix', 'Large Capacity Autoclave', 'Multi-Gas Sensor Array', 'Differential Scanning Calorimeter',
        'Dynamic Shear Rheometer', 'Atomic Absorption Spectrometer', 'X-Ray Fluorescence Analyzer', 'Karl Fischer Titrator'
    ],
    'Computing': [
        'NVIDIA A100 GPU Cluster', 'Quantum Simulator Node', 'Enterprise Blade Server', 'Petabyte NAS Storage Array',
        '100GbE Managed Backbone Switch', 'Enterprise VR Rendering Station', 'Mixed Reality AR Glasses', 'Dual Xeon Rendering Workstation',
        'Industrial IoT Gateway', 'Robotics Edge Controller', 'High-End FPGA Development Hub', 'AI Edge Vision Accelerator',
        'Network Security Analysis Appliance', 'HPC Computing Node', 'Modular UPS System (50kVA)', 'Liquid Cooling Control Unit',
        'Deep Learning Training Server', 'Cyber-Range Security Terminal', 'Big Data Processing Cluster', 'Cloud Gateway Module'
    ],
    'Optics': [
        'Tunable Laser Diode', 'Vibration Isolated Optical Table', 'High-Resolution Spectrometer', 'Michelson Interferometer Set',
        'Laser Beam Profiler', 'Ultra-Fast Photodetector', 'Scanning Monochromator', 'Optical Power Meter (Pico-Watt)',
        'Precision Autocollimator', 'Lens Mapping/Analysis System', 'Holography Development Kit', 'Digital Polarimeter',
        'Automatic Fiber Fusion Splicer', 'Optical Spectrum Analyzer', 'Microscope Objective Array', 'Pockels Cell Driver',
        'Acousto-Optic Modulator', 'Optical Parametric Oscillator', 'Thin Film Thickness Monitor', 'Confocal Laser Module'
    ],
    'Biology': [
        'Laser Scanning Confocal Microscope', 'Real-Time PCR System', 'Multi-Color Flow Cytometer', 'Chemiluminescence Gel Doc',
        'Electrophoresis Power Hub', 'Microplate Reader (Multi-Mode)', 'Class II Biosafety Cabinet', 'Ultra-Low Temp Freezer (-80C)',
        'Automated Cell Counter', 'Tri-Gas CO2 Incubator', 'Precision Shaking Water Bath', 'High-Pressure Homogenizer',
        'Next-Gen DNA Sequencer', 'Fast Protein Liquid Chromatograph', 'Microtome Sectioning System', 'Tissue Processor',
        'Inverted Fluorescence Microscope', 'Cryostat Microtome', 'Electroporation System', 'Colony Counter (AI Powered)'
    ]
};

const generateManualData = (name, category, index) => {
    // Basic variety indices
    const v1 = index % 3;
    const v2 = (index + 1) % 3;

    const data = {
        aim: `To investigate the fundamental operational parameters and performance characteristics of the ${name} within ${category} engineering protocols.`,
        requiredMaterials: [`${name} Central Processing Unit`, 'Regulated Power Interface', 'Digital Logic Probe', 'High-Precision Calibration Kit'],
        formula: 'Ψ = Σ (x_i * w_i)',
        theory: `The theoretical framework for the ${name} is rooted in advanced ${category.toLowerCase()} mechanics, focusing on the relationship between input signal modulation and output precision.`,
        experimentSteps: [
            `Initialize the ${name} subsystem and verify structural integrity.`,
            `Calibrate the ${category} sensors against standard reference points.`,
            `Execute a sequence of controlled test cycles (N=10) and monitor telemetry.`,
            `Analyze the resulting data matrix for statistical anomalies.`
        ],
        observationsTable: "STEP | VOLTAGE (V) | CURRENT (mA) | ACCURACY (%)\n------------------------------------------\n01   | 5.00        | 120.5        | 99.8\n02   | 10.00       | 240.1        | 99.7\n03   | 15.00       | 360.8        | 99.9",
        conclusion: `The results confirm that the ${name} maintains a precision variance within the specified ±0.05% margin for ${category} applications.`,
        vivaQuestions: [
            `What are the primary error sources when operating the ${name}?`,
            `Define the resolution limit of this specific ${category} asset.`,
            `How does ambient noise affect the ${name}'s data acquisition?`
        ],
        safetyPrecautions: ['Verify high-voltage isolation.', 'Wear ESD-safe wrist straps.', 'Ensure active ventilation is operational.'],
        homePrep: [`Download the latest ${name} API documentation.`, 'Review signal processing fundamentals.', 'Prepare a detailed experiment logbook.']
    };

    // Category-specific logic
    if (category === 'Electronics') {
        data.formula = 'V(t) = L(di/dt) + Ri(t)';
        data.requiredMaterials.push('Digital Storage Oscilloscope', 'Signal Generator', 'Breadboard Matrix');
        data.observationsTable = "T (ms) | CH1 (V) | CH2 (V) | PHASE (deg)\n----------------------------------------\n1.0    | 2.4     | 1.8     | 15.2\n2.0    | 4.8     | 3.6     | 15.1";
    } else if (category === 'Mechanical') {
        data.formula = 'τ = G * θ / L';
        data.requiredMaterials.push('Vernier Calipers (Digital)', 'Torque Wrench', 'Load Cell Array');
        data.observationsTable = "LOAD (N) | DISP (mm) | STRESS (MPa) | STRAIN\n--------------------------------------------\n500      | 0.12      | 45.2         | 0.0012\n1000     | 0.25      | 90.5         | 0.0025";
    } else if (category === 'Chemical') {
        data.formula = 'pH = -log[H+]';
        data.requiredMaterials.push('Deionized Water', 'Standard Buffer Solutions', 'Magnetic Stirrer');
        data.observationsTable = "TIME (s) | TEMP (C) | pH VALUE | REACTION RATE\n--------------------------------------------\n30       | 25.4     | 7.21     | 0.05\n60       | 26.1     | 7.15     | 0.08";
    } else if (category === 'Computing') {
        data.formula = 'T(n) = 2T(n/2) + O(n)';
        data.requiredMaterials = ['NVIDIA CUDA Toolkit', 'High-Speed Fiber Patch Cables', 'Secure Shell Terminal'];
        data.observationsTable = "CORES | DATA SIZE | TIME (ms) | SPEEDUP\n---------------------------------------\n8     | 1GB       | 450       | 1.0\n16    | 1GB       | 230       | 1.95";
    } else if (category === 'Optics') {
        data.formula = '1/f = (n-1)(1/R1 - 1/R2)';
        data.requiredMaterials.push('Optical Rail (2m)', 'Collimator', 'Photodiode Sensor');
        data.observationsTable = "ANGLE (i) | ANGLE (r) | REF INDEX | DEVIATION\n-------------------------------------------\n10.0      | 6.5       | 1.521     | 3.5\n20.0      | 13.1      | 1.519     | 6.9";
    } else if (category === 'Biology') {
        data.formula = 'μ = μmax * S / (Ks + S)';
        data.requiredMaterials.push('Autoclaved Glassware', 'Micro-pipette Set', 'Growth Medium');
        data.observationsTable = "SAMPLE | OD600 | CELL COUNT | VIABILITY (%)\n-----------------------------------------\nA1     | 0.45  | 1.2e6      | 98.2\nB1     | 0.89  | 2.5e6      | 97.5";
    }

    // Name-specific Overrides for maximum uniqueness
    if (name.includes('Microscope')) {
        data.aim = `Detailed visualization and morphological characterization of biological samples using the ${name}.`;
        data.experimentSteps = [
            'Clean all optical surfaces with lint-free wipes.',
            'Mount the specimen and initialize the 40x objective.',
            'Adjust the condenser and diaphragm for optimal contrast.',
            'Capture digital micro-graphs for morphological analysis.'
        ];
    } else if (name.includes('Printer')) {
        data.aim = `Additive manufacturing process optimization for complex geometries using the ${name}.`;
        data.experimentSteps = [
            'Import the STL model and generate the G-code slice.',
            'Level the build plate and apply adhesion interface.',
            'Monitor the first layer deposition for structural stability.',
            'Post-process the fabricated part and measure tolerances.'
        ];
    } else if (name.includes('Spectrometer') || name.includes('Analyzer')) {
        data.aim = `Quantitative and qualitative analysis of unknown samples using the ${name} spectral matrix.`;
        data.experimentSteps = [
            'Perform a dark-current subtraction and baseline scan.',
            'Insert the sample cuvette and ensure no air bubbles.',
            'Capture the absorption/emission spectrum across the target range.',
            'Execute a peak-detection algorithm to identify components.'
        ];
    }

    // Add some random variation to steps if they are default
    if (v1 === 1 && !name.includes('Microscope')) {
        data.experimentSteps.push('Verify the environmental temperature and humidity levels.');
    }
    if (v2 === 2) {
        data.requiredMaterials.push('Precision Multi-meter');
    }

    return data;
};

const descriptions = [
    'Professional grade laboratory instrument for high-precision research and analysis.',
    'Advanced modular system designed for undergraduate and postgraduate experimental protocols.',
    'State-of-the-art diagnostic equipment for structural and behavioral characterization.',
    'High-throughput analysis module featuring automated calibration and real-time monitoring.',
    'Specialized engineering tool for material validation and performance optimization.'
];

const locations = {
    'Electronics': 'Electronics Wing, Level ',
    'Mechanical': 'Engineering Workshop ',
    'Chemical': 'Chemical Sciences Lab ',
    'Computing': 'Data Center Core, Rack ',
    'Optics': 'Optics & Photonics Lab ',
    'Biology': 'Life Sciences Division, Room '
};

const facultyNames = [
    'Dr. Vikram Sarabhai', 'Dr. A.P.J. Abdul Kalam', 'Dr. C.V. Raman', 'Dr. Homi Bhabha', 
    'Dr. Satyendra Nath Bose', 'Dr. Meghnad Saha', 'Dr. Shanti Swarup Bhatnagar', 'Dr. Venkatraman Ramakrishnan',
    'Dr. Jayant Narlikar', 'Dr. G. Madhavan Nair', 'Dr. Tessy Thomas', 'Dr. K. Sivan',
    'Dr. R. Chidambaram', 'Dr. Anil Kakodkar', 'Dr. Kasturirangan'
];
const assistantNames = [
    'Mr. Rajesh Gupta', 'Mr. Suresh Kumar', 'Mr. Amit Verma', 'Mr. Nitin Sharma',
    'Mr. Deepak Reddy', 'Mr. Vijay Patil', 'Mr. Sanjay Singh', 'Mr. Manoj Das',
    'Mr. Rahul Mehta', 'Mr. Pankaj Mishra'
];

const seedData = [];

categories.forEach(cat => {
    const items = itemNames[cat];
    items.forEach((name, index) => {
        const manual = generateManualData(name, cat, index);
        seedData.push({
            name,
            description: descriptions[index % descriptions.length],
            category: cat,
            pricePerHour: 50 + (Math.floor(Math.random() * 20) * 25),
            totalSlots: 5 + Math.floor(Math.random() * 11),
            facultyInCharge: facultyNames[index % facultyNames.length],
            labAssistant: assistantNames[index % assistantNames.length],
            labNumber: (index % 9) + 1,
            status: Math.random() > 0.15 ? 'available' : (Math.random() > 0.5 ? 'maintenance' : 'unavailable'),
            condition: ['Excellent', 'Good', 'Fair'][Math.floor(Math.random() * 3)],
            location: locations[cat] + (Math.floor(index / 5) + 1) + (cat === 'Computing' ? String.fromCharCode(65 + (index % 5)) : ''),
            ...manual
        });
    });
});

const run = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lab-booking';
        await mongoose.connect(uri);
        console.log(`Connected to MongoDB ${uri.includes('mongodb+srv') ? 'Atlas' : 'Local'}`);
        
        await Equipment.deleteMany();
        await Equipment.insertMany(seedData);
        
        console.log(`Successfully seeded ${seedData.length} premium assets with HIGH-VARIETY MANUALS across ${categories.length} departments.`);
        process.exit(0);
    } catch (err) {
        console.error('Error seeding data:', err.message);
        process.exit(1);
    }
};

run();
