const mongoose = require('mongoose');

const staffPreferenceSchema = new mongoose.Schema({
	staff: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true,
		index: true
	},
	date: {
		type: Date,
		required: true
	},
	session: {
		type: String,
		enum: ['FN', 'AN'],
		required: true
	},
	notes: {
		type: String,
		trim: true
	},
	createdAt: {
		type: Date,
		default: Date.now
	}
});

// One booking per staff per day/session
staffPreferenceSchema.index({ staff: 1, date: 1, session: 1 }, { unique: true });

module.exports = mongoose.model('StaffPreference', staffPreferenceSchema);

