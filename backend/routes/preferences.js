const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const StaffPreference = require('../models/StaffPreference');
const Exam = require('../models/Exam');
const HallAssignment = require('../models/HallAssignment');

// Create preference with slot locking (Staff only)
router.post('/', authenticate, authorize('staff'), async (req, res) => {
	try {
		const { date, session, notes } = req.body;
		if (!date || !session) {
			return res.status(400).json({ message: 'date and session are required' });
		}

		// Capacity check for the selected slot (department-scoped)
		const depId = req.user.department?._id || req.user.department;
		const day = new Date(date); day.setHours(0,0,0,0);
		const dayEnd = new Date(day); dayEnd.setHours(23,59,59,999);
		const STAFF_PER_HALL = parseInt(process.env.STAFF_PER_HALL || '1', 10);

		// Use a date range to avoid timezone/exact-match issues
		const slotExams = await Exam.find({
			department: depId,
			isPublished: true,
			date: { $gte: day, $lte: dayEnd },
			session
		}).select('_id');
		if (slotExams.length === 0) {
			return res.status(400).json({ message: 'No published exams for this slot' });
		}
		const assignments = await HallAssignment.find({ exam: { $in: slotExams.map(x => x._id) } }).select('halls');
		const numHalls = assignments.reduce((sum, a) => sum + (a.halls?.length || 0), 0);
		const capacity = numHalls * STAFF_PER_HALL;

		const used = await StaffPreference.countDocuments({ date: day, session });
		if (used >= capacity) {
			return res.status(409).json({ message: 'Selected slot is full' });
		}

		const pref = new StaffPreference({
			staff: req.user._id,
			date: day,
			session,
			notes: notes || undefined
		});

		await pref.save();
		return res.status(201).json(pref);
	} catch (error) {
		if (error && error.code === 11000) {
			return res.status(400).json({ message: 'You already booked a preference for this slot' });
		}
		console.error('Create preference error:', error);
		return res.status(500).json({ message: 'Server error', error: error.message });
	}
});

// List taken slots (for UI to disable)
router.get('/slots', authenticate, async (req, res) => {
	try {
		const prefs = await StaffPreference.find().select('date session');
		res.json(prefs);
	} catch (error) {
		res.status(500).json({ message: 'Server error', error: error.message });
	}
});

// Get my preference (Staff)
router.get('/me', authenticate, authorize('staff'), async (req, res) => {
	try {
		const pref = await StaffPreference.findOne({ staff: req.user._id });
		res.json(pref);
	} catch (error) {
		res.status(500).json({ message: 'Server error', error: error.message });
	}
});

module.exports = router;

// Available slots derived from published exams, excluding taken ones
router.get('/available', authenticate, async (req, res) => {
  try {
    const depId = req.user.department?._id || req.user.department;
    const now = new Date(); now.setHours(0,0,0,0);
    const STAFF_PER_HALL = parseInt(process.env.STAFF_PER_HALL || '1', 10);

    // Pull published exams for this department
    const exams = await Exam.find({ department: depId, isPublished: true, date: { $gte: now } }).select('date session');

    // Group by day/session
    const groups = new Map();
    for (const e of exams) {
      const d = new Date(e.date); d.setHours(0,0,0,0);
      const key = `${d.toISOString()}__${e.session}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(e);
    }

    // Build capacity per slot from hall assignments
    const slotMap = new Map(); // key -> { date, session, capacity }
    for (const [key, examGroup] of groups.entries()) {
      const examIds = examGroup.map(x => x._id);
      const asgs = await HallAssignment.find({ exam: { $in: examIds } }).select('halls');
      const numHalls = asgs.reduce((sum, a) => sum + (a.halls?.length || 0), 0);
      const capacity = numHalls * STAFF_PER_HALL;
      const [iso, session] = key.split('__');
      slotMap.set(key, { date: new Date(iso), session, capacity });
    }

    // Count existing bookings per slot
    const allSlots = Array.from(slotMap.values());
    const taken = await StaffPreference.find({ date: { $in: allSlots.map(s => s.date) } }).select('date session');
    const takenCount = new Map();
    for (const t of taken) {
      const d = new Date(t.date); d.setHours(0,0,0,0);
      const key = `${d.toISOString()}__${t.session}`;
      takenCount.set(key, (takenCount.get(key) || 0) + 1);
    }

    const available = [];
    for (const [key, slot] of slotMap.entries()) {
      const used = takenCount.get(key) || 0;
      const remaining = Math.max(0, slot.capacity - used);
      if (remaining > 0) available.push({ date: slot.date, session: slot.session, remaining });
    }

    available.sort((a,b) => {
      const da = new Date(a.date) - new Date(b.date);
      return da !== 0 ? da : a.session.localeCompare(b.session);
    });

    res.json(available);
  } catch (error) {
    console.error('Fetch available slots error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
