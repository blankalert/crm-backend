import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Plus, Trash2, Edit2, Save, X, GitBranch, ArrowDown, GripVertical } from 'lucide-react'
import '../../../App.css'

const PipelineSettings = ({ token }) => {
  const [pipelines, setPipelines] = useState([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  
  // FORM STATE
  const [form, setForm] = useState({
      id: null,
      pipeline_name: '',
      module: 'Lead', // Default
      is_active: true,
      stages: [],
      exit_reasons: [],
      won_stage_name: 'Won',
      lost_stage_name: 'Lost',
      unqualified_stage_name: 'Unqualified'
  })

  useEffect(() => {
    if(token) fetchPipelines()
  }, [token])

  const fetchPipelines = async () => {
      try {
          const res = await axios.get('http://localhost:3000/api/pipelines', { headers: { Authorization: `Bearer ${token}` } });
          setPipelines(res.data);
      } catch(e) { console.error(e); }
  }

  // --- STAGE HELPERS ---
  const addStage = () => {
      setForm(prev => ({
          ...prev,
          stages: [...prev.stages, { name: '', win_likelihood: 10, description: '' }]
      }))
  }
  
  const updateStage = (idx, field, val) => {
      const updated = [...form.stages];
      updated[idx][field] = val;
      setForm({ ...form, stages: updated });
  }

  const removeStage = (idx) => {
      setForm({ ...form, stages: form.stages.filter((_, i) => i !== idx) });
  }

  // --- EXIT REASON HELPERS ---
  const addReason = (type) => {
      setForm(prev => ({
          ...prev,
          exit_reasons: [...prev.exit_reasons, { reason_type: type, description: '' }]
      }))
  }
  
  const updateReason = (idx, val) => {
      const updated = [...form.exit_reasons];
      updated[idx].description = val;
      setForm({ ...form, exit_reasons: updated });
  }

  const removeReason = (idx) => {
      setForm({ ...form, exit_reasons: form.exit_reasons.filter((_, i) => i !== idx) });
  }

  // --- SAVE ---
  const handleSave = async () => {
      if(!form.pipeline_name) return alert("Name required");
      if(form.stages.length === 0) return alert("Add at least one stage");

      try {
          await axios.post('http://localhost:3000/api/pipelines', form, { headers: { Authorization: `Bearer ${token}` } });
          setIsFormOpen(false);
          fetchPipelines();
      } catch(e) { alert("Failed to save"); }
  }

  const handleEdit = (p) => {
      setForm({
          id: p.id,
          pipeline_name: p.pipeline_name,
          module: p.module,
          is_active: p.is_active,
          stages: p.stages || [],
          exit_reasons: p.exit_reasons || [],
          won_stage_name: p.won_stage_name || 'Won',
          lost_stage_name: p.lost_stage_name || 'Lost',
          unqualified_stage_name: p.unqualified_stage_name || 'Unqualified'
      });
      setIsFormOpen(true);
  }

  const handleDelete = async (id) => {
      if(!window.confirm("Delete pipeline?")) return;
      try {
          await axios.delete(`http://localhost:3000/api/pipelines/${id}`, { headers: { Authorization: `Bearer ${token}` } });
          fetchPipelines();
      } catch(e) { alert("Failed"); }
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
                <h2 style={{ margin: 0, color: '#1e293b' }}>Pipeline Configuration</h2>
                <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>Define sales stages and exit criteria.</p>
            </div>
            {!isFormOpen && (
                <button onClick={() => { 
                    setIsFormOpen(true); 
                    setForm({ 
                        id:null, 
                        pipeline_name:'', 
                        module:'Lead', 
                        is_active:true, 
                        stages:[], 
                        exit_reasons:[],
                        won_stage_name: 'Won', lost_stage_name: 'Lost', unqualified_stage_name: 'Unqualified'
                    }) 
                }} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Plus size={18} /> New Pipeline
                </button>
            )}
        </div>

        {isFormOpen ? (
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0 }}>{form.id ? 'Edit' : 'Create'} Pipeline</h3>
                    <button onClick={() => setIsFormOpen(false)} style={{ background: 'none', border: 'none', cursor:'pointer' }}><X /></button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '30px' }}>
                    <div className="form-group"><label>Pipeline Name</label><input className="form-input" value={form.pipeline_name} onChange={e => setForm({...form, pipeline_name: e.target.value})} /></div>
                    <div className="form-group"><label>Module</label><select className="form-input" value={form.module} onChange={e => setForm({...form, module: e.target.value})}><option>Lead</option><option>Order</option><option>Customer</option></select></div>
                </div>

                {/* STAGES */}
                <h4 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Pipeline Stages (0% to 100%)</h4>
                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '30px' }}>
                    {form.stages.map((st, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                            <GripVertical size={16} color="#cbd5e1" />
                            <input className="form-input" placeholder="Stage Name (e.g. Qualified)" value={st.name} onChange={e => updateStage(idx, 'name', e.target.value)} style={{flex:2}} />
                            <input className="form-input" type="number" placeholder="%" value={st.win_likelihood} onChange={e => updateStage(idx, 'win_likelihood', e.target.value)} style={{width:'80px'}} />
                            <button onClick={() => removeStage(idx)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                        </div>
                    ))}
                    <button onClick={addStage} className="btn-secondary" style={{ marginTop: '10px', fontSize: '0.8rem' }}>+ Add Stage</button>
                </div>

                {/* EXIT REASONS */}
                <h4 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginTop:'30px' }}>Closure Settings</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px', background: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
                    <div className="form-group">
                        <label>Won Stage Name</label>
                        <input className="form-input" value={form.won_stage_name} onChange={e => setForm({...form, won_stage_name: e.target.value})} placeholder="e.g. Won" />
                    </div>
                    <div className="form-group">
                        <label>Lost Stage Name</label>
                        <input className="form-input" value={form.lost_stage_name} onChange={e => setForm({...form, lost_stage_name: e.target.value})} placeholder="e.g. Lost" />
                    </div>
                    <div className="form-group">
                        <label>Unqualified Stage Name</label>
                        <input className="form-input" value={form.unqualified_stage_name} onChange={e => setForm({...form, unqualified_stage_name: e.target.value})} placeholder="e.g. Unqualified" />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                    {/* WON REASONS */}
                    <div style={{ background: '#f0fdf4', padding: '15px', borderRadius: '8px', border: '1px solid #dcfce7' }}>
                        <h5 style={{ margin: '0 0 10px 0', color: '#166534' }}>Won Reasons</h5>
                        {form.exit_reasons.filter(r => r.reason_type === 'Won').map((r, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                                <input className="form-input" placeholder="e.g. Successful Demo" value={r.description} onChange={e => {
                                    const realIdx = form.exit_reasons.findIndex(original => original === r);
                                    updateReason(realIdx, e.target.value);
                                }} />
                                <button onClick={() => removeReason(form.exit_reasons.findIndex(original => original === r))} style={{ color: '#ef4444', border: 'none', background: 'none' }}><X size={14}/></button>
                            </div>
                        ))}
                        <button onClick={() => addReason('Won')} className="btn-xs" style={{marginTop:'5px'}}>+ Add Reason</button>
                    </div>

                    {/* LOST REASONS */}
                    <div style={{ background: '#fff1f2', padding: '15px', borderRadius: '8px', border: '1px solid #fecdd3' }}>
                        <h5 style={{ margin: '0 0 10px 0', color: '#991b1b' }}>Lost Reasons</h5>
                        {form.exit_reasons.filter(r => r.reason_type === 'Lost').map((r, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                                <input className="form-input" placeholder="e.g. Too Expensive" value={r.description} onChange={e => {
                                    const realIdx = form.exit_reasons.findIndex(original => original === r);
                                    updateReason(realIdx, e.target.value);
                                }} />
                                <button onClick={() => removeReason(form.exit_reasons.findIndex(original => original === r))} style={{ color: '#ef4444', border: 'none', background: 'none' }}><X size={14}/></button>
                            </div>
                        ))}
                        <button onClick={() => addReason('Lost')} className="btn-xs" style={{marginTop:'5px'}}>+ Add Reason</button>
                    </div>

                    {/* UNQUALIFIED REASONS */}
                    <div style={{ background: '#fef2f2', padding: '15px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                         <h5 style={{ margin: '0 0 10px 0', color: '#991b1b' }}>Unqualified Reasons</h5>
                         {form.exit_reasons.filter(r => r.reason_type === 'Unqualified').map((r, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                                <input className="form-input" placeholder="e.g. Bad Contact Info" value={r.description} onChange={e => {
                                    const realIdx = form.exit_reasons.findIndex(original => original === r);
                                    updateReason(realIdx, e.target.value);
                                }} />
                                <button onClick={() => removeReason(form.exit_reasons.findIndex(original => original === r))} style={{ color: '#ef4444', border: 'none', background: 'none' }}><X size={14}/></button>
                            </div>
                        ))}
                        <button onClick={() => addReason('Unqualified')} className="btn-xs" style={{marginTop:'5px'}}>+ Add Reason</button>
                    </div>
                </div>

                <div style={{ marginTop: '20px', textAlign: 'right' }}>
                    <button onClick={handleSave} className="btn-primary" style={{ padding: '12px 24px' }}>Save Configuration</button>
                </div>
            </div>
        ) : (
            <div className="card">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #eee', textAlign: 'left' }}>
                            <th style={{ padding: '10px' }}>Name</th>
                            <th style={{ padding: '10px' }}>Module</th>
                            <th style={{ padding: '10px' }}>Stages</th>
                            <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pipelines.map(p => (
                            <tr key={p.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                                <td style={{ padding: '15px 10px', fontWeight: 'bold' }}>{p.pipeline_name}</td>
                                <td style={{ padding: '15px 10px' }}><span style={{ background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>{p.module}</span></td>
                                <td style={{ padding: '15px 10px', color: '#64748b' }}>
                                    {p.stages ? p.stages.map(s => s.name).join(' → ') : 'No stages'}
                                </td>
                                <td style={{ padding: '15px 10px', textAlign: 'right' }}>
                                    <button onClick={() => handleEdit(p)} style={{ marginRight: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb' }}><Edit2 size={16} /></button>
                                    <button onClick={() => handleDelete(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
    </div>
  )
}

export default PipelineSettings