import React, { useEffect, useState } from 'react';

const API = 'http://localhost:3601/api/custom-views';

function getHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Simple equirectangular projection for continental US viewport
function project(lat, lng, w, h) {
  // bounds: lng -125..-66, lat 24..50
  const minLng = -125, maxLng = -66, minLat = 24, maxLat = 50;
  const x = ((lng - minLng) / (maxLng - minLng)) * w;
  const y = h - ((lat - minLat) / (maxLat - minLat)) * h;
  return { x, y };
}

export default function LocationsMap() {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch(`${API}/locations-map`, { headers: getHeaders() })
      .then(r => r.json())
      .then(d => setPoints(d.points || []))
      .catch(() => setPoints([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 24, color: '#94a3b8' }}>Loading map...</div>;

  const W = 720, H = 380;

  return (
    <div data-testid="locations-map" style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 16 }}>
      <h3 style={{ color: '#f1f5f9', marginBottom: 12 }}>Locations Map ({points.length} sites)</h3>
      <div style={{ position: 'relative', width: W, height: H, background: '#0f172a', borderRadius: 8, border: '1px solid #1e3a5f' }}>
        <svg width={W} height={H} style={{ display: 'block' }}>
          {/* US outline approximation */}
          <rect x="20" y="20" width={W - 40} height={H - 40} fill="#0b1426" stroke="#1e3a5f" strokeWidth="1" rx="6" />
          <text x={W / 2} y={36} fill="#475569" fontSize="11" textAnchor="middle">USA - SparkleWash Network</text>
          {points.map(p => {
            const { x, y } = project(p.lat, p.lng, W, H);
            const r = p.status === 'open' ? 8 : 6;
            const fill = p.status === 'open' ? '#22c55e' : '#f59e0b';
            return (
              <g key={p.id} onClick={() => setSelected(p)} style={{ cursor: 'pointer' }}>
                <circle cx={x} cy={y} r={r} fill={fill} fillOpacity="0.7" stroke="#f1f5f9" strokeWidth="1.5" />
                <text x={x + 10} y={y + 4} fill="#cbd5e1" fontSize="10">{p.name}</text>
              </g>
            );
          })}
        </svg>
        {selected && (
          <div style={{ position: 'absolute', top: 12, right: 12, background: '#1e3a5f', padding: 12, borderRadius: 8, minWidth: 200, border: '1px solid #3b82f6' }}>
            <div style={{ color: '#f1f5f9', fontWeight: 600 }}>{selected.name}</div>
            <div style={{ color: '#94a3b8', fontSize: 12 }}>{selected.city}</div>
            <div style={{ color: '#cbd5e1', fontSize: 12, marginTop: 6 }}>Revenue/wk: ${selected.revenue_weekly.toLocaleString()}</div>
            <div style={{ color: '#cbd5e1', fontSize: 12 }}>Washes/hr: {selected.washes_per_hour}</div>
            <div style={{ color: '#cbd5e1', fontSize: 12 }}>Status: {selected.status}</div>
            <button onClick={() => setSelected(null)} style={{ marginTop: 8, background: 'transparent', border: '1px solid #475569', color: '#cbd5e1', borderRadius: 4, padding: '4px 8px', cursor: 'pointer' }}>Close</button>
          </div>
        )}
      </div>
      <div style={{ marginTop: 10, display: 'flex', gap: 16, fontSize: 12, color: '#94a3b8' }}>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#22c55e', marginRight: 6 }} />Open</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', marginRight: 6 }} />Maintenance</span>
      </div>
    </div>
  );
}
