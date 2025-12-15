import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Save, Check, Plus, Trash2, Edit2, X, Building2, AlertTriangle } from 'lucide-react'
import '../App.css'

const Settings = ({ token }) => {
  // Tab State
  const [activeTab, setActiveTab] = useState('roles') // 'roles' or 'company'
  
  // ROLES STATE
  const [permissions, setPermissions] = useState([])
  const [roles, setRoles] = useState([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingRoleId, setEditingRoleId] = useState(null)
  const [roleForm, setRoleForm] = useState({ name: '', permissionIds: [] })

  // COMPANY STATE
  const [companyForm, setCompanyForm] = useState({})
  const [loading, setLoading] = useState(false)
  const [deactivateData, setDeactivateData] = useState({ password: '', confirmPassword: '' })
  
  useEffect(() => {
    fetchPermissions()
    fetchRoles()
    fetchCompanyProfile()
  }, [token])

  // --- API CALLS ---
  const fetchPermissions = async () => {
    try { const res = await axios.get('http://localhost:3000/api/permissions', { headers: { Authorization: `Bearer ${token}` } }); setPermissions(res.data); } catch(e){}
  }
  const fetchRoles = async () => {
    try { const res = await axios.get('http://localhost:3000/api/roles', { headers: { Authorization: `Bearer ${token}` } }); setRoles(res.data); } catch(e){}
  }
  const fetchCompanyProfile = async () => {
    try { const res = await axios.get('http://localhost:3000/api/tenant/profile', { headers: { Authorization: `Bearer ${token}` } }); setCompanyForm(res.data); } catch(e){}
  }

  // --- ROLE HANDLERS ---
  const handleSaveRole = async () => { /* ... same as before ... */ 
      if (!roleForm.name) return alert("Please enter a Role Name");
      if (roleForm.permissionIds.length === 0) return alert("Please select at least one permission");
      try {
          if (editingRoleId) {
              await axios.put(`http://localhost:3000/api/roles/${editingRoleId}`, roleForm, { headers: { Authorization: `Bearer ${token}` } })
          } else {
              await axios.post('http://localhost:3000/api/roles', roleForm, { headers: { Authorization: `Bearer ${token}` } })
          }
          setIsFormOpen(false); setEditingRoleId(null); setRoleForm({ name: '', permissionIds: [] }); fetchRoles();
      } catch (err) { alert("Failed to save role") }
  }
  
  const handleEditClick = (role) => {
      const rolePermIds = role.permissions.map(slug => {
          const found = permissions.find(p => p.slug === slug)
          return found ? found.id : null
      }).filter(Boolean)
      setRoleForm({ name: role.name, permissionIds: rolePermIds })
      setEditingRoleId(role.id)
      setIsFormOpen(true)
  }

  const handleDeleteClick = async (id) => {
      if(!window.confirm("Are you sure?")) return;
      try { await axios.delete(`http://localhost:3000/api/roles/${id}`, { headers: { Authorization: `Bearer ${token}` } }); fetchRoles(); } catch(e){}
  }

  const togglePermission = (permId) => {
      setRoleForm(prev => {
          const exists = prev.permissionIds.includes(permId);
          return { ...prev, permissionIds: exists ? prev.permissionIds.filter(id => id !== permId) : [...prev.permissionIds, permId] }
      })
  }

  // --- COMPANY HANDLERS ---
  const handleCompanyUpdate = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
          await axios.put('http://localhost:3000/api/tenant/profile', companyForm, { headers: { Authorization: `Bearer ${token}` } });
          alert("Company Profile Updated!");
      } catch (err) {
          alert("Update Failed: " + (err.response?.data?.message || "Server Error"));
      } finally { setLoading(false); }
  }

  const handleDeactivate = async () => {
      if (!window.confirm("WARNING: This will lock ALL users out of the system immediately. Are you sure?")) return;
      try {
          await axios.post('http://localhost:3000/api/tenant/deactivate', deactivateData, { headers: { Authorization: `Bearer ${token}` } });
          alert("Account Deactivated. Logging out...");
          window.location.href = "/";
      } catch (err) {
          alert("Deactivation Failed: " + (err.response?.data?.message || "Error"));
      }
  }

  // --- HELPERS ---
  const getPermissionId = (module, action) => {
      const targetSlug = `${module}:${action}`.toLowerCase(); 
      const found = permissions.find(p => p.slug.includes(targetSlug) || p.slug === targetSlug);
      return found ? found.id : null;
  }
  const modules = ['Lead', 'Order', 'Customer', 'User', 'Settings'];
  const actions = [{label:'Create',key:'create'},{label:'Read',key:'read'},{label:'Update',key:'update'},{label:'Delete',key:'delete'}];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* SUB-HEADER TABS */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0' }}>
            <div 
                onClick={() => setActiveTab('roles')}
                style={{ padding: '10px 20px', cursor: 'pointer', borderBottom: activeTab==='roles'?'2px solid #2563eb':'none', fontWeight: activeTab==='roles'?'bold':'normal', color: activeTab==='roles'?'#2563eb':'#64748b' }}
            >
                Role Control
            </div>
            <div 
                onClick={() => setActiveTab('company')}
                style={{ padding: '10px 20px', cursor: 'pointer', borderBottom: activeTab==='company'?'2px solid #2563eb':'none', fontWeight: activeTab==='company'?'bold':'normal', color: activeTab==='company'?'#2563eb':'#64748b' }}
            >
                Company Profile
            </div>
        </div>

        {/* ================= ROLE CONTROL TAB ================= */}
        {activeTab === 'roles' && (
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0, color: '#1e293b' }}>System Roles</h2>
                    {!isFormOpen && (
                        <button onClick={() => { setIsFormOpen(true); setEditingRoleId(null); setRoleForm({ name: '', permissionIds: [] }) }} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Plus size={18} /> Add Role
                        </button>
                    )}
                </div>
                
                {isFormOpen && (
                    <div className="card" style={{ marginBottom: '30px', borderLeft: '4px solid #2563eb' }}>
                        {/* ... (Keep existing Role Form Code) ... */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, color: '#1e293b' }}>{editingRoleId ? 'Edit Role' : 'Create New Role'}</h3>
                            <button onClick={() => setIsFormOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={24} /></button>
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#475569' }}>Role Name</label>
                            <input type="text" placeholder="e.g. Sales Manager" className="form-input" value={roleForm.name} onChange={e => setRoleForm({...roleForm, name: e.target.value})} style={{ maxWidth: '400px', color: '#0f172a' }} />
                        </div>
                        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '20px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                        <th style={{ padding: '12px', textAlign: 'left', color: '#475569', fontSize: '0.9rem' }}>Module</th>
                                        {actions.map(action => (<th key={action.key} style={{ padding: '12px', textAlign: 'center', color: '#475569', fontSize: '0.9rem' }}>{action.label}</th>))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {modules.map((mod, idx) => (
                                        <tr key={mod} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? 'white' : '#fcfcfc' }}>
                                            <td style={{ padding: '12px', fontWeight: '500', color: '#334155' }}>{mod}s</td>
                                            {actions.map(action => {
                                                const permId = getPermissionId(mod, action.key);
                                                const isChecked = roleForm.permissionIds.includes(permId);
                                                return (
                                                    <td key={action.key} style={{ padding: '12px', textAlign: 'center' }}>
                                                        {permId ? (
                                                            <div onClick={() => togglePermission(permId)} style={{ width: '20px', height: '20px', margin: '0 auto', borderRadius: '4px', cursor: 'pointer', border: isChecked ? 'none' : '2px solid #cbd5e1', background: isChecked ? '#2563eb' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>{isChecked && <Check size={14} />}</div>
                                                        ) : <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>N/A</span>}
                                                    </td>
                                                )
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button onClick={() => setIsFormOpen(false)} className="btn-danger" style={{ background: 'white', color: '#ef4444', border: '1px solid #ef4444' }}>Cancel</button>
                            <button onClick={handleSaveRole} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Save size={18} /> {editingRoleId ? 'Update Role' : 'Save Role'}</button>
                        </div>
                    </div>
                )}

                <div className="card">
                    <h3 style={{ margin: '0 0 20px 0', color: '#1e293b' }}>Existing Roles</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                    <th style={{ textAlign: 'left', padding: '12px', color: '#64748b' }}>Role Name</th>
                                    <th style={{ textAlign: 'left', padding: '12px', color: '#64748b' }}>Permissions Access</th>
                                    <th style={{ textAlign: 'right', padding: '12px', color: '#64748b' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {roles.map(r => (
                                    <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '12px', fontWeight: 'bold', color: '#334155' }}>{r.name}</td>
                                        <td style={{ padding: '12px' }}>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                                {r.permissions && r.permissions.length > 0 ? (
                                                    r.permissions.slice(0, 4).map(p => (<span key={p} style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', color: '#475569' }}>{p.replace(':', ' ')}</span>))
                                                ) : <span style={{ color: '#ccc', fontSize: '0.8rem' }}>No Permissions</span>}
                                                {r.permissions && r.permissions.length > 4 && <span style={{ fontSize: '0.75rem', color: '#64748b' }}>+{r.permissions.length - 4} more</span>}
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                <button onClick={() => handleEditClick(r)} style={{ padding: '6px', background: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: '4px' }}><Edit2 size={16} /></button>
                                                <button onClick={() => handleDeleteClick(r.id)} style={{ padding: '6px', background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: '4px' }}><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

        {/* ================= COMPANY PROFILE TAB ================= */}
        {activeTab === 'company' && (
            <div>
                <div className="card" style={{ marginBottom: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px' }}>
                        <div style={{ width: '50px', height: '50px', background: '#eff6ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                            <Building2 size={24} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, color: '#1e293b' }}>Company Settings</h2>
                            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Manage branding, contact info, and billing details.</p>
                        </div>
                    </div>

                    <form onSubmit={handleCompanyUpdate}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                            <div className="form-group">
                                <label style={{color: '#475569'}}>Company Name</label>
                                <input type="text" className="form-input" disabled value={companyForm.company_name || ''} style={{ background: '#f8fafc' }} />
                            </div>
                            <div className="form-group">
                                <label style={{color: '#475569'}}>Brand Name (Display Name)</label>
                                <input type="text" className="form-input" value={companyForm.brand_name || ''} onChange={e => setCompanyForm({...companyForm, brand_name: e.target.value})} />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                            <div className="form-group">
                                <label style={{color: '#475569'}}>Industry</label>
                                <input type="text" className="form-input" value={companyForm.industry || ''} onChange={e => setCompanyForm({...companyForm, industry: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label style={{color: '#475569'}}>Employees</label>
                                <input type="number" className="form-input" value={companyForm.employee_count || ''} onChange={e => setCompanyForm({...companyForm, employee_count: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label style={{color: '#475569'}}>GSTIN / Tax ID</label>
                                <input type="text" className="form-input" value={companyForm.gstin || ''} onChange={e => setCompanyForm({...companyForm, gstin: e.target.value})} />
                            </div>
                        </div>

                        <h4 style={{ color: '#94a3b8', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginTop: '30px' }}>Contact Information</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                            <div className="form-group">
                                <label style={{color: '#475569'}}>Company Email</label>
                                <input type="email" className="form-input" value={companyForm.comp_email || ''} onChange={e => setCompanyForm({...companyForm, comp_email: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label style={{color: '#475569'}}>Company Phone</label>
                                <input type="text" className="form-input" value={companyForm.comp_phone || ''} onChange={e => setCompanyForm({...companyForm, comp_phone: e.target.value})} />
                            </div>
                        </div>
                        <div className="form-group" style={{ marginBottom: '20px' }}>
                            <label style={{color: '#475569'}}>Address</label>
                            <input type="text" className="form-input" value={companyForm.address || ''} onChange={e => setCompanyForm({...companyForm, address: e.target.value})} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                            <div className="form-group"><input type="text" placeholder="City" className="form-input" value={companyForm.city || ''} onChange={e => setCompanyForm({...companyForm, city: e.target.value})} /></div>
                            <div className="form-group"><input type="text" placeholder="State" className="form-input" value={companyForm.state || ''} onChange={e => setCompanyForm({...companyForm, state: e.target.value})} /></div>
                            <div className="form-group"><input type="text" placeholder="Country" className="form-input" value={companyForm.country || ''} onChange={e => setCompanyForm({...companyForm, country: e.target.value})} /></div>
                        </div>

                        <div style={{ textAlign: 'right', marginTop: '20px' }}>
                            <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '12px 30px' }}>
                                {loading ? 'Saving...' : 'Save Profile'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* DANGER ZONE */}
                <div className="card" style={{ border: '1px solid #fee2e2' }}>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                        <div style={{ padding: '10px', background: '#fee2e2', borderRadius: '8px', color: '#dc2626' }}>
                            <AlertTriangle size={24} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ margin: '0 0 5px 0', color: '#dc2626' }}>Deactivate Company Account</h3>
                            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                                This will immediately lock all users out of the system. 
                                This action prevents access but does not delete data. 
                                Reactivation requires contacting support.
                            </p>
                            
                            <div style={{ marginTop: '20px', background: '#fef2f2', padding: '15px', borderRadius: '6px' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#991b1b', marginBottom: '10px' }}>
                                    Verify Owner Password to Confirm:
                                </label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input 
                                        type="password" 
                                        placeholder="Owner Password" 
                                        className="form-input" 
                                        style={{ border: '1px solid #fecaca' }}
                                        value={deactivateData.password}
                                        onChange={e => setDeactivateData({...deactivateData, password: e.target.value})}
                                    />
                                    <input 
                                        type="password" 
                                        placeholder="Confirm Password" 
                                        className="form-input" 
                                        style={{ border: '1px solid #fecaca' }}
                                        value={deactivateData.confirmPassword}
                                        onChange={e => setDeactivateData({...deactivateData, confirmPassword: e.target.value})}
                                    />
                                    <button onClick={handleDeactivate} className="btn-danger">
                                        Deactivate
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  )
}

export default Settings