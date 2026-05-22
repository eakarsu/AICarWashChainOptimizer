import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FEATURES } from '../config/features';
import { AI_TOOLS } from '../config/aiTools';

function Dashboard({ user, onLogout }) {
  const navigate = useNavigate();

  return (
    <>
      <header className="header">
        <div className="header-left">
          <span style={{ fontSize: '24px' }}>🚗💦</span>
          <h1>SparkleWash AI Optimizer</h1>
        </div>
        <div className="header-right">
          <div className="user-badge">
            <span>👤</span>
            <span>{user.name}</span>
            <span style={{ color: '#64748b', fontSize: '12px' }}>({user.role})</span>
          </div>
          <button onClick={onLogout} className="btn-logout">Sign Out</button>
        </div>
      </header>

      <div className="dashboard">
        <h2 className="dashboard-title">Command Center</h2>
        <p className="dashboard-subtitle">Manage your car wash chain with AI-powered insights across {FEATURES.length} integrated modules</p>

        <div className="cards-grid">
          {FEATURES.map((feature) => (
            <div
              key={feature.key}
              className="feature-card"
              style={{ '--card-color': feature.color }}
              onClick={() => navigate(`/feature/${feature.key}`)}
            >
              <div className="card-header">
                <div className="card-icon" style={{ background: `${feature.color}20` }}>
                  {feature.icon}
                </div>
                <div className="card-title">{feature.title}</div>
              </div>
              <div className="card-description">{feature.description}</div>
              <span className={`card-badge ${feature.isAI ? 'badge-ai' : 'badge-management'}`}>
                {feature.isAI ? '✨ AI Powered' : '📋 Management'}
              </span>
            </div>
          ))}
        </div>

        <h2 className="dashboard-title" style={{ marginTop: 32 }}>Advanced AI Tools</h2>
        <p className="dashboard-subtitle">Deep analytical AI tools for chain-level optimization.</p>

        <div className="cards-grid">
          {AI_TOOLS.map((tool) => (
            <div
              key={tool.key}
              className="feature-card"
              style={{ '--card-color': tool.color }}
              onClick={() => navigate(`/ai-tools/${tool.key}`)}
            >
              <div className="card-header">
                <div className="card-icon" style={{ background: `${tool.color}20` }}>{tool.icon}</div>
                <div className="card-title">{tool.title}</div>
              </div>
              <div className="card-description">{tool.description}</div>
              <span className="card-badge badge-ai">✨ Advanced AI</span>
            </div>
          ))}
          <div
            className="feature-card"
            style={{ '--card-color': '#64748b' }}
            onClick={() => navigate('/ai-history')}
          >
            <div className="card-header">
              <div className="card-icon" style={{ background: '#64748b20' }}>🗂️</div>
              <div className="card-title">AI Run History</div>
            </div>
            <div className="card-description">View all your AI requests and results, paginated and filterable.</div>
            <span className="card-badge badge-management">📋 History</span>
          </div>
          <div
            className="feature-card"
            style={{ '--card-color': '#0ea5e9' }}
            onClick={() => navigate('/webhooks')}
          >
            <div className="card-header">
              <div className="card-icon" style={{ background: '#0ea5e920' }}>🔔</div>
              <div className="card-title">Webhooks</div>
            </div>
            <div className="card-description">Subscribe external systems to chain events (washes, memberships, alerts).</div>
            <span className="card-badge badge-management">📡 Integrations</span>
          </div>
          <div
            data-testid="wash-views-card"
            className="feature-card"
            style={{ '--card-color': '#a855f7' }}
            onClick={() => navigate('/custom-views')}
          >
            <div className="card-header">
              <div className="card-icon" style={{ background: '#a855f720' }}>🧰</div>
              <div className="card-title">Wash Views</div>
            </div>
            <div className="card-description">Custom ops views: bay utilization timeline, location performance heatmap, shift report PDF, promo/pricing rules.</div>
            <span className="card-badge badge-management">📋 Custom Views</span>
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;
