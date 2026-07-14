const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    avatarColor: { type: String, default: '#FFB238' },
    points: { type: Number, default: 0 },
    partners: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    lastReminderSentDate: { type: String, default: null } // 'YYYY-MM-DD'
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
