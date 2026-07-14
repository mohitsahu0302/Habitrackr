const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    frequency: { type: String, enum: ['daily'], default: 'daily' },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastCompletedDate: { type: String, default: null }, // 'YYYY-MM-DD'
    totalCompletions: { type: Number, default: 0 },
    milestonesReached: [{ type: Number }],
    isArchived: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Habit', habitSchema);
