const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendBookingEmail = async (userEmail, bookingDetails, type = 'created') => {
    // Fallback if not configured
    if (process.env.EMAIL_USER === 'your_email@gmail.com' || !process.env.EMAIL_USER) {
        console.log(`[Mock Email] To: ${userEmail}, Type: ${type}, Equipment: ${bookingDetails.equipmentName}`);
        return;
    }

    let subject = type === 'created' 
        ? '🚀 Lab Protocol Initiated: Booking Confirmed' 
        : type === 'cancelled' 
            ? '⚠️ Lab Protocol Terminated: Booking Cancelled'
            : '📝 Lab Protocol Update: Approval Received';

    let html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #334155;">
            <div style="background: linear-gradient(135deg, #1e3a8a 0%, #1e1b4b 100%); padding: 30px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px; letter-spacing: 2px;">PRIVATE LAB LIMITED</h1>
                <p style="margin: 5px 0 0; font-size: 14px; color: #94a3b8; text-transform: uppercase;">Engineering Department Portal</p>
            </div>
            <div style="padding: 40px;">
                <h2 style="color: #3b82f6; margin-top: 0;">${subject}</h2>
                <p style="line-height: 1.6; color: #94a3b8;">Greetings Personnel,</p>
                <p style="line-height: 1.6;">${type === 'created' 
                    ? `Your request to access the following laboratory resource has been processed and confirmed.` 
                    : `The following laboratory resource allocation has been removed from the current mission schedule.`}</p>
                
                <div style="background: rgba(255,255,255,0.03); border-radius: 8px; padding: 20px; margin: 30px 0; border: 1px solid #334155;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px;">EQUIPMENT</td><td style="padding: 8px 0; font-weight: 700;">${bookingDetails.equipmentName}</td></tr>
                        <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px;">TIMELINE</td><td style="padding: 8px 0; font-weight: 700;">${bookingDetails.date}</td></tr>
                        <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px;">DURATION</td><td style="padding: 8px 0; font-weight: 700;">${bookingDetails.startTime} - ${bookingDetails.endTime}</td></tr>
                        <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px;">PROTOCOL ID</td><td style="padding: 8px 0; font-weight: 700; color: #3b82f6;">#${bookingDetails.id || 'N/A'}</td></tr>
                    </table>
                </div>

                <p style="font-size: 14px; color: #64748b; text-align: center; margin-top: 40px;">Please ensure you have your digital clearance token ready when arriving at the lab.</p>
            </div>
            <div style="background: rgba(0,0,0,0.2); padding: 20px; text-align: center; font-size: 12px; color: #475569;">
                &copy; 2026 Private Lab Limited. All rights reserved. | Security Protocol v4.0
            </div>
        </div>
    `;

    try {
        await transporter.sendMail({
            from: `"Private Lab Ltd" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: subject,
            html: html
        });
    } catch (err) {
        if (err.responseCode === 535) {
            console.error('\n❌ EMAIL AUTHENTICATION FAILURE (535):');
            console.error('   Your Gmail credentials were rejected. This usually happens because:');
            console.error('   1. You are using your regular password instead of an "App Password".');
            console.error('   2. 2-Step Verification is not enabled.');
            console.error('   FIX: Go to Google Account Security > App Passwords, generate a code, and use it in EMAIL_PASS.\n');
        } else {
            console.error('Email Dispatch Error:', err.message);
        }
    }
};

module.exports = { sendBookingEmail };
