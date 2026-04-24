import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FEATURES } from '../config/features';
import { fetchAll, createItem, updateItem, deleteItem, runAI } from '../services/api';
import AIAnalysisPanel from '../components/AIAnalysisPanel';

function FeaturePage({ user, onLogout }) {
  const { featureKey } = useParams();
  const navigate = useNavigate();
  const feature = FEATURES.find(f => f.key === featureKey);

  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchAll(feature.endpoint, search);
      setData(result);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, [feature.endpoint, search]);

  useEffect(() => {
    if (feature) loadData();
  }, [feature, loadData]);

  if (!feature) {
    return <div className="feature-page"><h2>Feature not found</h2></div>;
  }

  const formatValue = (value, format) => {
    if (value === null || value === undefined) return '-';
    if (format === 'currency') return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    if (format === 'date') return new Date(value).toLocaleDateString();
    if (format === 'status') return value;
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  };

  const handleRowClick = (item) => {
    setSelectedItem(item);
    setShowDetail(true);
  };

  const handleNew = () => {
    const initial = {};
    feature.fields.forEach(f => {
      if (f.type === 'checkbox') initial[f.key] = false;
      else initial[f.key] = '';
    });
    setFormData(initial);
    setEditMode(false);
    setShowForm(true);
  };

  const handleEdit = () => {
    const initial = {};
    feature.fields.forEach(f => {
      let val = selectedItem[f.key];
      if (f.type === 'date' && val) {
        val = new Date(val).toISOString().split('T')[0];
      }
      initial[f.key] = val !== null && val !== undefined ? val : '';
    });
    setFormData(initial);
    setEditMode(true);
    setShowDetail(false);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteItem(feature.endpoint, id);
      setShowDetail(false);
      setSelectedItem(null);
      setDeleteConfirm(null);
      loadData();
    } catch (err) {
      alert('Error deleting: ' + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const cleanData = { ...formData };
      feature.fields.forEach(f => {
        if (f.type === 'number' && cleanData[f.key] !== '') {
          cleanData[f.key] = Number(cleanData[f.key]);
        }
        if (f.type === 'checkbox') {
          cleanData[f.key] = Boolean(cleanData[f.key]);
        }
        if (cleanData[f.key] === '') delete cleanData[f.key];
      });

      if (editMode) {
        await updateItem(feature.endpoint, selectedItem.id, cleanData);
      } else {
        await createItem(feature.endpoint, cleanData);
      }
      setShowForm(false);
      setFormData({});
      loadData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleAI = async () => {
    setAiLoading(true);
    setAiResult(null);
    try {
      const params = {};
      if (feature.aiParam && data.length > 0) {
        params[feature.aiParam] = data[0][feature.aiParam] || data[0].id || 1;
      }
      const result = await runAI(feature.aiEndpoint, params);
      setAiResult(result);
    } catch (err) {
      setAiResult({ error: err.message });
    } finally {
      setAiLoading(false);
    }
  };

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
          </div>
          <button onClick={onLogout} className="btn-logout">Sign Out</button>
        </div>
      </header>

      <div className="feature-page">
        <div className="page-header">
          <div className="page-header-left">
            <button className="btn-back" onClick={() => navigate('/')}>← Back</button>
            <span style={{ fontSize: '28px' }}>{feature.icon}</span>
            <h2 className="page-title">{feature.title}</h2>
          </div>
          <div className="page-actions">
            {feature.isAI && (
              <button className="btn-ai" onClick={handleAI} disabled={aiLoading}>
                {aiLoading ? '⏳ Analyzing...' : `✨ ${feature.aiLabel}`}
              </button>
            )}
            <button className="btn-new" onClick={handleNew}>+ New Item</button>
          </div>
        </div>

        {/* AI Analysis Panel */}
        {(aiLoading || aiResult) && (
          <AIAnalysisPanel
            result={aiResult}
            loading={aiLoading}
            type={feature.aiEndpoint}
            onClose={() => { setAiResult(null); setAiLoading(false); }}
          />
        )}

        {/* Search */}
        <div className="search-bar">
          <input
            type="text"
            placeholder={`Search ${feature.title.toLowerCase()}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Data Table */}
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                {feature.columns.map(col => (
                  <th key={col.key}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={feature.columns.length} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={feature.columns.length} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No data found</td></tr>
              ) : (
                data.map(item => (
                  <tr key={item.id} onClick={() => handleRowClick(item)}>
                    {feature.columns.map(col => (
                      <td key={col.key}>
                        {col.format === 'status' ? (
                          <span className={`status-badge status-${item[col.key]}`}>
                            {item[col.key]}
                          </span>
                        ) : (
                          formatValue(item[col.key], col.format)
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Detail Modal */}
        {showDetail && selectedItem && (
          <div className="modal-overlay" onClick={() => setShowDetail(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{feature.icon} {feature.title} Details</h2>
                <button className="modal-close" onClick={() => setShowDetail(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="detail-grid">
                  {(feature.detailFields || []).map(key => {
                    const field = feature.fields.find(f => f.key === key);
                    const label = field ? field.label : key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                    const value = selectedItem[key];
                    const isLong = typeof value === 'string' && value.length > 80;
                    return (
                      <div key={key} className={`detail-item ${isLong ? 'full-width' : ''}`}>
                        <div className="detail-label">{label}</div>
                        <div className="detail-value">
                          {typeof value === 'boolean' ? (value ? 'Yes' : 'No') :
                           value === null || value === undefined ? '-' :
                           key.includes('date') ? new Date(value).toLocaleDateString() :
                           key.includes('cost') || key.includes('price') || key.includes('revenue') || key.includes('rate') || key.includes('value') ?
                             `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` :
                           key === 'status' || key === 'risk_level' || key === 'predicted_demand' || key === 'sentiment' ?
                             <span className={`status-badge status-${value}`}>{value}</span> :
                           String(value)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn-edit" onClick={handleEdit}>Edit</button>
                {deleteConfirm === selectedItem.id ? (
                  <>
                    <button className="btn-delete" onClick={() => handleDelete(selectedItem.id)}>Confirm Delete</button>
                    <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                  </>
                ) : (
                  <button className="btn-delete" onClick={() => setDeleteConfirm(selectedItem.id)}>Delete</button>
                )}
                <button className="btn-cancel" onClick={() => setShowDetail(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="modal-overlay" onClick={() => setShowForm(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editMode ? 'Edit' : 'New'} {feature.title}</h2>
                <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
              </div>
              <div className="modal-body">
                <form className="edit-form" onSubmit={handleSubmit}>
                  <div className="edit-form">
                    {feature.fields.map(field => (
                      <div key={field.key} className="form-group">
                        <label>{field.label} {field.required && '*'}</label>
                        {field.type === 'textarea' ? (
                          <textarea
                            rows={3}
                            value={formData[field.key] || ''}
                            onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                            required={field.required}
                          />
                        ) : field.type === 'select' ? (
                          <select
                            value={formData[field.key] || ''}
                            onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                            required={field.required}
                          >
                            <option value="">Select...</option>
                            {field.options.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : field.type === 'checkbox' ? (
                          <div style={{ padding: '8px 0' }}>
                            <input
                              type="checkbox"
                              checked={formData[field.key] || false}
                              onChange={e => setFormData({ ...formData, [field.key]: e.target.checked })}
                              style={{ width: 'auto', marginRight: '8px' }}
                            />
                            <span style={{ color: '#94a3b8' }}>{formData[field.key] ? 'Yes' : 'No'}</span>
                          </div>
                        ) : (
                          <input
                            type={field.type}
                            value={formData[field.key] || ''}
                            onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                            required={field.required}
                            step={field.type === 'number' ? 'any' : undefined}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                    <button type="submit" className="btn-edit">{editMode ? 'Save Changes' : 'Create'}</button>
                    <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default FeaturePage;
