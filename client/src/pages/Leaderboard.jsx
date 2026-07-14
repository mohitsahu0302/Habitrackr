import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Leaderboard() {
  const [tab, setTab] = useState('global');
  const [leaderboard, setLeaderboard] = useState([]);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/leaderboard/${tab}`);
        setLeaderboard(data.leaderboard);
      } catch (err) {
        setError('Could not load leaderboard.');
      }
    };
    load();
  }, [tab]);

  return (
    <div className="page">
      <h1>Leaderboard</h1>
      <p className="page-subtitle">Points come from check-ins and streak milestones.</p>
      {error && <div className="alert-error">{error}</div>}
      <div className="tabs">
        <button className={tab === 'global' ? 'tab-active' : ''} onClick={() => setTab('global')}>
          Global
        </button>
        <button className={tab === 'friends' ? 'tab-active' : ''} onClick={() => setTab('friends')}>
          Friends
        </button>
      </div>
      <ol className="leaderboard-list">
        {leaderboard.map((u, i) => (
          <li key={u._id} className={`leaderboard-item ${user && u._id === user.id ? 'leaderboard-me' : ''}`}>
            <span className="rank stat-mono">#{i + 1}</span>
            <span className="avatar-dot" style={{ background: u.avatarColor }} />
            <span className="name">{u.name}</span>
            <span className="points stat-mono">{u.points}</span>
          </li>
        ))}
        {leaderboard.length === 0 && <p className="empty-state">No data yet.</p>}
      </ol>
    </div>
  );
}
