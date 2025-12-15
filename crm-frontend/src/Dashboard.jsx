import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate, Navigate } from 'react-router-dom'
import { LayoutDashboard, Zap, CheckSquare, Package, Phone, Users, Settings as SettingsIcon } from 'lucide-react'
import './App.css'

import Sidebar from './components/Sidebar'
import Overview from './components/Overview'
import UserControl from './components/UserControl'
import Settings from './components/Settings'
import Leads from './components/Leads'

function Dashboard() {
  const [isSidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState('Overview')
  const [currentUser, setCurrentUser] = useState({ name: 'Loading...', role: '...', firstName: 'User' })
  const [companyName, setCompanyName] = useState('CRM System')
  const [dashboardData, setDashboardData] = useState(null)

  const navigate = useNavigate() 
  const token = localStorage.getItem('token')

  if (!token) return <Navigate to="/" />

  useEffect(() => {
    const loadData = async () => {
        try {
            const res = await axios.get('http://localhost:3000/api/dashboard', { headers: { Authorization: `Bearer ${token}` } })
            setDashboardData(res.data)
            setCompanyName(res.data.company_name)
            setCurrentUser({
                name: res.data.user.full_name,
                role: res.data.user.role,
                firstName: res.data.user.first_name
            })
        } catch (err) {
            if (err.response && err.response.status === 401) {
                localStorage.clear();
                navigate('/');
            }
        }
    }
    loadData()
  }, [token])

  const handleLogout = () => { localStorage.clear(); navigate('/') }

  const menuItems = [
    { name: 'Overview', icon: <LayoutDashboard size={20} /> },
    { name: 'Leads', icon: <Zap size={20} /> },
    { name: 'Task', icon: <CheckSquare size={20} /> },
    { name: 'Orders', icon: <Package size={20} /> },
    { name: 'Contact', icon: <Phone size={20} /> },
    { name: 'Customer', icon: <Users size={20} /> },
    { 
      name: 'Settings', icon: <SettingsIcon size={20} />,
      subItems: [ { name: 'Role Control' }, { name: 'User Control' } ]
    },
  ]

  const renderContent = () => {
    switch(activeTab) {
      case 'Overview': return <Overview data={dashboardData} companyName={companyName} />
      case 'Leads': return <Leads token={token} />
      case 'User Control': return <UserControl token={token} />
      case 'Role Control': return <Settings token={token} />
      default: return <div style={{ textAlign: 'center', marginTop: '100px', color: '#94a3b8' }}><h2>{activeTab}</h2><p>Coming Soon.</p></div>
    }
  }

  return (
    <div className="app-container">
        <Sidebar 
            isSidebarOpen={isSidebarOpen} 
            toggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
            companyName={companyName} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            currentUser={currentUser} 
            menuItems={menuItems}
            onLogout={handleLogout} 
        />

        <div className="main-content">
            {/* Top Toggle removed, Sidebar header now handles it */}
            <div className="content-body" style={{ padding: '20px' }}>
               {renderContent()}
            </div>
        </div>
    </div>
  )
}

export default Dashboard