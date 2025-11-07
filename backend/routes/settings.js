const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const Setting = require('../models/Setting');

const KEY = 'staffPerHall';

router.get('/staff-per-hall', authenticate, authorize('exam_coordinator'), async (req, res) => {
	try {
		const s = await Setting.findOne({ key: KEY });
		const envDefault = parseInt(process.env.STAFF_PER_HALL || '1', 10);
		res.json({ value: s ? parseInt(s.value, 10) : envDefault });
	} catch (error) {
		res.status(500).json({ message: 'Server error', error: error.message });
	}
});

router.put('/staff-per-hall', authenticate, authorize('exam_coordinator'), async (req, res) => {
	try {
		const { value } = req.body;
		const num = parseInt(value, 10);
		if (!Number.isFinite(num) || num < 1 || num > 10) {
			return res.status(400).json({ message: 'value must be an integer between 1 and 10' });
		}
		const updated = await Setting.findOneAndUpdate(
			{ key: KEY },
			{ key: KEY, value: num, updatedAt: new Date() },
			{ upsert: true, new: true, setDefaultsOnInsert: true }
		);
		res.json({ value: updated.value });
	} catch (error) {
		res.status(500).json({ message: 'Server error', error: error.message });
	}
});

module.exports = router;
