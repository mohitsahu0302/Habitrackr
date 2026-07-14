import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span className="flame-mark">/\</span> HabiTrackr
      </Link>
      <div className="navbar-links">
        <Link to="/">Dashboard</Link>
        <Link to="/partners">Partners</Link>
        <Link to="/leaderboard">Leaderboard</Link>
      </div>
      <div className="navbar-user">
        <span className="points-badge">{user.points} pts</span>
        <span className="navbar-name">{user.name}</span>
        <button onClick={handleLogout} className="btn-link">Log out</button>
      </div>
    </nav>
  );
}
