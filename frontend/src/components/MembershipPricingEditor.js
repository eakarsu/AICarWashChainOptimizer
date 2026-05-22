import React, { useEffect, useState } from 'react';

const API = 'http://localhost:3601/api/custom-views';

function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function MembershipPricingEditor() {
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`${API}/membership-pricing`, { headers: getHeaders() });
      const d = await r.json();
      setTiers(d.tiers || []);
    } finally {
      setLoading(false);
    }
  }

  function update(i, field, val) {
    const next = [...tiers];
    next[i] = { ...next[i], [field]: field === 'perks' ? val.split(',').map(s => s.trim()).filter(Boolean) : val };
    setTiers(next);
  }

  async function save() {
    setSaving(true);
    setMsg('');
    try {
      const r = await fetch(`${API}/membership-pricing`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ tiers }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Save failed');
      setTiers(d.tiers || []);
      setMsg('Saved successfully');
      setTimeout(() => setMsg(''), 3000);
    } catch (e) {
      setMsg(`Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={{ padding: 24, color: '#94a3b8' }}>Loading membership pricing...</div>;

  return (
    <div data-testid="membership-pricing" style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 20 }}>
      <h3 style={{ color: '#f1f5f9', marginBottom: 12 }}>Membership Pricing Editor</h3>
      <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 16 }}>
        Adjust pricing, wash quotas, and perks for unlimited subscription plans. Changes apply chain-wide on save.
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#e2e8f0' }}>
          <thead>
            <tr style={{ background: '#0f172a', textAlign: 'left' }}>
              <th style={{ padding: 10, borderBottom: '1px solid #334155' }}>Tier</th>
              <th style={{ padding: 10, borderBottom: '1px solid #334155' }}>Price ($)</th>
              <th style={{ padding: 10, borderBottom: '1px solid #334155' }}>Washes / mo</th>
              <th style={{ padding: 10, borderBottom: '1px solid #334155' }}>Perks (comma-sep)</th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((t, i) => (
              <tr key={t.tier} style={{ background: i % 2 ? '#1e293b' : '#172033' }}>
                <td style={{ padding: 10, fontWeight: 600 }}>{t.tier}</td>
                <td style={{ padding: 10 }}>
                  <input type="number" step="0.01" value={t.price} onChange={e => update(i, 'price', parseFloat(e.target.value))}
                    style={{ width: 100, padding: 6, background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4 }} />
                </td>
                <td style={{ padding: 10 }}>
                  <input type="number" value={t.washes_per_month} onChange={e => update(i, 'washes_per_month', parseInt(e.target.value, 10))}
                    style={{ width: 100, padding: 6, background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4 }} />
                </td>
                <td style={{ padding: 10 }}>
                  <input type="text" value={(t.perks || []).join(', ')} onChange={e => update(i, 'perks', e.target.value)}
                    style={{ width: '100%', minWidth: 240, padding: 6, background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4 }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
        <button data-testid="save-pricing-btn" onClick={save} disabled={saving}
          style={{ background: '#22c55e', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 6, cursor: saving ? 'wait' : 'pointer', fontWeight: 600 }}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        <button onClick={load} disabled={saving}
          style={{ background: 'transparent', color: '#cbd5e1', padding: '10px 20px', border: '1px solid #475569', borderRadius: 6, cursor: 'pointer' }}>
          Reload
        </button>
        {msg && <span style={{ color: msg.startsWith('Error') ? '#ef4444' : '#22c55e', fontSize: 13 }}>{msg}</span>}
      </div>
    </div>
  );
}
