import { useState } from 'react';

export default function HabitCard({ habit, onCheckIn, onDelete }) {
  const [busy, setBusy] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const doneToday = habit.lastCompletedDate === today;

  const handleCheckIn = async () => {
    setBusy(true);
    try {
      await onCheckIn(habit._id);
    } finally {
      setBusy(false);
    }
  };

  // Weekly ladder: 7 ticks showing progress within the current 7-day block
  const ladderFilled = habit.currentStreak % 7 === 0 && habit.currentStreak > 0 ? 7 : habit.currentStreak % 7;

  return (
    <div className={`habit-card ${doneToday ? 'habit-card-done' : ''}`}>
      <div className="habit-card-header">
        <h3>{habit.title}</h3>
        <button className="btn-icon" onClick={() => onDelete(habit._id)} title="Archive habit">
          ✕
        </button>
      </div>
      {habit.description && <p className="habit-desc">{habit.description}</p>}

      <div className="streak-ladder" title={`${habit.currentStreak}-day streak`}>
        {Array.from({ length: 7 }).map((_, i) => (
          <span key={i} className={`ladder-tick ${i < ladderFilled ? 'ladder-tick-filled' : ''}`} />
        ))}
      </div>

      <div className="habit-stats">
        <div className="stat">
          <span className="stat-value stat-mono">{habit.currentStreak}</span>
          <span className="stat-label">day streak</span>
        </div>
        <div className="stat">
          <span className="stat-value stat-mono">{habit.longestStreak}</span>
          <span className="stat-label">best streak</span>
        </div>
        <div className="stat">
          <span className="stat-value stat-mono">{habit.totalCompletions}</span>
          <span className="stat-label">total check-ins</span>
        </div>
      </div>

      <button className={`btn-checkin ${doneToday ? 'btn-checked' : ''}`} onClick={handleCheckIn} disabled={doneToday || busy}>
        {doneToday ? 'Checked in today' : busy ? 'Saving...' : 'Check in'}
      </button>
    </div>
  );
}
