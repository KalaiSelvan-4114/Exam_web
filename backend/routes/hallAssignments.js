const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const Exam = require('../models/Exam');
const Hall = require('../models/Hall');
const HallAssignment = require('../models/HallAssignment');

// Helper function to calculate year ranges from year breakdown
const calculateYearRanges = (yearBreakdown, totalStudents) => {
  if (!yearBreakdown || !(yearBreakdown instanceof Map)) {
    return null; // No year breakdown available
  }

  const yearRanges = [];
  let currentPos = 1;

  // Process years in order: 1, 2, 3, 4
  for (const year of ['1', '2', '3', '4']) {
    const count = yearBreakdown.get(year) || 0;
    if (count > 0) {
      yearRanges.push({
        year: parseInt(year),
        start: currentPos,
        end: currentPos + count - 1,
        count: count
      });
      currentPos += count;
    }
  }

  return yearRanges.length > 0 ? yearRanges : null;
};

// Helper function to get student numbers for a hall range, organized by year
const getStudentNumbersByYear = (hallStart, hallEnd, yearRanges) => {
  if (!yearRanges) {
    // No year breakdown - return sequential numbers
    const numbers = [];
    for (let i = hallStart; i <= hallEnd; i++) {
      numbers.push({ number: i, year: null });
    }
    return numbers;
  }

  const students = [];
  
  // For each year range, find which student numbers fall in the hall range
  for (const yearRange of yearRanges) {
    // Find overlap between year range and hall range
    const overlapStart = Math.max(yearRange.start, hallStart);
    const overlapEnd = Math.min(yearRange.end, hallEnd);
    
    if (overlapStart <= overlapEnd) {
      // Add students from this year that fall in the hall range
      for (let num = overlapStart; num <= overlapEnd; num++) {
        students.push({ number: num, year: yearRange.year });
      }
    }
  }

  // Sort by year first (3rd year, then 4th year, etc.), then by number
  students.sort((a, b) => {
    if (a.year !== b.year) {
      return (a.year || 999) - (b.year || 999);
    }
    return a.number - b.number;
  });

  return students;
};

// Create or replace hall assignments for an exam (Department Coordinator only)
router.post('/', authenticate, authorize('department_coordinator'), async (req, res) => {
	try {
		const { examId, hallIds, replace } = req.body; // hallIds: string[], replace?: boolean

		if (!examId || !Array.isArray(hallIds) || hallIds.length === 0) {
			return res.status(400).json({ message: 'examId and hallIds[] are required' });
		}

    const exam = await Exam.findById(examId);
		if (!exam) {
			return res.status(404).json({ message: 'Exam not found' });
		}

    // Only DPC of the exam's department can assign
    const userDeptId = req.user.department?._id || req.user.department;
    if (!userDeptId || String(userDeptId) !== String(exam.department)) {
      return res.status(403).json({ message: 'You can assign halls only for your department\'s exams' });
    }

    // Require published exam
    if (!exam.isPublished) {
      return res.status(400).json({ message: 'Exam must be published before assigning halls' });
    }

		// If not replace, merge with existing assignment first
		let mergedHallIds = hallIds;
		const existing = await HallAssignment.findOne({ exam: exam._id });
		if (existing && !replace) {
			const existingIds = existing.halls.map(h => String(h.hall));
			const set = new Set([...existingIds, ...hallIds.map(String)]);
			mergedHallIds = Array.from(set);
		}

		// Fetch halls and compute capacities
		const halls = await Hall.find({ _id: { $in: mergedHallIds }, isActive: true });
		if (halls.length !== hallIds.length) {
			return res.status(400).json({ message: 'One or more halls not found' });
		}

    // Ensure all halls belong to the same department as the exam
		const invalidDeptHall = halls.find(h => String(h.department) !== String(exam.department));
    if (invalidDeptHall) {
      return res.status(400).json({ message: 'All selected halls must belong to the exam\'s department' });
    }

    // Check hall conflicts on the same date/session
    const sameDayExams = await Exam.find({
      _id: { $ne: exam._id },
      department: exam.department,
      date: new Date(exam.date),
      session: exam.session,
      status: { $in: ['scheduled', 'ongoing'] }
    }).select('_id');

    if (sameDayExams.length > 0) {
      const conflicting = await HallAssignment.find({
        exam: { $in: sameDayExams.map(e => e._id) },
        'halls.hall': { $in: hallIds }
      }).populate('halls.hall');

      if (conflicting.length > 0) {
        return res.status(400).json({ message: 'One or more halls are already assigned for this date/session' });
      }
    }

		const items = halls.map(h => ({ hall: h._id, capacity: h.capacity }));
		const totalCapacity = items.reduce((sum, h) => sum + (h.capacity || 0), 0);

		if (totalCapacity < exam.totalStudents) {
			return res.status(400).json({ message: 'Total hall capacity is less than total students' });
		}

		// Upsert HallAssignment per exam
		const assignment = await HallAssignment.findOneAndUpdate(
			{ exam: exam._id },
			{ exam: exam._id, halls: items, totalCapacity, assignedBy: req.user._id },
			{ new: true, upsert: true, setDefaultsOnInsert: true }
		).populate('halls.hall');

		return res.status(201).json({ message: 'Halls assigned successfully', assignment });
	} catch (error) {
		console.error('Hall assignment error:', error);
		return res.status(500).json({ message: 'Server error', error: error.message });
	}
});

