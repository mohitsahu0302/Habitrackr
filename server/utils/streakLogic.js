const { todayStr, daysBetween } = require('./dateUtils');

const MILESTONES = [3, 7, 14, 30, 60, 100, 365];

/**
 * Applies a check-in to a habit document (mutates it) and returns
 * info about the result: { alreadyCheckedInToday, newMilestones }
 */
function applyCheckIn(habit) {
  const today = todayStr();

  if (habit.lastCompletedDate === today) {
    return { alreadyCheckedInToday: true, newMilestones: [] };
  }

  if (!habit.lastCompletedDate) {
    habit.currentStreak = 1;
  } else {
    const gap = daysBetween(habit.lastCompletedDate, today);
    if (gap === 1) {
      habit.currentStreak += 1;
    } else if (gap > 1) {
      habit.currentStreak = 1; // streak was broken, restart at 1
    } else {
      habit.currentStreak = habit.currentStreak || 1;
    }
  }

  habit.lastCompletedDate = today;
  habit.totalCompletions += 1;
  habit.longestStreak = Math.max(habit.longestStreak, habit.currentStreak);

  const newMilestones = MILESTONES.filter(
    (m) => habit.currentStreak >= m && !habit.milestonesReached.includes(m)
  );
  if (newMilestones.length) {
    habit.milestonesReached.push(...newMilestones);
  }

  return { alreadyCheckedInToday: false, newMilestones };
}

/**
 * Lazily resets a streak to 0 if more than one day has passed since the
 * last completion (i.e. the user missed a day). Call on read and via cron.
 */
function reconcileStreak(habit) {
  if (!habit.lastCompletedDate) return false;
  const today = todayStr();
  const gap = daysBetween(habit.lastCompletedDate, today);
  if (gap > 1 && habit.currentStreak !== 0) {
    habit.currentStreak = 0;
    return true;
  }
  return false;
}

module.exports = { applyCheckIn, reconcileStreak, MILESTONES };
