const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const Department = require('../models/Department');
const User = require('../models/User');

// Get all departments (public endpoint for signup)
router.get('/public', async (req, res) => {
  try {
    const departments = await Department.find()
      .select('_id name code')
      .sort({ name: 1 });
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all departments (authenticated)
router.get('/', authenticate, async (req, res) => {
  try {
    const departments = await Department.find().populate('coordinator', 'name email');
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get department by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const department = await Department.findById(req.params.id).populate('coordinator', 'name email');
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    res.json(department);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create department (Exam Coordinator only)
router.post('/', authenticate, authorize('exam_coordinator'), async (req, res) => {
  try {
    const { name, code, coordinator } = req.body;

    const department = new Department({
      name,
      code,
      coordinator: coordinator || undefined
    });

    await department.save();
    const populatedDept = await Department.findById(department._id).populate('coordinator', 'name email');
    res.status(201).json(populatedDept);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Department name or code already exists' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update department (Exam Coordinator only)
router.put('/:id', authenticate, authorize('exam_coordinator'), async (req, res) => {
  try {
    const { name, code, coordinator } = req.body;
    
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    if (name) department.name = name;
    if (code) department.code = code;
    if (coordinator !== undefined) department.coordinator = coordinator;

    await department.save();
    const populatedDept = await Department.findById(department._id).populate('coordinator', 'name email');
    res.json(populatedDept);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Department name or code already exists' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete department (Exam Coordinator only)
router.delete('/:id', authenticate, authorize('exam_coordinator'), async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    // Check if department has users
    const users = await User.find({ department: department._id });
    if (users.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete department with assigned users. Reassign users first.' 
      });
    }

    await department.deleteOne();
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

