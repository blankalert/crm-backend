import React, { useState } from 'react'
import { User, ChevronDown, ChevronRight, LogOut } from 'lucide-react'
import '../App.css'

// Helper Component for Recursive Menu Items
const SidebarItem = ({ item, isSidebarOpen, activeTab, onNavigate, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const hasChildren = item.subItems && item.subItems.length > 0
  
  // Check if this item or any child is active to auto-expand or highlight
  const isActive = activeTab === item.name
  
  const handleClick = (e) => {
    e.stopPropagation()
    if (hasChildren) {
        setIsExpanded(!isExpanded)
    } else {
        onNavigate(item.name)
    }
  }

  // Indentation for nested levels
  const paddingLeft = isSidebarOpen ? 20 + (level * 15) : 20

  return (
    <div>
      <div
        onClick={handleClick}
        className={`nav-item ${isActive && !hasChildren ? 'active' : ''}`}
        title={item.name}
        style={{ 
          paddingLeft: `${paddingLeft}px`,
          justifyContent: isSidebarOpen ? 'space-between' : 'center',
          paddingRight: isSidebarOpen ? '20px' : '0'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {item.icon && <span>{item.icon}</span>}
          {isSidebarOpen && <span>{item.name}</span>}
        </div>
        {isSidebarOpen && hasChildren && (
          isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
        )}
      </div>

      {/* Render Children Recursively */}
      {isSidebarOpen && hasChildren && isExpanded && (
        <div style={{ background: 'rgba(0,0,0,0.1)' }}>
          {item.subItems.map((subItem) => (
            <SidebarItem 
              key={subItem.name} 
              item={subItem} 
              isSidebarOpen={isSidebarOpen} 
              activeTab={activeTab} 
              onNavigate={onNavigate} 
              level={level + 1} 
            />
          ))}
        </div>
      )}
    </div>
  )
}

const Sidebar = ({ isSidebarOpen, toggleSidebar, companyName, activeTab, setActiveTab, currentUser, menuItems, onLogout }) => {
  const getInitials = (name) => {
      if(!name) return 'CO';
      const parts = name.split(' ');
      if (parts.length === 1) return name.substring(0, 2).toUpperCase();
      return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  return (
    <div className="sidebar" style={{ width: isSidebarOpen ? '260px' : '80px' }}>
      <div className="sidebar-header" onClick={toggleSidebar} title="Toggle Sidebar">
        {isSidebarOpen ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '0 10px' }}>
              <div style={{ minWidth: '36px', height: '36px', background: '#2563eb', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '0.9rem', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                  {getInitials(companyName)}
              </div>
              <span className="brand-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{companyName}</span>
          </div>
        ) : (
          <div style={{ width: '42px', height: '42px', background: '#2563eb', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.1rem', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
              {getInitials(companyName)}
          </div>
        )}
      </div>

      <div style={{ flex: 1, padding: '15px 0', overflowY: 'auto' }}>
        {menuItems.map(item => (
            <SidebarItem 
                key={item.name} 
                item={item} 
                isSidebarOpen={isSidebarOpen} 
                activeTab={activeTab} 
                onNavigate={setActiveTab} 
            />
        ))}
      </div>

      <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: isSidebarOpen ? 'space-between' : 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="avatar" style={{ background: '#334155', color: 'white', minWidth: '40px', minHeight: '40px' }}><User size={20} /></div>
                {isSidebarOpen && (
                    <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'white' }}>{currentUser.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{currentUser.role}</div>
                    </div>
                )}
            </div>
            {isSidebarOpen && (
                <button onClick={onLogout} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <LogOut size={18} />
                </button>
            )}
        </div>
        {!isSidebarOpen && (
             <button onClick={onLogout} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '10px 0', width: '100%', color: '#ef4444', marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <LogOut size={20} />
            </button>
        )}
      </div>
    </div>
  )
}

export default Sidebar