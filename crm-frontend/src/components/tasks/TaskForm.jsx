import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Search, Loader } from 'lucide-react';
import axios from 'axios';

const RESPONSE_OPTIONS = {
    Positive: ['Interested', 'Quote Requested', 'Meeting Scheduled', 'Ready to Buy'],
    Moderate: ['Call Back Later', 'Send Information', 'Need more time', 'Thinking'],
    Negative: ['Not Interested', 'Wrong Number', 'Competitor', 'Budget Issue']
};

const TaskForm = ({ form, isEditing, onBack, onSave, onChange, users, token }) => {
    const [leads, setLeads] = useState([]);
    const [leadSearch, setLeadSearch] = useState('');
    const [shouldLoad, setShouldLoad] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // Fetch leads for the "Related To" dropdown if module is Lead
    useEffect(() => {
        if (form.related_to_module === 'Lead' && shouldLoad) {
            if (leadSearch.length > 0 && leadSearch.length < 3) {
                setLeads([]);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            const delay = leadSearch.length >= 3 ? 1500 : 500;

            const timer = setTimeout(() => {
                const params = leadSearch ? { search: leadSearch } : {};
                axios.get('http://localhost:3000/api/leads', { headers: { Authorization: `Bearer ${token}` }, params })
                    .then(res => setLeads(res.data.data || (Array.isArray(res.data) ? res.data : [])))
                    .catch(e => console.error("Failed to fetch leads", e))
                    .finally(() => setIsLoading(false));
            }, delay);
            return () => clearTimeout(timer);
        }
    }, [form.related_to_module, token, leadSearch, shouldLoad]);

    const handleResponseTypeChange = (e) => {
        const type = e.target.value;
        onChange('response_type', type);
        onChange('response_text', ''); // Reset response text when type changes
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '50px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', gap: '5px', color: '#64748b' }}>
                    <ArrowLeft /> Cancel
                </button>
                <h2 style={{ margin: 0, color: '#1e293b' }}>{isEditing ? 'Edit Task' : 'New Task'}</h2>
                <button onClick={onSave} className="btn-primary" style={{ display: 'flex', gap: '5px', padding: '10px 20px' }}>
                    <Save size={18} /> Save
                </button>
            </div>

            <div className="card">
                <h4 style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', color: '#94a3b8', marginBottom: '20px' }}>Task Details</h4>
                
                <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label>Task Subject</label>
                    <input className="form-input" value={form.task_name || ''} onChange={e => onChange('task_name', e.target.value)} required placeholder="e.g. Follow up with client" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div className="form-group">
                        <label>Task Type</label>
                        <select className="form-input" value={form.task_type || 'Follow-Up'} onChange={e => onChange('task_type', e.target.value)}>
                            <option>Follow-Up</option><option>Call</option><option>Reminder</option><option>Todo</option><option>Meeting</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Status</label>
                        <select className="form-input" value={form.status || 'Open'} onChange={e => onChange('status', e.target.value)}>
                            <option>Open</option><option>In Progress</option><option>Completed</option><option>Cancelled</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Priority</label>
                        <select className="form-input" value={form.priority || 'Medium'} onChange={e => onChange('priority', e.target.value)}>
                            <option>High</option><option>Medium</option><option>Low</option>
                        </select>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div className="form-group">
                        <label>Due Date</label>
                        <input type="datetime-local" className="form-input" value={form.due_date || ''} onChange={e => onChange('due_date', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Assigned To</label>
                        <select className="form-input" value={form.owner_id || ''} onChange={e => onChange('owner_id', e.target.value)}>
                            <option value="">Select User...</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                        </select>
                    </div>
                </div>

                <h4 style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', color: '#94a3b8', marginBottom: '20px', marginTop: '30px' }}>Related Entity</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginBottom: '20px' }}>
                    <div className="form-group">
                        <label>Module</label>
                        <select className="form-input" value={form.related_to_module || ''} onChange={e => onChange('related_to_module', e.target.value)}>
                            <option value="">None</option>
                            <option value="Lead">Lead</option>
                            <option value="Customer">Customer</option>
                            <option value="Order">Order</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Record</label>
                        {form.related_to_module === 'Lead' ? (
                            <div>
                                <div style={{position:'relative', marginBottom:'5px'}}>
                                    <input 
                                        className="form-input" 
                                        placeholder="Search Lead..." 
                                        value={leadSearch} 
                                        onChange={e => { setLeadSearch(e.target.value); setShouldLoad(true); }} 
                                        onFocus={() => setShouldLoad(true)}
                                        style={{paddingLeft:'30px', width:'100%'}} 
                                    />
                                    {isLoading ? (
                                        <Loader size={16} className="animate-spin" style={{position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', color:'#3b82f6'}}/>
                                    ) : (
                                        <Search size={16} style={{position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', color:'#94a3b8'}}/>
                                    )}
                                </div>
                                {leadSearch.length > 0 && leadSearch.length < 3 && <div style={{fontSize:'0.75rem', color:'#ef4444', marginBottom:'5px'}}>Type at least 3 characters</div>}
                                <select className="form-input" value={form.related_to_id || ''} onChange={e => {
                                    const val = e.target.value;
                                    onChange('related_to_id', val);
                                    const selected = leads.find(l => l.id == val);
                                    if (selected) {
                                        onChange('related_rid', selected.leadRID || selected.leadrid);
                                    } else if (!val) {
                                        onChange('related_rid', '');
                                    }
                                }} onFocus={() => setShouldLoad(true)}>
                                    <option value="">Select Lead...</option>
                                    {isLoading && <option disabled>Loading...</option>}
                                    {form.related_to_id && !leads.find(l => l.id == form.related_to_id) && (
                                        <option value={form.related_to_id}>#{form.related_rid || form.leadrid || form.leadRID || form.related_to_id} - (Selected)</option>
                                    )}
                                    {leads.map(l => <option key={l.id} value={l.id}>#{l.leadRID || l.leadrid || l.id} - {l.title} {l.company_name ? `(${l.company_name})` : ''}</option>)}
                                </select>
                            </div>
                        ) : (
                            <input 
                                className="form-input" 
                                placeholder="Enter ID (Search coming soon)" 
                                value={form.related_to_id || ''} 
                                onChange={e => onChange('related_to_id', e.target.value)} 
                                disabled={!form.related_to_module}
                            />
                        )}
                    </div>
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label>Description</label>
                    <textarea className="form-input" rows="3" value={form.description || ''} onChange={e => onChange('description', e.target.value)}></textarea>
                </div>

                {/* RESPONSE SECTION */}
                <h4 style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', color: '#94a3b8', marginBottom: '20px', marginTop: '30px' }}>Task Outcome</h4>
                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                        <div className="form-group">
                            <label>Response Type</label>
                            <select className="form-input" value={form.response_type || ''} onChange={handleResponseTypeChange}>
                                <option value="">Select Type...</option>
                                <option value="Positive">Positive</option>
                                <option value="Moderate">Moderate</option>
                                <option value="Negative">Negative</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Response</label>
                            <select className="form-input" value={form.response_text || ''} onChange={e => onChange('response_text', e.target.value)} disabled={!form.response_type}>
                                <option value="">Select Response...</option>
                                {form.response_type && RESPONSE_OPTIONS[form.response_type]?.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Remark (Optional)</label>
                        <textarea className="form-input" rows="2" value={form.remark || ''} onChange={e => onChange('remark', e.target.value)} placeholder="Add any additional notes about the outcome..."></textarea>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default TaskForm;