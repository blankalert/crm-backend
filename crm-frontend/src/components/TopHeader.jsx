import React from 'react'
import { Menu, ChevronLeft, LogOut } from 'lucide-react'
import '../App.css'

const TopHeader = ({ isSidebarOpen, setSidebarOpen, currentUser, handleLogout }) => {
  return (
    <div className="top-header">
      <button onClick={() => setSidebarOpen(!isSidebarOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
        {isSidebarOpen ? <ChevronLeft size={24} /> : <Menu size={24} />}
      </button>

      <div className="user-profile">
        <button onClick={handleLogout} className="btn-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}>
          <LogOut size={16} />
          <span>Logout {currentUser.firstName}</span>
        </button>
      </div>
    </div>
  )
}

export default TopHeader