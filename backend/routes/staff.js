const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const Exam = require('../models/Exam');
const StaffPreference = require('../models/StaffPreference');
const User = require('../models/User');

// Get staff's assigned exams
router.get('/exams', authenticate, authorize('staff'), async (req, res) => {
  try {
    const exams = await Exam.find({
      'assignedStaff.staff': req.user._id
    })
      .populate('subject')
      .populate('hall')
      .populate('assignedStaff.staff', 'name email')
      .sort({ date: 1, startTime: 1 });

    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get staff's exam preferences
router.get('/preferences', authenticate, authorize('staff'), async (req, res) => {
  try {
    const preferences = await StaffPreference.find({ staff: req.user._id })
      .populate('exam', 'subject date startTime endTime hall')
      .populate({
        path: 'exam',
        populate: { path: 'subject hall' }
      })
      .sort({ createdAt: -1 });

    res.json(preferences);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Set preference for an exam
router.post('/preferences', authenticate, authorize('staff'), async (req, res) => {
  try {
    const { examId, preference } = req.body;

    if (!['preferred', 'available', 'not_available'].includes(preference)) {
      return res.status(400).json({ message: 'Invalid preference value' });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    let staffPreference = await StaffPreference.findOne({
      staff: req.user._id,
      exam: examId
    });

    if (staffPreference) {
      staffPreference.preference = preference;
    } else {
      staffPreference = new StaffPreference({
        staff: req.user._id,
        exam: examId,
        preference
      });
    }

    await staffPreference.save();
    const populated = await StaffPreference.findById(staffPreference._id)
      .populate({
        path: 'exam',
        populate: { path: 'subject hall' }
      });

    res.json(populated);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Preference already exists' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Confirm or reject exam duty
router.put('/exams/:examId/confirm', authenticate, authorize('staff'), async (req, res) => {
  try {
    const { examId } = req.params;
    const { status } = req.body; // 'confirmed' or 'rejected'

    if (!['confirmed', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Use "confirmed" or "rejected"' });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const staffAssignment = exam.assignedStaff.find(
      item => item.staff.toString() === req.user._id.toString()
    );

    if (!staffAssignment) {
      return res.status(403).json({ message: 'You are not assigned to this exam' });
    }

    staffAssignment.status = status;
    await exam.save();

    const populatedExam = await Exam.findById(examId)
      .populate('subject')
      .populate('hall')
      .populate('assignedStaff.staff', 'name email');

    res.json(populatedExam);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get upcoming exam duties calendar
router.get('/calendar', authenticate, authorize('staff'), async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const currentMonth = month !== undefined ? parseInt(month) : new Date().getMonth();
    
    // Start of the month at 00:00:00
    const startDate = new Date(currentYear, currentMonth, 1);
    startDate.setHours(0, 0, 0, 0);
    
    // End of the month at 23:59:59.999
    const endDate = new Date(currentYear, currentMonth + 1, 0);
    endDate.setHours(23, 59, 59, 999);

    // Get ALL exams for the month (not just assigned ones)
    const exams = await Exam.find({
      date: { $gte: startDate, $lte: endDate }
    })
      .populate('subject')
      .populate('hall')
      .select('date startTime endTime subject hall assignedStaff')
      .sort({ date: 1, startTime: 1 });

    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

