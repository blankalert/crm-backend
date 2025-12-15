import React, { useState } from 'react'
import { User, ChevronDown, ChevronRight, LogOut } from 'lucide-react'
import '../App.css'

const Sidebar = ({ isSidebarOpen, toggleSidebar, companyName, activeTab, setActiveTab, currentUser, menuItems, onLogout }) => {
  const [expandedMenus, setExpandedMenus] = useState({})

  const toggleMenu = (name) => {
    setExpandedMenus(prev => ({ ...prev, [name]: !prev[name] }))
  }

  const handleItemClick = (item) => {
    if (item.subItems) {
      if (isSidebarOpen) toggleMenu(item.name)
    } else {
      setActiveTab(item.name)
    }
  }

  // Helper to get Initials (e.g. "Jindal Texofab" -> "JT")
  const getInitials = (name) => {
      if(!name) return 'CO';
      const parts = name.split(' ');
      if (parts.length === 1) return name.substring(0, 2).toUpperCase();
      return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  return (
    <div className="sidebar" style={{ width: isSidebarOpen ? '260px' : '80px' }}>
      
      {/* --- SIDEBAR HEADER (TOGGLE) --- */}
      <div 
        className="sidebar-header" 
        onClick={toggleSidebar} 
        title="Toggle Sidebar"
      >
        {isSidebarOpen ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '0 10px' }}>
              {/* Blue Box Icon */}
              <div style={{ 
                  minWidth: '36px', height: '36px', background: '#2563eb', borderRadius: '8px', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  color: 'white', fontWeight: 'bold', fontSize: '0.9rem', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}>
                  {getInitials(companyName)}
              </div>
              <span className="brand-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {companyName}
              </span>
          </div>
        ) : (
          // Collapsed View (Just the Box)
          <div style={{ 
              width: '42px', height: '42px', background: '#2563eb', borderRadius: '10px', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              color: 'white', fontWeight: 'bold', fontSize: '1.1rem', boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
          }}>
              {getInitials(companyName)}
          </div>
        )}
      </div>

      {/* --- MENU ITEMS --- */}
      <div style={{ flex: 1, padding: '15px 0', overflowY: 'auto' }}>
        {menuItems.map(item => {
          const isActive = activeTab === item.name || (item.subItems && item.subItems.some(sub => sub.name === activeTab));
          const isExpanded = expandedMenus[item.name];

          return (
            <div key={item.name}>
              <div
                onClick={() => handleItemClick(item)}
                className={`nav-item ${isActive && !item.subItems ? 'active' : ''}`}
                title={item.name}
                style={{ justifyContent: isSidebarOpen ? 'space-between' : 'center', paddingRight: isSidebarOpen ? '20px' : '0' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {item.icon}
                  {isSidebarOpen && <span>{item.name}</span>}
                </div>
                {isSidebarOpen && item.subItems && (isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
              </div>
              {isSidebarOpen && item.subItems && isExpanded && (
                <div style={{ background: 'rgba(0,0,0,0.2)' }}>
                  {item.subItems.map(sub => (
                    <div key={sub.name} onClick={() => setActiveTab(sub.name)} className={`nav-item ${activeTab === sub.name ? 'active' : ''}`} style={{ paddingLeft: '52px', fontSize: '0.9rem' }}>
                      <span>{sub.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* --- USER PROFILE (With Logout) --- */}
      <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: isSidebarOpen ? 'space-between' : 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="avatar" style={{ background: '#334155', color: 'white', minWidth: '40px', minHeight: '40px' }}>
                    <User size={20} />
                </div>
                {isSidebarOpen && (
                    <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'white' }}>{currentUser.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{currentUser.role}</div>
                    </div>
                )}
            </div>
            
            {/* Logout Icon Button */}
            {isSidebarOpen && (
                <button 
                    onClick={onLogout} 
                    style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                    title="Logout"
                >
                    <LogOut size={18} />
                </button>
            )}
        </div>
        
        {/* Collapsed Logout */}
        {!isSidebarOpen && (
             <button 
                onClick={onLogout} 
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '10px 0', width: '100%', color: '#ef4444', marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)' }}
                title="Logout"
            >
                <LogOut size={20} />
            </button>
        )}
      </div>
    </div>
  )
}

export default Sidebar