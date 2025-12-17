import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { 
  Plus, LayoutList, LayoutGrid 
} from 'lucide-react'
import '../../App.css'
import AdvancedTable from '../AdvancedTable'

// Import Modules
import LeadDetails from './LeadDetails'
import LeadForm from './LeadForm'
import KanbanBoard from './KanbanBoard'

const Leads = () => {
  const { token } = useOutletContext();
  const { id } = useParams(); 
  const navigate = useNavigate();

  const [leads, setLeads] = useState([])
  const [users, setUsers] = useState([]) 
  
  // VIEW STATE
  const [viewMode, setViewMode] = useState('kanban') 
  const [isFormOpen, setIsFormOpen] = useState(false) 

  // DETAIL VIEW DATA
  const [leadDetail, setLeadDetail] = useState(null)
  // We keep selectedLeadId for the Edit Form logic
  const [selectedLeadId, setSelectedLeadId] = useState(null)
  
  // FORM STATE
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
  
  // Shared State for Details View
  const [activeDetailTab, setActiveDetailTab] = useState('details')
  const [showClosePopup, setShowClosePopup] = useState(false)
  const [closeStatus, setCloseStatus] = useState('') 
  const [closeReason, setCloseReason] = useState('')
  const [draggedLeadId, setDraggedLeadId] = useState(null)
  
  // PIPELINE CONFIRMATION STATE
  const [targetStage, setTargetStage] = useState(null)

  const statuses = ['New', 'Contacted', 'Qualified', 'Negotiation', 'Won', 'Lost'];
  const pipelineStages = ['New', 'Contacted', 'Qualified', 'Negotiation'];
  const closedStages = ['Won', 'Lost', 'Unqualified'];
  const allStatuses = [...pipelineStages, ...closedStages];
  const pipelines = ['Standard', 'Enterprise', 'Quick Sale']; 

  useEffect(() => {
    fetchLeads()
    fetchUsers()
  }, [token])

  useEffect(() => {
      if (id) {
          fetchLeadDetails(id);
      } else {
          setLeadDetail(null);
          setSelectedLeadId(null);
          if (viewMode === 'detail') setViewMode('kanban'); 
      }
  }, [id, token])

  const fetchLeads = async () => {
    try { const res = await axios.get('http://localhost:3000/api/leads', { headers: { Authorization: `Bearer ${token}` } }); setLeads(res.data); } catch(e){ console.error("Failed to load leads", e); }
  }
  const fetchUsers = async () => {
    try { const res = await axios.get('http://localhost:3000/api/users', { headers: { Authorization: `Bearer ${token}` } }); setUsers(res.data); } catch(e){ console.error("Failed to load users", e); }
  }

  const fetchLeadDetails = async (leadId) => {
      try {
          const res = await axios.get(`http://localhost:3000/api/leads/${leadId}`, { headers: { Authorization: `Bearer ${token}` } });
          setLeadDetail(res.data);
          setSelectedLeadId(leadId); // FIX: Ensure this is set so updates know which ID to use
          setViewMode('detail');
          setTargetStage(null); // Reset pending stage selection
      } catch(e) { 
          console.error("Failed to fetch lead details"); 
          navigate('/dashboard/leads'); 
      }
  }

  // --- ACTIONS ---
  
  const handleRowClick = (lead) => {
      navigate(`/dashboard/leads/details/${lead.id}`);
  }

  const handleEditClick = async (leadOrId) => {
      const leadId = leadOrId.id || leadOrId;
      try {
          const res = await axios.get(`http://localhost:3000/api/leads/${leadId}`, { headers: { Authorization: `Bearer ${token}` } });
          const fullLead = res.data;
          
          setLeadForm({
              name: fullLead.title || '',
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
          setLeadDetail(fullLead); 
          setSelectedLeadId(fullLead.id);
          setViewMode('edit');
      } catch(e) { console.error("Failed to load for edit", e); }
  }

  const handleAddNew = () => {
      setLeadForm({ 
          name: '', lead_date: new Date().toISOString().split('T')[0], category: '', company_email: '', company_phone: '', 
          lead_message: '', remark: '', source: '', owner: '', status: 'New', pipeline: 'Standard', 
          req_amount: '', lead_type: 'Warm', priority: 'Medium', company_name: '', city: '', state: '', 
          phones: [], emails: [], address: { line: '', city: '', state: '', zipcode: '' }
      });
      setViewMode('edit');
      setSelectedLeadId(null);
  }

  const handleSave = async (e) => {
      e.preventDefault();
      try {
          if (viewMode === 'edit' && selectedLeadId) { // Editing existing
             await axios.put(`http://localhost:3000/api/leads/${selectedLeadId}`, leadForm, { headers: { Authorization: `Bearer ${token}` } });
          } else { // Creating new
             await axios.post('http://localhost:3000/api/leads', leadForm, { headers: { Authorization: `Bearer ${token}` } });
          }
          fetchLeads();
          if(id) {
             fetchLeadDetails(id);
          } else {
             setViewMode('kanban'); 
          }
      } catch(err) { alert("Save Failed"); }
  }
  
  // --- PIPELINE HANDLERS ---
  
  // 1. Select Stage (Local only)
  const handleStageSelect = (stage) => {
      setTargetStage(stage);
  }

  // 2. Confirm Update (API Call)
  const handleConfirmStageUpdate = async () => {
      const activeId = leadDetail?.id || selectedLeadId;
      if(!targetStage || !activeId) return;
      
      const oldStatus = leadDetail.status;
      setLeadDetail(prev => ({ ...prev, status: targetStage })); // Optimistic UI

      try {
          await axios.put(`http://localhost:3000/api/leads/${activeId}`, { status: targetStage }, { headers: { Authorization: `Bearer ${token}` } });
          fetchLeads();
          setTargetStage(null); // Clear selection after success
      } catch(err) { 
          alert("Status Update Failed"); 
          console.error(err);
          setLeadDetail(prev => ({ ...prev, status: oldStatus })); // Revert
      }
  }

  const initiateCloseLead = (status) => { setCloseStatus(status); setCloseReason(''); setShowClosePopup(true); }
  
  const confirmCloseLead = async () => {
      if(!closeReason) return alert("Please enter a reason.");
      const activeId = leadDetail?.id || selectedLeadId;
      
      const oldStatus = leadDetail.status;
      setLeadDetail(prev => ({ ...prev, status: closeStatus, closed_reason: closeReason })); 

      try {
          await axios.put(`http://localhost:3000/api/leads/${activeId}`, { 
              status: closeStatus, 
              closed_reason: closeReason, 
              closed_time: new Date().toISOString() 
          }, { headers: { Authorization: `Bearer ${token}` } });
          
          fetchLeads(); 
          setShowClosePopup(false);
      } catch(err) { 
          alert("Failed to close lead"); 
          setLeadDetail(prev => ({ ...prev, status: oldStatus })); 
      }
  }

  const handleDelete = async (lead) => {
      if(!window.confirm(`Delete ${lead.title}?`)) return;
      try { await axios.delete(`http://localhost:3000/api/leads/${lead.id}`, { headers: { Authorization: `Bearer ${token}` } }); fetchLeads(); } catch(e){}
  }

  // --- DRAG & DROP ---
  const onDragStart = (e, leadId) => { setDraggedLeadId(leadId); e.dataTransfer.effectAllowed = "move"; }
  const onDragOver = (e) => { e.preventDefault(); }
  const onDrop = async (e, newStatus) => {
      e.preventDefault(); if (!draggedLeadId) return;
      const updatedLeads = leads.map(l => l.id === draggedLeadId ? { ...l, status: newStatus } : l);
      setLeads(updatedLeads);
      try { await axios.put(`http://localhost:3000/api/leads/${draggedLeadId}`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } }); fetchLeads(); } catch(err) { fetchLeads(); }
      setDraggedLeadId(null);
  }

  const handleChange = (field, val) => setLeadForm(p => ({...p, [field]: val}));
  const handleArrayChange = (field, idx, key, val) => { const arr = [...leadForm[field]]; arr[idx][key] = val; setLeadForm(p => ({...p, [field]: arr})); }
  const addItem = (field, item) => setLeadForm(p => ({...p, [field]: [...p[field], item]}));
  const removeItem = (field, idx) => setLeadForm(p => ({...p, [field]: p[field].filter((_,i)=>i!==idx)}));
  const handleAddress = (k, v) => setLeadForm(p => ({...p, address: {...p.address, [k]: v}}));
  
  const leadColumns = [
      { key: 'title', label: 'Name' }, { key: 'company_name', label: 'Company' },
      { key: 'pipeline', label: 'Pipeline' }, { key: 'status', label: 'Stage' }, 
      { key: 'req_amount', label: 'Value ($)' }, { key: 'agent_name', label: 'Owner' }, 
      { key: 'priority', label: 'Priority' }
  ];
  const getStatusColor = (s) => {
      if(s==='New') return {bg:'#dbeafe',t:'#1e40af',b:'#93c5fd'};
      if(s==='Won') return {bg:'#dcfce7',t:'#166534',b:'#86efac'};
      if(s==='Lost' || s==='Unqualified') return {bg:'#fee2e2',t:'#991b1b',b:'#fca5a5'};
      return {bg:'#f1f5f9',t:'#475569',b:'#cbd5e1'};
  }

  const headerActions = (
      <div style={{ display: 'flex', gap: '5px', background: '#e2e8f0', padding: '4px', borderRadius: '6px' }}>
          <button onClick={() => setViewMode('list')} style={{ background: viewMode === 'list' ? 'white' : 'transparent', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}><LayoutList size={18} color={viewMode==='list'?'#2563eb':'#64748b'} /></button>
          <button onClick={() => setViewMode('kanban')} style={{ background: viewMode === 'kanban' ? 'white' : 'transparent', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}><LayoutGrid size={18} color={viewMode==='kanban'?'#2563eb':'#64748b'} /></button>
      </div>
  )

  const renderKanban = useCallback((filteredLeads) => (
      <KanbanBoard 
          leads={filteredLeads} statuses={statuses} 
          onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} 
          onCardClick={handleRowClick} getStatusColor={getStatusColor}
      />
  ), [leads, draggedLeadId]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '20px' }}>
        
        {/* CASE 1: DETAIL VIEW (URL has ID) */}
        {id && leadDetail && viewMode !== 'edit' && (
            <LeadDetails 
                lead={leadDetail}
                onBack={() => navigate('/dashboard/leads')}
                onEdit={() => handleEditClick(leadDetail)}
                activeTab={activeDetailTab}
                setActiveTab={setActiveDetailTab}
                pipelineStages={pipelineStages}
                
                // Props for 2-Step Update
                targetStage={targetStage}
                onStageSelect={handleStageSelect}
                onConfirmStageUpdate={handleConfirmStageUpdate}
                
                onCloseLead={initiateCloseLead}
                showClosePopup={showClosePopup}
                closeStatus={closeStatus}
                closeReason={closeReason}
                setCloseReason={setCloseReason}
                onConfirmClose={confirmCloseLead}
                onCancelClose={() => setShowClosePopup(false)}
                getStatusColor={getStatusColor}
                isClosed={closedStages.includes(leadDetail.status)}
                currentStageIndex={pipelineStages.indexOf(leadDetail.status)}
            />
        )}

        {/* CASE 2: LIST / KANBAN (No URL ID) */}
        {!id && viewMode !== 'edit' && (
            <AdvancedTable 
                tableName="leads_module"
                title="Sales Pipeline"
                columns={leadColumns}
                data={leads}
                onAdd={handleAddNew}
                onDelete={handleDelete}
                onEdit={handleEditClick} 
                onRowClick={handleRowClick}
                headerActions={headerActions}
                customRenderer={viewMode === 'kanban' ? renderKanban : null}
            />
        )}

        {/* CASE 3: EDIT / ADD FORM */}
        {viewMode === 'edit' && (
            <LeadForm 
                form={leadForm}
                isEditing={!!(leadDetail && leadDetail.id)}
                onBack={() => {
                    if (id) setViewMode('detail'); 
                    else setViewMode('kanban'); 
                }}
                onSave={handleSave}
                onChange={handleChange}
                onArrayChange={handleArrayChange}
                onAddItem={addItem}
                onRemoveItem={removeItem}
                onAddressChange={handleAddress}
                users={users}
                statuses={statuses}
                pipelines={pipelines}
                allStatuses={allStatuses}
            />
        )}
    </div>
  )
}

export default Leads