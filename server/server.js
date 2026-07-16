require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cron = require('node-cron');

const authRoutes = require('./routes/authRoutes');
const habitRoutes = require('./routes/habitRoutes');
const partnerRoutes = require('./routes/partnerRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const Habit = require('./models/Habit');
const User = require('./models/User');
const { sendEmail } = require('./utils/emailService');
const { todayStr } = require('./utils/dateUtils');

const app = express();

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://habitrackr-frontend.onrender.com"
  ],
  credentials: true
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// 404 handler
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// Central error handler (safety net)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`HabiTrackr server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Daily reminder job — runs every day at 8:00 PM server time.
// Emails users (once/day) who have at least one habit not completed today.
cron.schedule('0 20 * * *', async () => {
  console.log('Running daily reminder job...');
  try {
    const today = todayStr();
    const habits = await Habit.find({ isArchived: false });
    const userIdsNeedingReminder = new Set(
      habits.filter((h) => h.lastCompletedDate !== today).map((h) => String(h.user))
    );

    for (const userId of userIdsNeedingReminder) {
      const user = await User.findById(userId);
      if (!user || user.lastReminderSentDate === today) continue;

      await sendEmail({
        toEmail: user.email,
        toName: user.name,
        subject: "Don't break your streak!",
        message: `Hi ${user.name}, you still have habits to check off today on HabiTrackr. Log in and keep your streak alive!`
      });

      user.lastReminderSentDate = today;
      await user.save();
    }
  } catch (err) {
    console.error('Reminder job failed:', err);
  }
});

module.exports = app;
