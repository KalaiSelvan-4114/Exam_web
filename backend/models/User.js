const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['exam_coordinator', 'department_coordinator', 'staff', 'student'],
    required: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: function() {
      return this.role !== 'exam_coordinator';
    }
  },
  year: {
    type: Number,
    enum: [1, 2, 3, 4],
    required: function() {
      return this.role === 'student';
    }
  },
  googleId: {
    type: String,
    sparse: true
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId; // Required if not using Google auth
    },
    minlength: 6
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  if (this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

module.exports = mongoose.model('User', userSchema);

