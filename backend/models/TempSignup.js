const mongoose = require('mongoose');

const tempSignupSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'staff', 'department_coordinator', 'exam_coordinator'],
    required: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  year: {
    type: Number,
    enum: [1, 2, 3, 4]
  },
  expiresAt: {
    type: Date,
    required: true,
    default: Date.now,
    expires: 600 // 10 minutes
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// NOTE: Do NOT hash password here.
// The final `User` model will hash the password on save.

module.exports = mongoose.model('TempSignup', tempSignupSchema);

