import React, { useState } from 'react';

const API = 'http://localhost:3601/api/custom-views';

function getHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function nextMonday() {
  const d = new Date();
  const day = d.getDay();
  const diff = (day === 0 ? 1 : 8 - day);
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export default function ShiftSchedulePDF() {
  const [week, setWeek] = useState(nextMonday());
  const [location, setLocation] = useState('SparkleWash #101');
  const [status, setStatus] = useState('');
  const [generating, setGenerating] = useState(false);

  async function download() {
    setGenerating(true);
    setStatus('Generating PDF...');
    try {
      const url = `${API}/shift-schedule.pdf?week=${encodeURIComponent(week)}&location=${encodeURIComponent(location)}`;
      const res = await fetch(url, { headers: getHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const dlUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = dlUrl;
      a.download = `shift-schedule-${week}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(dlUrl);
      setStatus(`Downloaded shift-schedule-${week}.pdf (${(blob.size / 1024).toFixed(1)} KB)`);
    } catch (e) {
      setStatus(`Failed: ${e.message}`);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div data-testid="shift-schedule-pdf" style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 20 }}>
      <h3 style={{ color: '#f1f5f9', marginBottom: 12 }}>Shift Schedule PDF</h3>
      <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 16 }}>
        Generate a weekly printable shift schedule for tunnel attendants, with shift labels (Open/Mid/Close) and off-days.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <label style={{ display: 'flex', flexDirection: 'column', color: '#cbd5e1', fontSize: 13 }}>
          Week of (Mon)
          <input type="date" value={week} onChange={e => setWeek(e.target.value)}
            style={{ marginTop: 6, padding: 8, background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 6 }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', color: '#cbd5e1', fontSize: 13 }}>
          Location
          <select value={location} onChange={e => setLocation(e.target.value)}
            style={{ marginTop: 6, padding: 8, background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 6 }}>
            {['SparkleWash #101', 'SparkleWash #102', 'SparkleWash #103', 'SparkleWash #104'].map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </label>
      </div>
      <button data-testid="shift-pdf-btn" onClick={download} disabled={generating}
        style={{ background: '#3b82f6', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 6, cursor: generating ? 'wait' : 'pointer', fontWeight: 600 }}>
        {generating ? 'Generating...' : 'Download PDF'}
      </button>
      {status && (
        <div style={{ marginTop: 12, padding: 10, background: '#0f172a', borderRadius: 6, color: '#cbd5e1', fontSize: 12, fontFamily: 'monospace' }}>
          {status}
        </div>
      )}
    </div>
  );
}
