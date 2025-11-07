const admin = require('../config/firebaseAdmin');
const OTP = require('../models/OTP');
const otpGenerator = require('otp-generator');

// Generate and send OTP using Firebase
const generateAndStoreOTP = async (email) => {
  try {
    // Normalize email (lowercase and trim)
    const normalizedEmail = email.toLowerCase().trim();
    
    // Generate OTP
    const otp = otpGenerator.generate(6, { 
      upperCaseAlphabets: false, 
      lowerCaseAlphabets: false, 
      specialChars: false 
    });

    // Delete old OTPs for this email
    await OTP.deleteMany({ email: normalizedEmail });

    // Save OTP (expires in 10 minutes)
    const otpData = new OTP({
      email: normalizedEmail,
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });
    await otpData.save();

    // Send email using Firebase Extensions or custom email service
    // For now, we'll use a simple email sending approach
    // You can integrate with Firebase Cloud Functions or use Firebase Extensions
    
    return otp;
  } catch (error) {
    console.error('Error generating OTP:', error);
    throw error;
  }
};

// Send OTP via email using Firebase (requires Firebase Cloud Functions or Extensions)
const sendOTPViaFirebase = async (email, otp) => {
  try {
    // Option 1: Use Firebase Cloud Functions to send email
    // This requires setting up a Cloud Function that handles email sending
    
    // Option 2: Use Firebase Extensions (Email Trigger)
    // This requires installing the "Trigger Email" extension
    
    // Option 3: Use a third-party service integrated with Firebase
    // For now, we'll log it (in production, implement one of the above)
    
    // TODO: Implement actual email sending via Firebase Cloud Functions
    // For now, return success
    return true;
  } catch (error) {
    console.error('Error sending OTP via Firebase:', error);
    throw error;
  }
};

// Check OTP validity without marking it as verified
const checkOTP = async (email, otp) => {
  try {
    // Normalize email (lowercase and trim) to match stored format
    const normalizedEmail = email.toLowerCase().trim();
    
    // Validate OTP format
    if (!otp || otp.length !== 6 || !/^\d+$/.test(otp)) {
      console.error('Invalid OTP format:', otp);
      return false;
    }

    const otpData = await OTP.findOne({ 
      email: normalizedEmail, 
      otp: otp.trim(),
      expiresAt: { $gt: new Date() },
      verified: false
    });

    if (!otpData) {
      console.error('OTP not found or expired for email:', normalizedEmail);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking OTP:', error);
    console.error('Error details:', error.message, error.stack);
    return false;
  }
};

// Verify OTP and mark as verified
const verifyOTP = async (email, otp) => {
  try {
    // Normalize email (lowercase and trim) to match stored format
    const normalizedEmail = email.toLowerCase().trim();
    
    // Validate OTP format
    if (!otp || otp.length !== 6 || !/^\d+$/.test(otp)) {
      console.error('Invalid OTP format:', otp);
      return false;
    }

    const otpData = await OTP.findOne({ 
      email: normalizedEmail, 
      otp: otp.trim(),
      expiresAt: { $gt: new Date() },
      verified: false
    });

    if (!otpData) {
      console.error('OTP not found or expired for email:', normalizedEmail);
      return false;
    }

    // Mark OTP as verified
    otpData.verified = true;
    await otpData.save();

    return true;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    console.error('Error details:', error.message, error.stack);
    return false;
  }
};

module.exports = {
  generateAndStoreOTP,
  sendOTPViaFirebase,
  checkOTP,
  verifyOTP
};

