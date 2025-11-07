const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Department = require('../models/Department');

// Get all users (Exam Coordinator only)
router.get('/', authenticate, authorize('exam_coordinator'), async (req, res) => {
  try {
    const users = await User.find().populate('department').select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('department').select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create user (Exam Coordinator only)
router.post('/', authenticate, authorize('exam_coordinator'), async (req, res) => {
  try {
    const { name, email, role, department } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const user = new User({
      name,
      email,
      role,
      department: department || undefined
    });

    await user.save();
    const populatedUser = await User.findById(user._id).populate('department').select('-password');
    res.status(201).json(populatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user (Exam Coordinator only)
router.put('/:id', authenticate, authorize('exam_coordinator'), async (req, res) => {
  try {
    const { name, role, department, isActive } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (role) user.role = role;
    if (department !== undefined) user.department = department;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();
    const populatedUser = await User.findById(user._id).populate('department').select('-password');
    res.json(populatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete user (Exam Coordinator only)
router.delete('/:id', authenticate, authorize('exam_coordinator'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.deleteOne();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

