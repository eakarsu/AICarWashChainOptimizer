import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FEATURES } from '../config/features';

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
      </div>
    </>
  );
}

export default Dashboard;
