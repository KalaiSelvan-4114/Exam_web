const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const Exam = require('../models/Exam');
const Hall = require('../models/Hall');
const HallAssignment = require('../models/HallAssignment');
const StaffPreference = require('../models/StaffPreference');
const Subject = require('../models/Subject');
const StudentExam = require('../models/StudentExam');

// Helper to convert Map to object for JSON response
const mapToObject = (map) => {
  if (!map || !(map instanceof Map)) return { '1': 0, '2': 0, '3': 0, '4': 0 };
  const obj = {};
  for (const [key, value] of map.entries()) {
    obj[key] = value;
  }
  return obj;
};

// Helper to transform exam for JSON response
const transformExam = (exam) => {
  const examObj = exam.toObject ? exam.toObject() : exam;
  if (examObj.yearBreakdown) {
    examObj.yearBreakdown = mapToObject(examObj.yearBreakdown);
  }
  return examObj;
};

// Get all exams
router.get('/', authenticate, async (req, res) => {
  try {
    const { role, department } = req.user;
    let query = {};

    // Filter based on role
    if (role === 'department_coordinator' && department) {
      // Get exams created for this department
      query.department = department._id || department;
    } else if (role === 'staff') {
      // Staff: show exams assigned to me OR published exams in my department
      const depId = department?._id || department;
      query.$or = [
        { 'assignedStaff.staff': req.user._id },
        { department: depId, isPublished: true }
      ];
    } else if (role === 'student') {
      // Student: show published exams in my department (fallback if no personalized mapping)
      const depId = department?._id || department;
      const studentExams = await StudentExam.find({ student: req.user._id }).select('exam');
      const examIds = studentExams.map(se => se.exam);
      if (examIds.length > 0) {
        query._id = { $in: examIds };
      } else {
        query = { department: depId, isPublished: true };
      }
    }

    const exams = await Exam.find(query)
      .populate('subject')
      .populate('hall')
      .populate('assignedStaff.staff', 'name email')
      .populate('createdBy', 'name email')
      .sort({ date: 1, startTime: 1 });

    res.json(exams.map(transformExam));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DPC: get published exams for my department (explicit, reliable)
router.get('/department/published', authenticate, authorize('department_coordinator'), async (req, res) => {
  try {
    const depId = req.user.department?._id || req.user.department;
    if (!depId) {
      return res.status(400).json({ message: 'Department not set for user' });
    }

    const exams = await Exam.find({ department: depId, isPublished: true })
      .populate('subject')
      .populate('hall')
      .populate('assignedStaff.staff', 'name email')
      .populate('createdBy', 'name email')
      .sort({ date: 1 });

    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get exam by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('subject')
      .populate('hall')
      .populate('assignedStaff.staff', 'name email')
      .populate('createdBy', 'name email');

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    res.json(transformExam(exam));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create exam (Exam Coordinator only) - without hall; publish later
router.post('/', authenticate, authorize('exam_coordinator'), async (req, res) => {
  try {
    const { department, subject, date, session, totalStudents } = req.body;

    if (!department) {
      return res.status(400).json({ message: 'Department is required' });
    }

    // Handle yearBreakdown (convert object to Map)
    let yearBreakdown = new Map([
      ['1', 0],
      ['2', 0],
      ['3', 0],
      ['4', 0]
    ]);
    if (req.body.yearBreakdown && typeof req.body.yearBreakdown === 'object') {
      yearBreakdown = new Map();
      for (const year of ['1', '2', '3', '4']) {
        yearBreakdown.set(year, parseInt(req.body.yearBreakdown[year] || '0', 10) || 0);
      }
    }

    const exam = new Exam({
      department,
      subject,
      date,
      session,
      totalStudents,
      yearBreakdown,
      // Per new workflow: exam is published immediately after creation
      isPublished: true,
      createdBy: req.user._id
    });

    await exam.save();
    const populatedExam = await Exam.findById(exam._id)
      .populate('subject')
      .populate('hall')
      .populate('assignedStaff.staff', 'name email')
      .populate('createdBy', 'name email');

    res.status(201).json(transformExam(populatedExam));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update exam (Exam Coordinator only)
router.put('/:id', authenticate, authorize('exam_coordinator'), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const { department, subject, date, session, totalStudents, status, yearBreakdown } = req.body;

    if (department) exam.department = department;
    if (subject) exam.subject = subject;
    if (date) exam.date = date;
    if (session) exam.session = session;
    // Hall and staff are managed by DPC/EC flows, not directly editable here
    if (totalStudents) exam.totalStudents = totalStudents;
    if (status) exam.status = status;
    if (yearBreakdown && typeof yearBreakdown === 'object') {
      const newBreakdown = new Map();
      for (const year of ['1', '2', '3', '4']) {
        newBreakdown.set(year, parseInt(yearBreakdown[year] || '0', 10) || 0);
      }
      exam.yearBreakdown = newBreakdown;
    }

    await exam.save();
    const populatedExam = await Exam.findById(exam._id)
      .populate('subject')
      .populate('hall')
      .populate('assignedStaff.staff', 'name email')
      .populate('createdBy', 'name email');

    res.json(transformExam(populatedExam));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Publish exam (Exam Coordinator only)
router.post('/:id/publish', authenticate, authorize('exam_coordinator'), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    exam.isPublished = true;
    await exam.save();

    const populatedExam = await Exam.findById(exam._id)
      .populate('subject')
      .populate('hall')
      .populate('assignedStaff.staff', 'name email')
      .populate('createdBy', 'name email');

    res.json(transformExam(populatedExam));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Unpublish exam (Exam Coordinator only)
router.post('/:id/unpublish', authenticate, authorize('exam_coordinator'), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    exam.isPublished = false;
    await exam.save();

    const populatedExam = await Exam.findById(exam._id)
      .populate('subject')
      .populate('hall')
      .populate('assignedStaff.staff', 'name email')
      .populate('createdBy', 'name email');

    res.json(transformExam(populatedExam));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete exam (Exam Coordinator only)
router.delete('/:id', authenticate, authorize('exam_coordinator'), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    await exam.deleteOne();
    res.json({ message: 'Exam deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

// Allocate halls and staff based on preferences (Exam Coordinator only)
router.post('/:id/allocate', authenticate, authorize('exam_coordinator'), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    // Require hall assignment first
    const assignment = await HallAssignment.findOne({ exam: exam._id }).populate('halls.hall');
    if (!assignment) return res.status(400).json({ message: 'Assign halls to this exam first' });

    // Use session on exam
    const session = exam.session;

    // Find staff who picked the same day/session
    const startOfDay = new Date(exam.date); startOfDay.setHours(0,0,0,0);
    const endOfDay = new Date(exam.date); endOfDay.setHours(23,59,59,999);

    const candidates = await StaffPreference.find({
      date: { $gte: startOfDay, $lte: endOfDay },
      session
    }).populate('staff', 'name email role');

    // Randomize candidates using Fisher–Yates for unbiased shuffle
    const shuffled = [...candidates];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Determine staff per hall
    let staffPerHall = parseInt(process.env.STAFF_PER_HALL || '1', 10);
    if (!Number.isFinite(staffPerHall) || staffPerHall < 1) staffPerHall = 1;

    // Assign staff per hall (even distribution)
    const totalNeeded = assignment.halls.length * staffPerHall;
    const chosen = shuffled.slice(0, totalNeeded);

    // Flatten for exam.assignedStaff
    exam.assignedStaff = chosen.map(c => ({ staff: c.staff._id, status: 'confirmed' }));
    await exam.save();

    // Persist per-hall staff mapping on HallAssignment
    let idx = 0;
    assignment.halls = assignment.halls.map(h => {
      const staffForHall = chosen.slice(idx, idx + staffPerHall).map(c => c.staff._id);
      idx += staffPerHall;
      return { ...h.toObject(), assignedStaff: staffForHall };
    });
    await assignment.save();

    const populatedExam = await Exam.findById(exam._id)
      .populate('subject')
      .populate('assignedStaff.staff', 'name email')
      .populate('createdBy', 'name email');

    res.json({ message: 'Allocation completed', exam: populatedExam, halls: assignment.halls });
  } catch (error) {
    console.error('Allocation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

