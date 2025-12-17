import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate, Navigate, Outlet, useLocation } from 'react-router-dom'
import { LayoutDashboard, Zap, CheckSquare, Package, Phone, Users, Settings as SettingsIcon } from 'lucide-react'
import './App.css'

import Sidebar from './components/Sidebar'

function Dashboard() {
  const [isSidebarOpen, setSidebarOpen] = useState(true)
  const [currentUser, setCurrentUser] = useState({ name: 'Loading...', role: '...', firstName: 'User' })
  const [companyName, setCompanyName] = useState('CRM System')
  
  // Dashboard Data State - We'll pass this down via Outlet context
  const [dashboardData, setDashboardData] = useState(null)

  const navigate = useNavigate() 
  const location = useLocation()
  const token = localStorage.getItem('token')

  if (!token) return <Navigate to="/" />

  useEffect(() => {
    const loadData = async () => {
        try {
            const res = await axios.get('http://localhost:3000/api/dashboard', {
                headers: { Authorization: `Bearer ${token}` }
            })
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

  const handleLogout = () => {
    localStorage.clear()
    navigate('/')
  }

  // Define Menu Items with Paths
  const menuItems = [
    { name: 'Overview', icon: <LayoutDashboard size={20} />, path: '/dashboard/overview' },
    { name: 'Leads', icon: <Zap size={20} />, path: '/dashboard/leads' },
    { name: 'Task', icon: <CheckSquare size={20} />, path: '/dashboard/tasks' },
    { name: 'Orders', icon: <Package size={20} />, path: '/dashboard/orders' },
    { name: 'Contact', icon: <Phone size={20} />, path: '/dashboard/contacts' },
    { name: 'Customer', icon: <Users size={20} />, path: '/dashboard/customers' },
    { 
      name: 'Settings', 
      icon: <SettingsIcon size={20} />,
      subItems: [
        { name: 'Role Control', path: '/dashboard/settings/roles' },
        { name: 'User Control', path: '/dashboard/settings/users' },
        { name: 'Company Profile', path: '/dashboard/settings/company' }
      ]
    },
  ]

  // Determine active tab based on current URL path
  const getActiveTab = () => {
      const path = location.pathname;
      if (path.includes('/leads')) return 'Leads';
      if (path.includes('/overview')) return 'Overview';
      if (path.includes('/settings/roles')) return 'Role Control';
      if (path.includes('/settings/users')) return 'User Control';
      if (path.includes('/settings/company')) return 'Company Profile';
      return '';
  }

  // Handle Navigation
  const handleNavigation = (name) => {
      let item = menuItems.find(i => i.name === name);
      if(!item) {
          menuItems.forEach(i => {
              if(i.subItems) {
                  const sub = i.subItems.find(s => s.name === name);
                  if(sub) item = sub;
              }
          })
      }
      if(item && item.path) navigate(item.path);
  }

  return (
    <div className="app-container">
        <Sidebar 
            isSidebarOpen={isSidebarOpen} 
            toggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
            companyName={companyName} 
            activeTab={getActiveTab()} 
            setActiveTab={handleNavigation} 
            currentUser={currentUser} 
            menuItems={menuItems}
            onLogout={handleLogout} 
        />

        <div className="main-content">
            <div className="content-body" style={{ padding: '0' }}>
               {/* Context provider allows child routes to access shared data */}
               <Outlet context={{ token, dashboardData, companyName, currentUser }} /> 
            </div>
        </div>
    </div>
  )
}

export default Dashboard