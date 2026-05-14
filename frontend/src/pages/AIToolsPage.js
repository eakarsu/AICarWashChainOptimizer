import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AI_TOOLS } from '../config/aiTools';
import { runAI, submitAIFeedback } from '../services/api';

function AIToolsPage({ user, onLogout }) {
  const { toolKey } = useParams();
  const navigate = useNavigate();
  const tool = AI_TOOLS.find(t => t.key === toolKey);

  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(0);
  const [feedbackSent, setFeedbackSent] = useState(false);

  if (!tool) {
    return (
      <div style={{ padding: 40 }}>
        <h2>AI Tool not found</h2>
        <button className="btn-back" onClick={() => navigate('/')}>← Back to Dashboard</button>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setResult(null);
    try {
      const payload = { ...formData };
      // Parse JSON fields
      tool.fields.forEach(f => {
        if (f.type === 'json' && typeof payload[f.key] === 'string') {
          try { payload[f.key] = JSON.parse(payload[f.key]); } catch (_) {}
        }
        if (f.type === 'number' && payload[f.key] !== undefined) {
          payload[f.key] = Number(payload[f.key]);
        }
      });
      const res = await runAI(tool.key, payload);
      setResult(res);
    } catch (err) {
      setError(err.message || 'AI request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRate = async (n) => {
    setRating(n);
    try {
      await submitAIFeedback({ endpoint: tool.key, rating: n, request_data: formData });
      setFeedbackSent(true);
    } catch (_) {}
  };

  return (
    <>
      <header className="header">
        <div className="header-left">
          <span style={{ fontSize: 24 }}>🚗💦</span>
          <h1>SparkleWash AI Optimizer</h1>
        </div>
        <div className="header-right">
          <div className="user-badge">
            <span>👤</span>
            <span>{user.name}</span>
          </div>
          <button onClick={onLogout} className="btn-logout">Sign Out</button>
        </div>
      </header>

      <div className="feature-page">
        <div className="page-header">
          <div className="page-header-left">
            <button className="btn-back" onClick={() => navigate('/')}>← Back</button>
            <span style={{ fontSize: 28 }}>{tool.icon}</span>
            <h2 className="page-title">{tool.title}</h2>
          </div>
        </div>
        <p style={{ color: '#94a3b8', marginBottom: 16 }}>{tool.description}</p>

        <form onSubmit={handleSubmit} className="edit-form" style={{ background: '#0f172a', padding: 20, borderRadius: 12 }}>
          {tool.fields.map(f => (
            <div key={f.key} className="form-group">
              <label>{f.label} {f.required && '*'}</label>
              {f.type === 'json' ? (
                <textarea
                  rows={f.rows || 4}
                  value={formData[f.key] || ''}
                  onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                  placeholder={f.placeholder || '[ ... ]'}
                  required={f.required}
                  style={{ fontFamily: 'monospace' }}
                />
              ) : (
                <input
                  type={f.type || 'text'}
                  value={formData[f.key] || ''}
                  onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  required={f.required}
                />
              )}
            </div>
          ))}
          <div style={{ marginTop: 16 }}>
            <button type="submit" className="btn-ai" disabled={loading}>
              {loading ? '⏳ Analyzing...' : `✨ Run ${tool.title}`}
            </button>
          </div>
        </form>

        {error && (
          <div style={{ background: '#7f1d1d', color: '#fff', padding: 12, borderRadius: 8, marginTop: 16 }}>
            {error}
          </div>
        )}

        {result && (
          <div style={{ marginTop: 24 }}>
            <h3 style={{ color: '#e2e8f0' }}>📊 AI Analysis</h3>
            <pre style={{
              background: '#0f172a', padding: 16, borderRadius: 12,
              color: '#e2e8f0', overflow: 'auto', maxHeight: 600
            }}>
              {JSON.stringify(result.analysis || result, null, 2)}
            </pre>

            <div style={{ marginTop: 16, padding: 16, background: '#1f2937', borderRadius: 12 }}>
              <div style={{ color: '#cbd5e1', marginBottom: 8 }}>Rate this analysis:</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[1,2,3,4,5].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => handleRate(n)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 22,
                             color: rating >= n ? '#facc15' : '#475569' }}>★</button>
                ))}
              </div>
              {feedbackSent && <div style={{ color: '#10b981', marginTop: 8 }}>✓ Thanks for the feedback!</div>}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default AIToolsPage;
