import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Save, Check, Plus, Trash2, Edit2, X } from 'lucide-react'
import '../../../App.css'

const RoleSettings = ({ token }) => {
  const [permissions, setPermissions] = useState([])
  const [roles, setRoles] = useState([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingRoleId, setEditingRoleId] = useState(null)
  const [roleForm, setRoleForm] = useState({ name: '', permissionIds: [] })

  useEffect(() => {
    fetchPermissions()
    fetchRoles()
  }, [token])

  const fetchPermissions = async () => {
    try { const res = await axios.get('http://localhost:3000/api/permissions', { headers: { Authorization: `Bearer ${token}` } }); setPermissions(res.data); } catch(e){}
  }
  const fetchRoles = async () => {
    try { const res = await axios.get('http://localhost:3000/api/roles', { headers: { Authorization: `Bearer ${token}` } }); setRoles(res.data); } catch(e){}
  }

  const handleSaveRole = async () => {
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

  const getPermissionId = (module, action) => {
      const targetSlug = `${module}:${action}`.toLowerCase(); 
      const found = permissions.find(p => p.slug.includes(targetSlug) || p.slug === targetSlug);
      return found ? found.id : null;
  }
  const modules = ['Lead', 'Order', 'Customer', 'User', 'Settings'];
  const actions = [{label:'Create',key:'create'},{label:'Read',key:'read'},{label:'Update',key:'update'},{label:'Delete',key:'delete'}];

  return (
    <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, color: '#1e293b' }}>Role Management</h2>
            {!isFormOpen && (
                <button onClick={() => { setIsFormOpen(true); setEditingRoleId(null); setRoleForm({ name: '', permissionIds: [] }) }} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Plus size={18} /> Add Role
                </button>
            )}
        </div>
        
        {isFormOpen && (
            <div className="card" style={{ marginBottom: '30px', borderLeft: '4px solid #2563eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, color: '#1e293b' }}>{editingRoleId ? 'Edit Role' : 'Create New Role'}</h3>
                    <button onClick={() => setIsFormOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={24} /></button>
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#475569' }}>Role Name</label>
                    <input type="text" className="form-input" value={roleForm.name} onChange={e => setRoleForm({...roleForm, name: e.target.value})} style={{ maxWidth: '400px' }} />
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
                    <button onClick={() => setIsFormOpen(false)} className="btn-secondary">Cancel</button>
                    <button onClick={handleSaveRole} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Save size={18} /> Save</button>
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
                            <th style={{ textAlign: 'left', padding: '12px', color: '#64748b' }}>Permissions</th>
                            <th style={{ textAlign: 'right', padding: '12px', color: '#64748b' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {roles.map(r => (
                            <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '12px', fontWeight: 'bold', color: '#334155' }}>{r.name}</td>
                                <td style={{ padding: '12px' }}>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                        {r.permissions && r.permissions.length > 0 ? r.permissions.slice(0, 4).map(p => (<span key={p} style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', color: '#475569' }}>{p.replace(':', ' ')}</span>)) : <span style={{ color: '#ccc', fontSize: '0.8rem' }}>No Permissions</span>}
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
  )
}
export default RoleSettings