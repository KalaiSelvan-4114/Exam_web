const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const Hall = require('../models/Hall');
const Exam = require('../models/Exam');

// Get all halls
router.get('/', authenticate, async (req, res) => {
  try {
    const { role, department } = req.user;
    let query = { isActive: true };

    // Department coordinators see only their department's halls
    if (role === 'department_coordinator' && department) {
      query.department = department;
    }

    const halls = await Hall.find(query)
      .populate('department')
      .sort({ name: 1 });

    res.json(halls);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get hall by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const hall = await Hall.findById(req.params.id).populate('department');
    if (!hall) {
      return res.status(404).json({ message: 'Hall not found' });
    }
    res.json(hall);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create hall (Department Coordinator only)
router.post('/', authenticate, authorize('department_coordinator'), async (req, res) => {
  try {
    const { name, number, location, capacity, facilities } = req.body;

    if (!req.user.department) {
      return res.status(400).json({ message: 'Department coordinator must have a department assigned' });
    }

    const hall = new Hall({
      name,
      number,
      location,
      capacity,
      facilities: facilities || [],
      department: req.user.department
    });

    await hall.save();
    const populatedHall = await Hall.findById(hall._id).populate('department');
    res.status(201).json(populatedHall);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Hall number already exists in this department' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update hall (Department Coordinator only)
router.put('/:id', authenticate, authorize('department_coordinator'), async (req, res) => {
  try {
    const hall = await Hall.findById(req.params.id);
    if (!hall) {
      return res.status(404).json({ message: 'Hall not found' });
    }

    // Check if hall belongs to coordinator's department
    if (hall.department.toString() !== req.user.department.toString()) {
      return res.status(403).json({ message: 'Access denied. Hall does not belong to your department.' });
    }

    const { name, number, location, capacity, facilities, isActive } = req.body;

    if (name) hall.name = name;
    if (number) hall.number = number;
    if (location) hall.location = location;
    if (capacity) hall.capacity = capacity;
    if (facilities) hall.facilities = facilities;
    if (isActive !== undefined) hall.isActive = isActive;

    await hall.save();
    const populatedHall = await Hall.findById(hall._id).populate('department');
    res.json(populatedHall);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete hall (Department Coordinator only)
router.delete('/:id', authenticate, authorize('department_coordinator'), async (req, res) => {
  try {
    const hall = await Hall.findById(req.params.id);
    if (!hall) {
      return res.status(404).json({ message: 'Hall not found' });
    }

    // Check if hall belongs to coordinator's department
    if (hall.department.toString() !== req.user.department.toString()) {
      return res.status(403).json({ message: 'Access denied. Hall does not belong to your department.' });
    }

    // Check if hall has upcoming exams
    const upcomingExams = await Exam.find({
      hall: hall._id,
      date: { $gte: new Date() },
      status: { $in: ['scheduled', 'ongoing'] }
    });

    if (upcomingExams.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete hall with upcoming exams. Deactivate it instead.' 
      });
    }

    await hall.deleteOne();
    res.json({ message: 'Hall deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get hall availability for a date
router.get('/:id/availability', authenticate, async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'Date parameter is required' });
    }

    const exams = await Exam.find({
      hall: req.params.id,
      date: new Date(date),
      status: { $in: ['scheduled', 'ongoing'] }
    }).select('startTime endTime');

    res.json({ date, bookedSlots: exams });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

