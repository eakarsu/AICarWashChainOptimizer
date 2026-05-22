import React, { useEffect, useState } from 'react';

const API = 'http://localhost:3601/api/custom-views';

function getHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const COLORS = ['#3b82f6', '#06b6d4', '#22c55e', '#f59e0b', '#a855f7'];

export default function BayUtilizationTimeline() {
  const [data, setData] = useState(null);
  const [loc, setLoc] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/bay-utilization-timeline?location_id=${loc}`, { headers: getHeaders() })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [loc]);

  if (loading || !data) return <div style={{ padding: 24, color: '#94a3b8' }}>Loading bay utilization timeline...</div>;

  const W = 760, H = 380;
  const pad = { l: 50, r: 20, t: 40, b: 40 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const hours = data.hours;
  const xStep = innerW / (hours.length - 1);

  function pathFor(samples) {
    return samples
      .map((s, i) => {
        const x = pad.l + i * xStep;
        const y = pad.t + innerH - s.utilization * innerH;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }

  return (
    <div
      data-testid="bay-utilization-timeline"
      style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 16 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ color: '#f1f5f9' }}>Bay Utilization Timeline (24h)</h3>
        <select
          value={loc}
          onChange={(e) => setLoc(parseInt(e.target.value, 10))}
          style={{ background: '#0f172a', color: '#f1f5f9', border: '1px solid #334155', padding: '6px 10px', borderRadius: 6 }}
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <option key={i} value={i}>Location #{100 + i}</option>
          ))}
        </select>
      </div>
      <svg width={W} height={H} style={{ display: 'block', background: '#0f172a', borderRadius: 8 }}>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = pad.t + innerH - innerH * t;
          return (
            <g key={t}>
              <line x1={pad.l} y1={y} x2={pad.l + innerW} y2={y} stroke="#1e3a5f" strokeDasharray="2,3" />
              <text x={pad.l - 8} y={y + 3} fill="#64748b" fontSize="10" textAnchor="end">
                {Math.round(t * 100)}%
              </text>
            </g>
          );
        })}
        {hours.map((h) => {
          if (h % 3 !== 0) return null;
          const x = pad.l + h * xStep;
          return (
            <text key={h} x={x} y={H - pad.b + 14} fill="#94a3b8" fontSize="9" textAnchor="middle">
              {String(h).padStart(2, '0')}
            </text>
          );
        })}
        {data.series.map((s, si) => (
          <g key={s.bay}>
            <path d={pathFor(s.samples)} fill="none" stroke={COLORS[si % COLORS.length]} strokeWidth={2} />
            {s.samples.map((p) => (
              <circle
                key={p.hour}
                cx={pad.l + p.hour * xStep}
                cy={pad.t + innerH - p.utilization * innerH}
                r={2}
                fill={COLORS[si % COLORS.length]}
              />
            ))}
          </g>
        ))}
        <text x={pad.l + innerW / 2} y={H - 6} fill="#64748b" fontSize="10" textAnchor="middle">
          Hour of day
        </text>
      </svg>
      <div style={{ marginTop: 12, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {data.series.map((s, si) => (
          <div key={s.bay} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#cbd5e1', fontSize: 12 }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, background: COLORS[si % COLORS.length], borderRadius: 2 }} />
            {s.bay} (avg {Math.round(s.avg_utilization * 100)}%, peak @{s.peak_hour}:00)
          </div>
        ))}
        <div style={{ marginLeft: 'auto', color: '#22c55e', fontWeight: 600 }}>
          Chain avg: {Math.round(data.chain_avg * 100)}%
        </div>
      </div>
    </div>
  );
}
