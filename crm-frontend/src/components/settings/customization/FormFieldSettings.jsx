import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, X, Eye, EyeOff } from 'lucide-react';
import '../../../App.css'

const FormFieldSettings = () => {
  const [moduleName, setModuleName] = useState('leads');
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentField, setCurrentField] = useState(null);
  
  const [formData, setFormData] = useState({
    field_label: '',
    field_type: 'text',
    options: '',
    is_required: false,
    is_hidden: false
  });

  // Using the corrected route from server.js
  const API_BASE = 'http://localhost:3000/api/form-fields';

  useEffect(() => {
    fetchFields();
  }, [moduleName]);

  const fetchFields = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/fields/${moduleName}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFields(res.data);
    } catch (err) {
      console.error("Error fetching fields:", err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setCurrentField(null);
    setFormData({
      field_label: '',
      field_type: 'text',
      options: '',
      is_required: false,
      is_hidden: false
    });
    setIsModalOpen(true);
  };

  const openEditModal = (field) => {
    setCurrentField(field);
    setFormData({
      field_label: field.field_label,
      field_type: field.field_type,
      options: field.options ? field.options.join(', ') : '',
      is_required: field.is_required,
      is_hidden: field.is_hidden
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure? This will delete the field and all associated data.")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/fields/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchFields();
    } catch (err) {
      console.error("Error deleting field:", err);
      alert("Failed to delete field");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    // Convert comma-separated string to array
    const optionsArray = formData.options.split(',').map(s => s.trim()).filter(s => s !== '');

    const payload = {
      module_name: moduleName,
      field_label: formData.field_label,
      field_type: formData.field_type,
      options: optionsArray,
      is_required: formData.is_required,
      is_hidden: formData.is_hidden
    };

    try {
      if (currentField) {
        // Update
        await axios.put(`${API_BASE}/fields/${currentField.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // Create
        await axios.post(`${API_BASE}/fields`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setIsModalOpen(false);
      fetchFields();
    } catch (err) {
      console.error("Error saving field:", err);
      alert(err.response?.data?.error || "Failed to save field");
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
            <h2 style={{ margin: 0, color: '#1e293b' }}>Form Field Customization</h2>
            <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>Manage custom fields for your modules.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select 
            value={moduleName} 
            onChange={(e) => setModuleName(e.target.value)}
            className="form-input"
            style={{ width: 'auto' }}
          >
            <option value="leads">Leads Module</option>
            <option value="tasks">Tasks Module</option>
          </select>
          <button 
            onClick={openAddModal}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Plus size={18} /> Add Custom Field
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '15px 20px', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Label</th>
                <th style={{ padding: '15px 20px', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Type</th>
                <th style={{ padding: '15px 20px', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Origin</th>
                <th style={{ padding: '15px 20px', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Visibility</th>
                <th style={{ padding: '15px 20px', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Options</th>
                <th style={{ padding: '15px 20px', textAlign: 'right', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {loading ? (
                <tr><td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>Loading fields...</td></tr>
                ) : fields.length === 0 ? (
                <tr><td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>No fields found.</td></tr>
                ) : (
                fields.map(field => (
                    <tr key={field.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '15px 20px', fontWeight: '500', color: '#334155' }}>{field.field_label}</td>
                    <td style={{ padding: '15px 20px', color: '#64748b', textTransform: 'capitalize' }}>{field.field_type}</td>
                    <td style={{ padding: '15px 20px' }}>
                        <span style={{ 
                            padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600',
                            background: field.is_system ? '#eff6ff' : '#f0fdf4',
                            color: field.is_system ? '#1d4ed8' : '#15803d'
                        }}>
                        {field.is_system ? 'System' : 'Custom'}
                        </span>
                    </td>
                    <td style={{ padding: '15px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: field.is_hidden ? '#94a3b8' : '#0f172a' }}>
                            {field.is_hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                            <span style={{ fontSize: '0.9rem' }}>{field.is_hidden ? 'Hidden' : 'Visible'}</span>
                        </div>
                    </td>
                    <td style={{ padding: '15px 20px', color: '#64748b', fontSize: '0.9rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {field.field_type === 'select' && field.options ? field.options.join(', ') : '-'}
                    </td>
                    <td style={{ padding: '15px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button 
                            onClick={() => openEditModal(field)}
                            style={{ padding: '6px', background: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            title="Edit"
                            >
                            <Edit2 size={16} />
                            </button>
                            {!field.is_system && (
                            <button 
                                onClick={() => handleDelete(field.id)}
                                style={{ padding: '6px', background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                title="Delete"
                            >
                                <Trash2 size={16} />
                            </button>
                            )}
                        </div>
                    </td>
                    </tr>
                ))
                )}
            </tbody>
            </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '24px', borderRadius: '8px', background: 'white', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#1e293b' }}>
                {currentField ? 'Edit Field' : 'Add New Field'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#475569' }}>Field Label</label>
                <input 
                  type="text" 
                  required
                  value={formData.field_label}
                  onChange={(e) => setFormData({...formData, field_label: e.target.value})}
                  className="form-input"
                  placeholder="e.g. Budget"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#475569' }}>Field Type</label>
                <select 
                  value={formData.field_type}
                  onChange={(e) => setFormData({...formData, field_type: e.target.value})}
                  disabled={currentField?.is_system}
                  className="form-input"
                  style={{ background: currentField?.is_system ? '#f1f5f9' : 'white' }}
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="select">Select (Dropdown)</option>
                  <option value="textarea">Text Area</option>
                </select>
                {currentField?.is_system && <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '5px' }}>System field types cannot be changed.</p>}
              </div>

              {formData.field_type === 'select' && (
                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#475569' }}>Options (comma separated)</label>
                  <input 
                    type="text" 
                    value={formData.options}
                    placeholder="Option 1, Option 2, Option 3"
                    onChange={(e) => setFormData({...formData, options: e.target.value})}
                    className="form-input"
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '20px', marginBottom: '25px', padding: '15px', background: '#f8fafc', borderRadius: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: '#334155' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.is_required}
                    onChange={(e) => setFormData({...formData, is_required: e.target.checked})}
                    style={{ width: '16px', height: '16px' }}
                  />
                  Required
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: '#334155' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.is_hidden}
                    onChange={(e) => setFormData({...formData, is_hidden: e.target.checked})}
                    style={{ width: '16px', height: '16px' }}
                  />
                  Hide field
                </label>
              </div>

              <div style={{ display: 'flex', justifySelf: 'flex-end', justifyContent: 'flex-end', gap: '10px' }}>
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn-primary"
                >
                  Save Field
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormFieldSettings;