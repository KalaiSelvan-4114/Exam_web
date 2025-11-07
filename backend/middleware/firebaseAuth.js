const admin = require('../config/firebaseAdmin');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const verifyFirebaseToken = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Firebase token is required' });
    }

    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const email = decodedToken.email;
    const allowedDomain = process.env.ALLOWED_DOMAIN || 'psnacet.edu.in';

    // Check if email is from allowed domain
    if (!email || !email.endsWith(`@${allowedDomain}`)) {
      return res.status(403).json({ 
        message: `Access denied. Only ${allowedDomain} email addresses are allowed.` 
      });
    }

    // Find or create user
    let user = await User.findOne({ email });

    if (!user) {
      // Auto-create user with student role (can be changed by exam coordinator)
      user = new User({
        name: decodedToken.name || email.split('@')[0],
        email: email,
        role: 'student', // Default role
        googleId: decodedToken.uid,
        isEmailVerified: decodedToken.email_verified || false
      });
      await user.save();
    } else if (!user.googleId) {
      // Link Google account to existing user
      user.googleId = decodedToken.uid;
      if (!user.isEmailVerified) {
        user.isEmailVerified = decodedToken.email_verified || false;
      }
      await user.save();
    }

    // Generate JWT token for our API
    const jwtToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    req.user = user;
    req.jwtToken = jwtToken;
    next();
  } catch (error) {
    console.error('Firebase authentication error:', error);
    res.status(401).json({ message: 'Invalid Firebase token' });
  }
};

module.exports = { verifyFirebaseToken };
