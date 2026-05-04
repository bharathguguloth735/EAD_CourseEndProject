const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendEmail = async (to, subject, html) => {
    // If not configured, just log
    if (process.env.EMAIL_USER === 'your_email@gmail.com' || !process.env.EMAIL_USER) {
        console.log('--- MOCK EMAIL ---');
        console.log('To:', to);
        console.log('Subject:', subject);
        console.log('Content:', html.replace(/<[^>]*>?/gm, ''));
        console.log('------------------');
        return { isMock: true };
    }

    try {
        const info = await transporter.sendMail({
            from: `"Private Lab Ltd" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
        });
        return info;
    } catch (err) {
        if (err.responseCode === 535) {
            console.error('\n❌ EMAIL AUTHENTICATION FAILURE (535):');
            console.error('   Your Gmail credentials were rejected. This usually happens because:');
            console.error('   1. You are using your regular password instead of an "App Password".');
            console.error('   FIX: Go to Google Account Security > App Passwords, generate a code, and use it in EMAIL_PASS.\n');
        } else {
            console.error('Email Error:', err.message);
        }
        return { error: true, message: err.message };
    }
};

module.exports = { sendEmail };
