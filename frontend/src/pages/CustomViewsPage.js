import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LocationsMap from '../components/LocationsMap';
import ThroughputPerBayChart from '../components/ThroughputPerBayChart';
import ShiftSchedulePDF from '../components/ShiftSchedulePDF';
import MembershipPricingEditor from '../components/MembershipPricingEditor';
import BayUtilizationTimeline from '../components/BayUtilizationTimeline';
import LocationPerformanceHeatmap from '../components/LocationPerformanceHeatmap';
import ShiftReportPDF from '../components/ShiftReportPDF';
import PromoRulesEditor from '../components/PromoRulesEditor';

const VIEWS = [
  { key: 'bay-utilization', label: 'Bay Utilization Timeline', icon: '⏱️', type: 'viz' },
  { key: 'location-heatmap', label: 'Location Performance Heatmap', icon: '🔥', type: 'viz' },
  { key: 'shift-report', label: 'Shift Report PDF', icon: '📑', type: 'tool' },
  { key: 'promo-rules', label: 'Pricing / Promo Rules', icon: '🏷️', type: 'tool' },
  { key: 'locations-map', label: 'Locations Map', icon: '🗺️', type: 'viz' },
  { key: 'throughput-chart', label: 'Throughput per Bay', icon: '📊', type: 'viz' },
  { key: 'shift-pdf', label: 'Shift Schedule PDF', icon: '📄', type: 'tool' },
  { key: 'membership-pricing', label: 'Membership Pricing', icon: '💳', type: 'tool' },
];

export default function CustomViewsPage({ user, onLogout }) {
  const navigate = useNavigate();
  const [active, setActive] = useState('bay-utilization');

  function renderView() {
    switch (active) {
      case 'bay-utilization': return <BayUtilizationTimeline />;
      case 'location-heatmap': return <LocationPerformanceHeatmap />;
      case 'shift-report': return <ShiftReportPDF />;
      case 'promo-rules': return <PromoRulesEditor />;
      case 'locations-map': return <LocationsMap />;
      case 'throughput-chart': return <ThroughputPerBayChart />;
      case 'shift-pdf': return <ShiftSchedulePDF />;
      case 'membership-pricing': return <MembershipPricingEditor />;
      default: return null;
    }
  }

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
            <span>{user?.name}</span>
            <span style={{ color: '#64748b', fontSize: '12px' }}>({user?.role})</span>
          </div>
          <button onClick={onLogout} className="btn-logout">Sign Out</button>
        </div>
      </header>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
        {/* Sidebar */}
        <aside data-testid="wash-views-sidebar" style={{ width: 280, background: '#1e293b', borderRight: '1px solid #334155', padding: 20 }}>
          <button onClick={() => navigate('/')}
            style={{ background: 'transparent', border: '1px solid #475569', color: '#cbd5e1', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', marginBottom: 16, fontSize: 12 }}>
            ← Dashboard
          </button>
          <h2 data-testid="wash-views-title" style={{ color: '#f1f5f9', fontSize: 18, marginBottom: 6 }}>Wash Views</h2>
          <p style={{ color: '#64748b', fontSize: 12, marginBottom: 16 }}>Custom car-wash chain ops views</p>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {VIEWS.map(v => (
              <button
                key={v.key}
                data-testid={`nav-${v.key}`}
                onClick={() => setActive(v.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: active === v.key ? '#1e3a5f' : 'transparent',
                  border: active === v.key ? '1px solid #3b82f6' : '1px solid transparent',
                  color: active === v.key ? '#f1f5f9' : '#94a3b8',
                  padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                  textAlign: 'left', fontSize: 14,
                }}
              >
                <span style={{ fontSize: 18 }}>{v.icon}</span>
                <span>{v.label}</span>
                <span style={{ marginLeft: 'auto', fontSize: 10, color: '#64748b', textTransform: 'uppercase' }}>{v.type}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, padding: 24, background: '#0f172a' }}>
          <h2 style={{ color: '#f1f5f9', marginBottom: 4 }}>{VIEWS.find(v => v.key === active)?.label}</h2>
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>Car-wash chain operational view</p>
          {renderView()}
        </main>
      </div>
    </>
  );
}
