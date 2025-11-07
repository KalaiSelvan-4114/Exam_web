const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const { authenticate, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Exam = require('../models/Exam');
const Hall = require('../models/Hall');
const Subject = require('../models/Subject');
const Department = require('../models/Department');
const HallAssignment = require('../models/HallAssignment');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel' ||
        file.mimetype === 'text/csv') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) and CSV files are allowed'));
    }
  }
});

// Helper function to parse Excel file
const parseExcel = (buffer) => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet, { raw: false });
};

// Upload Users (Admin/Exam Coordinator only)
router.post('/users', authenticate, authorize('exam_coordinator', 'admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const data = parseExcel(req.file.buffer);
    const results = { success: [], errors: [] };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        const email = (row.email || row.Email || '').toLowerCase().trim();
        const name = row.name || row.Name || '';
        const role = (row.role || row.Role || 'student').toLowerCase();
        const department = row.department || row.Department || '';
        const year = row.year || row.Year ? parseInt(row.year || row.Year) : undefined;
        const password = row.password || row.Password || 'default123';

        if (!email || !name) {
          results.errors.push({ row: i + 2, error: 'Email and name are required' });
          continue;
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          results.errors.push({ row: i + 2, email, error: 'User already exists' });
          continue;
        }

        // Find department
        let deptId = null;
        if (department && role !== 'exam_coordinator') {
          const dept = await Department.findOne({ 
            $or: [
              { name: new RegExp(`^${department}$`, 'i') },
              { code: new RegExp(`^${department}$`, 'i') }
            ]
          });
          if (!dept) {
            results.errors.push({ row: i + 2, email, error: `Department not found: ${department}` });
            continue;
          }
          deptId = dept._id;
        }

        // Validate year for students
        if (role === 'student' && (!year || year < 1 || year > 4)) {
          results.errors.push({ row: i + 2, email, error: 'Year must be 1, 2, 3, or 4 for students' });
          continue;
        }

        const user = new User({
          name,
          email,
          password, // Will be hashed by pre-save hook
          role,
          department: deptId,
          year: role === 'student' ? year : undefined,
          isEmailVerified: false,
          isActive: true
        });

        await user.save();
        results.success.push({ row: i + 2, email, name });
      } catch (error) {
        results.errors.push({ row: i + 2, error: error.message });
      }
    }

    res.json({
      message: `Processed ${data.length} rows. ${results.success.length} successful, ${results.errors.length} errors.`,
      results
    });
  } catch (error) {
    console.error('Upload users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Upload Departments (Admin/Exam Coordinator only)
router.post('/departments', authenticate, authorize('exam_coordinator', 'admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const data = parseExcel(req.file.buffer);
    const results = { success: [], errors: [] };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        const name = row.name || row.Name || '';
        const code = (row.code || row.Code || '').toUpperCase().trim();
        const coordinatorEmail = row.coordinator || row.Coordinator || '';

        if (!name || !code) {
          results.errors.push({ row: i + 2, error: 'Name and code are required' });
          continue;
        }

        // Check if department exists
        const existing = await Department.findOne({
          $or: [
            { name: new RegExp(`^${name}$`, 'i') },
            { code: code }
          ]
        });

        if (existing) {
          results.errors.push({ row: i + 2, name, error: 'Department already exists' });
          continue;
        }

        // Find coordinator if email provided
        let coordinatorId = null;
        if (coordinatorEmail) {
          const coordinator = await User.findOne({ 
            email: coordinatorEmail.toLowerCase().trim(),
            role: 'department_coordinator'
          });
          if (coordinator) {
            coordinatorId = coordinator._id;
          }
        }

        const department = new Department({
          name,
          code,
          coordinator: coordinatorId || undefined
        });

        await department.save();
        results.success.push({ row: i + 2, name, code });
      } catch (error) {
        results.errors.push({ row: i + 2, error: error.message });
      }
    }

    res.json({
      message: `Processed ${data.length} rows. ${results.success.length} successful, ${results.errors.length} errors.`,
      results
    });
  } catch (error) {
    console.error('Upload departments error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Upload Subjects (Admin/Exam Coordinator only)
router.post('/subjects', authenticate, authorize('exam_coordinator', 'admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const data = parseExcel(req.file.buffer);
    const results = { success: [], errors: [] };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        const name = row.name || row.Name || row.subject || row.Subject || '';
        const code = row.code || row.Code || row.subjectCode || row.SubjectCode || '';
        const department = row.department || row.Department || '';
        const semester = parseInt(row.semester || row.Semester || 1);

        if (!name || !code) {
          results.errors.push({ row: i + 2, error: 'Subject name and code are required' });
          continue;
        }

        if (!semester || semester < 1 || semester > 8) {
          results.errors.push({ row: i + 2, error: 'Semester must be between 1 and 8' });
          continue;
        }

        // Find department
        const dept = await Department.findOne({
          $or: [
            { name: new RegExp(`^${department}$`, 'i') },
            { code: new RegExp(`^${department}$`, 'i') }
          ]
        });

        if (!dept) {
          results.errors.push({ row: i + 2, name, error: `Department not found: ${department}` });
          continue;
        }

        // Check if subject exists
        const existing = await Subject.findOne({ 
          name: new RegExp(`^${name}$`, 'i'),
          department: dept._id
        });

        if (existing) {
          results.errors.push({ row: i + 2, name, error: 'Subject already exists' });
          continue;
        }

        const subject = new Subject({
          name,
          code,
          department: dept._id,
          semester
        });

        await subject.save();
        results.success.push({ row: i + 2, name, code });
      } catch (error) {
        results.errors.push({ row: i + 2, error: error.message });
      }
    }

    res.json({
      message: `Processed ${data.length} rows. ${results.success.length} successful, ${results.errors.length} errors.`,
      results
    });
  } catch (error) {
    console.error('Upload subjects error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Upload Halls (Admin/Exam Coordinator only)
router.post('/halls', authenticate, authorize('exam_coordinator', 'admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const data = parseExcel(req.file.buffer);
    const results = { success: [], errors: [] };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        const name = row.name || row.Name || row.hallName || row.HallName || '';
        const number = row.number || row.Number || row.hallNumber || row.HallNumber || '';
        const capacity = parseInt(row.capacity || row.Capacity || 0);
        const location = row.location || row.Location || '';
        const department = row.department || row.Department || '';

        if (!name || !number || !location || !capacity || capacity < 1) {
          results.errors.push({ row: i + 2, error: 'Name, number, location, and valid capacity are required' });
          continue;
        }

        // Find department
        const dept = await Department.findOne({
          $or: [
            { name: new RegExp(`^${department}$`, 'i') },
            { code: new RegExp(`^${department}$`, 'i') }
          ]
        });

        if (!dept) {
          results.errors.push({ row: i + 2, name, error: `Department not found: ${department}` });
          continue;
        }

        // Check if hall exists
        const existing = await Hall.findOne({
          name: new RegExp(`^${name}$`, 'i'),
          department: dept._id
        });

        if (existing) {
          results.errors.push({ row: i + 2, name, error: 'Hall already exists' });
          continue;
        }

        const hall = new Hall({
          name,
          number,
          capacity,
          location,
          department: dept._id,
          isActive: true
        });

        await hall.save();
        results.success.push({ row: i + 2, name, capacity });
      } catch (error) {
        results.errors.push({ row: i + 2, error: error.message });
      }
    }

    res.json({
      message: `Processed ${data.length} rows. ${results.success.length} successful, ${results.errors.length} errors.`,
      results
    });
  } catch (error) {
    console.error('Upload halls error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Upload Exams (Exam Coordinator only)
router.post('/exams', authenticate, authorize('exam_coordinator'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const data = parseExcel(req.file.buffer);
    const results = { success: [], errors: [] };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        const subject = row.subject || row.Subject || '';
        const department = row.department || row.Department || '';
        const date = row.date || row.Date || '';
        const session = (row.session || row.Session || 'FN').toUpperCase();
        const totalStudents = parseInt(row.totalStudents || row.TotalStudents || row.students || row.Students || 0);
        const year1 = parseInt(row.year1 || row.Year1 || 0) || 0;
        const year2 = parseInt(row.year2 || row.Year2 || 0) || 0;
        const year3 = parseInt(row.year3 || row.Year3 || 0) || 0;
        const year4 = parseInt(row.year4 || row.Year4 || 0) || 0;

        if (!subject || !department || !date || !totalStudents) {
          results.errors.push({ row: i + 2, error: 'Subject, department, date, and totalStudents are required' });
          continue;
        }

        if (!['FN', 'AN'].includes(session)) {
          results.errors.push({ row: i + 2, error: 'Session must be FN or AN' });
          continue;
        }

        // Find department
        const dept = await Department.findOne({
          $or: [
            { name: new RegExp(`^${department}$`, 'i') },
            { code: new RegExp(`^${department}$`, 'i') }
          ]
        });

        if (!dept) {
          results.errors.push({ row: i + 2, subject, error: `Department not found: ${department}` });
          continue;
        }

        // Find subject
        const subj = await Subject.findOne({
          name: new RegExp(`^${subject}$`, 'i'),
          department: dept._id
        });

        if (!subj) {
          results.errors.push({ row: i + 2, subject, error: `Subject not found: ${subject}` });
          continue;
        }

        // Parse date
        const examDate = new Date(date);
        if (isNaN(examDate.getTime())) {
          results.errors.push({ row: i + 2, subject, error: 'Invalid date format' });
          continue;
        }

        // Create year breakdown
        const yearBreakdown = new Map([
          ['1', year1],
          ['2', year2],
          ['3', year3],
          ['4', year4]
        ]);

        const exam = new Exam({
          department: dept._id,
          subject: subj._id,
          date: examDate,
          session,
          totalStudents,
          yearBreakdown: yearBreakdown,
          isPublished: true,
          createdBy: req.user._id
        });

        await exam.save();
        results.success.push({ row: i + 2, subject, date, session });
      } catch (error) {
        results.errors.push({ row: i + 2, error: error.message });
      }
    }

    res.json({
      message: `Processed ${data.length} rows. ${results.success.length} successful, ${results.errors.length} errors.`,
      results
    });
  } catch (error) {
    console.error('Upload exams error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Upload Hall Plans (Department Coordinator only)
router.post('/hall-plans', authenticate, authorize('department_coordinator'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const data = parseExcel(req.file.buffer);
    const results = { success: [], errors: [] };

    const userDeptId = req.user.department?._id || req.user.department;
    if (!userDeptId) {
      return res.status(400).json({ message: 'Department coordinator must have a department assigned' });
    }

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        const subject = row.subject || row.Subject || '';
        const date = row.date || row.Date || '';
        const session = (row.session || row.Session || '').toUpperCase();
        const hallNumber = row.hallNumber || row.HallNumber || row.hall || row.Hall || '';
        const rangeStart = parseInt(row.rangeStart || row.RangeStart || 0);
        const rangeEnd = parseInt(row.rangeEnd || row.RangeEnd || 0);
        const rows = parseInt(row.rows || row.Rows || 0);
        const cols = parseInt(row.cols || row.Cols || row.columns || row.Columns || 0);

        if (!subject || !date || !session || !hallNumber || !rangeStart || !rangeEnd) {
          results.errors.push({ row: i + 2, error: 'Subject, Date, Session, HallNumber, RangeStart, and RangeEnd are required' });
          continue;
        }

        if (!['FN', 'AN'].includes(session)) {
          results.errors.push({ row: i + 2, error: 'Session must be FN or AN' });
          continue;
        }

        // Parse date
        const examDate = new Date(date);
        if (isNaN(examDate.getTime())) {
          results.errors.push({ row: i + 2, error: 'Invalid date format' });
          continue;
        }

        // Find subject
        const Subject = require('../models/Subject');
        const subj = await Subject.findOne({
          name: new RegExp(`^${subject}$`, 'i'),
          department: userDeptId
        });

        if (!subj) {
          results.errors.push({ row: i + 2, error: `Subject not found: ${subject}` });
          continue;
        }

        // Find exam - create date range for the day
        const startOfDay = new Date(examDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(examDate);
        endOfDay.setHours(23, 59, 59, 999);

        const exam = await Exam.findOne({
          subject: subj._id,
          department: userDeptId,
          date: {
            $gte: startOfDay,
            $lte: endOfDay
          },
          session: session
        });

        if (!exam) {
          results.errors.push({ row: i + 2, error: `Exam not found for ${subject} on ${date} (${session})` });
          continue;
        }

        // Find hall by number in DPC's department
        const Hall = require('../models/Hall');
        const hall = await Hall.findOne({
          number: hallNumber,
          department: userDeptId
        });

        if (!hall) {
          results.errors.push({ row: i + 2, error: `Hall not found with number: ${hallNumber}` });
          continue;
        }

        // Find hall assignment
        const assignment = await HallAssignment.findOne({ exam: exam._id }).populate('halls.hall');
        if (!assignment) {
          results.errors.push({ row: i + 2, error: 'Hall assignment not found. Assign halls first.' });
          continue;
        }

        // Find hall in assignment by hall number
        const hallEntry = assignment.halls.find(entry => {
          const hallInEntry = entry.hall;
          return hallInEntry && (hallInEntry.number === hallNumber || String(hallInEntry._id) === String(hall._id));
        });

        if (!hallEntry) {
          results.errors.push({ row: i + 2, error: `Hall ${hallNumber} not found in assignment for this exam` });
          continue;
        }

        // Update range
        hallEntry.rangeStart = rangeStart;
        hallEntry.rangeEnd = rangeEnd;

        // Update seating if provided
        if (rows > 0 && cols > 0) {
          hallEntry.seatingRows = rows;
          hallEntry.seatingCols = cols;
          hallEntry.seatingOrder = 'column'; // Default
        }

        await assignment.save();
        results.success.push({ row: i + 2, subject, date, session, hallNumber, rangeStart, rangeEnd });
      } catch (error) {
        results.errors.push({ row: i + 2, error: error.message });
      }
    }

    res.json({
      message: `Processed ${data.length} rows. ${results.success.length} successful, ${results.errors.length} errors.`,
      results
    });
  } catch (error) {
    console.error('Upload hall plans error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Download sample template
router.get('/template/:type', authenticate, (req, res) => {
  const { type } = req.params;
  let headers = [];
  let filename = '';

  switch (type) {
    case 'users':
      headers = [['Email', 'Name', 'Role', 'Department', 'Year', 'Password']];
      filename = 'users_template.xlsx';
      break;
    case 'departments':
      headers = [['Name', 'Code', 'Coordinator (Email)']];
      filename = 'departments_template.xlsx';
      break;
    case 'subjects':
      headers = [['Name', 'Code', 'Department', 'Semester']];
      filename = 'subjects_template.xlsx';
      break;
    case 'halls':
      headers = [['Name', 'Number', 'Capacity', 'Location', 'Department']];
      filename = 'halls_template.xlsx';
      break;
    case 'exams':
      headers = [['Subject', 'Department', 'Date (YYYY-MM-DD)', 'Session (FN/AN)', 'TotalStudents', 'Year1', 'Year2', 'Year3', 'Year4']];
      filename = 'exams_template.xlsx';
      break;
    case 'hall-plans':
      headers = [['Subject', 'Date (YYYY-MM-DD)', 'Session (FN/AN)', 'HallNumber', 'RangeStart', 'RangeEnd', 'Rows', 'Cols']];
      filename = 'hall_plans_template.xlsx';
      break;
    default:
      return res.status(400).json({ message: 'Invalid template type' });
  }

  const worksheet = XLSX.utils.aoa_to_sheet(headers);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

  // Set column widths
  const colWidths = headers[0].map(() => ({ wch: 20 }));
  worksheet['!cols'] = colWidths;

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
});

module.exports = router;

