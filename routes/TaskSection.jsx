import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, Clock, User, CheckCircle, Circle } from 'lucide-react';

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
                <form onSubmit={handleSave} className="card" style={{ background: '#f8fafc', marginBottom: '20px' }}>
                    {/* Form fields here */}
                    <input name="task_name" value={form.task_name} onChange={handleInputChange} placeholder="Task Name" className="form-input" required />
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '10px 0'}}>
                        <select name="task_type" value={form.task_type} onChange={handleInputChange} className="form-input">
                            <option>Follow-Up</option><option>Call</option><option>Reminder</option><option>Todo</option>
                        </select>
                        <select name="status" value={form.status} onChange={handleInputChange} className="form-input">
                            <option>Open</option><option>In Progress</option><option>Completed</option><option>Cancelled</option>
                        </select>
                        <select name="priority" value={form.priority} onChange={handleInputChange} className="form-input">
                            <option>Medium</option><option>High</option><option>Low</option>
                        </select>
                        <input name="due_date" type="datetime-local" value={form.due_date} onChange={handleInputChange} className="form-input" />
                        <select name="owner_id" value={form.owner_id} onChange={handleInputChange} className="form-input">
                            <option value="">Assign to...</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                        </select>
                    </div>
                    <textarea name="description" value={form.description} onChange={handleInputChange} placeholder="Description..." className="form-input" rows="2"></textarea>
                    <div style={{ textAlign: 'right', marginTop: '10px' }}>
                        <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                        <button type="submit" className="btn-primary">Save Task</button>
                    </div>
                </form>
            )}

            <div>
                {tasks.map(task => (
                    <div key={task.id} style={{ display: 'flex', alignItems: 'center', padding: '10px', borderBottom: '1px solid #eee' }}>
                        <button onClick={() => toggleStatus(task)} style={{background:'none', border:'none', cursor:'pointer', marginRight:'10px'}}>
                            {task.status === 'Completed' ? <CheckCircle size={20} color="#22c55e" /> : <Circle size={20} color="#94a3b8" />}
                        </button>
                        <div style={{ flex: 1, textDecoration: task.status === 'Completed' ? 'line-through' : 'none', color: task.status === 'Completed' ? '#94a3b8' : 'inherit' }}>
                            <div style={{ fontWeight: '600' }}>{task.task_name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', gap: '15px', marginTop: '4px' }}>
                                <span style={{display:'flex', alignItems:'center', gap:'4px'}}><Clock size={12}/> {formatDate(task.due_date)}</span>
                                <span style={{display:'flex', alignItems:'center', gap:'4px'}}><User size={12}/> {task.owner_name || 'Unassigned'}</span>
                            </div>
                        </div>
                        <div>
                            <button onClick={() => handleEdit(task)} className="btn-icon"><Edit size={16} /></button>
                            <button onClick={() => handleDelete(task.id)} className="btn-icon" style={{color: '#ef4444'}}><Trash2 size={16} /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TaskSection;