import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { 
  Plus, DollarSign, User, Phone, X, MoreHorizontal, Trash2, Mail, MapPin, 
  LayoutList, LayoutGrid, ArrowLeft, Save, Edit, ClipboardList, MessageSquare, FileText, CheckCircle
} from 'lucide-react'
import '../App.css'
import AdvancedTable from './AdvancedTable'

const Leads = ({ token }) => {
  const [leads, setLeads] = useState([])
  const [users, setUsers] = useState([]) 
  
  // VIEW STATE: 'list', 'kanban', 'detail' (Read-Only), 'edit' (Form)
  const [viewMode, setViewMode] = useState('kanban') 
  const [selectedLeadId, setSelectedLeadId] = useState(null)
  const [activeDetailTab, setActiveDetailTab] = useState('details')
  const [isFormOpen, setIsFormOpen] = useState(false) // For Add New Modal only
  const [draggedLeadId, setDraggedLeadId] = useState(null)

  // DETAIL VIEW STATE (For Read-Only)
  const [leadDetail, setLeadDetail] = useState(null)
  
  // FORM STATE (For Add/Edit)
  const [leadForm, setLeadForm] = useState({ 
      name: '', lead_date: new Date().toISOString().split('T')[0],
      category: '', company_email: '', company_phone: '', lead_message: '', remark: '', 
      source: '', owner: '', status: 'New', pipeline: 'Standard', 
      req_amount: '', lead_type: 'Warm', priority: 'Medium', company_name: '', 
      city: '', state: '', 
      phones: [{ number: '', type: 'Mobile' }], 
      emails: [{ email: '', type: 'Work' }],
      address: { line: '', city: '', state: '', zipcode: '' }
  })

  const statuses = ['New', 'Contacted', 'Qualified', 'Negotiation', 'Won', 'Lost'];
  const pipelines = ['Standard', 'Enterprise', 'Quick Sale']; 

  useEffect(() => {
    fetchLeads()
    fetchUsers()
  }, [token])

  const fetchLeads = async () => {
    try { const res = await axios.get('http://localhost:3000/api/leads', { headers: { Authorization: `Bearer ${token}` } }); setLeads(res.data); } catch(e){}
  }
  const fetchUsers = async () => {
    try { const res = await axios.get('http://localhost:3000/api/users', { headers: { Authorization: `Bearer ${token}` } }); setUsers(res.data); } catch(e){}
  }

  // --- ACTIONS ---
  
  // 1. OPEN DETAIL VIEW (Read Only)
  const handleRowClick = async (lead) => {
      try {
          // If we clicked from the list view 'lead' object might be partial (from table data)
          // We fetch full details to be safe
          const res = await axios.get(`http://localhost:3000/api/leads/${lead.id}`, { headers: { Authorization: `Bearer ${token}` } });
          setLeadDetail(res.data);
          setSelectedLeadId(lead.id);
          setViewMode('detail');
          setActiveDetailTab('details');
      } catch(e) { console.error("Failed to fetch lead details"); }
  }

  // 2. OPEN EDIT FORM (Write)
  const handleEditClick = async (lead) => {
      try {
          const res = await axios.get(`http://localhost:3000/api/leads/${lead.id}`, { headers: { Authorization: `Bearer ${token}` } });
          const fullLead = res.data;
          
          setLeadForm({
              name: fullLead.title,
              lead_date: fullLead.lead_date ? fullLead.lead_date.split('T')[0] : '',
              category: fullLead.category || '',
              company_email: fullLead.company_email || '',
              company_phone: fullLead.company_phone || '',
              lead_message: fullLead.lead_message || '',
              remark: fullLead.remark || '',
              source: fullLead.source || '',
              owner: fullLead.owner || '',
              status: fullLead.status || 'New',
              pipeline: fullLead.pipeline || 'Standard',
              req_amount: fullLead.req_amount || '',
              lead_type: fullLead.lead_type || 'Warm',
              priority: fullLead.priority || 'Medium',
              company_name: fullLead.company_name || '',
              city: fullLead.city || '',
              state: fullLead.state || '',
              phones: fullLead.phones || [], 
              emails: fullLead.emails || [],
              address: fullLead.address || { line: '', city: '', state: '', zipcode: '' }
          });
          setSelectedLeadId(fullLead.id);
          setViewMode('edit');
      } catch(e) { console.error("Failed to load for edit"); }
  }

  // 3. OPEN ADD NEW FORM
  const handleAddNew = () => {
      setSelectedLeadId(null);
      setLeadForm({ 
          name: '', lead_date: new Date().toISOString().split('T')[0], category: '', company_email: '', company_phone: '', 
          lead_message: '', remark: '', source: '', owner: '', status: 'New', pipeline: 'Standard', 
          req_amount: '', lead_type: 'Warm', priority: 'Medium', company_name: '', city: '', state: '', 
          phones: [], emails: [], address: { line: '', city: '', state: '', zipcode: '' }
      });
      setViewMode('edit');
  }

  // 4. SAVE (Create or Update)
  const handleSave = async (e) => {
      e.preventDefault();
      try {
          if (selectedLeadId) {
              await axios.put(`http://localhost:3000/api/leads/${selectedLeadId}`, leadForm, { headers: { Authorization: `Bearer ${token}` } });
          } else {
              await axios.post('http://localhost:3000/api/leads', leadForm, { headers: { Authorization: `Bearer ${token}` } });
          }
          fetchLeads();
          setViewMode('kanban'); 
      } catch(err) { alert("Save Failed"); }
  }

  // 5. QUICK UPDATE (Pipeline/Stage in Detail View)
  const handleQuickUpdate = async (field, value) => {
      setLeadDetail(prev => ({ ...prev, [field]: value }));
      try {
          await axios.put(`http://localhost:3000/api/leads/${selectedLeadId}`, { [field]: value }, { headers: { Authorization: `Bearer ${token}` } });
          fetchLeads(); 
      } catch(err) { 
          alert("Update Failed"); 
          // Ideally revert here
      }
  }

  const handleDelete = async (lead) => {
      if(!window.confirm(`Delete ${lead.title}?`)) return;
      try { await axios.delete(`http://localhost:3000/api/leads/${lead.id}`, { headers: { Authorization: `Bearer ${token}` } }); fetchLeads(); } catch(e){}
  }

  // --- DRAG AND DROP HANDLERS ---
  const onDragStart = (e, leadId) => { setDraggedLeadId(leadId); e.dataTransfer.effectAllowed = "move"; }
  const onDragOver = (e) => { e.preventDefault(); }
  const onDrop = async (e, newStatus) => {
      e.preventDefault(); if (!draggedLeadId) return;
      const updatedLeads = leads.map(l => l.id === draggedLeadId ? { ...l, status: newStatus } : l);
      setLeads(updatedLeads);
      try { await axios.put(`http://localhost:3000/api/leads/${draggedLeadId}`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } }); fetchLeads(); } 
      catch(err) { fetchLeads(); }
      setDraggedLeadId(null);
  }

  // --- FORM HELPERS ---
  const handleChange = (field, val) => setLeadForm(p => ({...p, [field]: val}));
  const handleArrayChange = (field, idx, key, val) => { const arr = [...leadForm[field]]; arr[idx][key] = val; setLeadForm(p => ({...p, [field]: arr})); }
  const addItem = (field, item) => setLeadForm(p => ({...p, [field]: [...p[field], item]}));
  const removeItem = (field, idx) => setLeadForm(p => ({...p, [field]: p[field].filter((_,i)=>i!==idx)}));
  const handleAddress = (k, v) => setLeadForm(p => ({...p, address: {...p.address, [k]: v}}));

  // --- RENDERERS ---
  const leadColumns = [
      { key: 'title', label: 'Name' }, 
      { key: 'company_name', label: 'Company' },
      { key: 'pipeline', label: 'Pipeline' }, 
      { key: 'status', label: 'Stage' }, 
      { key: 'req_amount', label: 'Value ($)' },
      { key: 'agent_name', label: 'Owner' }, 
      { key: 'priority', label: 'Priority' }
  ];

  const getStatusColor = (s) => {
      if(s==='New') return {bg:'#dbeafe',t:'#1e40af',b:'#93c5fd'};
      if(s==='Won') return {bg:'#dcfce7',t:'#166534',b:'#86efac'};
      if(s==='Lost') return {bg:'#fee2e2',t:'#991b1b',b:'#fca5a5'};
      return {bg:'#f1f5f9',t:'#475569',b:'#cbd5e1'};
  }

  // --- VIEW: DETAIL VIEW (READ ONLY) ---
  if (viewMode === 'detail' && leadDetail) {
      return (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', background: 'white', padding: '15px 20px', borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <button onClick={() => setViewMode('kanban')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', gap: '5px', color: '#64748b' }}>
                          <ArrowLeft /> Back
                      </button>
                      <div>
                          <h2 style={{ margin: 0, color: '#1e293b', fontSize: '1.4rem' }}>{leadDetail.title} ({leadDetail.company_name})</h2>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '0.85rem', color: '#64748b' }}>
                              <span>Owner: <b>{leadDetail.agent_name || 'Unassigned'}</b></span>
                              <span>•</span>
                              <span>Category: {leadDetail.category || '-'}</span>
                              <span>•</span>
                              <span>Location: {leadDetail.city || '-'}</span>
                          </div>
                      </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                      <button className="btn-secondary" style={{display:'flex', gap:'5px'}}><Phone size={16}/> Call</button>
                      <button className="btn-secondary" style={{display:'flex', gap:'5px'}}><Mail size={16}/> Email</button>
                      <button onClick={() => handleEditClick({id: leadDetail.id})} className="btn-secondary" style={{ display: 'flex', gap: '5px', padding:'8px 20px' }}>
                          <Edit size={18} /> Edit
                      </button>
                  </div>
              </div>

              <div style={{ display: 'flex', flex: 1, gap: '20px', overflow: 'hidden', padding: '0 20px 20px' }}>
                  
                  {/* LEFT: MAIN CONTENT */}
                  <div className="card" style={{ flex: 3, overflowY: 'auto', paddingRight: '10px' }}>
                      
                      {/* PIPELINE BAR (Quick Edit) */}
                      <div style={{ marginBottom:'30px', paddingBottom:'20px', borderBottom:'1px solid #f1f5f9' }}>
                          <h4 style={{ margin: '0 0 15px 0', color: '#64748b', fontSize: '0.9rem' }}>Pipeline Progress</h4>
                          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '50px', padding: '5px', gap: '2px' }}>
                              {statuses.map((status, idx) => {
                                  const isCurrent = leadDetail.status === status;
                                  const isPast = statuses.indexOf(leadDetail.status) > idx;
                                  return (
                                      <div 
                                          key={status}
                                          onClick={() => handleQuickUpdate('status', status)}
                                          style={{ 
                                              flex: 1, textAlign: 'center', padding: '8px 0', cursor: 'pointer',
                                              background: isCurrent ? '#2563eb' : (isPast ? '#93c5fd' : 'transparent'),
                                              color: (isCurrent || isPast) ? 'white' : '#64748b',
                                              borderRadius: '25px', fontSize: '0.85rem', fontWeight: '600',
                                              transition: 'all 0.2s'
                                          }}
                                      >
                                          {status}
                                      </div>
                                  )
                              })}
                          </div>
                      </div>

                      {/* TABS (Details, Notes, Tasks) */}
                      <div style={{ display: 'flex', gap: '30px', borderBottom: '1px solid #e2e8f0', marginBottom: '20px' }}>
                          {['details', 'notes', 'tasks'].map(tab => (
                              <div key={tab} onClick={() => setActiveDetailTab(tab)} style={{ paddingBottom: '10px', cursor: 'pointer', borderBottom: activeDetailTab===tab?'2px solid #2563eb':'none', color: activeDetailTab===tab?'#2563eb':'#64748b', fontWeight: '500', display: 'flex', gap: '6px', alignItems: 'center', textTransform: 'capitalize' }}>
                                  {tab === 'details' && <FileText size={16} />}
                                  {tab === 'notes' && <MessageSquare size={16} />}
                                  {tab === 'tasks' && <ClipboardList size={16} />}
                                  {tab}
                              </div>
                          ))}
                      </div>

                      {activeDetailTab === 'details' && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                              <div>
                                  <h4 style={{color:'#94a3b8', textTransform:'uppercase', fontSize:'0.75rem', marginBottom:'15px', letterSpacing:'0.5px'}}>Lead Info</h4>
                                  <div style={{marginBottom:'15px'}}><label style={{fontSize:'0.75rem', color:'#64748b', display:'block'}}>Amount</label><span style={{fontSize:'1.1rem', fontWeight:'500'}}>${leadDetail.req_amount || '0'}</span></div>
                                  <div style={{marginBottom:'15px'}}><label style={{fontSize:'0.75rem', color:'#64748b', display:'block'}}>Lead Type</label><span style={{background:'#dbeafe', color:'#1e40af', padding:'2px 8px', borderRadius:'4px', fontSize:'0.85rem'}}>{leadDetail.lead_type}</span></div>
                                  <div style={{marginBottom:'15px'}}><label style={{fontSize:'0.75rem', color:'#64748b', display:'block'}}>Priority</label><span style={{fontSize:'0.9rem'}}>{leadDetail.priority}</span></div>
                              </div>
                              <div>
                                  <h4 style={{color:'#94a3b8', textTransform:'uppercase', fontSize:'0.75rem', marginBottom:'15px', letterSpacing:'0.5px'}}>Contact Info</h4>
                                  <div style={{marginBottom:'15px'}}><label style={{fontSize:'0.75rem', color:'#64748b', display:'block'}}>Email</label><a href={`mailto:${leadDetail.company_email}`} style={{color:'#2563eb', textDecoration:'none'}}>{leadDetail.company_email || '-'}</a></div>
                                  <div style={{marginBottom:'15px'}}><label style={{fontSize:'0.75rem', color:'#64748b', display:'block'}}>Phone</label><a href={`tel:${leadDetail.company_phone}`} style={{color:'#2563eb', textDecoration:'none'}}>{leadDetail.company_phone || '-'}</a></div>
                                  <div style={{marginBottom:'15px'}}><label style={{fontSize:'0.75rem', color:'#64748b', display:'block'}}>Address</label><span>{leadDetail.address?.line ? `${leadDetail.address.line}, ` : ''}{leadDetail.city}</span></div>
                              </div>
                              <div style={{gridColumn: '1 / -1'}}>
                                  <h4 style={{color:'#94a3b8', textTransform:'uppercase', fontSize:'0.75rem', marginBottom:'10px', letterSpacing:'0.5px'}}>Description</h4>
                                  <p style={{color:'#334155', lineHeight:'1.5', background:'#f8fafc', padding:'15px', borderRadius:'6px'}}>{leadDetail.lead_message || 'No description provided.'}</p>
                              </div>
                          </div>
                      )}
                      {activeDetailTab === 'notes' && (
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                              {/* Placeholder for Notes */}
                              <div style={{ flex: 1, overflowY: 'auto' }}>
                                  <div style={{ borderBottom: '1px solid #f1f5f9', padding: '15px 0' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                          <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>Called client, no answer</span>
                                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>2 hours ago</span>
                                      </div>
                                      <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>Left a voicemail regarding the bulk order proposal.</p>
                                  </div>
                              </div>
                              <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                                  <input className="form-input" placeholder="Add a note..." />
                                  <button className="btn-primary">Add</button>
                              </div>
                          </div>
                      )}
                      {activeDetailTab === 'tasks' && (
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                  <ClipboardList size={48} style={{ marginBottom: '10px', opacity: 0.5 }} />
                                  <h3>No Tasks Found</h3>
                                  <button className="btn-primary" style={{ marginTop: '10px' }}>+ Add Task</button>
                              </div>
                          </div>
                      )}
                  </div>

                  {/* RIGHT: SIDEBAR */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div className="card">
                          <h4 style={{ margin: '0 0 15px 0', fontSize: '0.9rem', color: '#334155' }}>Owner</h4>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '36px', height: '36px', background: '#3b82f6', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                  {leadDetail.agent_name ? leadDetail.agent_name.charAt(0) : '?'}
                              </div>
                              <div>
                                  <div style={{ fontWeight: '500', fontSize: '0.95rem' }}>{leadDetail.agent_name || 'Unassigned'}</div>
                                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Sales Agent</div>
                              </div>
                          </div>
                      </div>
                      
                      <div className="card">
                          <h4 style={{ margin: '0 0 15px 0', fontSize: '0.85rem', color: '#64748b', textTransform:'uppercase' }}>Quick Actions</h4>
                          <div style={{ display: 'grid', gap: '10px' }}>
                              <button className="btn-secondary" style={{justifyContent:'center'}}>Schedule Meeting</button>
                              <button className="btn-secondary" style={{justifyContent:'center'}}>Log Call</button>
                              <button className="btn-secondary" style={{justifyContent:'center'}}>Create Task</button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )
  }

  // --- VIEW 2: EDIT / ADD FORM ---
  if (viewMode === 'edit') {
      return (
          <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom:'50px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <button onClick={() => setViewMode('kanban')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', gap: '5px', color: '#64748b' }}><ArrowLeft /> Cancel</button>
                  <h2 style={{ margin: 0, color: '#1e293b' }}>{selectedLeadId ? 'Edit Lead' : 'New Lead'}</h2>
                  <button onClick={handleSave} className="btn-primary" style={{ display: 'flex', gap: '5px', padding:'10px 20px' }}><Save size={18} /> Save</button>
              </div>

              <div className="card">
                  <h4 style={{borderBottom:'1px solid #f1f5f9', paddingBottom:'10px', color:'#94a3b8', marginBottom:'20px'}}>Lead Information</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                      <div className="form-group"><label>Lead Name</label><input className="form-input" value={leadForm.name} onChange={e=>handleChange('name',e.target.value)} required /></div>
                      <div className="form-group"><label>Company</label><input className="form-input" value={leadForm.company_name} onChange={e=>handleChange('company_name',e.target.value)} /></div>
                      <div className="form-group"><label>Date</label><input type="date" className="form-input" value={leadForm.lead_date} onChange={e=>handleChange('lead_date',e.target.value)} /></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                      <div className="form-group"><label>Value ($)</label><input type="number" className="form-input" value={leadForm.req_amount} onChange={e=>handleChange('req_amount',e.target.value)} /></div>
                      <div className="form-group"><label>Status</label><select className="form-input" value={leadForm.status} onChange={e=>handleChange('status',e.target.value)}>{statuses.map(s=><option key={s}>{s}</option>)}</select></div>
                      <div className="form-group"><label>Pipeline</label><select className="form-input" value={leadForm.pipeline} onChange={e=>handleChange('pipeline',e.target.value)}>{pipelines.map(p=><option key={p}>{p}</option>)}</select></div>
                      <div className="form-group"><label>Priority</label><select className="form-input" value={leadForm.priority} onChange={e=>handleChange('priority',e.target.value)}><option>Medium</option><option>High</option><option>Low</option></select></div>
                  </div>

                  <h4 style={{borderBottom:'1px solid #f1f5f9', paddingBottom:'10px', color:'#94a3b8', marginBottom:'20px', marginTop:'30px'}}>Contact Details</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                      <div className="form-group"><label>Primary Email</label><input className="form-input" value={leadForm.company_email} onChange={e=>handleChange('company_email',e.target.value)} /></div>
                      <div className="form-group"><label>Primary Phone</label><input className="form-input" value={leadForm.company_phone} onChange={e=>handleChange('company_phone',e.target.value)} /></div>
                  </div>
                  
                  {/* Dynamic Contacts */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
                          <label>Secondary Phones</label>
                          {leadForm.phones.map((p, i) => (
                              <div key={i} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                                  <input className="form-input" placeholder="Number" value={p.number} onChange={e=>handleArrayChange('phones', i, 'number', e.target.value)} />
                                  <select className="form-input" style={{width:'100px'}} value={p.type} onChange={e=>handleArrayChange('phones', i, 'type', e.target.value)}><option>Mobile</option><option>Work</option></select>
                                  <button type="button" onClick={()=>removeItem('phones', i)} style={{color:'#ef4444', border:'none', cursor:'pointer'}}><Trash2 size={16}/></button>
                              </div>
                          ))}
                          <button type="button" onClick={()=>addItem('phones', {number:'', type:'Mobile'})} style={{fontSize:'0.8rem', color:'#2563eb', border:'none', cursor:'pointer'}}>+ Add</button>
                      </div>
                      <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
                          <label>Secondary Emails</label>
                          {leadForm.emails.map((e, i) => (
                              <div key={i} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                                  <input className="form-input" placeholder="Email" value={e.email} onChange={ev=>handleArrayChange('emails', i, 'email', ev.target.value)} />
                                  <button type="button" onClick={()=>removeItem('emails', i)} style={{color:'#ef4444', border:'none', cursor:'pointer'}}><Trash2 size={16}/></button>
                              </div>
                          ))}
                          <button type="button" onClick={()=>addItem('emails', {email:'', type:'Work'})} style={{fontSize:'0.8rem', color:'#2563eb', border:'none', cursor:'pointer'}}>+ Add</button>
                      </div>
                  </div>

                  {/* Address */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop:'20px' }}>
                      <div className="form-group"><label>City</label><input className="form-input" value={leadForm.address.city} onChange={e=>handleAddress('city',e.target.value)} /></div>
                      <div className="form-group"><label>State</label><input className="form-input" value={leadForm.address.state} onChange={e=>handleAddress('state',e.target.value)} /></div>
                      <div className="form-group"><label>Zipcode</label><input className="form-input" value={leadForm.address.zipcode} onChange={e=>handleAddress('zipcode',e.target.value)} /></div>
                  </div>

                  <h4 style={{borderBottom:'1px solid #f1f5f9', paddingBottom:'10px', color:'#94a3b8', marginBottom:'20px', marginTop:'30px'}}>Assignment</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div className="form-group">
                          <label>Owner</label>
                          <select className="form-input" value={leadForm.owner} onChange={e=>handleChange('owner',e.target.value)}>
                              <option value="">Select...</option>
                              {users.map(u=><option key={u.id} value={u.id}>{u.full_name}</option>)}
                          </select>
                      </div>
                      <div className="form-group"><label>Category</label><input className="form-input" value={leadForm.category} onChange={e=>handleChange('category',e.target.value)} /></div>
                  </div>
                  <div className="form-group"><label>Description</label><textarea rows="3" className="form-input" value={leadForm.lead_message} onChange={e=>handleChange('lead_message',e.target.value)} /></div>
              </div>
          </div>
      )
  }

  // --- HEADER ACTIONS (Toggle Buttons) ---
  const headerActions = (
      <div style={{ display: 'flex', gap: '5px', background: '#e2e8f0', padding: '4px', borderRadius: '6px' }}>
          <button onClick={() => setViewMode('list')} style={{ background: viewMode === 'list' ? 'white' : 'transparent', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}><LayoutList size={18} color={viewMode==='list'?'#2563eb':'#64748b'} /></button>
          <button onClick={() => setViewMode('kanban')} style={{ background: viewMode === 'kanban' ? 'white' : 'transparent', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}><LayoutGrid size={18} color={viewMode==='kanban'?'#2563eb':'#64748b'} /></button>
      </div>
  )

  const renderKanban = (filteredLeads) => (
      <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px', height: '100%' }}>
          {statuses.map(status => {
              const columnLeads = filteredLeads.filter(l => l.status === status);
              const style = getStatusColor(status);
              return (
                  <div key={status} onDragOver={onDragOver} onDrop={(e) => onDrop(e, status)} 
                       style={{ minWidth: '300px', background: '#f8fafc', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', borderTop: `4px solid ${style.b}`, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
                          <h4 style={{ margin: 0, color: style.t, textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '700' }}>{status}</h4>
                          <span style={{ background: style.bg, color: style.t, borderRadius: '12px', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 'bold' }}>{columnLeads.length}</span>
                      </div>
                      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '100px' }}>
                          {columnLeads.map(lead => (
                              <div key={lead.id} 
                                   draggable 
                                   onDragStart={(e) => onDragStart(e, lead.id)}
                                   onClick={() => handleRowClick(lead)}
                                   style={{ background: 'white', padding: '15px', borderRadius: '6px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', cursor: 'pointer', position: 'relative' }}>
                                  <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>{lead.title}</div>
                                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '8px' }}>{lead.company_name}</div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#475569', borderTop: '1px solid #f8fafc', paddingTop: '10px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><DollarSign size={14} /> {lead.req_amount || 0}</div>
                                      <div style={{ fontSize: '0.7rem' }}>{lead.agent_name || 'Unassigned'}</div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )
          })}
      </div>
  )

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {viewMode !== 'detail' && viewMode !== 'edit' ? (
            <AdvancedTable 
                tableName="leads_module"
                title="Sales Pipeline"
                columns={leadColumns}
                data={leads}
                onAdd={handleAddNew}
                onDelete={handleDelete}
                onEdit={handleEditClick} 
                onRowClick={handleRowClick} // This now works with AdvancedTable
                headerActions={headerActions}
                customRenderer={viewMode === 'kanban' ? renderKanban : null}
            />
        ) : null}
        
        {/* Detail and Edit views are rendered via early returns above */}
    </div>
  )
}

export default Leads