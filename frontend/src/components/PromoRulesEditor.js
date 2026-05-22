import React, { useEffect, useState } from 'react';

const API = 'http://localhost:3601/api/custom-views';

function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const EMPTY = { code: '', description: '', discount_pct: 10, active: true, valid_from: '', valid_to: '' };

export default function PromoRulesEditor() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [draft, setDraft] = useState(EMPTY);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`${API}/promo-rules`, { headers: getHeaders() });
      const d = await r.json();
      setRules(d.rules || []);
    } finally {
      setLoading(false);
    }
  }

  async function createRule() {
    if (!draft.code.trim()) { setMsg('Error: code is required'); return; }
    setBusy(true); setMsg('');
    try {
      const r = await fetch(`${API}/promo-rules`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(draft),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'create failed');
      setDraft(EMPTY);
      setMsg('Promo rule created');
      setTimeout(() => setMsg(''), 2500);
      load();
    } catch (e) {
      setMsg(`Error: ${e.message}`);
    } finally { setBusy(false); }
  }

  async function updateRule(id, patch) {
    setBusy(true); setMsg('');
    try {
      const r = await fetch(`${API}/promo-rules/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(patch),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'update failed');
      setRules((rs) => rs.map((x) => (x.id === id ? d : x)));
      setMsg('Saved');
      setTimeout(() => setMsg(''), 2000);
    } catch (e) {
      setMsg(`Error: ${e.message}`);
    } finally { setBusy(false); }
  }

  async function removeRule(id) {
    setBusy(true); setMsg('');
    try {
      const r = await fetch(`${API}/promo-rules/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || `HTTP ${r.status}`);
      }
      setRules((rs) => rs.filter((x) => x.id !== id));
      setMsg('Deleted');
      setTimeout(() => setMsg(''), 2000);
    } catch (e) {
      setMsg(`Error: ${e.message}`);
    } finally { setBusy(false); }
  }

  if (loading) return <div style={{ padding: 24, color: '#94a3b8' }}>Loading promo rules...</div>;

  return (
    <div
      data-testid="promo-rules-editor"
      style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 20 }}
    >
      <h3 style={{ color: '#f1f5f9', marginBottom: 6 }}>Pricing / Promo Rules</h3>
      <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 16 }}>
        Manage discount codes that chain-wide pricing engine applies at checkout. Full CRUD.
      </p>

      {/* Create form */}
      <div style={{ background: '#0f172a', padding: 12, borderRadius: 8, marginBottom: 16 }}>
        <div style={{ color: '#cbd5e1', fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Add new promo rule</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
          <input
            placeholder="CODE"
            value={draft.code}
            onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
            style={{ padding: 6, background: '#1e293b', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4 }}
          />
          <input
            placeholder="Description"
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            style={{ gridColumn: 'span 2', padding: 6, background: '#1e293b', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4 }}
          />
          <input
            type="number" min={0} max={100}
            placeholder="% off"
            value={draft.discount_pct}
            onChange={(e) => setDraft({ ...draft, discount_pct: parseFloat(e.target.value) })}
            style={{ padding: 6, background: '#1e293b', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4 }}
          />
          <input
            type="date"
            value={draft.valid_from}
            onChange={(e) => setDraft({ ...draft, valid_from: e.target.value })}
            style={{ padding: 6, background: '#1e293b', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4 }}
          />
          <input
            type="date"
            value={draft.valid_to}
            onChange={(e) => setDraft({ ...draft, valid_to: e.target.value })}
            style={{ padding: 6, background: '#1e293b', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4 }}
          />
        </div>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={{ color: '#cbd5e1', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={draft.active}
              onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
            />
            Active
          </label>
          <button
            data-testid="create-promo-btn"
            onClick={createRule}
            disabled={busy}
            style={{ background: '#22c55e', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 6, cursor: busy ? 'wait' : 'pointer', fontWeight: 600 }}
          >
            Add Promo
          </button>
          {msg && <span style={{ color: msg.startsWith('Error') ? '#ef4444' : '#22c55e', fontSize: 12 }}>{msg}</span>}
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#e2e8f0' }}>
          <thead>
            <tr style={{ background: '#0f172a', textAlign: 'left' }}>
              <th style={{ padding: 8, borderBottom: '1px solid #334155' }}>Code</th>
              <th style={{ padding: 8, borderBottom: '1px solid #334155' }}>Description</th>
              <th style={{ padding: 8, borderBottom: '1px solid #334155' }}>% off</th>
              <th style={{ padding: 8, borderBottom: '1px solid #334155' }}>Active</th>
              <th style={{ padding: 8, borderBottom: '1px solid #334155' }}>Valid from</th>
              <th style={{ padding: 8, borderBottom: '1px solid #334155' }}>Valid to</th>
              <th style={{ padding: 8, borderBottom: '1px solid #334155' }}></th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r, i) => (
              <tr key={r.id} style={{ background: i % 2 ? '#1e293b' : '#172033' }}>
                <td style={{ padding: 8, fontWeight: 600, color: '#3b82f6' }}>{r.code}</td>
                <td style={{ padding: 8 }}>
                  <input
                    type="text"
                    defaultValue={r.description}
                    onBlur={(e) => e.target.value !== r.description && updateRule(r.id, { description: e.target.value })}
                    style={{ width: '100%', minWidth: 200, padding: 4, background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4 }}
                  />
                </td>
                <td style={{ padding: 8 }}>
                  <input
                    type="number" min={0} max={100}
                    defaultValue={r.discount_pct}
                    onBlur={(e) => +e.target.value !== r.discount_pct && updateRule(r.id, { discount_pct: parseFloat(e.target.value) })}
                    style={{ width: 70, padding: 4, background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4 }}
                  />
                </td>
                <td style={{ padding: 8 }}>
                  <input
                    type="checkbox"
                    checked={r.active}
                    onChange={(e) => updateRule(r.id, { active: e.target.checked })}
                  />
                </td>
                <td style={{ padding: 8 }}>
                  <input
                    type="date"
                    defaultValue={r.valid_from}
                    onBlur={(e) => e.target.value !== r.valid_from && updateRule(r.id, { valid_from: e.target.value })}
                    style={{ padding: 4, background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4 }}
                  />
                </td>
                <td style={{ padding: 8 }}>
                  <input
                    type="date"
                    defaultValue={r.valid_to}
                    onBlur={(e) => e.target.value !== r.valid_to && updateRule(r.id, { valid_to: e.target.value })}
                    style={{ padding: 4, background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4 }}
                  />
                </td>
                <td style={{ padding: 8 }}>
                  <button
                    onClick={() => removeRule(r.id)}
                    disabled={busy}
                    style={{ background: '#ef4444', color: 'white', padding: '4px 10px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {rules.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 16, textAlign: 'center', color: '#64748b' }}>No promo rules — add one above.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
