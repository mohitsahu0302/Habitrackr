const express = require('express');
const Habit = require('../models/Habit');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { applyCheckIn, reconcileStreak } = require('../utils/streakLogic');
const { sendEmail } = require('../utils/emailService');

const router = express.Router();

// Get all of the current user's habits (with lazy streak reconciliation)
router.get('/', auth, async (req, res) => {
  try {
    const habits = await Habit.find({ user: req.userId, isArchived: false }).sort({ createdAt: -1 });

    const toSave = [];
    for (const habit of habits) {
      if (reconcileStreak(habit)) toSave.push(habit.save());
    }
    if (toSave.length) await Promise.all(toSave);

    res.json({ habits });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching habits' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Habit title is required' });
    }
    const habit = await Habit.create({ user: req.userId, title: title.trim(), description: description || '' });
    res.status(201).json({ habit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating habit' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, user: req.userId });
    if (!habit) return res.status(404).json({ message: 'Habit not found' });
    habit.isArchived = true;
    await habit.save();
    res.json({ message: 'Habit archived' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting habit' });
  }
});

// Check in (mark today's completion) for a habit
router.post('/:id/checkin', auth, async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, user: req.userId });
    if (!habit) return res.status(404).json({ message: 'Habit not found' });

    reconcileStreak(habit);
    const { alreadyCheckedInToday, newMilestones } = applyCheckIn(habit);

    if (alreadyCheckedInToday) {
      return res.status(400).json({ message: "You've already checked in today for this habit", habit });
    }

    await habit.save();

    const pointsEarned = 10 + newMilestones.length * 20;
    const user = await User.findByIdAndUpdate(req.userId, { $inc: { points: pointsEarned } }, { new: true });

    // Notify accountability partners on milestone achievements
    if (newMilestones.length && user.partners.length) {
      const partners = await User.find({ _id: { $in: user.partners } });
      const bestMilestone = Math.max(...newMilestones);
      partners.forEach((partner) => {
        sendEmail({
          toEmail: partner.email,
          toName: partner.name,
          subject: `${user.name} just hit a ${bestMilestone}-day streak!`,
          message: `${user.name} reached a ${bestMilestone}-day streak on "${habit.title}". Send some encouragement!`
        }).catch(() => {});
      });
    }

    res.json({ habit, pointsEarned, newMilestones, totalPoints: user.points });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during check-in' });
  }
});

module.exports = router;
