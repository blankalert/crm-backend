import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, Clock, User, CheckCircle, Circle, X } from 'lucide-react';

const TaskSection = ({ token, relatedToModule, relatedToId, users }) => {
    const [tasks, setTasks] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentTask, setCurrentTask] = useState(null);

    const initialFormState = {
        task_name: '',
        task_type: 'Follow-Up',
        description: '',
        status: 'Open',
        priority: 'Medium',
        due_date: '',
        owner_id: ''
    };

    const [form, setForm] = useState(initialFormState);

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
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const payload = { ...form, related_to_module: relatedToModule, related_to_id: relatedToId };
        
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

    const handleEdit = (task) => {
        setCurrentTask(task);
        setForm({
            task_name: task.task_name,
            task_type: task.task_type,
            description: task.description || '',
            status: task.status,
            priority: task.priority,
            due_date: task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : '',
            owner_id: task.owner_id
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

    const toggleStatus = async (task) => {
        const newStatus = task.status === 'Completed' ? 'Open' : 'Completed';
        
        if (newStatus === 'Completed' && !window.confirm("Are you sure you want to mark this task as completed?")) {
            return;
        }

        try {
            await axios.put(`http://localhost:3000/api/tasks/${task.id}`, { ...task, status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
            fetchTasks();
        } catch (err) {
            alert("Failed to update status");
        }
    }

    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString() : 'No due date';

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0 }}>Tasks ({tasks.length})</h3>
                <button className="btn-primary" onClick={() => { setShowForm(true); setIsEditing(false); setForm(initialFormState); }}>
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
                                    <input name="due_date" type="datetime-local" value={form.due_date} onChange={handleInputChange} className="form-input" style={{ width: '100%' }} />
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
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Save Task</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div>
                {tasks.map(task => (
                    <div key={task.id} style={{ display: 'flex', alignItems: 'flex-start', padding: '15px', borderBottom: '1px solid #eee' }}>
                        <button onClick={() => toggleStatus(task)} style={{background:'none', border:'none', cursor:'pointer', marginRight:'15px', marginTop: '2px'}} title="Mark Complete">
                            {task.status === 'Completed' ? <CheckCircle size={20} color="#22c55e" /> : <Circle size={20} color="#94a3b8" />}
                        </button>
                        <div style={{ flex: 1, textDecoration: task.status === 'Completed' ? 'line-through' : 'none', opacity: task.status === 'Completed' ? 0.6 : 1 }}>
                            <div style={{ fontWeight: '600', fontSize: '1rem', color: '#1e293b' }}>{task.task_name}</div>
                            {task.description && <div style={{ fontSize: '0.9rem', color: '#475569', marginTop: '4px', marginBottom: '8px' }}>{task.description}</div>}
                            <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', gap: '15px', alignItems: 'center' }}>
                                <span style={{display:'flex', alignItems:'center', gap:'4px', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px'}}><Clock size={12}/> {formatDate(task.due_date)}</span>
                                <span style={{display:'flex', alignItems:'center', gap:'4px'}}><User size={12}/> {task.owner_name || 'Unassigned'}</span>
                            </div>
                        </div>
                        <div style={{display: 'flex', gap: '5px'}}>
                            <button onClick={() => handleEdit(task)} className="btn-icon" style={{color: '#64748b'}}><Edit size={16} /></button>
                            <button onClick={() => handleDelete(task.id)} className="btn-icon" style={{color: '#ef4444'}}><Trash2 size={16} /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TaskSection;