import { useEffect, useState } from 'react';
import api from '../api/axios';
import HabitCard from '../components/HabitCard';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showForm, setShowForm] = useState(false);
  const { refreshUser } = useAuth();

  const loadHabits = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/habits');
      setHabits(data.habits);
    } catch (err) {
      setError('Could not load habits.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHabits();
  }, []);

  const handleAddHabit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const { data } = await api.post('/habits', { title, description });
      setHabits((prev) => [data.habit, ...prev]);
      setTitle('');
      setDescription('');
      setShowForm(false);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create habit.');
    }
  };

  const handleCheckIn = async (habitId) => {
    try {
      const { data } = await api.post(`/habits/${habitId}/checkin`);
      setHabits((prev) => prev.map((h) => (h._id === habitId ? data.habit : h)));
      refreshUser();
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Check-in failed.');
    }
  };

  const handleDelete = async (habitId) => {
    if (!window.confirm('Archive this habit? It will be removed from your dashboard.')) return;
    try {
      await api.delete(`/habits/${habitId}`);
      setHabits((prev) => prev.filter((h) => h._id !== habitId));
    } catch (err) {
      setError('Could not archive habit.');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Your habits</h1>
          <p className="page-subtitle">Check in daily. Miss a day and the streak resets to zero.</p>
        </div>
        <button onClick={() => setShowForm((s) => !s)}>{showForm ? 'Cancel' : '+ New habit'}</button>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {showForm && (
        <form className="inline-form" onSubmit={handleAddHabit}>
          <input
            type="text"
            placeholder="Habit title (e.g. Read 20 pages)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <button type="submit">Add habit</button>
        </form>
      )}

      {loading ? (
        <p>Loading habits...</p>
      ) : habits.length === 0 ? (
        <p className="empty-state">No habits yet. Add your first one above to start a streak.</p>
      ) : (
        <div className="habit-grid">
          {habits.map((habit) => (
            <HabitCard key={habit._id} habit={habit} onCheckIn={handleCheckIn} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
