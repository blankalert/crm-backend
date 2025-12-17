import { useState, useEffect } from 'react'
import axios from 'axios'
import { BrowserRouter, Routes, Route, useNavigate, Navigate, Outlet, useOutletContext } from 'react-router-dom'
import './App.css'

import Login from './Login'
import Register from './Register'
import Dashboard from './Dashboard'
import Overview from './components/Overview'
import UserControl from './components/UserControl'
import Settings from './components/Settings'
import Leads from './components/leads/Leads'

// --- GLOBAL AUTH INTERCEPTOR ---
const AuthHandler = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          localStorage.clear();
          navigate('/');
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, [navigate]);
  return null;
}

// --- WRAPPERS ---
const OverviewWrapperWithContext = () => {
    const context = useOutletContext();
    if (!context || !context.dashboardData) return <div>Loading...</div>;
    return <Overview data={context.dashboardData} companyName={context.companyName} />;
}

const UserControlWrapperWithContext = () => {
    const { token } = useOutletContext();
    return <UserControl token={token} />;
}

const SettingsWrapperWithContext = () => {
    const { token } = useOutletContext();
    return <Settings token={token} />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthHandler />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<Login />} />
        
        <Route path="/dashboard" element={<Dashboard />}>
            <Route index element={<Navigate to="overview" replace />} />
            
            <Route path="overview" element={<OverviewWrapperWithContext />} />
            
            {/* Leads Routes */}
            <Route path="leads" element={<Leads />} />
            <Route path="leads/details/:id" element={<Leads />} />
            
            {/* Settings Routes */}
            <Route path="settings/users" element={<UserControlWrapperWithContext />} />
            <Route path="settings/roles" element={<SettingsWrapperWithContext />} />
            <Route path="settings/company" element={<SettingsWrapperWithContext />} />
            
            {/* Fallbacks for other menu items if components not ready */}
            <Route path="tasks" element={<div>Tasks Module</div>} />
            <Route path="orders" element={<div>Orders Module</div>} />
            <Route path="contacts" element={<div>Contacts Module</div>} />
            <Route path="customers" element={<div>Customers Module</div>} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App