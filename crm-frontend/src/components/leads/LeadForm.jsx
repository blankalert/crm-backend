import React, { useState, useEffect } from 'react'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import axios from 'axios'

const LeadForm = ({ 
    form, isEditing, onBack, onSave, onChange, 
    onArrayChange, onAddItem, onRemoveItem, onAddressChange, 
    users, 
    // Receive pipelines from parent
    pipelinesProp
}) => {
  const [pipelines, setPipelines] = useState([])
  const [activeStages, setActiveStages] = useState([])

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

  const initializeStages = (pipeList) => {
      if (form.pipeline) {
          const current = pipeList.find(p => p.pipeline_name === form.pipeline);
          if (current) setActiveStages(current.stages.map(s => s.name));
      } else if (pipeList.length > 0 && !form.pipeline) {
          // Default new lead to first pipeline
          onChange('pipeline', pipeList[0].pipeline_name);
          setActiveStages(pipeList[0].stages.map(s => s.name));
          onChange('status', pipeList[0].stages[0].name);
      }
  }

  // Update stages when pipeline changes
  const handlePipelineChange = (e) => {
      const newPipelineName = e.target.value;
      onChange('pipeline', newPipelineName);
      
      const selected = pipelines.find(p => p.pipeline_name === newPipelineName);
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

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom:'50px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', gap: '5px', color: '#64748b' }}><ArrowLeft /> Cancel</button>
            <h2 style={{ margin: 0, color: '#1e293b' }}>{isEditing ? 'Edit Lead' : 'New Lead'}</h2>
            <button onClick={onSave} className="btn-primary" style={{ display: 'flex', gap: '5px', padding:'10px 20px' }}><Save size={18} /> Save</button>
        </div>

        <div className="card">
            <h4 style={{borderBottom:'1px solid #f1f5f9', paddingBottom:'10px', color:'#94a3b8', marginBottom:'20px'}}>Lead Information</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div className="form-group"><label>Lead Name / Title</label><input className="form-input" value={form.name || ''} onChange={e=>onChange('name',e.target.value)} required /></div>
                <div className="form-group"><label>Company</label><input className="form-input" value={form.company_name || ''} onChange={e=>onChange('company_name',e.target.value)} /></div>
                <div className="form-group"><label>Date</label><input type="date" className="form-input" value={form.lead_date || ''} onChange={e=>onChange('lead_date',e.target.value)} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div className="form-group"><label>Value ($)</label><input type="number" className="form-input" value={form.req_amount || ''} onChange={e=>onChange('req_amount',e.target.value)} /></div>
                
                {/* PIPELINE SELECTOR */}
                <div className="form-group">
                    <label>Pipeline</label>
                    <select className="form-input" value={form.pipeline || ''} onChange={handlePipelineChange}>
                        {pipelines.map(p => <option key={p.id} value={p.pipeline_name}>{p.pipeline_name}</option>)}
                    </select>
                </div>

                {/* DYNAMIC STATUS SELECTOR */}
                <div className="form-group">
                    <label>Status</label>
                    <select className="form-input" value={form.status || ''} onChange={e=>onChange('status',e.target.value)}>
                        {dropdownStatuses.map(s => <option key={s}>{s}</option>)}
                    </select>
                </div>

                <div className="form-group"><label>Priority</label><select className="form-input" value={form.priority || 'Medium'} onChange={e=>onChange('priority',e.target.value)}><option>Medium</option><option>High</option><option>Low</option></select></div>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop:'20px' }}>
                <div className="form-group"><label>City</label><input className="form-input" value={form.address?.city || ''} onChange={e=>onAddressChange('city',e.target.value)} /></div>
                <div className="form-group"><label>State</label><input className="form-input" value={form.address?.state || ''} onChange={e=>onAddressChange('state',e.target.value)} /></div>
                <div className="form-group"><label>Zipcode</label><input className="form-input" value={form.address?.zipcode || ''} onChange={e=>onAddressChange('zipcode',e.target.value)} /></div>
            </div>

            <h4 style={{borderBottom:'1px solid #f1f5f9', paddingBottom:'10px', color:'#94a3b8', marginBottom:'20px', marginTop:'30px'}}>Assignment</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group"><label>Owner</label><select className="form-input" value={form.owner || ''} onChange={e=>onChange('owner',e.target.value)}><option value="">Select...</option>{users.map(u=><option key={u.id} value={u.id}>{u.full_name}</option>)}</select></div>
                <div className="form-group"><label>Category</label><input className="form-input" value={form.category || ''} onChange={e=>onChange('category',e.target.value)} /></div>
            </div>
            <div className="form-group"><label>Description</label><textarea rows="3" className="form-input" value={form.lead_message || ''} onChange={e=>onChange('lead_message',e.target.value)} /></div>
        </div>
    </div>
  )
}
export default LeadForm