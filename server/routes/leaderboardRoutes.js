const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Global leaderboard - top users by points
router.get('/global', auth, async (req, res) => {
  try {
    const users = await User.find().select('name avatarColor points').sort({ points: -1 }).limit(20);
    res.json({ leaderboard: users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching leaderboard' });
  }
});

// Friends-only leaderboard - me + my partners, sorted by points
router.get('/friends', auth, async (req, res) => {
  try {
    const me = await User.findById(req.userId);
    const ids = [req.userId, ...me.partners];
    const users = await User.find({ _id: { $in: ids } }).select('name avatarColor points').sort({ points: -1 });
    res.json({ leaderboard: users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching friends leaderboard' });
  }
});

module.exports = router;
