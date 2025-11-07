const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const Exam = require('../models/Exam');
const Hall = require('../models/Hall');
const HallAssignment = require('../models/HallAssignment');

// Get hall allocation report (Department Coordinator)
router.get('/hall-allocation', authenticate, authorize('department_coordinator'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const depId = req.user.department?._id || req.user.department;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const examQuery = { department: depId };
    if (Object.keys(dateFilter).length) {
      examQuery.date = dateFilter;
    }

    // Fetch department halls
    const halls = await Hall.find({ department: depId }).sort({ name: 1 });
    const exams = await Exam.find(examQuery)
      .populate('subject')
      .populate('assignedStaff.staff', 'name email')
      .sort({ date: 1 });

    // Fetch all assignments for these exams
    const examIds = exams.map(e => e._id);
    const assignments = await HallAssignment.find({ exam: { $in: examIds } }).populate('halls.hall');
    const examIdToHalls = new Map();
    assignments.forEach(a => {
      examIdToHalls.set(String(a.exam), a.halls.map(h => h.hall));
    });

    // Build report per hall based on assignments
    // Build report, and for each hall use per-hall assignedStaff when available
    const report = halls.map(hall => {
      const hallExams = exams.filter(exam => {
        const hallsForExam = examIdToHalls.get(String(exam._id)) || [];
        return hallsForExam.some(h => String(h._id) === String(hall._id));
      });

      return {
        hall: {
          name: hall.name,
          number: hall.number,
          location: hall.location,
          capacity: hall.capacity
        },
        exams: hallExams.map(exam => {
          const asg = assignments.find(a => String(a.exam) === String(exam._id));
          let staffForThisHall = [];
          if (asg) {
            const hallEntry = asg.halls.find(h => String(h.hall?._id || h.hall) === String(hall._id));
            if (hallEntry && hallEntry.assignedStaff && hallEntry.assignedStaff.length) {
              staffForThisHall = hallEntry.assignedStaff;
            }
          }
          // Populate staff names by matching with exam.assignedStaff or via population if needed
          const nameMap = new Map();
          (exam.assignedStaff || []).forEach(s => { if (s.staff) nameMap.set(String(s.staff._id || s.staff), { name: s.staff.name, status: s.status }); });
          const staffOut = (staffForThisHall.length ? staffForThisHall : [])
            .map(id => nameMap.get(String(id)) || { name: '-', status: '-' });
          // Fallback: if no per-hall mapping, show all exam staff
          const finalStaff = staffOut.length ? staffOut : (exam.assignedStaff || []).map(s => ({ name: s.staff?.name || '-', status: s.status || '-' }));

          return {
            subject: exam.subject?.name || '-',
            date: exam.date,
            session: exam.session,
            students: exam.totalStudents,
            staff: finalStaff
          };
        })
      };
    });

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all hall allocations (Exam Coordinator)
router.get('/all-hall-allocations', authenticate, authorize('exam_coordinator'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const examQuery = {};

    if (startDate && endDate) {
      examQuery.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    // Fetch all exams
    const exams = await Exam.find(examQuery)
      .populate('subject')
      .populate('department')
      .sort({ date: 1 });

    // Fetch all hall assignments for these exams
    const examIds = exams.map(e => e._id);
    const assignments = await HallAssignment.find({ exam: { $in: examIds } })
      .populate({
        path: 'halls.hall',
        populate: { path: 'department', select: 'name' }
      });

    // Get all unique staff IDs
    const staffIds = new Set();
    assignments.forEach(assignment => {
      assignment.halls.forEach(hallEntry => {
        if (hallEntry.assignedStaff && Array.isArray(hallEntry.assignedStaff)) {
          hallEntry.assignedStaff.forEach(id => staffIds.add(String(id)));
        }
      });
    });

    // Fetch all staff in one query
    const User = require('../models/User');
    const staffMap = new Map();
    if (staffIds.size > 0) {
      const staffList = await User.find({ _id: { $in: Array.from(staffIds) } }).select('name email');
      staffList.forEach(staff => {
        staffMap.set(String(staff._id), {
          name: staff.name,
          email: staff.email,
          status: 'confirmed'
        });
      });
    }

    // Build report - one row per exam-hall combination
    const report = [];
    
    for (const exam of exams) {
      const assignment = assignments.find(a => String(a.exam) === String(exam._id));
      
      if (assignment && assignment.halls && assignment.halls.length > 0) {
        // Multiple halls per exam
        for (const hallEntry of assignment.halls) {
          const hall = hallEntry.hall;
          if (!hall) continue;

          // Get staff assigned to this specific hall
          const staffList = [];
          if (hallEntry.assignedStaff && Array.isArray(hallEntry.assignedStaff) && hallEntry.assignedStaff.length > 0) {
            hallEntry.assignedStaff.forEach(staffId => {
              const staff = staffMap.get(String(staffId));
              if (staff) {
                staffList.push(staff);
              }
            });
          }

          report.push({
            examId: exam._id,
            subject: exam.subject?.name || '-',
            date: exam.date,
            session: exam.session,
            hall: {
              name: hall.name,
              number: hall.number,
              location: hall.location,
              department: hall.department?.name || exam.department?.name || '-'
            },
            students: hallEntry.rangeStart && hallEntry.rangeEnd 
              ? `${hallEntry.rangeStart}-${hallEntry.rangeEnd}` 
              : exam.totalStudents,
            staff: staffList
          });
        }
      } else {
        // No halls assigned yet
        report.push({
          examId: exam._id,
          subject: exam.subject?.name || '-',
          date: exam.date,
          session: exam.session,
          hall: {
            name: 'Not Assigned',
            number: '-',
            location: '-',
            department: exam.department?.name || '-'
          },
          students: exam.totalStudents,
          staff: []
        });
      }
    }

    res.json(report);
  } catch (error) {
    console.error('Error fetching all hall allocations:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get exam schedule summary
router.get('/schedule-summary', authenticate, authorize('exam_coordinator'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const exams = await Exam.find(query)
      .populate('subject')
      .populate('hall')
      .populate({
        path: 'subject',
        populate: { path: 'department' }
      });

    const summary = {
      totalExams: exams.length,
      byDepartment: {},
      byStatus: {},
      byDate: {}
    };

    exams.forEach(exam => {
      const deptName = exam.subject.department.name;
      summary.byDepartment[deptName] = (summary.byDepartment[deptName] || 0) + 1;

      summary.byStatus[exam.status] = (summary.byStatus[exam.status] || 0) + 1;

      const dateStr = exam.date.toISOString().split('T')[0];
      summary.byDate[dateStr] = (summary.byDate[dateStr] || 0) + 1;
    });

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

