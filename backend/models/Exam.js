const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
    index: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: false
  },
  endTime: {
    type: String,
    required: false
  },
  session: {
    type: String,
    enum: ['FN', 'AN'],
    required: true
  },
  // Hall will be assigned later by Department Coordinator via HallAssignment
  hall: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hall',
    required: false
  },
  assignedStaff: [{
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'rejected'],
      default: 'pending'
    }
  }],
  totalStudents: {
    type: Number,
    required: true,
    min: 1
  },
  yearBreakdown: {
    type: Map,
    of: Number,
    default: function() {
      return new Map([
        ['1', 0],
        ['2', 0],
        ['3', 0],
        ['4', 0]
      ]);
    },
    validate: {
      validator: function(v) {
        if (!(v instanceof Map)) return false;
        let total = 0;
        for (const [year, count] of v.entries()) {
          if (!['1', '2', '3', '4'].includes(year)) return false;
          if (typeof count !== 'number' || count < 0) return false;
          total += count;
        }
        // Allow sum to be 0 (not set) or equal to totalStudents
        return total === 0 || total === this.totalStudents;
      },
      message: 'Year breakdown must sum to 0 (not set) or totalStudents and only include years 1-4'
    }
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

examSchema.index({ date: 1, hall: 1 });
examSchema.index({ subject: 1, date: 1 });

module.exports = mongoose.model('Exam', examSchema);

