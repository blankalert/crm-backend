import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, CheckCircle, Circle, Layout, Copy } from 'lucide-react';
import '../../../App.css';

const LayoutManager = () => {
  const { token } = useOutletContext() || {};
  const authToken = token || localStorage.getItem('token');
  const navigate = useNavigate();

  const [layouts, setLayouts] = useState([]);
  const [moduleName, setModuleName] = useState('leads');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authToken) fetchLayouts();
  }, [authToken, moduleName]);

  const fetchLayouts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:3000/api/layouts/${moduleName}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setLayouts(res.data);
    } catch (err) {
      console.error("Failed to fetch layouts", err);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (id) => {
    try {
      await axios.put(`http://localhost:3000/api/layouts/${id}/activate`, {}, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      fetchLayouts(); // Refresh to show new active state
    } catch (err) {
      alert("Failed to activate layout");
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await axios.post(`http://localhost:3000/api/layouts/${id}/duplicate`, {}, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      fetchLayouts();
    } catch (err) {
      alert("Failed to duplicate layout");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this layout?")) return;
    try {
      await axios.delete(`http://localhost:3000/api/layouts/${id}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      fetchLayouts();
    } catch (err) {
      alert("Failed to delete layout");
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
            <h2 style={{ margin: 0, color: '#1e293b' }}>Form Layout Manager</h2>
            <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>Manage and activate custom form layouts.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select 
            value={moduleName} 
            onChange={(e) => setModuleName(e.target.value)}
            className="form-input"
            style={{ width: 'auto' }}
          >
            <option value="leads">Leads Module</option>
            {/* Add other modules here later */}
          </select>
          <button 
            onClick={() => navigate('/dashboard/settings/form-layouts/new')}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Plus size={18} /> Create New Layout
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '15px 20px', textAlign: 'left', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' }}>Layout Name</th>
              <th style={{ padding: '15px 20px', textAlign: 'left', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: '15px 20px', textAlign: 'left', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' }}>Created At</th>
              <th style={{ padding: '15px 20px', textAlign: 'right', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" style={{ padding: '30px', textAlign: 'center' }}>Loading...</td></tr>
            ) : layouts.length === 0 ? (
              <tr><td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>No layouts found. Create one to get started.</td></tr>
            ) : (
              layouts.map(layout => (
                <tr key={layout.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '15px 20px', fontWeight: '600', color: '#334155' }}>{layout.layout_name}</td>
                  <td style={{ padding: '15px 20px' }}>
                    {layout.is_active ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600' }}><CheckCircle size={14} /> Active</span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#64748b', fontSize: '0.8rem' }}><Circle size={14} /> Inactive</span>
                    )}
                  </td>
                  <td style={{ padding: '15px 20px', color: '#64748b', fontSize: '0.9rem' }}>{new Date(layout.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '15px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      {!layout.is_active && <button onClick={() => handleActivate(layout.id)} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 10px' }}>Activate</button>}
                      <button onClick={() => handleDuplicate(layout.id)} className="btn-icon" style={{ background: '#f0f9ff', color: '#0ea5e9' }} title="Duplicate"><Copy size={16} /></button>
                      <button onClick={() => navigate(`/dashboard/settings/form-layouts/edit/${layout.id}`)} className="btn-icon" style={{ background: '#eff6ff', color: '#2563eb' }}><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(layout.id)} className="btn-icon" style={{ background: '#fef2f2', color: '#ef4444' }}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LayoutManager;