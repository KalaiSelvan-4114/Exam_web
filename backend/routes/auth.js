const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const otpGenerator = require('otp-generator');
const { verifyGoogleToken } = require('../middleware/googleAuth');
const { verifyFirebaseToken } = require('../middleware/firebaseAuth');
const { authenticate } = require('../middleware/auth');
const admin = require('../config/firebaseAdmin');
const User = require('../models/User');
const OTP = require('../models/OTP');
const TempSignup = require('../models/TempSignup');
const { sendOTPEmail } = require('../services/emailService');
const { generateAndStoreOTP, checkOTP, verifyOTP } = require('../services/firebaseOTPService');

// Google Sign-In with Firebase
router.post('/google', verifyFirebaseToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('department').select('-password');
    
    res.json({
      message: 'Authentication successful',
      token: req.jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Legacy Google Sign-In (keeping for backward compatibility)
router.post('/google-legacy', verifyGoogleToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('department').select('-password');
    
    res.json({
      message: 'Authentication successful',
      token: req.jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('department').select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Signup - Send OTP using Firebase
router.post('/signup/send-otp', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  }),
  body('name').trim().notEmpty(),
  body('role').optional().isIn(['student', 'staff', 'department_coordinator', 'exam_coordinator'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name, role, department } = req.body;
    const allowedDomain = process.env.ALLOWED_DOMAIN || 'psnacet.edu.in';

    // Normalize email (lowercase and trim)
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email is from allowed domain
    if (!normalizedEmail.endsWith(`@${allowedDomain}`)) {
      return res.status(403).json({ 
        message: `Access denied. Only ${allowedDomain} email addresses are allowed.` 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Delete old OTPs and temp signups for this email
    await OTP.deleteMany({ email: normalizedEmail });
    await TempSignup.deleteMany({ email: normalizedEmail });

    // Store temporary signup data
    const tempSignup = new TempSignup({
      email: normalizedEmail,
      name,
      password, // Will be hashed by pre-save hook
      role: role || 'student',
      department: department || undefined,
      year: (role === 'student' && req.body.year) ? parseInt(req.body.year, 10) : undefined,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });
    await tempSignup.save();

    // Generate OTP using Firebase service
    try {
      const otp = await generateAndStoreOTP(normalizedEmail);
      
      // Send OTP email (using nodemailer for now, can be replaced with Firebase Cloud Functions)
      await sendOTPEmail(normalizedEmail, otp);
      
      res.json({ 
        message: 'OTP sent to your email. Please check your inbox.',
        email: normalizedEmail 
      });
    } catch (error) {
      console.error('Error generating/sending OTP:', error);
      
      // Check if it's an email sending error but OTP was generated
      if (error.message && (error.message.includes('SMTP') || !process.env.SMTP_USER)) {
        // OTP was generated but email failed - in dev mode, we still allow it
        res.json({ 
          message: 'OTP generated. Check backend console for OTP (SMTP not configured).',
          email: normalizedEmail,
          developmentMode: true
        });
      } else {
        res.status(500).json({ 
          message: 'Failed to send OTP. Please check SMTP configuration. See OTP_SETUP.md for help.',
          error: error.message 
        });
      }
    }
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Signup - Verify OTP and Create User
router.post('/signup/verify-otp', [
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, otp } = req.body;

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Verify OTP (check only, don't mark as verified yet)
    if (!otp || !otp.trim()) {
      return res.status(400).json({ message: 'OTP is required' });
    }

    console.log('Verifying OTP for email:', normalizedEmail);
    
    const isValidOTP = await checkOTP(normalizedEmail, otp);
    if (!isValidOTP) {
      return res.status(400).json({ message: 'Invalid or expired OTP. Please check and try again.' });
    }

    // Get temporary signup data
    const tempSignup = await TempSignup.findOne({ 
      email: normalizedEmail,
      expiresAt: { $gt: new Date() }
    });

    if (!tempSignup) {
      return res.status(400).json({ message: 'Signup session expired. Please start again.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      await TempSignup.deleteMany({ email: normalizedEmail });
      await OTP.deleteMany({ email: normalizedEmail });
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Validate department requirement for non-exam_coordinator roles
    if (tempSignup.role !== 'exam_coordinator' && !tempSignup.department) {
      return res.status(400).json({ 
        message: 'Department is required for this role. Please start signup again and select a department.' 
      });
    }

    // Validate year requirement for students
    if (tempSignup.role === 'student' && !tempSignup.year) {
      return res.status(400).json({ 
        message: 'Year is required for students. Please start signup again and select a year.' 
      });
    }

    // Create user with stored data
    const userData = {
      name: tempSignup.name,
      email: normalizedEmail,
      password: tempSignup.password, // Already hashed
      role: tempSignup.role,
      isEmailVerified: true
    };

    // Add department if it exists (required for non-exam_coordinator roles)
    if (tempSignup.department) {
      userData.department = tempSignup.department;
    }

    // Add year if it exists (required for students)
    if (tempSignup.year) {
      userData.year = tempSignup.year;
    }

    const user = new User(userData);
    await user.save();

    // Only mark OTP as verified after successful user creation
    await verifyOTP(normalizedEmail, otp);

    // Clean up temporary data
    await TempSignup.deleteMany({ email: normalizedEmail });
    await OTP.deleteMany({ email: normalizedEmail });

    // Generate JWT token
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in environment variables');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Populate department if it exists, otherwise return null
    let populatedUser;
    try {
      populatedUser = await User.findById(user._id).populate('department').select('-password');
    } catch (populateError) {
      console.error('Error populating department:', populateError);
      // If population fails, get user without populate
      populatedUser = await User.findById(user._id).select('-password');
    }

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: populatedUser._id,
        name: populatedUser.name,
        email: populatedUser.email,
        role: populatedUser.role,
        department: populatedUser.department || null
      }
    });
  } catch (error) {
    console.error('Signup verification error:', error);
    console.error('Error stack:', error.stack);
    
    if (error.code === 11000) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    // More detailed error message for debugging
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Server error occurred during account creation';
    
    res.status(500).json({ 
      message: 'Server error', 
      error: errorMessage 
    });
  }
});

// Login with email and password
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Normalize email (lowercase and trim) to match stored format
    const normalizedEmail = email.toLowerCase().trim();
    
    console.log('Login attempt:', {
      originalEmail: email,
      normalizedEmail: normalizedEmail,
      passwordLength: password?.length
    });

    // Find user - try both normalized and original email patterns
    let user = await User.findOne({ email: normalizedEmail });
    
    // If not found, try case-insensitive search
    if (!user) {
      console.log('User not found with normalized email, trying case-insensitive search...');
      user = await User.findOne({ 
        $expr: { 
          $eq: [{ $toLower: "$email" }, normalizedEmail] 
        } 
      });
    }
    
    // If still not found, log what emails exist for debugging
    if (!user) {
      console.log('User not found. Searching for similar emails...');
      const similarUsers = await User.find({ 
        email: { $regex: new RegExp(normalizedEmail.split('@')[0], 'i') } 
      }).select('email role');
      console.log('Similar users found:', similarUsers);
      
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    console.log('User found:', {
      id: user._id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      hasPassword: !!user.password
    });

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated. Please contact administrator.' });
    }

    // Check if user has password (not Google-only account)
    if (!user.password) {
      return res.status(401).json({ message: 'Please use Google Sign-In for this account' });
    }

    // Verify password
    console.log('Comparing password...');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password comparison result:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('Password mismatch for user:', user.email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    console.log('Password verified successfully');

    // Check email verification
    if (!user.isEmailVerified) {
      return res.status(401).json({ message: 'Please verify your email first' });
    }

    // Generate JWT token
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in environment variables');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Populate department if it exists, otherwise return null
    let populatedUser;
    try {
      populatedUser = await User.findById(user._id).populate('department').select('-password');
    } catch (populateError) {
      console.error('Error populating department:', populateError);
      // If population fails, get user without populate
      populatedUser = await User.findById(user._id).select('-password');
    }

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: populatedUser._id,
        name: populatedUser.name,
        email: populatedUser.email,
        role: populatedUser.role,
        department: populatedUser.department || null
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Resend OTP (for signup)
router.post('/resend-otp', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    
    // Normalize email (lowercase and trim)
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Check if temp signup exists
    const tempSignup = await TempSignup.findOne({ email: normalizedEmail });
    if (!tempSignup) {
      return res.status(400).json({ message: 'Signup session expired. Please start again.' });
    }

    // Generate new OTP using the service
    const otp = await generateAndStoreOTP(normalizedEmail);

    // Send OTP email
    try {
      await sendOTPEmail(normalizedEmail, otp);
      res.json({ message: 'OTP resent to your email' });
    } catch (error) {
      console.error('Error sending email:', error);
      // In development mode, still allow it
      if (process.env.NODE_ENV !== 'production' || !process.env.SMTP_USER) {
        res.json({ 
          message: 'OTP generated. Check backend console for OTP (SMTP not configured).',
          developmentMode: true
        });
      } else {
        res.status(500).json({ message: 'Failed to send OTP email. Please try again.' });
      }
    }
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Logout (client-side token removal)
router.post('/logout', authenticate, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;

// Forgot Password - Request OTP
router.post('/password/forgot', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      // Do not reveal user existence
      return res.json({ message: 'If this email exists, an OTP has been sent' });
    }

    // Generate OTP and send email
    const otp = await generateAndStoreOTP(normalizedEmail);
    await sendOTPEmail(normalizedEmail, otp);

    return res.json({ message: 'OTP sent to your email. Please check your inbox.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Forgot Password - Verify OTP
router.post('/password/verify-otp', [
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, otp } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const isValid = await checkOTP(normalizedEmail, otp);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    return res.json({ message: 'OTP verified. You can reset your password now.' });
  } catch (error) {
    console.error('Verify reset OTP error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Forgot Password - Reset
router.post('/password/reset', [
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }),
  body('newPassword').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, otp, newPassword } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Verify OTP (mark as used)
    const verified = await verifyOTP(normalizedEmail, otp);
    if (!verified) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    // Cleanup OTPs for this email
    await OTP.deleteMany({ email: normalizedEmail });

    return res.json({ message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

