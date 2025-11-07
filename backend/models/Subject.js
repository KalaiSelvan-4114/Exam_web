const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

subjectSchema.index({ code: 1, department: 1 }, { unique: true });

module.exports = mongoose.model('Subject', subjectSchema);

