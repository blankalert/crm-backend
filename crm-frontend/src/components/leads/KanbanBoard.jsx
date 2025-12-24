import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { DollarSign, Loader, Edit2, ChevronDown, ChevronUp } from 'lucide-react'

// Individual Card Component
const KanbanCard = ({ lead, visibleColumns, columns, onDragStart, onCardClick, onEdit, pipelines }) => {
    const [expanded, setExpanded] = useState(false);

    // Resolve pipeline name if needed
    const leadWithPipelineName = {
        ...lead,
        pipeline_name: pipelines?.find(p => p.id === lead.pipeline)?.pipeline_name || '-'
    };

    // Filter columns to display (exclude ID and Title as they are in header)
    const displayCols = columns.filter(c => 
        visibleColumns.includes(c.key) && 
        c.key !== 'leadrid' && 
        c.key !== 'title'
    );

    // Show first 3 by default, or all if expanded
    const visibleDisplayCols = expanded ? displayCols : displayCols.slice(0, 3);

    return (
        <div 
            draggable 
            onDragStart={(e) => onDragStart(e, lead.id)}
            onClick={() => onCardClick(lead)}
            style={{ background: 'white', padding: '15px', borderRadius: '6px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', cursor: 'pointer', position: 'relative', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column', gap: '8px' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
            <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', marginBottom: '2px' }}>#{lead.leadRID || lead.leadrid}</div>
                <div style={{ fontWeight: '600', color: '#1e293b' }}>{lead.title}</div>
            </div>

            {visibleDisplayCols.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {visibleDisplayCols.map(col => (
                        <div key={col.key} style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#94a3b8' }}>{col.label}:</span>
                            <span style={{ fontWeight: '500', color: '#475569', textAlign: 'right', maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {leadWithPipelineName[col.key] || '-'}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px', paddingTop: '8px', borderTop: '1px solid #f8fafc' }}>
                {displayCols.length > 3 ? (
                    <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.75rem', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '2px' }}>{expanded ? <>Show Less <ChevronUp size={12}/></> : <>+{displayCols.length - 3} More <ChevronDown size={12}/></>}</button>
                ) : <span></span>}
                <button onClick={(e) => { e.stopPropagation(); onEdit(lead); }} style={{ background: '#f1f5f9', border: 'none', color: '#64748b', cursor: 'pointer', padding: '6px', borderRadius: '4px' }} title="Edit"><Edit2 size={14} /></button>
            </div>
        </div>
    )
}

const KanbanBoard = ({ token, pipelineId, statuses, onCardClick, getStatusColor, filters = {}, visibleColumns = [], columns = [], onEdit, pipelines }) => {
  const [kanbanData, setKanbanData] = useState({});
  const [draggedItemId, setDraggedItemId] = useState(null);

  // Initialize columns when pipeline or statuses change
  useEffect(() => {
      const initialColumns = {};
      statuses.forEach(status => {
          initialColumns[status] = { items: [], page: 1, hasMore: true, loading: false };
      });
      setKanbanData(initialColumns);
      
      // Initial fetch for all columns
      if (pipelineId) {
          statuses.forEach(status => fetchColumnData(status, 1, initialColumns));
      }
  }, [pipelineId, statuses, JSON.stringify(filters)]);

  const fetchColumnData = async (status, page, currentCols = null) => {
      const cols = currentCols || kanbanData;
      if (!cols[status]) return;

      setKanbanData(prev => ({
          ...prev,
          [status]: { ...prev[status], loading: true }
      }));

      try {
          const res = await axios.get('http://localhost:3000/api/leads', {
              headers: { Authorization: `Bearer ${token}` },
              params: {
                  pipeline: pipelineId,
                  status: status,
                  page: page,
                  limit: 15,
                  search: filters.search || ''
              }
          });

          const newItems = res.data.data;
          const pagination = res.data.pagination;

          setKanbanData(prev => ({
              ...prev,
              [status]: {
                  items: page === 1 ? newItems : [...prev[status].items, ...newItems],
                  page: page,
                  hasMore: page < pagination.totalPages,
                  loading: false
              }
          }));
      } catch (err) {
          console.error(`Failed to fetch leads for ${status}`, err);
          setKanbanData(prev => ({ ...prev, [status]: { ...prev[status], loading: false } }));
      }
  };

  const handleScroll = (e, status) => {
      const { scrollTop, scrollHeight, clientHeight } = e.target;
      if (scrollHeight - scrollTop <= clientHeight + 50) {
          const col = kanbanData[status];
          if (col && !col.loading && col.hasMore) {
              fetchColumnData(status, col.page + 1);
          }
      }
  };

  const onDragStart = (e, leadId) => {
      setDraggedItemId(leadId);
      e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e) => {
      e.preventDefault();
  };

  const onDrop = async (e, targetStatus) => {
      e.preventDefault();
      if (!draggedItemId) return;

      // Find source status and item
      let sourceStatus = null;
      let draggedItem = null;
      Object.keys(kanbanData).forEach(status => {
          const found = kanbanData[status].items.find(i => i.id === draggedItemId);
          if (found) { sourceStatus = status; draggedItem = found; }
      });

      if (!sourceStatus || sourceStatus === targetStatus || !draggedItem) {
          setDraggedItemId(null); return;
      }

      // Optimistic Update
      setKanbanData(prev => {
          const newSourceItems = prev[sourceStatus].items.filter(i => i.id !== draggedItemId);
          const newTargetItems = [{ ...draggedItem, status: targetStatus }, ...prev[targetStatus].items];
          return {
              ...prev,
              [sourceStatus]: { ...prev[sourceStatus], items: newSourceItems },
              [targetStatus]: { ...prev[targetStatus], items: newTargetItems }
          };
      });

      // API Call
      try {
          await axios.put(`http://localhost:3000/api/leads/${draggedItemId}`, { status: targetStatus }, { headers: { Authorization: `Bearer ${token}` } });
      } catch (err) {
          console.error("Failed to update status", err);
      }
      setDraggedItemId(null);
  };

  return (
    <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px', height: '100%' }}>
          {statuses.map(status => {
              const col = kanbanData[status] || { items: [], loading: false };
              const style = getStatusColor(status);
              return (
                  <div key={status} onDragOver={onDragOver} onDrop={(e) => onDrop(e, status)} 
                       style={{ minWidth: '300px', width: '300px', background: '#f8fafc', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', borderTop: `4px solid ${style.b}`, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
                          <h4 style={{ margin: 0, color: style.t, textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '700' }}>{status}</h4>
                          <span style={{ background: style.bg, color: style.t, borderRadius: '12px', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 'bold' }}>{col.items.length}{col.hasMore ? '+' : ''}</span>
                      </div>
                      <div onScroll={(e) => handleScroll(e, status)} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '100px', paddingRight: '5px' }}>
                          {col.items.map(lead => (
                              <KanbanCard 
                                  key={lead.id}
                                  lead={lead}
                                  visibleColumns={visibleColumns}
                                  columns={columns}
                                  onDragStart={onDragStart}
                                  onCardClick={(l) => onCardClick(l, col.items, { 
                                      type: 'kanban', 
                                      status: status, 
                                      page: col.page, 
                                      hasMore: col.hasMore, 
                                      pipelineId: pipelineId,
                                      search: filters.search 
                                  })} 
                                  onEdit={onEdit}
                                  pipelines={pipelines}
                              />
                          ))}
                          {col.loading && <div style={{ display: 'flex', justifyContent: 'center', padding: '10px' }}><Loader size={20} className="spin" color="#94a3b8" /></div>}
                      </div>
                  </div>
              )
          })}
      </div>
  )
}
export default KanbanBoard