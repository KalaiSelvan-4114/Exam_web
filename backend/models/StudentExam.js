const mongoose = require('mongoose');

const studentExamSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  seatNumber: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

studentExamSchema.index({ student: 1, exam: 1 }, { unique: true });

module.exports = mongoose.model('StudentExam', studentExamSchema);

