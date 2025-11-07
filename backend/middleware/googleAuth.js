const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const verifyGoogleToken = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Google token is required' });
    }

    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload.email;
    const allowedDomain = process.env.ALLOWED_DOMAIN || 'psnacet.edu.in';

    // Check if email is from allowed domain
    if (!email.endsWith(`@${allowedDomain}`)) {
      return res.status(403).json({ 
        message: `Access denied. Only ${allowedDomain} email addresses are allowed.` 
      });
    }

    // Find or create user
    let user = await User.findOne({ email });

    if (!user) {
      // Auto-create user with student role (can be changed by exam coordinator)
      user = new User({
        name: payload.name,
        email: email,
        role: 'student', // Default role
        googleId: payload.sub,
      });
      await user.save();
    } else if (!user.googleId) {
      // Link Google account to existing user
      user.googleId = payload.sub;
      await user.save();
    }

    // Generate JWT token
    const jwtToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    req.user = user;
    req.jwtToken = jwtToken;
    next();
  } catch (error) {
    console.error('Google authentication error:', error);
    res.status(401).json({ message: 'Invalid Google token' });
  }
};

module.exports = { verifyGoogleToken };

