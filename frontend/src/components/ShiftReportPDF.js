import React, { useState } from 'react';

const API = 'http://localhost:3601/api/custom-views';

export default function ShiftReportPDF() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [location, setLocation] = useState('SparkleWash #101');
  const [downloading, setDownloading] = useState(false);
  const [msg, setMsg] = useState('');

  async function download() {
    setDownloading(true);
    setMsg('');
    try {
      const token = localStorage.getItem('token');
      const url = `${API}/shift-report.pdf?date=${encodeURIComponent(date)}&location=${encodeURIComponent(location)}`;
      const r = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const blob = await r.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `shift-report-${date}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
      setMsg('Downloaded shift report PDF.');
    } catch (e) {
      setMsg(`Error: ${e.message}`);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div
      data-testid="shift-report-pdf"
      style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 20 }}
    >
      <h3 style={{ color: '#f1f5f9', marginBottom: 12 }}>Daily Shift Report PDF</h3>
      <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 16 }}>
        Generate a PDF report covering staffing, washes/hr, labor cost, revenue and variance vs target for each shift.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, color: '#cbd5e1', fontSize: 12 }}>
          Report date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ padding: 8, background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4 }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, color: '#cbd5e1', fontSize: 12 }}>
          Location name
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={{ padding: 8, background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 4 }}
          />
        </label>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button
          data-testid="download-shift-report-btn"
          onClick={download}
          disabled={downloading}
          style={{
            background: '#3b82f6',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: 6,
            cursor: downloading ? 'wait' : 'pointer',
            fontWeight: 600,
          }}
        >
          {downloading ? 'Generating...' : 'Download Shift Report PDF'}
        </button>
        {msg && (
          <span style={{ color: msg.startsWith('Error') ? '#ef4444' : '#22c55e', fontSize: 13 }}>
            {msg}
          </span>
        )}
      </div>

      <div style={{ marginTop: 20, padding: 12, background: '#0f172a', borderRadius: 8, color: '#94a3b8', fontSize: 12 }}>
        <strong style={{ color: '#cbd5e1' }}>Report contents:</strong>
        <ul style={{ marginTop: 6, paddingLeft: 18 }}>
          <li>Per-shift staff count, hours, washes completed</li>
          <li>Washes per hour (with variance vs 30/hr target)</li>
          <li>Labor cost @ $18.50/hr loaded</li>
          <li>Revenue and gross margin summary band</li>
        </ul>
      </div>
    </div>
  );
}
