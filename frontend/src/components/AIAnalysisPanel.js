import React from 'react';

function AIAnalysisPanel({ result, loading, type, onClose }) {
  if (loading) {
    return (
      <div className="ai-analysis-panel">
        <div className="ai-panel-header">
          <span>✨</span>
          <h3>AI Analysis in Progress</h3>
        </div>
        <div className="ai-loading">
          <div className="spinner"></div>
          <span>Analyzing data with AI... This may take a moment</span>
        </div>
      </div>
    );
  }

  if (!result) return null;

  if (result.error) {
    return (
      <div className="ai-analysis-panel">
        <div className="ai-panel-header">
          <span>⚠️</span>
          <h3>AI Analysis Error</h3>
          <button className="modal-close" onClick={onClose} style={{ marginLeft: 'auto' }}>×</button>
        </div>
        <div className="ai-panel-body">
          <div className="ai-warning">
            <span>⚠️</span>
            <div className="ai-recommendation-text">{result.error}</div>
          </div>
        </div>
      </div>
    );
  }

  let parsed = null;
  try {
    const raw = result.analysis || result;
    if (typeof raw === 'string') {
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleaned);
    } else {
      parsed = raw;
    }
  } catch {
    // If JSON parsing fails, render as formatted text
    return (
      <div className="ai-analysis-panel">
        <div className="ai-panel-header">
          <span>✨</span>
          <h3>AI Analysis Results</h3>
          <button className="modal-close" onClick={onClose} style={{ marginLeft: 'auto' }}>×</button>
        </div>
        <div className="ai-panel-body">
          <div className="ai-section">
            <div className="ai-section-content" style={{ whiteSpace: 'pre-wrap' }}>
              {result.analysis || JSON.stringify(result, null, 2)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-analysis-panel">
      <div className="ai-panel-header">
        <span>✨</span>
        <h3>AI Analysis Results</h3>
        <button className="modal-close" onClick={onClose} style={{ marginLeft: 'auto' }}>×</button>
      </div>
      <div className="ai-panel-body">
        {renderParsedData(parsed)}
      </div>
    </div>
  );
}

function renderParsedData(data, depth = 0) {
  if (!data || typeof data !== 'object') {
    return <span className="ai-section-content">{String(data)}</span>;
  }

  return Object.entries(data).map(([key, value]) => {
    const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const icon = getIconForKey(key);

    // Simple string or number
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      if (depth === 0) {
        return (
          <div key={key} className="ai-section">
            <div className="ai-section-title">{icon} {label}</div>
            <div className="ai-section-content">
              {typeof value === 'number' ? (
                <span className="ai-metric">
                  <span className="ai-metric-value">{formatNumber(key, value)}</span>
                </span>
              ) : (
                formatTextValue(String(value))
              )}
            </div>
          </div>
        );
      }
      return (
        <div key={key} style={{ marginBottom: '4px' }}>
          <span style={{ color: '#94a3b8', fontSize: '12px' }}>{label}: </span>
          <span style={{ color: '#e2e8f0', fontSize: '14px' }}>
            {typeof value === 'number' ? formatNumber(key, value) : String(value)}
          </span>
        </div>
      );
    }

    // Array
    if (Array.isArray(value)) {
      return (
        <div key={key} className="ai-section">
          <div className="ai-section-title">{icon} {label} ({value.length})</div>
          <div className="ai-section-content">
            {value.map((item, i) => {
              if (typeof item === 'string') {
                return (
                  <div key={i} className="ai-recommendation">
                    <span style={{ color: '#22c55e', fontSize: '16px' }}>→</span>
                    <div className="ai-recommendation-text">{item}</div>
                  </div>
                );
              }
              if (typeof item === 'object') {
                return (
                  <div key={i} className="ai-card">
                    {Object.entries(item).map(([k, v]) => {
                      const itemLabel = k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                      if (typeof v === 'object' && v !== null) {
                        if (Array.isArray(v)) {
                          return (
                            <div key={k} style={{ marginBottom: '6px' }}>
                              <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600 }}>{itemLabel}: </span>
                              <span style={{ color: '#e2e8f0', fontSize: '13px' }}>{v.join(', ')}</span>
                            </div>
                          );
                        }
                        return (
                          <div key={k} style={{ marginBottom: '6px' }}>
                            <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600 }}>{itemLabel}: </span>
                            <span style={{ color: '#e2e8f0', fontSize: '13px' }}>{JSON.stringify(v)}</span>
                          </div>
                        );
                      }
                      const isTitle = k === 'name' || k === 'chemical' || k === 'location' || k === 'campaign' || k === 'action' || k === 'part' || k === 'theme' || k === 'promotion' || k === 'recommendation' || k === 'opportunity' || k === 'service' || k === 'from_service' || k === 'employee';
                      if (isTitle) {
                        return (
                          <div key={k} className="ai-card-title">
                            {getStatusIcon(k, v)} {String(v)}
                          </div>
                        );
                      }
                      return (
                        <div key={k} className="ai-card-detail">
                          <span style={{ color: '#64748b' }}>{itemLabel}:</span>{' '}
                          {k.includes('score') || k.includes('risk') || k === 'confidence' || k === 'nps' ? (
                            <span className="ai-metric">
                              <span className="ai-metric-value">{formatNumber(k, v)}</span>
                            </span>
                          ) : k.includes('cost') || k.includes('price') || k.includes('revenue') || k.includes('savings') ? (
                            <span style={{ color: '#4ade80', fontWeight: 600 }}>
                              {typeof v === 'number' ? `$${v.toLocaleString()}` : v}
                            </span>
                          ) : k === 'urgency' || k === 'priority' || k === 'severity' || k === 'rating' ? (
                            <span className={`status-badge status-${v === 'immediate' ? 'critical' : v}`}>
                              {v}
                            </span>
                          ) : (
                            <span style={{ color: '#cbd5e1' }}>{String(v)}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              }
              return <div key={i}>{String(item)}</div>;
            })}
          </div>
        </div>
      );
    }

    // Nested object
    if (typeof value === 'object' && value !== null) {
      return (
        <div key={key} className="ai-section">
          <div className="ai-section-title">{icon} {label}</div>
          <div className="ai-card">
            {renderParsedData(value, depth + 1)}
          </div>
        </div>
      );
    }

    return null;
  });
}

function getIconForKey(key) {
  const icons = {
    forecast: '🌤️', summary: '📊', overview: '📋', recommendation: '💡', predictions: '🔮',
    savings: '💰', cost: '💵', revenue: '💰', risk: '⚠️', alert: '🔔', warning: '⚠️',
    staff: '👥', employee: '👤', chemical: '🧪', equipment: '⚙️', maintenance: '🔧',
    energy: '⚡', water: '💧', sentiment: '💬', churn: '🔄', member: '🎫',
    action: '✅', campaign: '📣', promotion: '🎯', pricing: '🏷️', schedule: '📅',
    efficiency: '📈', sustainability: '🌿', quality: '⭐', environmental: '🌍',
    renewable: '☀️', score: '📊', trend: '📈', impact: '💥', driver: '🎯',
    praise: '👏', complaint: '📝', nps: '📊', conservation: '💧', ranking: '🏆',
    opportunity: '🎯', upsell: '⬆️', location: '📍', daily: '📅',
  };
  for (const [k, v] of Object.entries(icons)) {
    if (key.toLowerCase().includes(k)) return v;
  }
  return '📌';
}

function getStatusIcon(key, value) {
  if (typeof value !== 'string') return '';
  const v = value.toLowerCase();
  if (v.includes('critical') || v.includes('urgent')) return '🔴';
  if (v.includes('high') || v.includes('warning')) return '🟡';
  if (v.includes('medium') || v.includes('moderate')) return '🟠';
  if (v.includes('low')) return '🟢';
  return '';
}

function formatNumber(key, value) {
  if (typeof value !== 'number') return value;
  if (key.includes('cost') || key.includes('price') || key.includes('revenue') || key.includes('savings') || key.includes('budget')) {
    return `$${value.toLocaleString()}`;
  }
  if (key.includes('percent') || key.includes('score') || key.includes('rate') || key.includes('confidence') || key.includes('margin')) {
    return `${value}%`;
  }
  return value.toLocaleString();
}

function formatTextValue(text) {
  if (text.length > 200) {
    return <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{text}</div>;
  }
  return text;
}

export default AIAnalysisPanel;
