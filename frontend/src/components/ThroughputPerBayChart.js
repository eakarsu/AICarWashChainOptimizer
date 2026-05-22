import React, { useEffect, useState } from 'react';

const API = 'http://localhost:3601/api/custom-views';

function getHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const BAY_COLORS = ['#3b82f6', '#06b6d4', '#22c55e', '#f59e0b', '#a855f7', '#ef4444'];

export default function ThroughputPerBayChart() {
  const [data, setData] = useState(null);
  const [loc, setLoc] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/throughput-per-bay?location_id=${loc}`, { headers: getHeaders() })
      .then(r => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [loc]);

  if (loading || !data) return <div style={{ padding: 24, color: '#94a3b8' }}>Loading throughput chart...</div>;

  const W = 720, H = 360;
  const pad = { l: 50, r: 20, t: 40, b: 40 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const maxY = 30;
  const hours = data.hours;
  const barGroupW = innerW / hours.length;
  const barW = (barGroupW - 6) / data.series.length;

  return (
    <div data-testid="throughput-chart" style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ color: '#f1f5f9' }}>Throughput per Bay (washes/hr)</h3>
        <select value={loc} onChange={e => setLoc(parseInt(e.target.value, 10))} style={{ background: '#0f172a', color: '#f1f5f9', border: '1px solid #334155', padding: '6px 10px', borderRadius: 6 }}>
          {[1, 2, 3, 4, 5].map(i => <option key={i} value={i}>Location #{100 + i}</option>)}
        </select>
      </div>
      <svg width={W} height={H} style={{ display: 'block', background: '#0f172a', borderRadius: 8 }}>
        {/* y-axis grid */}
        {[0, 0.25, 0.5, 0.75, 1].map(t => {
          const y = pad.t + innerH - innerH * t;
          return (
            <g key={t}>
              <line x1={pad.l} y1={y} x2={pad.l + innerW} y2={y} stroke="#1e3a5f" strokeDasharray="2,3" />
              <text x={pad.l - 8} y={y + 3} fill="#64748b" fontSize="10" textAnchor="end">{Math.round(maxY * t)}</text>
            </g>
          );
        })}
        {/* bars */}
        {hours.map((h, hi) => (
          <g key={h} transform={`translate(${pad.l + hi * barGroupW + 3},0)`}>
            {data.series.map((s, si) => {
              const v = s.data[hi].washes;
              const bh = (v / maxY) * innerH;
              return (
                <rect key={s.bay}
                  x={si * barW}
                  y={pad.t + innerH - bh}
                  width={barW - 1}
                  height={bh}
                  fill={BAY_COLORS[si % BAY_COLORS.length]}
                  rx={1}
                >
                  <title>{`${s.bay} @ ${h}: ${v}`}</title>
                </rect>
              );
            })}
            <text x={barGroupW / 2 - 3} y={H - pad.b + 14} fill="#94a3b8" fontSize="9" textAnchor="middle">{h.slice(0, 2)}</text>
          </g>
        ))}
        <text x={pad.l + innerW / 2} y={H - 6} fill="#64748b" fontSize="10" textAnchor="middle">Hour of day</text>
      </svg>
      <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {data.series.map((s, si) => (
          <div key={s.bay} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#cbd5e1', fontSize: 12 }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, background: BAY_COLORS[si % BAY_COLORS.length], borderRadius: 2 }} />
            {s.bay} ({data.totals[si].total} total)
          </div>
        ))}
        <div style={{ marginLeft: 'auto', color: '#22c55e', fontWeight: 600 }}>Grand Total: {data.grand_total}</div>
      </div>
    </div>
  );
}
