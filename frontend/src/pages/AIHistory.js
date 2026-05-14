import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAIResults } from '../services/api';
import { AI_TOOLS } from '../config/aiTools';

function AIHistory({ user, onLogout }) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [endpoint, setEndpoint] = useState('');
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, total_pages: 0 });
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetchAIResults({ page, limit: 20, endpoint });
      setData(r.data || []);
      setPagination(r.pagination || { total: 0, total_pages: 0 });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-line */ }, [page, endpoint]);

  return (
    <>
      <header className="header">
        <div className="header-left">
          <span style={{ fontSize: 24 }}>🚗💦</span>
          <h1>SparkleWash AI Optimizer</h1>
        </div>
        <div className="header-right">
          <div className="user-badge"><span>👤</span><span>{user.name}</span></div>
          <button onClick={onLogout} className="btn-logout">Sign Out</button>
        </div>
      </header>

      <div className="feature-page">
        <div className="page-header">
          <div className="page-header-left">
            <button className="btn-back" onClick={() => navigate('/')}>← Back</button>
            <span style={{ fontSize: 28 }}>🗂️</span>
            <h2 className="page-title">AI Run History</h2>
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ marginRight: 8 }}>Filter by tool:</label>
          <select value={endpoint} onChange={(e) => { setPage(1); setEndpoint(e.target.value); }}>
            <option value="">All</option>
            {AI_TOOLS.map(t => <option key={t.key} value={t.key}>{t.title}</option>)}
          </select>
        </div>

        {loading ? <p>Loading...</p> : (
          <>
            {data.length === 0 && <p>No AI runs yet.</p>}
            {data.map(row => (
              <div key={row.id} style={{ padding: 12, background: '#1f2937', borderRadius: 12, margin: '8px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{row.endpoint}</strong>
                  <span style={{ color: '#94a3b8' }}>{new Date(row.created_at).toLocaleString()}</span>
                </div>
                <button className="btn" onClick={() => setExpanded(expanded === row.id ? null : row.id)} style={{ marginTop: 8 }}>
                  {expanded === row.id ? 'Hide' : 'Show'} Details
                </button>
                {expanded === row.id && (
                  <>
                    <h4>Request</h4>
                    <pre style={{ background: '#0f172a', padding: 8, borderRadius: 8, color: '#e2e8f0', overflow: 'auto' }}>
                      {JSON.stringify(row.request_data, null, 2)}
                    </pre>
                    <h4>Result</h4>
                    <pre style={{ background: '#0f172a', padding: 8, borderRadius: 8, color: '#e2e8f0', overflow: 'auto', maxHeight: 400 }}>
                      {JSON.stringify(row.result_data, null, 2)}
                    </pre>
                  </>
                )}
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
              <button className="btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span style={{ color: '#cbd5e1' }}>Page {page} of {pagination.total_pages || 1} ({pagination.total} total)</span>
              <button className="btn" disabled={page >= (pagination.total_pages || 1)} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default AIHistory;
