import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function Partners() {
  const [partners, setPartners] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadAll = async () => {
    try {
      const [{ data: partnersData }, { data: requestsData }] = await Promise.all([
        api.get('/partners'),
        api.get('/partners/requests/incoming')
      ]);
      setPartners(partnersData.partners);
      setIncoming(requestsData.requests);
    } catch (err) {
      setError('Could not load partners.');
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    try {
      const { data } = await api.get(`/partners/search?q=${encodeURIComponent(query)}`);
      setResults(data.users);
      setError('');
    } catch (err) {
      setError('Search failed.');
    }
  };

  const sendRequest = async (toUserId) => {
    setMessage('');
    setError('');
    try {
      await api.post('/partners/request', { toUserId });
      setMessage('Partner request sent.');
      setResults((prev) => prev.filter((u) => u._id !== toUserId));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send request.');
    }
  };

  const respond = async (requestId, action) => {
    try {
      await api.post(`/partners/requests/${requestId}/respond`, { action });
      loadAll();
    } catch (err) {
      setError('Could not respond to request.');
    }
  };

  const removePartner = async (partnerId) => {
    if (!window.confirm('Remove this accountability partner?')) return;
    try {
      await api.delete(`/partners/${partnerId}`);
      setPartners((prev) => prev.filter((p) => p._id !== partnerId));
    } catch (err) {
      setError('Could not remove partner.');
    }
  };

  return (
    <div className="page">
      <h1>Accountability partners</h1>
      <p className="page-subtitle">Add people who'll notice if you stop showing up.</p>

      {error && <div className="alert-error">{error}</div>}
      {message && <div className="alert-success">{message}</div>}

      <section className="section">
        <h2>Find people</h2>
        <form className="inline-form" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search by name or email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
        {results.length > 0 && (
          <ul className="list">
            {results.map((u) => (
              <li key={u._id} className="list-item">
                <span>
                  {u.name} <span className="text-muted">({u.email})</span>
                </span>
                <button onClick={() => sendRequest(u._id)}>Send request</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {incoming.length > 0 && (
        <section className="section">
          <h2>Incoming requests</h2>
          <ul className="list">
            {incoming.map((r) => (
              <li key={r._id} className="list-item">
                <span>
                  {r.from.name} <span className="text-muted">({r.from.email})</span>
                </span>
                <div className="button-row">
                  <button onClick={() => respond(r._id, 'accept')}>Accept</button>
                  <button className="btn-secondary" onClick={() => respond(r._id, 'reject')}>
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="section">
        <h2>Your partners ({partners.length})</h2>
        {partners.length === 0 ? (
          <p className="empty-state">No partners yet. Search above to add one.</p>
        ) : (
          <div className="partner-grid">
            {partners.map((p) => (
              <div key={p._id} className="partner-card">
                <div className="habit-card-header">
                  <h3>{p.name}</h3>
                  <button className="btn-icon" onClick={() => removePartner(p._id)} title="Remove partner">
                    ✕
                  </button>
                </div>
                <p className="stat-label">{p.points} points</p>
                {p.habits.length === 0 ? (
                  <p className="empty-state-small">No active habits</p>
                ) : (
                  <ul className="mini-habit-list">
                    {p.habits.map((h) => (
                      <li key={h._id}>
                        <span>{h.title}</span>
                        <span className="stat-mono">{h.currentStreak}d</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
