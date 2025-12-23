import React, { useState } from 'react'
import { ArrowLeft, Edit, Phone, Mail, FileText, MessageSquare, ClipboardList, CheckCircle, ChevronDown, ThumbsUp, XCircle, ThumbsDown, Clock, User, X } from 'lucide-react'
import TaskSection from './TaskSection'


const LeadDetails = ({
    lead, onBack, onEdit, activeTab, setActiveTab, pipelines, users, token,
    pipelineStages, 
    
    // Updated Props
    targetStage, onStageSelect, onConfirmStageUpdate, 
    
    onCloseLead, showClosePopup, closeStatus, closeReason, setCloseReason,
    onConfirmClose, onCancelClose, getStatusColor, isClosed, currentStageIndex
}) => {

  const formatDate = (dateString) => {
      if (!dateString) return '-';
      return new Date(dateString).toLocaleDateString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
  };

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const handleCloseOptionClick = (status) => { setIsDropdownOpen(false); onCloseLead(status); };

  const currentPipeline = pipelines.find(p => p.pipeline_name === lead.pipeline);

  const getCloseStatusName = (statusType) => {
      if (!currentPipeline) return statusType;
      switch(statusType) {
          case 'Won': return currentPipeline.won_stage_name || 'Won';
          case 'Lost': return currentPipeline.lost_stage_name || 'Lost';
          case 'Unqualified': return currentPipeline.unqualified_stage_name || 'Unqualified';
          default: return statusType;
      }
  }
  const finalCloseStatusName = isClosed ? getCloseStatusName(lead.status) : 'Close Lead';

  const availableStatuses = ['Won', 'Unqualified', 'Lost'];

  const availableReasons = currentPipeline && closeStatus
      ? currentPipeline.exit_reasons.filter(r => r.reason_type === closeStatus) 
      : [];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
        {/* --- HEADER --- */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', background: 'white', padding: '12px 20px', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <button onClick={onBack} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', display: 'flex', gap: '6px', color: '#64748b', fontSize: '0.85rem', fontWeight: '500', alignItems: 'center' }}><ArrowLeft size={16} /> Back</button>
                <div>
                    <h2 style={{ margin: 0, color: '#1e293b', fontSize: '1.4rem' }}>
                        <span style={{ color: '#94a3b8', marginRight: '10px', fontSize: '1.2rem' }}>#{lead.leadRID || lead.leadrid}</span>
                        {lead.title}
                    </h2>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '0.85rem', color: '#64748b' }}>
                        <span>{lead.company_name}</span><span>•</span><span>{lead.city || 'No Location'}</span>
                    </div>
                </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn-secondary" style={{display:'flex', gap:'5px', alignItems:'center'}}><Phone size={16}/> Call</button>
                <button className="btn-secondary" style={{display:'flex', gap:'5px', alignItems:'center'}}><Mail size={16}/> Email</button>
                <button onClick={onEdit} className="btn-secondary" style={{ display: 'flex', gap: '5px', padding:'8px 20px', alignItems:'center' }}><Edit size={18} /> Edit</button>
            </div>
        </div>

        {/* --- PIPELINE PROGRESS --- */}
        <div className="card" style={{ margin: '0 20px 15px 20px', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection:'column', gap:'10px' }}>
                {/* 1. Bar */}
                <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '50px', height: '36px', position: 'relative', overflow: 'hidden', width: '100%' }}>
                    {pipelineStages.map((stage, idx) => {
                        const isActive = lead.status === stage;
                        const isTarget = targetStage === stage;
                        const isPast = currentStageIndex > idx || isClosed;
                        const zIndex = pipelineStages.length - idx;
                        
                        // Color Logic: 
                        // Active = Blue
                        // Past = Green
                        // Target (Selected but not saved) = Purple
                        // Future = Grey
                        
                        let bg = '#f1f5f9';
                        let color = '#64748b';
                        
                        if (isTarget) { bg = '#4f46e5'; color = 'white'; } 
                        else if (isActive) { bg = '#2563eb'; color = 'white'; }
                        else if (isPast) { bg = '#22c55e'; color = 'white'; }

                        return (
                            <div key={stage} onClick={() => onStageSelect(stage)}
                                 style={{ flex: 1, background: bg, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', position: 'relative', height: '100%', zIndex: zIndex,
                                 clipPath: idx === 0 ? 'polygon(0 0, 95% 0, 100% 50%, 95% 100%, 0 100%)' : (idx === pipelineStages.length - 1 ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 5% 50%)' : 'polygon(0 0, 95% 0, 100% 50%, 95% 100%, 0 100%, 5% 50%)'),
                                 marginLeft: idx === 0 ? 0 : '-15px', paddingLeft: idx === 0 ? 0 : '15px', transition: 'background 0.2s' }}>
                                {(isActive || isPast || isTarget) && <CheckCircle size={14} style={{marginRight:'5px'}} />}
                                {stage}
                            </div>
                        )
                    })}
                </div>
                
                {/* 2. "Mark as Current" Button (Visible only when a new stage is selected) */}
                {targetStage && targetStage !== lead.status && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', animation: 'fadeIn 0.3s' }}>
                        <button 
                            onClick={onConfirmStageUpdate}
                            className="btn-primary" 
                            style={{ background: '#4f46e5', fontSize: '0.8rem', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '5px' }}
                        >
                            Mark as Current Status <CheckCircle size={14} />
                        </button>
                    </div>
                )}
            </div>

            {/* Close Dropdown */}
            <div style={{ position: 'relative', alignSelf: 'flex-start', marginTop: '4px' }}>
                <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="btn-primary" 
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', background: isClosed ? getStatusColor(lead.status).b : '#2563eb', padding: '8px 16px', fontSize: '0.9rem' }}
                >
                    {finalCloseStatusName} <ChevronDown size={16} />
                </button>
                {isDropdownOpen && (
                    <div style={{ position: 'absolute', top: '110%', right: 0, width: '180px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 50, overflow: 'hidden' }}>
                        <div onClick={() => handleCloseOptionClick('Won')} style={{ padding: '10px 15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontSize: '0.9rem' }} className="dropdown-item">
                            <ThumbsUp size={14} /> {getCloseStatusName('Won')}
                        </div>
                        <div onClick={() => handleCloseOptionClick('Unqualified')} style={{ padding: '10px 15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#991b1b', fontSize: '0.9rem' }} className="dropdown-item">
                            <XCircle size={14} /> {getCloseStatusName('Unqualified')}
                        </div>
                        <div onClick={() => handleCloseOptionClick('Lost')} style={{ padding: '10px 15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#991b1b', fontSize: '0.9rem' }} className="dropdown-item">
                            <ThumbsDown size={14} /> {getCloseStatusName('Lost')}
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* ... [Rest of the file remains same] ... */}
        {/* --- MAIN CONTENT SPLIT (75% / 25%) --- */}
        <div style={{ display: 'flex', flex: 1, gap: '20px', overflow: 'hidden', padding: '0 20px 20px' }}>
            {/* Left Content */}
            <div style={{ flex: 3, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', paddingRight: '5px' }}>
                {/* Details Section */}
                <div className="card">
                    {/* ... (Details Card Content) ... */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                        <FileText size={18} color="#2563eb" />
                        <h3 style={{ margin: 0, fontSize: '1rem', color: '#1e293b' }}>Details</h3>
                    </div>
                    {/* ... (Grid Layout for details) ... */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                         {/* ... Lead Info ... */}
                         <div>
                            <h4 style={{ color:'#94a3b8', fontSize:'0.75rem', textTransform:'uppercase', marginBottom:'15px', letterSpacing:'0.5px' }}>Lead Information</h4>
                            <div className="detail-row"><label>Amount</label><span>${lead.req_amount || '0.00'}</span></div>
                            <div className="detail-row"><label>Pipeline</label><span>{lead.pipeline}</span></div>
                            <div className="detail-row"><label>Priority</label><span>{lead.priority}</span></div>
                            <div className="detail-row"><label>Source</label><span>{lead.source || '-'}</span></div>
                            <div className="detail-row"><label>Lead Type</label><span style={{background:'#e0f2fe', color:'#0284c7', padding:'2px 8px', borderRadius:'4px', fontSize:'0.85rem'}}>{lead.lead_type}</span></div>
                        </div>
                        {/* ... Contact Info ... */}
                        <div>
                             <h4 style={{ color:'#94a3b8', fontSize:'0.75rem', textTransform:'uppercase', marginBottom:'15px', letterSpacing:'0.5px' }}>Contact</h4>
                             <div className="detail-row"><label>Email</label><span>{lead.company_email || '-'}</span></div>
                             <div className="detail-row"><label>Phone</label><span>{lead.company_phone || '-'}</span></div>
                             <div className="detail-row"><label>Address</label><span>{lead.address?.line ? `${lead.address.line}, ` : ''}{lead.city}</span></div>
                        </div>
                    </div>
                </div>

                {/* Notes Section */}
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                        <MessageSquare size={18} color="#2563eb" />
                        <h3 style={{ margin: 0, fontSize: '1rem', color: '#1e293b' }}>Notes</h3>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '20px', textAlign: 'center', color: '#94a3b8', borderRadius: '6px', border: '1px dashed #cbd5e1' }}>
                        Notes functionality coming soon.
                    </div>
                </div>
            </div>

            {/* Right Sidebar */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <TaskSection 
                    token={token}
                    relatedToModule="Lead"
                    relatedToId={lead.id}
                    users={users}
                />
            </div>
        </div>

        {/* ... [POPUP CODE SAME AS BEFORE] ... */}
        {showClosePopup && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(2px)' }}>
                <div className="card" style={{ width: '400px', padding: '24px' }}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
                        <h3 style={{ marginTop: 0, color: '#0f172a', fontSize:'1.2rem' }}>Mark as {getCloseStatusName(closeStatus)}</h3>
                        <button onClick={() => {onCancelClose(); setIsDropdownOpen(false)}} style={{background:'none', border:'none', cursor:'pointer', color:'#64748b'}}><X size={20}/></button>
                    </div>
                    {availableReasons.length > 0 ? (
                        <>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#475569', fontWeight: '500' }}>Reason for closing:</label>
                            <select
                                className="form-input"
                                value={closeReason}
                                onChange={e => setCloseReason(e.target.value)}
                                style={{ width: '100%' }}
                            >
                                <option value="">Select a reason...</option>
                                {availableReasons.map(reason => (
                                    <option key={reason.id} value={reason.description}>
                                        {reason.description}
                                    </option>
                                ))}
                            </select>
                        </>
                    ) : (
                        <p style={{fontSize: '0.9rem', color: '#64748b', background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0'}}>
                            No specific exit reasons are configured for this outcome. You can close this lead directly.
                        </p>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                        <button className="btn-secondary" onClick={() => {onCancelClose(); setIsDropdownOpen(false)}}>Cancel</button>
                        <button 
                            className="btn-primary" 
                            onClick={onConfirmClose}
                            disabled={availableReasons.length > 0 && !closeReason}
                            style={{ opacity: (availableReasons.length > 0 && !closeReason) ? 0.5 : 1, cursor: (availableReasons.length > 0 && !closeReason) ? 'not-allowed' : 'pointer' }}
                        >Confirm</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  )
}

export default LeadDetails