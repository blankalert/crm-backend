import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { 
  Plus, LayoutList, LayoutGrid, Filter 
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
  const [pipelines, setPipelines] = useState([]) // Stores full pipeline objects
  
  // VIEW STATE
  const [viewMode, setViewMode] = useState('list') 
  const [selectedPipelineId, setSelectedPipelineId] = useState('') // Tracks active pipeline for Kanban
  
  // DETAIL VIEW DATA
  const [leadDetail, setLeadDetail] = useState(null)
  const [selectedLeadId, setSelectedLeadId] = useState(null)
  
  // FORM STATE
  const [leadForm, setLeadForm] = useState({ 
      leadRID: '', name: '', lead_date: new Date().toISOString().split('T')[0],
      category: '', company_email: '', company_phone: '', lead_message: '', remark: '', 
      source: '', owner: '', status: 'New', pipeline: '', 
      req_amount: '', lead_type: 'Warm', priority: 'Medium', company_name: '', 
      city: '', state: '', 
      phones: [{ number: '', type: 'Mobile' }], 
      emails: [{ email: '', type: 'Work' }],
      address: { line: '', city: '', state: '', zipcode: '' }
  })
  
  // Shared State
  const [activeDetailTab, setActiveDetailTab] = useState('details')
  const [showClosePopup, setShowClosePopup] = useState(false)
  const [closeStatus, setCloseStatus] = useState('') 
  const [closeReason, setCloseReason] = useState('')
  const [draggedLeadId, setDraggedLeadId] = useState(null)
  
  // PIPELINE CONFIRMATION STATE
  const [targetStage, setTargetStage] = useState(null)

  // CONSTANTS
  const closedStages = ['Won', 'Lost', 'Unqualified'];

  useEffect(() => {
    if(token) {
        fetchLeads()
        fetchUsers()
        fetchPipelines()
    }
  }, [token])

  useEffect(() => {
      if (id) fetchLeadDetails(id);
      else { setLeadDetail(null); setSelectedLeadId(null); if (viewMode === 'detail') setViewMode('kanban'); }
  }, [id, token])

  const fetchLeads = async () => {
    try { const res = await axios.get('http://localhost:3000/api/leads', { headers: { Authorization: `Bearer ${token}` } }); setLeads(res.data); } catch(e){ console.error(e); }
  }
  const fetchUsers = async () => {
    try { const res = await axios.get('http://localhost:3000/api/users', { headers: { Authorization: `Bearer ${token}` } }); setUsers(res.data); } catch(e){ console.error(e); }
  }
  
  // Fetch Pipelines & Set Default
  const fetchPipelines = async () => {
      try { 
          const res = await axios.get('http://localhost:3000/api/pipelines?module=Lead', { headers: { Authorization: `Bearer ${token}` } }); 
          setPipelines(res.data);
          // Default to first pipeline for Kanban view
          if(res.data.length > 0 && !selectedPipelineId) setSelectedPipelineId(res.data[0].id);
      } catch(e){ console.error(e); }
  }

  const fetchLeadDetails = async (leadId) => {
      try {
          const res = await axios.get(`http://localhost:3000/api/leads/${leadId}`, { headers: { Authorization: `Bearer ${token}` } });
          setLeadDetail(res.data);
          setSelectedLeadId(leadId);
          setViewMode('detail');
      } catch(e) { navigate('/dashboard/leads'); }
  }

  // --- ACTIONS ---
  const handleRowClick = (lead) => { navigate(`/dashboard/leads/details/${lead.id}`); }

  const handleEditClick = async (leadOrId) => {
      const leadId = leadOrId.id || leadOrId;
      try {
          const res = await axios.get(`http://localhost:3000/api/leads/${leadId}`, { headers: { Authorization: `Bearer ${token}` } });
          const fullLead = res.data;
          
          setLeadForm({
              leadRID: fullLead.leadRID || fullLead.leadrid,
              name: fullLead.title || '',
              // ... map other fields ...
              lead_date: fullLead.lead_date ? fullLead.lead_date.split('T')[0] : '',
              category: fullLead.category || '', company_email: fullLead.company_email || '', company_phone: fullLead.company_phone || '',
              lead_message: fullLead.lead_message || '', remark: fullLead.remark || '', source: fullLead.source || '',
              owner: fullLead.owner || '', status: fullLead.status || 'New', pipeline: fullLead.pipeline || '',
              req_amount: fullLead.req_amount || '', lead_type: fullLead.lead_type || 'Warm', priority: fullLead.priority || 'Medium',
              company_name: fullLead.company_name || '', city: fullLead.city || '', state: fullLead.state || '',
              phones: fullLead.phones || [], emails: fullLead.emails || [],
              address: fullLead.address || { line: '', city: '', state: '', zipcode: '' }
          });
          setLeadDetail(fullLead); setSelectedLeadId(fullLead.id); setViewMode('edit');
      } catch(e) { console.error(e); }
  }

  const handleAddNew = () => {
      // Default to current Kanban Pipeline
      const currentPipe = pipelines.find(p => p.id === selectedPipelineId);
      const currentPipeName = currentPipe?.pipeline_name || '';
      const firstStage = currentPipe?.stages[0]?.name || 'New';

      setLeadForm({ 
          leadRID: '', name: '', lead_date: new Date().toISOString().split('T')[0], category: '', company_email: '', company_phone: '', 
          lead_message: '', remark: '', source: '', owner: '', 
          status: firstStage, pipeline: currentPipeName, 
          req_amount: '', lead_type: 'Warm', priority: 'Medium', company_name: '', city: '', state: '', 
          phones: [], emails: [], address: { line: '', city: '', state: '', zipcode: '' }
      });
      setViewMode('edit');
      setSelectedLeadId(null);
  }

  const handleSave = async (e) => {
      e.preventDefault();
      try {
          if (viewMode === 'edit' && selectedLeadId) {
             await axios.put(`http://localhost:3000/api/leads/${selectedLeadId}`, leadForm, { headers: { Authorization: `Bearer ${token}` } });
          } else {
             await axios.post('http://localhost:3000/api/leads', leadForm, { headers: { Authorization: `Bearer ${token}` } });
          }
          fetchLeads();
          if(id) fetchLeadDetails(id); else setViewMode('kanban'); 
      } catch(err) { alert("Save Failed"); }
  }

  const confirmCloseLead = async () => {
      if (!selectedLeadId || !closeStatus) return;
      
      const payload = {
          status: closeStatus,
          close_reason: closeReason,
      };

      try {
          await axios.put(`http://localhost:3000/api/leads/${selectedLeadId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
          
          setShowClosePopup(false);
          setCloseReason('');
          setCloseStatus('');
          
          fetchLeads();
          if (id) fetchLeadDetails(id);

      } catch (err) {
          console.error("Failed to close lead:", err);
          alert("Failed to close lead.");
      }
  }

  const handleStageSelect = (stage) => setTargetStage(stage);
  
  const handleConfirmStageUpdate = async () => {
      if(!targetStage || !selectedLeadId) return;
      try {
          await axios.put(`http://localhost:3000/api/leads/${selectedLeadId}`, { status: targetStage }, { headers: { Authorization: `Bearer ${token}` } });
          fetchLeadDetails(selectedLeadId);
          setTargetStage(null);
      } catch(e) { alert("Failed"); }
  }
  
  const handleQuickStatusUpdate = async (newStatus) => {
      setLeadDetail(prev => ({ ...prev, status: newStatus }));
      try {
          await axios.put(`http://localhost:3000/api/leads/${selectedLeadId}`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
          fetchLeads();
      } catch(err) { alert("Status Update Failed"); }
  }

  // --- DERIVE STAGES FOR KANBAN ---
  const getCurrentPipelineStages = () => {
      const activePipe = pipelines.find(p => p.id === selectedPipelineId);
      if (!activePipe) return ['New']; // Fallback
      
      // Return stage names + closed stages
      return [...activePipe.stages.map(s => s.name), ...closedStages];
  }

  // --- KANBAN RENDERER ---
  const getStatusColor = (s) => {
      if(s==='Won') return {bg:'#dcfce7',t:'#166534',b:'#86efac'};
      if(s==='Lost') return {bg:'#fee2e2',t:'#991b1b',b:'#fca5a5'};
      return {bg:'#f1f5f9',t:'#475569',b:'#cbd5e1'};
  }

  const renderKanban = useCallback((filteredLeads) => {
      // Filter leads by Pipeline Name too
      const activePipeName = pipelines.find(p => p.id === selectedPipelineId)?.pipeline_name;
      // If no pipeline selected yet (loading), don't filter strictly or show empty
      const pipelineLeads = activePipeName 
          ? filteredLeads.filter(l => l.pipeline === activePipeName)
          : filteredLeads; 
      
      const currentStatuses = getCurrentPipelineStages();

      return (
          <KanbanBoard 
              leads={pipelineLeads} statuses={currentStatuses} 
              onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} 
              onCardClick={handleRowClick} getStatusColor={getStatusColor}
          />
      )
  }, [leads, draggedLeadId, selectedPipelineId, pipelines]);

  // --- HEADER ACTIONS ---
  const headerActions = (
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* PIPELINE SELECTOR */}
          <select 
             className="btn-secondary" 
             style={{height:'34px', borderColor:'#cbd5e1'}}
             value={selectedPipelineId}
             onChange={(e) => setSelectedPipelineId(e.target.value)}
          >
              {pipelines.map(p => <option key={p.id} value={p.id}>{p.pipeline_name}</option>)}
          </select>

          <div style={{ display: 'flex', gap: '5px', background: '#e2e8f0', padding: '4px', borderRadius: '6px' }}>
              <button onClick={() => setViewMode('list')} style={{ background: viewMode === 'list' ? 'white' : 'transparent', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}><LayoutList size={18} color={viewMode==='list'?'#2563eb':'#64748b'} /></button>
              <button onClick={() => setViewMode('kanban')} style={{ background: viewMode === 'kanban' ? 'white' : 'transparent', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}><LayoutGrid size={18} color={viewMode==='kanban'?'#2563eb':'#64748b'} /></button>
          </div>
      </div>
  )

  // ... [Handlers: handleDelete, onDragStart/Over/Drop, etc. - keep existing logic]
  const handleDelete = async (lead) => { /*...*/ }
  const onDragStart = (e, leadId) => { setDraggedLeadId(leadId); e.dataTransfer.effectAllowed = "move"; }
  const onDragOver = (e) => { e.preventDefault(); }
  const onDrop = async (e, newStatus) => {
      e.preventDefault(); if (!draggedLeadId) return;
      // Optimistic update
      const updatedLeads = leads.map(l => l.id === draggedLeadId ? { ...l, status: newStatus } : l);
      setLeads(updatedLeads);
      try { await axios.put(`http://localhost:3000/api/leads/${draggedLeadId}`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } }); fetchLeads(); } 
      catch(err) { fetchLeads(); }
      setDraggedLeadId(null);
  }
  const handleChange = (field, val) => setLeadForm(p => ({...p, [field]: val}));
  const handleArrayChange = (field, idx, key, val) => { const arr = [...leadForm[field]]; arr[idx][key] = val; setLeadForm(p => ({...p, [field]: arr})); }
  const addItem = (field, item) => setLeadForm(p => ({...p, [field]: [...p[field], item]}));
  const removeItem = (field, idx) => setLeadForm(p => ({...p, [field]: p[field].filter((_,i)=>i!==idx)}));
  const handleAddress = (k, v) => setLeadForm(p => ({...p, address: {...p.address, [k]: v}}));
  const initiateCloseLead = (status) => { setCloseStatus(status); setCloseReason(''); setShowClosePopup(true); }

  const leadColumns = [
      { key: 'leadrid', label: 'ID' },
      { key: 'title', label: 'Name' }, { key: 'company_name', label: 'Company' },
      { key: 'pipeline', label: 'Pipeline' }, { key: 'status', label: 'Stage' }, 
      { key: 'req_amount', label: 'Value ($)' }, { key: 'agent_name', label: 'Owner' }, 
      { key: 'priority', label: 'Priority' }
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '20px' }}>
        
        {/* CASE 1: DETAIL VIEW */}
        {id && leadDetail && viewMode !== 'edit' && (
            <LeadDetails 
                lead={leadDetail}
                onBack={() => navigate('/dashboard/leads')}
                onEdit={() => handleEditClick(leadDetail)}
                activeTab={activeDetailTab}
                setActiveTab={setActiveDetailTab}
                users={users}
                token={token}
                
                // Pass Active Pipeline Stages for Progress Bar
                // We find the pipeline object matching lead.pipeline string
                pipelineStages={pipelines.find(p => p.pipeline_name === leadDetail.pipeline)?.stages.map(s => s.name) || ['New', 'Contacted']}
                pipelines={pipelines}
                
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
                // Fix index calc for dynamic stages
                currentStageIndex={(pipelines.find(p => p.pipeline_name === leadDetail.pipeline)?.stages.map(s => s.name) || []).indexOf(leadDetail.status)}
            />
        )}

        {/* CASE 2: LIST / KANBAN */}
        {!id && viewMode !== 'edit' && (
            <AdvancedTable 
                tableName="leads_module"
                title="Sales Pipeline"
                columns={leadColumns}
                data={leads} // Filtered by pipeline inside renderKanban, but full list passed to Table
                onAdd={handleAddNew}
                onDelete={handleDelete}
                onEdit={handleEditClick} 
                onRowClick={handleRowClick}
                headerActions={headerActions}
                customRenderer={viewMode === 'kanban' ? renderKanban : null}
            />
        )}

        {/* CASE 3: FORM */}
        {viewMode === 'edit' && (
            <LeadForm 
                form={leadForm}
                isEditing={!!(leadDetail && leadDetail.id)}
                onBack={() => id ? setViewMode('detail') : setViewMode('kanban')}
                onSave={handleSave}
                onChange={handleChange}
                onArrayChange={handleArrayChange}
                onAddItem={addItem}
                onRemoveItem={removeItem}
                onAddressChange={handleAddress}
                users={users}
                pipelinesProp={pipelines} // PASS PIPELINES PROP HERE
            />
        )}
    </div>
  )
}

export default Leads