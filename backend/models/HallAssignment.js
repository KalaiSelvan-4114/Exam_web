const mongoose = require('mongoose');

const hallAssignmentSchema = new mongoose.Schema({
	exam: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Exam',
		required: true,
		index: true
	},
	halls: [{
		hall: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Hall',
			required: true
		},
		capacity: {
			type: Number,
			required: true,
			min: 1
		},
		assignedStaff: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
		rangeStart: { type: Number },
		rangeEnd: { type: Number },
		seatingRows: { type: Number },
		seatingCols: { type: Number },
		seatingOrder: { type: String, enum: ['row', 'column'], default: 'column' }
	}],
	totalCapacity: {
		type: Number,
		required: true,
		min: 1
	},
	assignedBy: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	createdAt: {
		type: Date,
		default: Date.now
	}
});

hallAssignmentSchema.index({ exam: 1 }, { unique: true });

module.exports = mongoose.model('HallAssignment', hallAssignmentSchema);
