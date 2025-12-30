import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Circle, Clock, User, Calendar, Search, Filter, Plus, CheckSquare, ListFilter, ExternalLink, CheckCircle, XCircle, X, Phone, Mail, MessageSquare, Edit, Trash2, Loader } from 'lucide-react';
import TaskForm from './TaskForm';

const Tasks = () => {
    const { token, user } = useOutletContext();
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // View State
    const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'form'
    const [isEditing, setIsEditing] = useState(false);
    const [columnOrder, setColumnOrder] = useState(['today', 'yesterday', 'tomorrow', 'upcoming', 'old']);
    const [draggedCol, setDraggedCol] = useState(null);
    
    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [showStatusFilter, setShowStatusFilter] = useState(false);
    const [showTypeFilter, setShowTypeFilter] = useState(false);
    const [statusFilters, setStatusFilters] = useState([]);
    const [typeFilters, setTypeFilters] = useState([]);

    // Form State
    const initialForm = {
        task_name: '', task_type: 'Follow-Up', description: '', status: 'Open', priority: 'Medium',
        due_date: '', owner_id: '', related_to_module: '', related_to_id: '',
        related_rid: '', response_type: '', response_text: '', remark: ''
    };
    const [currentForm, setCurrentForm] = useState(initialForm);

    // Completion Popup State
    const [showCompletePopup, setShowCompletePopup] = useState(false);
    const [completingTask, setCompletingTask] = useState(null);
    const [completionData, setCompletionData] = useState({ response_type: '', response_text: '', remark: '' });

    // Quick View State
    const [showQuickView, setShowQuickView] = useState(false);
    const [viewingTask, setViewingTask] = useState(null);
    const [relatedLead, setRelatedLead] = useState(null);
    const [leadHistory, setLeadHistory] = useState([]);
    const [loadingQuickView, setLoadingQuickView] = useState(false);

    const RESPONSE_OPTIONS = {
        Positive: ['Interested', 'Quote Requested', 'Meeting Scheduled', 'Ready to Buy'],
        Moderate: ['Call Back Later', 'Send Information', 'Need more time', 'Thinking'],
        Negative: ['Not Interested', 'Wrong Number', 'Competitor', 'Budget Issue']
    };

    useEffect(() => {
        if (token) {
            fetchTasks();
            fetchUsers();
        }
    }, [token]);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:3000/api/tasks', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTasks(res.data);
        } catch (e) {
            console.error("Failed to fetch tasks", e);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await axios.get('http://localhost:3000/api/users', { headers: { Authorization: `Bearer ${token}` } });
            setUsers(res.data);
        } catch (e) { console.error("Failed to fetch users"); }
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
    };

    // --- FORM HANDLERS ---
    const handleAddNew = () => {
        setCurrentForm(initialForm);
        setIsEditing(false);
        setViewMode('form');
    };

    const handleEdit = (task) => {
        setCurrentForm({
            ...task,
            related_rid: task.related_rid || task.leadRID || task.leadrid || '',
            due_date: task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : ''
        });
        setIsEditing(true);
        setViewMode('form');
    };

    const handleFormChange = (field, value) => {
        setCurrentForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        const now = new Date().toISOString();
        const payload = {
            ...currentForm,
            updated_at: now,
            updated_by: user?.id
        };

        if (!isEditing) {
            payload.created_at = now;
            payload.created_by = user?.id;
        }

        try {
            if (isEditing) {
                await axios.put(`http://localhost:3000/api/tasks/${currentForm.id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
            } else {
                await axios.post('http://localhost:3000/api/tasks', payload, { headers: { Authorization: `Bearer ${token}` } });
            }
            fetchTasks();
            setViewMode('kanban');
        } catch (e) {
            alert("Failed to save task");
        }
    };

    // --- ACTION HANDLERS ---
    const handleRedirect = (task) => {
        if (!task.related_to_module || !task.related_to_id) return;
        if (window.confirm(`Navigate to related ${task.related_to_module}?`)) {
            const routes = {
                'Lead': `/dashboard/leads/details/${task.related_to_id}`,
                'Customer': `/dashboard/customers/${task.related_to_id}`,
                'Order': `/dashboard/orders/${task.related_to_id}`
            };
            const path = routes[task.related_to_module];
            if (path) navigate(path);
            else alert("Route not configured for this module.");
        }
    };

    const handleTaskClick = async (task) => {
        setViewingTask(task);
        setShowQuickView(true);
        setRelatedLead(null);
        setLeadHistory([]);
        
        if (task.related_to_module === 'Lead' && task.related_to_id) {
            setLoadingQuickView(true);
            try {
                const [leadRes, historyRes] = await Promise.all([
                    axios.get(`http://localhost:3000/api/leads/${task.related_to_id}`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`http://localhost:3000/api/tasks?related_to_module=Lead&related_to_id=${task.related_to_id}`, { headers: { Authorization: `Bearer ${token}` } })
                ]);
                
                setRelatedLead(leadRes.data);
                
                const history = historyRes.data
                    .filter(t => t.status === 'Completed' && t.id !== task.id)
                    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
                    .slice(0, 5);
                setLeadHistory(history);
            } catch (e) {
                console.error("Failed to fetch details", e);
            } finally {
                setLoadingQuickView(false);
            }
        }
    };

    const handleCancelTask = async (task) => {
        if (window.confirm("Are you sure you want to CANCEL this task?")) {
            try {
                await axios.put(`http://localhost:3000/api/tasks/${task.id}`, { ...task, status: 'Cancelled' }, { headers: { Authorization: `Bearer ${token}` } });
                fetchTasks();
                setShowQuickView(false);
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
            setShowCompletePopup(false); setCompletingTask(null); fetchTasks(); setShowQuickView(false);
        } catch (e) { alert("Failed to complete task"); }
    };

    // --- FILTER LOGIC ---
    const toggleFilter = (list, setList, value) => {
        if (list.includes(value)) setList(list.filter(i => i !== value));
        else setList([...list, value]);
    };

    const filteredTasks = tasks.filter(t => {
        const matchesSearch = t.task_name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilters.length === 0 || statusFilters.includes(t.status);
        const matchesType = typeFilters.length === 0 || typeFilters.includes(t.task_type);
        return matchesSearch && matchesStatus && matchesType;
    });

    // --- KANBAN LOGIC ---
    const categorizeTasks = (taskList) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const categories = {
            old: [],
            yesterday: [],
            today: [],
            tomorrow: [],
            upcoming: []
        };

        taskList.forEach(task => {
            if (task.status === 'Completed') return;

            if (!task.due_date) {
                categories.upcoming.push(task);
                return;
            }

            const d = new Date(task.due_date);
            d.setHours(0, 0, 0, 0);

            if (d.getTime() === today.getTime()) categories.today.push(task);
            else if (d.getTime() === yesterday.getTime()) categories.yesterday.push(task);
            else if (d.getTime() === tomorrow.getTime()) categories.tomorrow.push(task);
            else if (d < today) categories.old.push(task);
            else categories.upcoming.push(task);
        });

        // Sort Old: Descending (Newest overdue first)
        categories.old.sort((a, b) => new Date(b.due_date) - new Date(a.due_date));
        
        // Sort others: Ascending
        categories.upcoming.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
        
        return categories;
    };

    const groupedData = categorizeTasks(filteredTasks);

    const columnDefs = {
        today: { title: 'Today', data: groupedData.today, isGrouped: false, color: '#22c55e' },
        yesterday: { title: 'Yesterday', data: groupedData.yesterday, isGrouped: false, color: '#f97316' },
        tomorrow: { title: 'Tomorrow', data: groupedData.tomorrow, isGrouped: false, color: '#3b82f6' },
        upcoming: { title: 'Upcoming', data: groupedData.upcoming, isGrouped: true, color: '#64748b' },
        old: { title: 'Old', data: groupedData.old, isGrouped: true, color: '#ef4444' }
    };

    const renderTaskCard = (task) => (
        <div key={task.id} onClick={() => handleTaskClick(task)} style={{ background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Header: Task Name (Type) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '1rem', lineHeight: '1.4' }}>
                    {task.task_name} 
                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'normal', marginLeft: '6px' }}>({task.task_type})</span>
                </div>
                <span style={{ 
                    fontSize: '0.75rem', fontWeight: '600', padding: '2px 8px', borderRadius: '4px',
                    background: task.priority === 'High' ? '#fee2e2' : (task.priority === 'Low' ? '#dbeafe' : '#ffedd5'),
                    color: task.priority === 'High' ? '#991b1b' : (task.priority === 'Low' ? '#1e40af' : '#9a3412')
                }}>{task.priority}</span>
            </div>

            {/* Body: Module, Description */}
            <div style={{ fontSize: '0.9rem', color: '#475569' }}>
                {task.related_to_module && (
                    <div style={{ marginBottom: '6px', fontSize: '0.75rem', fontWeight: '600', color: '#3b82f6', background: '#eff6ff', width: 'fit-content', padding: '2px 6px', borderRadius: '4px' }}>
                        {task.related_to_module} {(task.related_rid || task.leadrid || task.leadRID || task.related_to_id) ? `#${task.related_rid || task.leadrid || task.leadRID || task.related_to_id}` : ''}
                    </div>
                )}
                {task.description && (
                    <div style={{ color: '#64748b', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.5' }}>
                        {task.description}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#94a3b8' }}>
                {task.status !== 'Completed' ? (
                    <>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#1e293b', fontWeight: '700' }}><Clock size={14} /> {task.due_date ? new Date(task.due_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'No Time'}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={14} /> {task.owner_name || 'Unassigned'}</span>
                    </>
                ) : (
                    <>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500', color: task.response_type === 'Positive' ? '#16a34a' : (task.response_type === 'Negative' ? '#dc2626' : '#64748b') }}>{task.response_type || 'No Response'}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><CheckSquare size={14} /> {task.updated_at ? new Date(task.updated_at).toLocaleDateString() : 'Done'}</span>
                    </>
                )}
            </div>

            {/* Action Buttons */}
            {task.status !== 'Completed' && task.status !== 'Cancelled' && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleRedirect(task); }}
                        disabled={!task.related_to_module || !task.related_to_id}
                        title="Go to Related Entity"
                        style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f1f5f9', color: (!task.related_to_module || !task.related_to_id) ? '#cbd5e1' : '#64748b', padding: '8px', borderRadius: '4px', border: 'none', cursor: (!task.related_to_module || !task.related_to_id) ? 'default' : 'pointer' }}
                    >
                        <ExternalLink size={16} />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); initiateCompleteTask(task); }}
                        title="Complete Task"
                        style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#dcfce7', color: '#166534', padding: '8px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                    >
                        <CheckCircle size={16} />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleCancelTask(task); }}
                        title="Cancel Task"
                        style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#fee2e2', color: '#991b1b', padding: '8px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                    >
                        <XCircle size={16} />
                    </button>
                </div>
            )}
        </div>
    );

    const renderGroupedTasks = (taskList) => {
        if (taskList.length === 0) return <div style={{ textAlign: 'center', color: '#cbd5e1', marginTop: '20px', fontSize: '0.9rem' }}>No tasks</div>;

        const groups = [];
        let currentGroup = null;

        taskList.forEach(task => {
            const dateStr = task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'No Date';
            
            if (!currentGroup || currentGroup.date !== dateStr) {
                currentGroup = { date: dateStr, tasks: [] };
                groups.push(currentGroup);
            }
            currentGroup.tasks.push(task);
        });

        return groups.map(group => (
            <div key={group.date} style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px', background:'#f1f5f9', padding:'4px 8px', borderRadius:'4px', width:'fit-content' }}>
                    <Calendar size={14} /> {group.date} <span style={{fontWeight:'normal', color:'#94a3b8'}}>({group.tasks.length})</span>
                </div>
                {group.tasks.map(renderTaskCard)}
            </div>
        ));
    };

    const handleColDragStart = (e, colKey) => {
        setDraggedCol(colKey);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleColDragOver = (e, targetKey) => {
        e.preventDefault();
        if (!draggedCol || draggedCol === targetKey) return;
        
        const newOrder = [...columnOrder];
        const draggedIdx = newOrder.indexOf(draggedCol);
        const targetIdx = newOrder.indexOf(targetKey);
        
        if (draggedIdx !== -1 && targetIdx !== -1) {
            newOrder.splice(draggedIdx, 1);
            newOrder.splice(targetIdx, 0, draggedCol);
            setColumnOrder(newOrder);
        }
    };

    const renderColumn = (key) => {
        const def = columnDefs[key];
        if (!def) return null;
        const { title, data, isGrouped, color } = def;

        return (
            <div 
                key={key}
                draggable
                onDragStart={(e) => handleColDragStart(e, key)}
                onDragOver={(e) => handleColDragOver(e, key)}
                style={{ minWidth: '340px', maxWidth: '340px', background: '#f8fafc', borderRadius: '8px', display: 'flex', flexDirection: 'column', height: '100%', borderTop: `4px solid ${color}`, flexShrink: 0, cursor: 'grab' }}
            >
                <div style={{ padding: '15px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>{title}</h3>
                    <span style={{ background: color, color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>{data.length}</span>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
                    {isGrouped ? renderGroupedTasks(data) : (
                        data.length > 0 ? data.map(renderTaskCard) : <div style={{ textAlign: 'center', color: '#cbd5e1', marginTop: '20px', fontSize: '0.9rem' }}>No tasks</div>
                    )}
                </div>
            </div>
        );
    };

    if (viewMode === 'form') {
        return (
            <TaskForm 
                form={currentForm} 
                isEditing={isEditing} 
                onBack={() => setViewMode('kanban')} 
                onSave={handleSave} 
                onChange={handleFormChange}
                users={users}
                token={token}
            />
        );
    }

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '20px', overflow: 'hidden' }}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                <h2 style={{ margin: 0, color: '#1e293b' }}>My Tasks</h2>
                
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {/* Search */}
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input 
                            placeholder="Search tasks..." 
                            className="form-input" 
                            style={{ paddingLeft: '32px', height: '36px', width: '200px' }}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Status Filter */}
                    <div style={{ position: 'relative' }}>
                        <button className={`btn-secondary ${statusFilters.length > 0 ? 'active' : ''}`} onClick={() => setShowStatusFilter(!showStatusFilter)} style={{ height: '36px', display: 'flex', gap: '5px', alignItems: 'center' }}>
                            <CheckSquare size={16} /> Status {statusFilters.length > 0 && `(${statusFilters.length})`}
                        </button>
                        {showStatusFilter && (
                            <div className="adv-dropdown-menu" style={{ right: 0, left: 'auto', width: '150px' }}>
                                {['Open', 'In Progress', 'Completed', 'Cancelled'].map(s => (
                                    <div key={s} className="menu-item" onClick={() => toggleFilter(statusFilters, setStatusFilters, s)}>
                                        <div className={`checkbox ${statusFilters.includes(s) ? 'checked' : ''}`}>{statusFilters.includes(s) && <CheckSquare size={12} />}</div> {s}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Type Filter */}
                    <div style={{ position: 'relative' }}>
                        <button className={`btn-secondary ${typeFilters.length > 0 ? 'active' : ''}`} onClick={() => setShowTypeFilter(!showTypeFilter)} style={{ height: '36px', display: 'flex', gap: '5px', alignItems: 'center' }}>
                            <ListFilter size={16} /> Type {typeFilters.length > 0 && `(${typeFilters.length})`}
                        </button>
                        {showTypeFilter && (
                            <div className="adv-dropdown-menu" style={{ right: 0, left: 'auto', width: '150px' }}>
                                {['Follow-Up', 'Call', 'Reminder', 'Todo', 'Meeting'].map(t => (
                                    <div key={t} className="menu-item" onClick={() => toggleFilter(typeFilters, setTypeFilters, t)}>
                                        <div className={`checkbox ${typeFilters.includes(t) ? 'checked' : ''}`}>{typeFilters.includes(t) && <CheckSquare size={12} />}</div> {t}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button onClick={handleAddNew} className="btn-primary" style={{ height: '36px', display: 'flex', gap: '5px', alignItems: 'center' }}>
                        <Plus size={18} /> Add Task
                    </button>
                </div>
            </div>
            
            {loading ? (
                <div>Loading tasks...</div>
            ) : (
                <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', height: '100%', paddingBottom: '10px' }}>
                    {columnOrder.map(key => renderColumn(key))}
                </div>
            )}

            {/* QUICK VIEW POPUP */}
            {showQuickView && viewingTask && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '900px', maxHeight: '90vh', overflowY: 'auto', background: 'white', padding: '24px', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0 }}>Task Details</h3>
                            <button onClick={() => setShowQuickView(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                            {/* LEFT: Task Info */}
                            <div>
                                <h4 style={{ margin: '0 0 15px 0', color: '#1e293b', fontSize: '1.2rem' }}>{viewingTask.task_name}</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '0.9rem', color: '#475569', marginBottom: '20px' }}>
                                    <div><strong>Type:</strong> {viewingTask.task_type}</div>
                                    <div><strong>Status:</strong> <span style={{ color: viewingTask.status === 'Completed' ? '#16a34a' : '#475569' }}>{viewingTask.status}</span></div>
                                    <div><strong>Priority:</strong> {viewingTask.priority}</div>
                                    <div><strong>Due:</strong> {viewingTask.due_date ? new Date(viewingTask.due_date).toLocaleString() : '-'}</div>
                                    <div><strong>Owner:</strong> {viewingTask.owner_name || 'Unassigned'}</div>
                                </div>
                                {viewingTask.description && (
                                    <div style={{ marginBottom: '20px', background: '#f8fafc', padding: '15px', borderRadius: '6px', fontSize: '0.9rem', color: '#334155' }}>
                                        <strong>Description:</strong><br/>
                                        {viewingTask.description}
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                    {viewingTask.status !== 'Completed' && viewingTask.status !== 'Cancelled' && (
                                        <>
                                            <button onClick={() => initiateCompleteTask(viewingTask)} className="btn-primary" style={{ background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '5px' }}><CheckCircle size={16} /> Complete</button>
                                            <button onClick={() => handleCancelTask(viewingTask)} className="btn-secondary" style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '5px' }}><XCircle size={16} /> Cancel</button>
                                        </>
                                    )}
                                    <button onClick={() => { setShowQuickView(false); handleEdit(viewingTask); }} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Edit size={16} /> Edit</button>
                                </div>
                            </div>

                            {/* RIGHT: Lead Info & History */}
                            <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '30px' }}>
                                {loadingQuickView ? (
                                    <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}><Loader className="animate-spin" /></div>
                                ) : relatedLead ? (
                                    <>
                                        <h4 style={{ margin: '0 0 15px 0', color: '#64748b', fontSize: '0.9rem', textTransform: 'uppercase' }}>Lead Details</h4>
                                        <div style={{ marginBottom: '20px' }}>
                                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#1e293b' }}>{relatedLead.title}</div>
                                            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>{relatedLead.company_name}</div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '10px', fontSize: '0.9rem' }}>
                                                {relatedLead.company_phone && <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Phone size={14} /> {relatedLead.company_phone}</div>}
                                                {relatedLead.company_email && <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Mail size={14} /> {relatedLead.company_email}</div>}
                                            </div>
                                            {relatedLead.lead_message && (
                                                <div style={{ marginTop: '10px', fontSize: '0.9rem', color: '#475569', fontStyle: 'italic' }}>
                                                    <MessageSquare size={14} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
                                                    "{relatedLead.lead_message}"
                                                </div>
                                            )}
                                        </div>

                                        <h4 style={{ margin: '20px 0 10px 0', color: '#64748b', fontSize: '0.9rem', textTransform: 'uppercase' }}>Recent Activity</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {leadHistory.length > 0 ? leadHistory.map(h => (
                                                <div key={h.id} style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', fontSize: '0.85rem' }}>
                                                    <div style={{ fontWeight: '600', color: '#334155' }}>{h.task_name}</div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', color: '#64748b' }}>
                                                        <span style={{ color: h.response_type === 'Positive' ? '#16a34a' : (h.response_type === 'Negative' ? '#dc2626' : '#ca8a04') }}>{h.response_type} - {h.response_text}</span>
                                                        <span>{new Date(h.updated_at).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            )) : <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>No recent history</div>}
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ color: '#94a3b8', textAlign: 'center', marginTop: '20px' }}>No related lead details available.</div>
                                )}
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
        </div>
    );
};

export default Tasks;
