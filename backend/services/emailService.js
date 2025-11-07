const nodemailer = require('nodemailer');

// Create transporter (you can configure this based on your email provider)
const createTransporter = () => {
  // Check if SMTP is configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️  SMTP credentials not configured. OTP will be logged to console instead.');
    return null;
  }

  // For Gmail, you can use app-specific password
  // For other providers, adjust the configuration
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

const sendOTPEmail = async (email, otp) => {
  try {
    const transporter = createTransporter();
    
    // If SMTP is not configured, log OTP to console (development mode)
    if (!transporter) {
      console.log('\n═══════════════════════════════════════════════════════');
      console.log('📧 OTP EMAIL (Development Mode - SMTP not configured)');
      console.log('═══════════════════════════════════════════════════════');
      console.log(`To: ${email}`);
      console.log(`Subject: Exam Schedule System - OTP Verification`);
      console.log(`OTP: ${otp}`);
      console.log('═══════════════════════════════════════════════════════\n');
      console.log('⚠️  To enable email sending, configure SMTP in backend/.env');
      console.log('   See OTP_SETUP.md for instructions\n');
      return true; // Return true so signup can continue
    }
    
    const mailOptions = {
      from: process.env.SMTP_USER || 'noreply@exam-schedule.com',
      to: email,
      subject: 'Exam Schedule System - OTP Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">OTP Verification</h2>
          <p>Dear User,</p>
          <p>Your OTP for account verification is:</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #2563eb; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this OTP, please ignore this email.</p>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">Best regards,<br>Exam Schedule Management System</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ OTP email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending OTP email:', error.message);
    console.error('Full error:', error);
    
    // In development, log the OTP even if email fails
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n⚠️  Email sending failed, but here is your OTP for testing:');
      console.log(`   OTP: ${otp}`);
      console.log(`   Email: ${email}\n`);
      // Still return true for development so user can continue
      return true;
    }
    
    throw error;
  }
};

module.exports = { sendOTPEmail };

