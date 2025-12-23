import React from 'react'
import { DollarSign } from 'lucide-react'

const KanbanBoard = ({ leads, statuses, onDragStart, onDragOver, onDrop, onCardClick, getStatusColor }) => {
  return (
    <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px', height: '100%' }}>
          {statuses.map(status => {
              const columnLeads = leads.filter(l => l.status === status);
              const style = getStatusColor(status);
              return (
                  <div key={status} onDragOver={onDragOver} onDrop={(e) => onDrop(e, status)} 
                       style={{ minWidth: '300px', background: '#f8fafc', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', borderTop: `4px solid ${style.b}`, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
                          <h4 style={{ margin: 0, color: style.t, textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '700' }}>{status}</h4>
                          <span style={{ background: style.bg, color: style.t, borderRadius: '12px', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 'bold' }}>{columnLeads.length}</span>
                      </div>
                      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '100px' }}>
                          {columnLeads.map(lead => (
                              <div key={lead.id} 
                                   draggable 
                                   onDragStart={(e) => onDragStart(e, lead.id)}
                                   onClick={() => onCardClick(lead)}
                                   style={{ background: 'white', padding: '15px', borderRadius: '6px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', cursor: 'pointer', position: 'relative' }}>
                                  <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', marginBottom: '4px' }}>#{lead.leadRID || lead.leadrid}</div>
                                  <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>{lead.title}</div>
                                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '8px' }}>{lead.company_name}</div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#475569', borderTop: '1px solid #f8fafc', paddingTop: '10px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><DollarSign size={14} /> {lead.req_amount || 0}</div>
                                      <div style={{ fontSize: '0.7rem' }}>{lead.agent_name || 'Unassigned'}</div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )
          })}
      </div>
  )
}
export default KanbanBoard