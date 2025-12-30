import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, Clock, User, CheckCircle, Circle, X, CheckSquare, XCircle, Calendar } from 'lucide-react';

const TaskSection = ({ token, relatedToModule, relatedToId, relatedToRID, users, currentUser }) => {
    const [tasks, setTasks] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentTask, setCurrentTask] = useState(null);
    const dateInputRef = useRef(null);
    
    // Completion & Quick View State
    const [showCompletePopup, setShowCompletePopup] = useState(false);
    const [completingTask, setCompletingTask] = useState(null);
    const [completionData, setCompletionData] = useState({ response_type: '', response_text: '', remark: '' });
    const [showQuickView, setShowQuickView] = useState(false);
    const [viewingTask, setViewingTask] = useState(null);

    const initialFormState = {
        task_name: '',
        task_type: 'Follow-Up',
        description: '',
        status: 'Open',
        priority: 'Medium',
        due_date: '',
        owner_id: '',
        response_type: '',
        response_text: '',
        remark: ''
    };

    const [form, setForm] = useState(initialFormState);

    const RESPONSE_OPTIONS = {
        Positive: ['Interested', 'Quote Requested', 'Meeting Scheduled', 'Ready to Buy'],
        Moderate: ['Call Back Later', 'Send Information', 'Need more time', 'Thinking'],
        Negative: ['Not Interested', 'Wrong Number', 'Competitor', 'Budget Issue']
    };

    const fetchTasks = async () => {
        if (!relatedToId) return;
        try {
            const res = await axios.get(`http://localhost:3000/api/tasks?related_to_module=${relatedToModule}&related_to_id=${relatedToId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTasks(res.data);
        } catch (e) {
            console.error("Failed to fetch tasks", e);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, [relatedToId, token]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => {
            const newData = { ...prev, [name]: value };
            if (name === 'response_type') newData.response_text = '';
            return newData;
        });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const payload = { 
            ...form, 
            related_to_module: relatedToModule, 
            related_to_id: relatedToId,
            related_rid: relatedToRID,
            updated_at: new Date().toISOString(),
            updated_by: currentUser?.id
        };
        
        try {
            if (isEditing) {
                await axios.put(`http://localhost:3000/api/tasks/${currentTask.id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
            } else {
                await axios.post('http://localhost:3000/api/tasks', payload, { headers: { Authorization: `Bearer ${token}` } });
            }
            setShowForm(false);
            setIsEditing(false);
            setForm(initialFormState);
            fetchTasks();
        } catch (err) {
            console.error("Failed to save task", err);
            alert("Failed to save task");
        }
    };

    const handleNewTask = () => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        const localIso = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);

        setForm({
            ...initialFormState,
            owner_id: currentUser?.id || '',
            due_date: localIso
        });
        setIsEditing(false);
        setShowForm(true);
    };

    const handleEdit = (task) => {
        setCurrentTask(task);
        setForm({
            task_name: task.task_name,
            task_type: task.task_type,
            description: task.description || '',
            status: task.status,
            priority: task.priority,
            due_date: task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : '',
            owner_id: task.owner_id,
            response_type: task.response_type || '',
            response_text: task.response_text || '',
            remark: task.remark || ''
        });
        setIsEditing(true);
        setShowForm(true);
    };

    const handleDelete = async (taskId) => {
        if (window.confirm("Are you sure you want to delete this task?")) {
            try {
                await axios.delete(`http://localhost:3000/api/tasks/${taskId}`, { headers: { Authorization: `Bearer ${token}` } });
                fetchTasks();
            } catch (err) {
                alert("Failed to delete task");
            }
        }
    };

    const handleCancelTask = async (task) => {
        if (window.confirm("Are you sure you want to CANCEL this task?")) {
            try {
                await axios.put(`http://localhost:3000/api/tasks/${task.id}`, { ...task, status: 'Cancelled' }, { headers: { Authorization: `Bearer ${token}` } });
                fetchTasks();
                if (showQuickView) setShowQuickView(false);
            } catch (e) { alert("Failed to cancel task"); }
        }
    };

    const initiateCompleteTask = (task) => {
        setCompletingTask(task);
        setCompletionData({ response_type: '', response_text: '', remark: '' });
        setShowCompletePopup(true);
    };

    const submitCompleteTask = async () => {
        if (!completionData.response_type) return alert("Please select a response type");
        try {
            await axios.put(`http://localhost:3000/api/tasks/${completingTask.id}`, { ...completingTask, status: 'Completed', response_type: completionData.response_type, response_text: completionData.response_text, remark: completionData.remark, updated_at: new Date().toISOString() }, { headers: { Authorization: `Bearer ${token}` } });
            setShowCompletePopup(false); setCompletingTask(null); fetchTasks();
            if (showQuickView) setShowQuickView(false);
        } catch (e) { alert("Failed to complete task"); }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'No due date';
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const statusOrder = { 'Open': 1, 'In Progress': 2, 'Completed': 3, 'Cancelled': 4 };

    const sortedTasks = [...tasks].sort((a, b) => {
        const statusA = statusOrder[a.status] || 99;
        const statusB = statusOrder[b.status] || 99;
        if (statusA !== statusB) return statusA - statusB;
        
        const dateA = a.due_date ? new Date(a.due_date).getTime() : 8640000000000000;
        const dateB = b.due_date ? new Date(b.due_date).getTime() : 8640000000000000;
        return dateA - dateB;
    });

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0 }}>Tasks ({tasks.length})</h3>
                <button className="btn-primary" onClick={handleNewTask}>
                    <Plus size={16} /> New Task
                </button>
            </div>

            {showForm && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '500px', background: 'white', padding: '24px', borderRadius: '8px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0 }}>{isEditing ? 'Edit Task' : 'New Task'}</h3>
                            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Task Name</label>
                                <input name="task_name" value={form.task_name} onChange={handleInputChange} className="form-input" style={{ width: '100%' }} required />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Type</label>
                                    <select name="task_type" value={form.task_type} onChange={handleInputChange} className="form-input" style={{ width: '100%' }}>
                                        <option>Follow-Up</option><option>Call</option><option>Reminder</option><option>Todo</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Status</label>
                                    <select name="status" value={form.status} onChange={handleInputChange} className="form-input" style={{ width: '100%' }}>
                                        <option>Open</option><option>In Progress</option><option>Completed</option><option>Cancelled</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Priority</label>
                                    <select name="priority" value={form.priority} onChange={handleInputChange} className="form-input" style={{ width: '100%' }}>
                                        <option>Medium</option><option>High</option><option>Low</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Due Date</label>
                                    <div style={{ position: 'relative' }}>
                                        <input ref={dateInputRef} name="due_date" type="datetime-local" value={form.due_date} onChange={handleInputChange} className="form-input" style={{ width: '100%' }} />
                                        <button 
                                            type="button"
                                            onClick={() => dateInputRef.current?.showPicker()}
                                            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 0, display: 'flex' }}
                                        >
                                            <Calendar size={16}/>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Assign To</label>
                                <select name="owner_id" value={form.owner_id} onChange={handleInputChange} className="form-input" style={{ width: '100%' }} required>
                                    <option value="">Select User...</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                                </select>
                            </div>
                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Description</label>
                                <textarea name="description" value={form.description} onChange={handleInputChange} className="form-input" rows="3" style={{ width: '100%' }}></textarea>
                            </div>

                            {form.status === 'Completed' && (
                                <div style={{ marginBottom: '20px', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <h4 style={{margin:'0 0 10px 0', fontSize:'0.9rem', color:'#64748b'}}>Completion Details</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '0.9rem' }}>Response Type</label>
                                            <select name="response_type" className="form-input" style={{ width: '100%' }} value={form.response_type} onChange={handleInputChange} required>
                                                <option value="">Select Type...</option>
                                                <option value="Positive">Positive</option>
                                                <option value="Moderate">Moderate</option>
                                                <option value="Negative">Negative</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '0.9rem' }}>Response</label>
                                            <select name="response_text" className="form-input" style={{ width: '100%' }} value={form.response_text} onChange={handleInputChange} disabled={!form.response_type}>
                                                <option value="">Select Response...</option>
                                                {form.response_type && RESPONSE_OPTIONS[form.response_type]?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '0.9rem' }}>Remark</label>
                                        <textarea name="remark" className="form-input" style={{ width: '100%' }} rows="2" value={form.remark} onChange={handleInputChange} placeholder="Optional remarks..."></textarea>
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Save Task</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* QUICK VIEW POPUP */}
            {showQuickView && viewingTask && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '500px', background: 'white', padding: '24px', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0 }}>Task Details</h3>
                            <button onClick={() => setShowQuickView(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        
                        <div style={{marginBottom: '20px'}}>
                            <h4 style={{margin: '0 0 10px 0', color: '#1e293b', fontSize: '1.1rem'}}>{viewingTask.task_name}</h4>
                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '0.9rem', color: '#475569'}}>
                                <div><strong>Type:</strong> {viewingTask.task_type}</div>
                                <div><strong>Status:</strong> <span style={{color: viewingTask.status === 'Completed' ? '#16a34a' : '#475569'}}>{viewingTask.status}</span></div>
                                <div><strong>Priority:</strong> {viewingTask.priority}</div>
                                <div><strong>Due:</strong> {formatDate(viewingTask.due_date)}</div>
                                <div><strong>Owner:</strong> {viewingTask.owner_name || 'Unassigned'}</div>
                            </div>
                            {viewingTask.description && (
                                <div style={{marginTop: '15px', background: '#f8fafc', padding: '10px', borderRadius: '6px', fontSize: '0.9rem', color: '#334155'}}>
                                    {viewingTask.description}
                                </div>
                            )}
                            {viewingTask.status === 'Completed' && (
                                <div style={{marginTop: '15px', borderTop: '1px solid #e2e8f0', paddingTop: '10px'}}>
                                    <div style={{fontWeight: '600', color: '#166534'}}>Outcome: {viewingTask.response_type}</div>
                                    <div style={{color: '#334155'}}>{viewingTask.response_text}</div>
                                    {viewingTask.remark && <div style={{fontStyle: 'italic', color: '#64748b', marginTop: '5px'}}>"{viewingTask.remark}"</div>}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                            <button onClick={() => setShowQuickView(false)} className="btn-secondary">Close</button>
                            <div style={{ display: 'flex', gap: '10px' }}>
                            {viewingTask.status !== 'Completed' && viewingTask.status !== 'Cancelled' && (
                                <>
                                    <button onClick={() => initiateCompleteTask(viewingTask)} className="btn-primary" style={{background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '5px'}}><CheckCircle size={16}/> Complete</button>
                                    <button onClick={() => handleCancelTask(viewingTask)} className="btn-secondary" style={{background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '5px'}}><XCircle size={16}/> Cancel</button>
                                </>
                            )}
                            <button onClick={() => { setShowQuickView(false); handleEdit(viewingTask); }} className="btn-secondary">Edit</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* COMPLETION POPUP */}
            {showCompletePopup && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
                    <div className="card" style={{ width: '400px', padding: '24px', background: 'white', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0 }}>Complete Task</h3>
                            <button onClick={() => setShowCompletePopup(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '0.9rem' }}>Response Type</label>
                            <select className="form-input" style={{ width: '100%' }} value={completionData.response_type} onChange={e => setCompletionData({ ...completionData, response_type: e.target.value, response_text: '' })}>
                                <option value="">Select Type...</option>
                                <option value="Positive">Positive</option>
                                <option value="Moderate">Moderate</option>
                                <option value="Negative">Negative</option>
                            </select>
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '0.9rem' }}>Response</label>
                            <select className="form-input" style={{ width: '100%' }} value={completionData.response_text} onChange={e => setCompletionData({ ...completionData, response_text: e.target.value })} disabled={!completionData.response_type}>
                                <option value="">Select Response...</option>
                                {completionData.response_type && RESPONSE_OPTIONS[completionData.response_type]?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '0.9rem' }}>Remark</label>
                            <textarea className="form-input" style={{ width: '100%' }} rows="3" value={completionData.remark} onChange={e => setCompletionData({ ...completionData, remark: e.target.value })} placeholder="Optional remarks..."></textarea>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button onClick={() => setShowCompletePopup(false)} className="btn-secondary">Cancel</button>
                            <button onClick={submitCompleteTask} className="btn-primary">Complete Task</button>
                        </div>
                    </div>
                </div>
            )}

            <div>
                {sortedTasks.map(task => (
                    <div key={task.id} onClick={() => { setViewingTask(task); setShowQuickView(true); }} style={{ padding: '15px', borderBottom: '1px solid #eee', cursor: 'pointer', transition: 'background 0.2s', display: 'flex', flexDirection: 'column', gap: '6px' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        
                        {/* Row 1: Task Name */}
                        <div style={{ fontWeight: 'bold', fontSize: '1rem', color: '#1e293b', textDecoration: (task.status === 'Completed' || task.status === 'Cancelled') ? 'line-through' : 'none', opacity: (task.status === 'Completed' || task.status === 'Cancelled') ? 0.6 : 1 }}>
                            {task.task_name}
                        </div>

                        {/* Row 2: Due Date or Response Info */}
                        {task.status === 'Completed' ? (
                            <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <div style={{fontWeight: '600', color: task.response_type === 'Positive' ? '#16a34a' : (task.response_type === 'Negative' ? '#dc2626' : '#ca8a04')}}>{task.response_type} <span style={{fontWeight:'normal', color:'#475569'}}>- {task.response_text}</span></div>
                            </div>
                        ) : (
                            <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Clock size={14}/> {formatDate(task.due_date)}
                            </div>
                        )}

                        {/* Row 3: Buttons & User */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', minHeight: '28px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                            {task.status !== 'Completed' && task.status !== 'Cancelled' && (
                                <>
                                    <button onClick={(e) => { e.stopPropagation(); initiateCompleteTask(task); }} className="btn-icon" style={{color: '#16a34a', background: '#dcfce7', padding: '6px', borderRadius: '4px'}} title="Complete"><CheckCircle size={16} /></button>
                                    <button onClick={(e) => { e.stopPropagation(); handleCancelTask(task); }} className="btn-icon" style={{color: '#991b1b', background: '#fee2e2', padding: '6px', borderRadius: '4px'}} title="Cancel"><XCircle size={16} /></button>
                                    <button onClick={(e) => { e.stopPropagation(); handleEdit(task); }} className="btn-icon" style={{color: '#64748b', background: '#f1f5f9', padding: '6px', borderRadius: '4px'}} title="Edit"><Edit size={16} /></button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }} className="btn-icon" style={{color: '#ef4444', background: '#fee2e2', padding: '6px', borderRadius: '4px'}} title="Delete"><Trash2 size={16} /></button>
                                </>
                            )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#64748b' }}>
                                <User size={14}/> {task.owner_name || 'Unassigned'}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TaskSection;