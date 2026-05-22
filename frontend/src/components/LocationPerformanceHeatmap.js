import React, { useEffect, useState } from 'react';

const API = 'http://localhost:3601/api/custom-views';

function getHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function scoreColor(score) {
  // 0..100 -> red (low) to green (high)
  const s = Math.max(0, Math.min(100, score));
  const hue = (s / 100) * 120; // 0=red, 120=green
  return `hsl(${hue}, 70%, 40%)`;
}

export default function LocationPerformanceHeatmap() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/location-performance-heatmap`, { headers: getHeaders() })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) return <div style={{ padding: 24, color: '#94a3b8' }}>Loading location performance heatmap...</div>;

  return (
    <div
      data-testid="location-performance-heatmap"
      style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 16 }}
    >
      <h3 style={{ color: '#f1f5f9', marginBottom: 12 }}>Location Performance Heatmap</h3>
      <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 16 }}>
        Composite KPI scores per location (0..100). Sorted by composite score.
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 2 }}>
          <thead>
            <tr>
              <th style={{ padding: 8, color: '#94a3b8', fontSize: 12, textAlign: 'left' }}>Location</th>
              <th style={{ padding: 8, color: '#94a3b8', fontSize: 12, textAlign: 'left' }}>City</th>
              {data.kpis.map((k) => (
                <th key={k} style={{ padding: 8, color: '#94a3b8', fontSize: 12, textAlign: 'center', minWidth: 80 }}>
                  {k}
                </th>
              ))}
              <th style={{ padding: 8, color: '#f1f5f9', fontSize: 12, textAlign: 'center' }}>Composite</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r) => (
              <tr key={r.location_id}>
                <td style={{ padding: 8, color: '#e2e8f0', fontSize: 13 }}>{r.name}</td>
                <td style={{ padding: 8, color: '#94a3b8', fontSize: 12 }}>{r.city}</td>
                {r.scores.map((s, si) => (
                  <td
                    key={si}
                    style={{
                      padding: 0,
                      textAlign: 'center',
                      background: scoreColor(s),
                      color: '#ffffff',
                      fontWeight: 600,
                      fontSize: 12,
                      borderRadius: 4,
                      minWidth: 60,
                      height: 32,
                    }}
                  >
                    {s}
                  </td>
                ))}
                <td
                  style={{
                    padding: 0,
                    textAlign: 'center',
                    background: scoreColor(r.composite),
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: 13,
                    borderRadius: 4,
                  }}
                >
                  {r.composite}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: '#cbd5e1' }}>
        <span>Score scale:</span>
        {[0, 25, 50, 75, 100].map((v) => (
          <span
            key={v}
            style={{
              padding: '4px 10px',
              background: scoreColor(v),
              color: '#ffffff',
              borderRadius: 4,
              fontWeight: 600,
            }}
          >
            {v}
          </span>
        ))}
      </div>
    </div>
  );
}
