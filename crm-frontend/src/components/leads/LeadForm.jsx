import React, { useState, useEffect } from 'react'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import axios from 'axios'

const LeadForm = ({ 
    form, isEditing, onBack, onSave, onChange, 
    onArrayChange, onAddItem, onRemoveItem, onAddressChange, onCustomDataChange,
    users, 
    // Receive pipelines from parent
    pipelinesProp
}) => {
  const [pipelines, setPipelines] = useState([])
  const [activeStages, setActiveStages] = useState([])
  const [customFields, setCustomFields] = useState([])
  const [layoutConfig, setLayoutConfig] = useState(null)

  // Load pipelines
  useEffect(() => {
    if (pipelinesProp) {
        setPipelines(pipelinesProp);
        initializeStages(pipelinesProp);
    } else {
        // Fallback fetch if not provided prop
        const token = localStorage.getItem('token'); 
        if(token) {
            axios.get('http://localhost:3000/api/pipelines?module=Lead', { headers: { Authorization: `Bearer ${token}` } })
            .then(res => {
                setPipelines(res.data);
                initializeStages(res.data);
            }).catch(e => console.error("Failed to load pipelines"));
        }
    }
  }, [pipelinesProp])

  // Load Custom Fields
  useEffect(() => {
    const fetchCustomFields = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await axios.get('http://localhost:3000/api/form-fields/fields/leads', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCustomFields(res.data);
        } catch (err) { console.error("Failed to load custom fields"); }
    }
    fetchCustomFields();
  }, [])

  // Load Layout Config
  useEffect(() => {
    const fetchLayout = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await axios.get('http://localhost:3000/api/layouts/leads/active', { headers: { Authorization: `Bearer ${token}` } });
            setLayoutConfig(res.data);
        } catch (err) { console.error("Failed to load layout config"); }
    }
    fetchLayout();
  }, [])

  const initializeStages = (pipeList) => {
      if (form.pipeline) {
          const current = pipeList.find(p => p.id === form.pipeline);
          if (current) setActiveStages(current.stages.map(s => s.name));
      } else if (pipeList.length > 0 && !form.pipeline) {
          // Default new lead to first pipeline
          onChange('pipeline', pipeList[0].id);
          setActiveStages(pipeList[0].stages.map(s => s.name));
          onChange('status', pipeList[0].stages[0].name);
      }
  }

  // Update stages when pipeline changes
  const handlePipelineChange = (e) => {
      const newPipelineId = e.target.value;
      onChange('pipeline', newPipelineId);
      
      const selected = pipelines.find(p => p.id === newPipelineId);
      if (selected) {
          const newStages = selected.stages.map(s => s.name);
          setActiveStages(newStages);
          // Reset status to first stage of new pipeline
          if(newStages.length > 0) onChange('status', newStages[0]); 
      }
  }

  // Combine Active Stages with Closed Stages (Won/Lost) for the dropdown
  const dropdownStatuses = [...activeStages];
  // Add closed stages if not already present
  ['Won', 'Lost', 'Unqualified'].forEach(s => {
      if(!dropdownStatuses.includes(s)) dropdownStatuses.push(s);
  });

  // Helper to render fields dynamically
  const renderField = (key) => {
      // System Fields
      switch(key) {
          case 'leadRID': return isEditing && form.leadRID ? <div key={key} className="form-group"><label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '5px' }}>Lead ID</label><input className="form-input" value={`#${form.leadRID}`} disabled style={{ background: '#f1f5f9', color: '#64748b', width: '120px', cursor: 'not-allowed' }} /></div> : null;
          case 'name': return <div key={key} className="form-group"><label>Lead Name / Title <span style={{color:'red'}}>*</span></label><input className="form-input" value={form.name || ''} onChange={e=>onChange('name',e.target.value)} required /></div>;
          case 'company_name': return <div key={key} className="form-group"><label>Company</label><input className="form-input" value={form.company_name || ''} onChange={e=>onChange('company_name',e.target.value)} /></div>;
          case 'lead_date': return <div key={key} className="form-group"><label>Date</label><input type="date" className="form-input" value={form.lead_date || ''} onChange={e=>onChange('lead_date',e.target.value)} /></div>;
          case 'req_amount': return <div key={key} className="form-group"><label>Value ($)</label><input type="number" className="form-input" value={form.req_amount || ''} onChange={e=>onChange('req_amount',e.target.value)} /></div>;
          case 'pipeline': return <div key={key} className="form-group"><label>Pipeline</label><select className="form-input" value={form.pipeline || ''} onChange={handlePipelineChange}>{pipelines.map(p => <option key={p.id} value={p.id}>{p.pipeline_name}</option>)}</select></div>;
          case 'status': return <div key={key} className="form-group"><label>Status</label><select className="form-input" value={form.status || ''} onChange={e=>onChange('status',e.target.value)}>{dropdownStatuses.map(s => <option key={s}>{s}</option>)}</select></div>;
          case 'priority': return <div key={key} className="form-group"><label>Priority</label><select className="form-input" value={form.priority || 'Medium'} onChange={e=>onChange('priority',e.target.value)}><option>Medium</option><option>High</option><option>Low</option></select></div>;
          case 'lead_type': return <div key={key} className="form-group"><label>Lead Type</label><select className="form-input" value={form.lead_type || 'Warm'} onChange={e=>onChange('lead_type',e.target.value)}><option>Cold</option><option>Warm</option><option>Hot</option></select></div>;
          case 'source': return <div key={key} className="form-group"><label>Source</label><input className="form-input" value={form.source || ''} onChange={e=>onChange('source',e.target.value)} placeholder="e.g. Website, Referral" /></div>;
          case 'company_email': return <div key={key} className="form-group"><label>Primary Email</label><input className="form-input" value={form.company_email || ''} onChange={e=>onChange('company_email',e.target.value)} /></div>;
          case 'company_phone': return <div key={key} className="form-group"><label>Primary Phone</label><input className="form-input" value={form.company_phone || ''} onChange={e=>onChange('company_phone',e.target.value)} /></div>;
          case 'phones': return (
            <div key={key} style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', gridColumn: 'span 2' }}>
                <label>Secondary Phones</label>
                {form.phones && form.phones.map((p, i) => (
                    <div key={i} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                        <input className="form-input" placeholder="Number" value={p.number || ''} onChange={e=>onArrayChange('phones', i, 'number', e.target.value)} />
                        <select className="form-input" style={{width:'100px'}} value={p.type || 'Mobile'} onChange={e=>onArrayChange('phones', i, 'type', e.target.value)}><option>Mobile</option><option>Work</option></select>
                        <button type="button" onClick={()=>onRemoveItem('phones', i)} style={{color:'#ef4444', border:'none', cursor:'pointer'}}><Trash2 size={16}/></button>
                    </div>
                ))}
                <button type="button" onClick={()=>onAddItem('phones', {number:'', type:'Mobile'})} style={{fontSize:'0.8rem', color:'#2563eb', border:'none', cursor:'pointer'}}>+ Add Phone</button>
            </div>
          );
          case 'emails': return (
            <div key={key} style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', gridColumn: 'span 2' }}>
                <label>Secondary Emails</label>
                {form.emails && form.emails.map((e, i) => (
                    <div key={i} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                        <input className="form-input" placeholder="Email" value={e.email || ''} onChange={ev=>onArrayChange('emails', i, 'email', ev.target.value)} />
                        <button type="button" onClick={()=>onRemoveItem('emails', i)} style={{color:'#ef4444', border:'none', cursor:'pointer'}}><Trash2 size={16}/></button>
                    </div>
                ))}
                <button type="button" onClick={()=>onAddItem('emails', {email:'', type:'Work'})} style={{fontSize:'0.8rem', color:'#2563eb', border:'none', cursor:'pointer'}}>+ Add Email</button>
            </div>
          );
          case 'address': return (
            <div key={key} style={{ gridColumn: 'span 3', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div className="form-group" style={{gridColumn: 'span 3'}}><label>Street Address</label><input className="form-input" value={form.address?.line || ''} onChange={e=>onAddressChange('line',e.target.value)} /></div>
                <div className="form-group"><label>City</label><input className="form-input" value={form.address?.city || ''} onChange={e=>onAddressChange('city',e.target.value)} /></div>
                <div className="form-group"><label>State</label><input className="form-input" value={form.address?.state || ''} onChange={e=>onAddressChange('state',e.target.value)} /></div>
                <div className="form-group"><label>Zipcode</label><input className="form-input" value={form.address?.zipcode || ''} onChange={e=>onAddressChange('zipcode',e.target.value)} /></div>
            </div>
          );
          case 'owner': return <div key={key} className="form-group"><label>Owner</label><select className="form-input" value={form.owner || ''} onChange={e=>onChange('owner',e.target.value)}><option value="">Select...</option>{users.map(u=><option key={u.id} value={u.id}>{u.full_name}</option>)}</select></div>;
          case 'category': return <div key={key} className="form-group"><label>Category</label><input className="form-input" value={form.category || ''} onChange={e=>onChange('category',e.target.value)} /></div>;
          case 'lead_message': return <div key={key} className="form-group" style={{gridColumn:'span 3'}}><label>Description</label><textarea rows="3" className="form-input" value={form.lead_message || ''} onChange={e=>onChange('lead_message',e.target.value)} /></div>;
          case 'remark': return <div key={key} className="form-group" style={{gridColumn:'span 3'}}><label>Remarks</label><textarea rows="2" className="form-input" value={form.remark || ''} onChange={e=>onChange('remark',e.target.value)} /></div>;
          default:
              // Custom Fields
              const field = customFields.find(f => f.field_key === key);
              if(field) {
                  if (field.is_hidden) return null;
                  const val = form.custom_data?.[field.field_key] || '';
                  return (
                      <div className="form-group" key={field.id}>
                          <label>{field.field_label} {field.is_required && <span style={{color:'red'}}>*</span>}</label>
                          {field.field_type === 'select' ? (
                              <select className="form-input" value={val} onChange={e => onCustomDataChange(field.field_key, e.target.value)} required={field.is_required}>
                                  <option value="">Select...</option>
                                  {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                              </select>
                          ) : field.field_type === 'textarea' ? (
                              <textarea className="form-input" value={val} onChange={e => onCustomDataChange(field.field_key, e.target.value)} required={field.is_required} />
                          ) : (
                              <input type={field.field_type} className="form-input" value={val} onChange={e => onCustomDataChange(field.field_key, e.target.value)} required={field.is_required} />
                          )}
                      </div>
                  )
              }
              return null;
      }
  }

  // Render Dynamic Layout
  if (layoutConfig && layoutConfig.length > 0) {
      return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom:'50px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', gap: '5px', color: '#64748b' }}><ArrowLeft /> Cancel</button>
                <h2 style={{ margin: 0, color: '#1e293b' }}>{isEditing ? 'Edit Lead' : 'New Lead'}</h2>
                <button onClick={onSave} className="btn-primary" style={{ display: 'flex', gap: '5px', padding:'10px 20px' }}><Save size={18} /> Save</button>
            </div>
            {layoutConfig.map((section, idx) => (
                <div key={idx} className="card" style={{ marginBottom: '20px' }}>
                    <h4 style={{borderBottom:'1px solid #f1f5f9', paddingBottom:'10px', color:'#94a3b8', marginBottom:'20px'}}>{section.title}</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                        {section.fields.map(key => renderField(key))}
                    </div>
                </div>
            ))}
        </div>
      )
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom:'50px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', gap: '5px', color: '#64748b' }}><ArrowLeft /> Cancel</button>
            <h2 style={{ margin: 0, color: '#1e293b' }}>{isEditing ? 'Edit Lead' : 'New Lead'}</h2>
            <button onClick={onSave} className="btn-primary" style={{ display: 'flex', gap: '5px', padding:'10px 20px' }}><Save size={18} /> Save</button>
        </div>

        <div className="card">
            <h4 style={{borderBottom:'1px solid #f1f5f9', paddingBottom:'10px', color:'#94a3b8', marginBottom:'20px'}}>Lead Information</h4>
            {isEditing && form.leadRID && (
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '5px' }}>Lead ID</label>
                    <input className="form-input" value={`#${form.leadRID}`} disabled style={{ background: '#f1f5f9', color: '#64748b', width: '120px', cursor: 'not-allowed' }} />
                </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div className="form-group"><label>Lead Name / Title</label><input className="form-input" value={form.name || ''} onChange={e=>onChange('name',e.target.value)} required /></div>
                <div className="form-group"><label>Company</label><input className="form-input" value={form.company_name || ''} onChange={e=>onChange('company_name',e.target.value)} /></div>
                <div className="form-group"><label>Date</label><input type="date" className="form-input" value={form.lead_date || ''} onChange={e=>onChange('lead_date',e.target.value)} /></div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div className="form-group"><label>Value ($)</label><input type="number" className="form-input" value={form.req_amount || ''} onChange={e=>onChange('req_amount',e.target.value)} /></div>
                
                {/* PIPELINE SELECTOR */}
                <div className="form-group">
                    <label>Pipeline</label>
                    <select className="form-input" value={form.pipeline || ''} onChange={handlePipelineChange}>
                        {pipelines.map(p => <option key={p.id} value={p.id}>{p.pipeline_name}</option>)}
                    </select>
                </div>

                {/* DYNAMIC STATUS SELECTOR */}
                <div className="form-group">
                    <label>Status</label>
                    <select className="form-input" value={form.status || ''} onChange={e=>onChange('status',e.target.value)}>
                        {dropdownStatuses.map(s => <option key={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div className="form-group"><label>Priority</label><select className="form-input" value={form.priority || 'Medium'} onChange={e=>onChange('priority',e.target.value)}><option>Medium</option><option>High</option><option>Low</option></select></div>
                <div className="form-group"><label>Lead Type</label><select className="form-input" value={form.lead_type || 'Warm'} onChange={e=>onChange('lead_type',e.target.value)}><option>Cold</option><option>Warm</option><option>Hot</option></select></div>
                <div className="form-group"><label>Source</label><input className="form-input" value={form.source || ''} onChange={e=>onChange('source',e.target.value)} placeholder="e.g. Website, Referral" /></div>
            </div>

            <h4 style={{borderBottom:'1px solid #f1f5f9', paddingBottom:'10px', color:'#94a3b8', marginBottom:'20px', marginTop:'30px'}}>Contact Details</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div className="form-group"><label>Primary Email</label><input className="form-input" value={form.company_email || ''} onChange={e=>onChange('company_email',e.target.value)} /></div>
                <div className="form-group"><label>Primary Phone</label><input className="form-input" value={form.company_phone || ''} onChange={e=>onChange('company_phone',e.target.value)} /></div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
                    <label>Secondary Phones</label>
                    {form.phones && form.phones.map((p, i) => (
                        <div key={i} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                            <input className="form-input" placeholder="Number" value={p.number || ''} onChange={e=>onArrayChange('phones', i, 'number', e.target.value)} />
                            <select className="form-input" style={{width:'100px'}} value={p.type || 'Mobile'} onChange={e=>onArrayChange('phones', i, 'type', e.target.value)}><option>Mobile</option><option>Work</option></select>
                            <button type="button" onClick={()=>onRemoveItem('phones', i)} style={{color:'#ef4444', border:'none', cursor:'pointer'}}><Trash2 size={16}/></button>
                        </div>
                    ))}
                    <button type="button" onClick={()=>onAddItem('phones', {number:'', type:'Mobile'})} style={{fontSize:'0.8rem', color:'#2563eb', border:'none', cursor:'pointer'}}>+ Add Phone</button>
                </div>
                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
                    <label>Secondary Emails</label>
                    {form.emails && form.emails.map((e, i) => (
                        <div key={i} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                            <input className="form-input" placeholder="Email" value={e.email || ''} onChange={ev=>onArrayChange('emails', i, 'email', ev.target.value)} />
                            <button type="button" onClick={()=>onRemoveItem('emails', i)} style={{color:'#ef4444', border:'none', cursor:'pointer'}}><Trash2 size={16}/></button>
                        </div>
                    ))}
                    <button type="button" onClick={()=>onAddItem('emails', {email:'', type:'Work'})} style={{fontSize:'0.8rem', color:'#2563eb', border:'none', cursor:'pointer'}}>+ Add Email</button>
                </div>
            </div>

            <h4 style={{borderBottom:'1px solid #f1f5f9', paddingBottom:'10px', color:'#94a3b8', marginBottom:'20px', marginTop:'30px'}}>Address</h4>
            <div className="form-group" style={{marginBottom: '15px'}}>
                <label>Street Address</label>
                <input className="form-input" value={form.address?.line || ''} onChange={e=>onAddressChange('line',e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div className="form-group"><label>City</label><input className="form-input" value={form.address?.city || ''} onChange={e=>onAddressChange('city',e.target.value)} /></div>
                <div className="form-group"><label>State</label><input className="form-input" value={form.address?.state || ''} onChange={e=>onAddressChange('state',e.target.value)} /></div>
                <div className="form-group"><label>Zipcode</label><input className="form-input" value={form.address?.zipcode || ''} onChange={e=>onAddressChange('zipcode',e.target.value)} /></div>
            </div>

            {/* CUSTOM FIELDS SECTION */}
            {customFields.length > 0 && (
                <>
                    <h4 style={{borderBottom:'1px solid #f1f5f9', paddingBottom:'10px', color:'#94a3b8', marginBottom:'20px', marginTop:'30px'}}>Custom Fields</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                        {customFields.map(field => {
                            if (field.is_hidden) return null;
                            const val = form.custom_data?.[field.field_key] || '';
                            return (
                                <div className="form-group" key={field.id}>
                                    <label>{field.field_label} {field.is_required && <span style={{color:'red'}}>*</span>}</label>
                                    {field.field_type === 'select' ? (
                                        <select className="form-input" value={val} onChange={e => onCustomDataChange(field.field_key, e.target.value)} required={field.is_required}>
                                            <option value="">Select...</option>
                                            {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    ) : field.field_type === 'textarea' ? (
                                        <textarea className="form-input" value={val} onChange={e => onCustomDataChange(field.field_key, e.target.value)} required={field.is_required} />
                                    ) : (
                                        <input type={field.field_type} className="form-input" value={val} onChange={e => onCustomDataChange(field.field_key, e.target.value)} required={field.is_required} />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </>
            )}

            <h4 style={{borderBottom:'1px solid #f1f5f9', paddingBottom:'10px', color:'#94a3b8', marginBottom:'20px', marginTop:'30px'}}>Additional Information</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group"><label>Owner</label><select className="form-input" value={form.owner || ''} onChange={e=>onChange('owner',e.target.value)}><option value="">Select...</option>{users.map(u=><option key={u.id} value={u.id}>{u.full_name}</option>)}</select></div>
                <div className="form-group"><label>Category</label><input className="form-input" value={form.category || ''} onChange={e=>onChange('category',e.target.value)} /></div>
            </div>
            <div className="form-group" style={{marginTop:'20px'}}><label>Description</label><textarea rows="3" className="form-input" value={form.lead_message || ''} onChange={e=>onChange('lead_message',e.target.value)} /></div>
            <div className="form-group" style={{marginTop:'15px'}}><label>Remarks</label><textarea rows="2" className="form-input" value={form.remark || ''} onChange={e=>onChange('remark',e.target.value)} /></div>
        </div>
    </div>
  )
}
export default LeadForm