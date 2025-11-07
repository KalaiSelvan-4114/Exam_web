const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const Subject = require('../models/Subject');
const Department = require('../models/Department');

// Get all subjects
router.get('/', authenticate, async (req, res) => {
  try {
    const { role, department } = req.user;
    let query = {};

    // Department coordinators see only their department's subjects
    if (role === 'department_coordinator' && department) {
      query.department = department;
    }

    const subjects = await Subject.find(query)
      .populate('department')
      .sort({ semester: 1, code: 1 });

    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get subject by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id).populate('department');
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    res.json(subject);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create subject (Department Coordinator only)
router.post('/', authenticate, authorize('department_coordinator'), async (req, res) => {
  try {
    const { name, code, semester } = req.body;

    if (!req.user.department) {
      return res.status(400).json({ message: 'Department coordinator must have a department assigned' });
    }

    const subject = new Subject({
      name,
      code,
      semester,
      department: req.user.department
    });

    await subject.save();
    const populatedSubject = await Subject.findById(subject._id).populate('department');
    res.status(201).json(populatedSubject);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Subject code already exists in this department' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update subject (Department Coordinator only)
router.put('/:id', authenticate, authorize('department_coordinator'), async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Check if subject belongs to coordinator's department
    if (subject.department.toString() !== req.user.department.toString()) {
      return res.status(403).json({ message: 'Access denied. Subject does not belong to your department.' });
    }

    const { name, code, semester } = req.body;

    if (name) subject.name = name;
    if (code) subject.code = code;
    if (semester) subject.semester = semester;

    await subject.save();
    const populatedSubject = await Subject.findById(subject._id).populate('department');
    res.json(populatedSubject);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Subject code already exists in this department' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete subject (Department Coordinator only)
router.delete('/:id', authenticate, authorize('department_coordinator'), async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Check if subject belongs to coordinator's department
    if (subject.department.toString() !== req.user.department.toString()) {
      return res.status(403).json({ message: 'Access denied. Subject does not belong to your department.' });
    }

    await subject.deleteOne();
    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

