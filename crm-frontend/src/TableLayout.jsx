import React from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'

// A reusable table that works for Users, Leads, Orders, etc.
const TableLayout = ({ 
    title,          // "User Management" or "Recent Orders"
    columns,        // Array: [{ label: "Name", key: "full_name" }, ...]
    data,           // Array of objects
    onAdd,          // Function to handle "Add New" button click
    onEdit,         // Function to handle Edit click
    onDelete        // Function to handle Delete click
}) => {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      
      {/* 1. Generic Header */}
      <div style={{ padding: '20px', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b' }}>{title}</h2>
        {onAdd && (
          <button onClick={onAdd} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px' }}>
            <Plus size={18} /> Add New
          </button>
        )}
      </div>

      {/* 2. Responsive Table Wrapper */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {/* Dynamic Headers */}
              {columns.map((col, idx) => (
                <th key={idx} style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {col.label}
                </th>
              ))}
              {/* Action Column (only if needed) */}
              {(onEdit || onDelete) && (
                <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                    Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((row, rIdx) => (
                <tr key={rIdx} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} style={{ padding: '16px 24px', color: '#334155', fontSize: '0.95rem' }}>
                      {/* Magic: Access the property dynamically using the key string */}
                      {row[col.key]}
                    </td>
                  ))}
                  
                  {(onEdit || onDelete) && (
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            {onEdit && (
                                <button onClick={() => onEdit(row)} title="Edit" style={{ padding: '8px', background: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                    <Edit size={16} />
                                </button>
                            )}
                            {onDelete && (
                                <button onClick={() => onDelete(row)} title="Delete" style={{ padding: '8px', background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + 1} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  No records found. Click "Add New" to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default TableLayout