// Get hall plan and seating for staff's assigned exams
router.get('/staff/my-halls', authenticate, authorize('staff'), async (req, res) => {
  try {
    // Find exams where this staff is assigned
    const exams = await Exam.find({
      'assignedStaff.staff': req.user._id
    })
      .populate('subject')
      .populate('department')
      .sort({ date: 1 });

    const result = [];

    for (const exam of exams) {
      const assignment = await HallAssignment.findOne({ exam: exam._id })
        .populate('halls.hall');

      if (!assignment) continue;

      // Find which halls this staff is assigned to
      const myHalls = assignment.halls.filter(h => {
        const staffIds = (h.assignedStaff || []).map(id => String(id));
        return staffIds.includes(String(req.user._id));
      });

      if (myHalls.length === 0) continue;

      // Get seating data for each hall
      const hallsWithSeating = await Promise.all(
        myHalls.map(async (h) => {
          const hall = h.hall;
          const hallData = {
            hallId: hall._id,
            hallName: hall.name,
            hallNumber: hall.number,
            hallLocation: hall.location,
            capacity: hall.capacity,
            rangeStart: h.rangeStart,
            rangeEnd: h.rangeEnd,
            totalSeats: h.rangeStart && h.rangeEnd ? (h.rangeEnd - h.rangeStart + 1) : 0,
            seatingRows: h.seatingRows,
            seatingCols: h.seatingCols,
            seatingOrder: h.seatingOrder || 'column'
          };

          return hallData;
        })
      );

      result.push({
        exam: {
          _id: exam._id,
          subject: exam.subject?.name,
          date: exam.date,
          session: exam.session,
          totalStudents: exam.totalStudents,
          yearBreakdown: exam.yearBreakdown ? Object.fromEntries(exam.yearBreakdown) : null
        },
        halls: hallsWithSeating
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching staff hall plans:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get seating arrangement for a specific hall (staff)
router.get('/staff/seating/:examId/:hallId', authenticate, authorize('staff'), async (req, res) => {
  try {
    const { examId, hallId } = req.params;

    // Verify staff is assigned to this exam
    const exam = await Exam.findOne({
      _id: examId,
      'assignedStaff.staff': req.user._id
    });

    if (!exam) {
      return res.status(403).json({ message: 'You are not assigned to this exam' });
    }

    const assignment = await HallAssignment.findOne({ exam: examId });
    if (!assignment) {
      return res.status(404).json({ message: 'Hall assignment not found' });
    }

    const hallEntry = assignment.halls.find(h => String(h.hall) === String(hallId));
    if (!hallEntry) {
      return res.status(404).json({ message: 'Hall not found in assignment' });
    }

    // Verify staff is assigned to this hall
    const staffIds = (hallEntry.assignedStaff || []).map(id => String(id));
    if (!staffIds.includes(String(req.user._id))) {
      return res.status(403).json({ message: 'You are not assigned to this hall' });
    }

    if (!hallEntry.rangeStart || !hallEntry.rangeEnd) {
      return res.json({ 
        hallId, 
        message: 'Seating arrangement not yet set for this hall',
        rangeStart: null,
        rangeEnd: null,
        seats: null
      });
    }

    const start = hallEntry.rangeStart;
    const end = hallEntry.rangeEnd;
    const total = end - start + 1;

    // If seating configuration exists, generate the matrix
    if (hallEntry.seatingRows && hallEntry.seatingCols) {
      const r = hallEntry.seatingRows;
      const c = hallEntry.seatingCols;
      const fillOrder = hallEntry.seatingOrder || 'column';
      const seats = Array.from({ length: r }, () => Array.from({ length: c }, () => null));

      // Get exam to access year breakdown
      const exam = await Exam.findById(examId);
      
      // Calculate year ranges from exam's year breakdown
      const yearRanges = calculateYearRanges(exam?.yearBreakdown, exam?.totalStudents);
      
      // Get student numbers organized by year
      const studentsByYear = getStudentNumbersByYear(start, end, yearRanges);

      // Fill seats with student numbers organized by year
      let studentIndex = 0;
      if (fillOrder === 'column') {
        for (let j = 0; j < c; j++) {
          for (let i = 0; i < r; i++) {
            if (studentIndex < studentsByYear.length) {
              seats[i][j] = studentsByYear[studentIndex].number;
              studentIndex++;
            }
          }
        }
      } else {
        for (let i = 0; i < r; i++) {
          for (let j = 0; j < c; j++) {
            if (studentIndex < studentsByYear.length) {
              seats[i][j] = studentsByYear[studentIndex].number;
              studentIndex++;
            }
          }
        }
      }

      return res.json({
        hallId,
        rangeStart: start,
        rangeEnd: end,
        totalSeats: total,
        rows: r,
        cols: c,
        order: fillOrder,
        seats
      });
    }

    // Return just range info if seating not generated yet
    res.json({
      hallId,
      rangeStart: start,
      rangeEnd: end,
      totalSeats: total,
      rows: null,
      cols: null,
      seats: null,
      message: 'Seating matrix not yet generated by coordinator'
    });
  } catch (error) {
    console.error('Error fetching seating:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get assignment for exam (EC or DPC)
router.get('/:examId', authenticate, async (req, res) => {
	try {
		const assignment = await HallAssignment.findOne({ exam: req.params.examId }).populate('halls.hall');
		if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
		res.json(assignment);
	} catch (error) {
		res.status(500).json({ message: 'Server error', error: error.message });
	}
});

// Set hall plan (ranges) for an exam (DPC)
router.put('/plan', authenticate, authorize('department_coordinator'), async (req, res) => {
  try {
    const { examId, plans } = req.body; // plans: [{ hallId, rangeStart, rangeEnd }]
    if (!examId || !Array.isArray(plans) || plans.length === 0) {
      return res.status(400).json({ message: 'examId and plans[] are required' });
    }

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    const userDeptId = req.user.department?._id || req.user.department;
    if (String(userDeptId) !== String(exam.department)) {
      return res.status(403).json({ message: 'You can plan halls only for your department\'s exams' });
    }

    const assignment = await HallAssignment.findOne({ exam: exam._id });
    if (!assignment) return res.status(400).json({ message: 'Assign halls before planning ranges' });

    // Validate ranges: within 1..totalStudents, non-overlapping
    const ranges = plans.map(p => ({
      hallId: String(p.hallId),
      start: Number(p.rangeStart),
      end: Number(p.rangeEnd)
    }));
    for (const r of ranges) {
      if (!Number.isFinite(r.start) || !Number.isFinite(r.end) || r.start < 1 || r.end < r.start || r.end > exam.totalStudents) {
        return res.status(400).json({ message: 'Invalid range values' });
      }
    }
    // Check overlaps
    const sorted = [...ranges].sort((a,b) => a.start - b.start);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].start <= sorted[i-1].end) {
        return res.status(400).json({ message: 'Ranges must not overlap' });
      }
    }

    // Apply to assignment
    assignment.halls = assignment.halls.map(h => {
      const plan = ranges.find(r => r.hallId === String(h.hall));
      if (plan) {
        h.rangeStart = plan.start;
        h.rangeEnd = plan.end;
      }
      return h;
    });
    await assignment.save();

    return res.json({ message: 'Hall plan saved', assignment });
  } catch (error) {
    console.error('Save hall plan error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Generate seating arrangement for a hall (matrix) (DPC)
router.post('/seating', authenticate, authorize('department_coordinator'), async (req, res) => {
  try {
    const { examId, hallId, rows, cols, order } = req.body;
    if (!examId || !hallId || !rows || !cols) {
      return res.status(400).json({ message: 'examId, hallId, rows, cols are required' });
    }
    const r = Number(rows), c = Number(cols);
    if (!Number.isFinite(r) || !Number.isFinite(c) || r < 1 || c < 1) {
      return res.status(400).json({ message: 'rows and cols must be positive integers' });
    }

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    const assignment = await HallAssignment.findOne({ exam: exam._id });
    if (!assignment) return res.status(400).json({ message: 'Assignment not found' });
    const hall = assignment.halls.find(h => String(h.hall) === String(hallId));
    if (!hall || !hall.rangeStart || !hall.rangeEnd) {
      return res.status(400).json({ message: 'Range for this hall is not set' });
    }

    const start = hall.rangeStart;
    const end = hall.rangeEnd;
    const total = end - start + 1;
    const seats = Array.from({ length: r }, () => Array.from({ length: c }, () => null));

    // Calculate year ranges from exam's year breakdown
    const yearRanges = calculateYearRanges(exam.yearBreakdown, exam.totalStudents);
    
    // Get student numbers organized by year
    const studentsByYear = getStudentNumbersByYear(start, end, yearRanges);

    // Fill seats with student numbers organized by year
    const fillOrder = (order || 'column').toLowerCase();
    let studentIndex = 0;

    if (fillOrder === 'column') {
      for (let j = 0; j < c; j++) {
        for (let i = 0; i < r; i++) {
          if (studentIndex < studentsByYear.length) {
            seats[i][j] = studentsByYear[studentIndex].number;
            studentIndex++;
          }
        }
      }
    } else {
      for (let i = 0; i < r; i++) {
        for (let j = 0; j < c; j++) {
          if (studentIndex < studentsByYear.length) {
            seats[i][j] = studentsByYear[studentIndex].number;
            studentIndex++;
          }
        }
      }
    }

    // Store seating configuration in hall assignment
    hall.seatingRows = r;
    hall.seatingCols = c;
    hall.seatingOrder = fillOrder;
    await assignment.save();

    return res.json({ hallId, rows: r, cols: c, seats, total, order: fillOrder });
  } catch (error) {
    console.error('Generate seating error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
