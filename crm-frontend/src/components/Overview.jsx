import React from 'react'
import '../App.css'

const Overview = ({ data, companyName }) => {
  return (
    <div className="card">
      <h2 style={{ marginTop: 0, color: '#1e293b' }}>Dashboard Overview</h2>
      {data ? (
        <div style={{ marginTop: '20px' }}>
          <p style={{ color: '#64748b' }}>Welcome to <strong>{companyName}</strong></p>
          <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
            <div style={{ background: '#eff6ff', padding: '20px', borderRadius: '8px', minWidth: '150px', border: '1px solid #dbeafe' }}>
              <h3 style={{ margin: 0, color: '#1e40af', fontSize: '2rem' }}>{data.stats.active_leads}</h3>
              <span style={{ color: '#1e3a8a', fontWeight: '500' }}>Active Leads</span>
            </div>
            
            <div style={{ background: '#fff7ed', padding: '20px', borderRadius: '8px', minWidth: '150px', border: '1px solid #ffedd5' }}>
              <h3 style={{ margin: 0, color: '#9a3412', fontSize: '2rem' }}>{data.stats.pending_orders}</h3>
              <span style={{ color: '#7c2d12', fontWeight: '500' }}>Pending Orders</span>
            </div>
          </div>
        </div>
      ) : (
        <p style={{color: '#64748b'}}>Loading System Stats...</p>
      )}
    </div>
  )
}

export default Overview