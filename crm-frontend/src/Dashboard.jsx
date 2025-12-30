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
  const [dashboardData, setDashboardData] = useState(null)

  const navigate = useNavigate() 
  const location = useLocation()
  const token = localStorage.getItem('token')

  console.log("Dashboard: Rendering. Token present:", !!token);

  if (!token) return <Navigate to="/" />

  useEffect(() => {
    const loadData = async () => {
        try {
            console.log("Dashboard: Fetching initial data...");
            const res = await axios.get('http://localhost:3000/api/dashboard', {
                headers: { Authorization: `Bearer ${token}` }
            })
            console.log("Dashboard: Data fetched successfully.");
            setDashboardData(res.data)
            setCompanyName(res.data.company_name)
            setCurrentUser({
                name: res.data.user.full_name,
                role: res.data.user.role,
                firstName: res.data.user.first_name
            })
        } catch (err) {
            console.error("Dashboard: Fetch failed", err);
            if (err.response && err.response.status === 401) {
                console.warn("Dashboard: 401 received during init load.");
                localStorage.clear();
                navigate('/');
            }
        }
    }
    loadData()
  }, [token, navigate])

  const handleLogout = () => {
    localStorage.clear()
    navigate('/')
  }

  // --- NESTED MENU STRUCTURE ---
  const menuItems = [
    { name: 'Overview', icon: <LayoutDashboard size={20} />, path: '/dashboard/overview' },
    { name: 'Leads', icon: <Zap size={20} />, path: '/dashboard/leads' },
    { name: 'Tasks', icon: <CheckSquare size={20} />, path: '/dashboard/tasks' },
    { name: 'Orders', icon: <Package size={20} />, path: '/dashboard/orders' },
    { name: 'Contact', icon: <Phone size={20} />, path: '/dashboard/contacts' },
    { name: 'Customer', icon: <Users size={20} />, path: '/dashboard/customers' },
    { 
      name: 'Settings', 
      icon: <SettingsIcon size={20} />,
      subItems: [
        { 
          name: 'Customization',
          subItems: [
            { name: 'Role Control', path: '/dashboard/settings/customization/roles' },
            { name: 'Pipeline Control', path: '/dashboard/settings/customization/pipeline' },
            { name: 'Form Field', path: '/dashboard/settings/customization/FormFieldSettings' },
            { name: 'Form Layout', path: '/dashboard/settings/form-layouts' },
            // Add other customization items here if needed
          ]
        },
        { 
          name: 'Organization',
          subItems: [
            { name: 'Company Profile', path: '/dashboard/settings/customization/company' },
            { name: 'User Control', path: '/dashboard/settings/users' },
          ]
        }
      ]
    },
  ]

  // Flatten logic to find path for active tab highlight
  const getActiveTab = () => {
      const path = location.pathname;
      if (path.includes('/leads')) return 'Leads';
      if (path.includes('/tasks')) return 'Tasks';
      if (path.includes('/overview')) return 'Overview';
      if (path.includes('/settings/customization/roles')) return 'Role Control';
      if (path.includes('/settings/users')) return 'User Control';
      if (path.includes('/settings/customization/company')) return 'Company Profile';
      return 'Overview'; // Default
  }

  // Recursively find the path for a given name
  const findPath = (items, name) => {
    for (const item of items) {
      if (item.name === name) return item.path;
      if (item.subItems) {
        const path = findPath(item.subItems, name);
        if (path) return path;
      }
    }
    return null;
  }

  const handleNavigation = (name) => {
      const path = findPath(menuItems, name);
      console.log(`Sidebar Navigating to: ${name} -> ${path}`);
      if (path) navigate(path);
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
               {/* Pass context to children */}
               <Outlet context={{ token, dashboardData, companyName, currentUser }} /> 
            </div>
        </div>
    </div>
  )
}

export default Dashboard