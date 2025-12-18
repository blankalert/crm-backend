import { useState, useEffect } from 'react'
import axios from 'axios'
import { BrowserRouter, Routes, Route, useNavigate, Navigate, Outlet, useOutletContext } from 'react-router-dom'
import './App.css'

import Login from './Login'
import Register from './Register'
import Dashboard from './Dashboard'
import Overview from './components/Overview'
import UserControl from './components/UserControl'
// Settings container removed as requested
import RoleSettings from './components/settings/customization/RoleSettings'
import CompanyProfile from './components/settings/customization/CompanyProfile'
import PipelineSettings from './components/settings/customization/PipelineSettings'

import Leads from './components/leads/Leads'


// --- GLOBAL AUTH INTERCEPTOR ---
const AuthHandler = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          console.warn("AuthHandler: 401 Unauthorized detected. Redirecting to Login...");
          console.warn("AuthHandler Error Details:", error.response.data);
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

// --- HELPER TO GET TOKEN ---
// Tries to get token from context, falls back to localStorage
const useToken = () => {
    const context = useOutletContext();
    const tokenFromStorage = localStorage.getItem('token');
    
    // Debugging Token Retrieval
    if (context && context.token) {
        // console.log("useToken: Found token in Outlet Context");
        return context.token;
    }
    if (tokenFromStorage) {
        // console.log("useToken: Found token in LocalStorage");
        return tokenFromStorage;
    }
    console.warn("useToken: No token found in Context OR LocalStorage!");
    return null;
}

// --- WRAPPERS ---
const OverviewWrapperWithContext = () => {
    const context = useOutletContext();
    if (!context || !context.dashboardData) return <div>Loading...</div>;
    return <Overview data={context.dashboardData} companyName={context.companyName} />;
}

const UserControlWrapperWithContext = () => {
    const token = useToken();
    if (!token) {
        console.log("UserControlWrapper: No token, redirecting...");
        return <Navigate to="/" />;
    }
    return <UserControl token={token} />;
}

// New Wrapper for RoleSettings
const RoleSettingsWrapper = () => {
    console.log("RoleSettingsWrapper: Rendering...");
    const token = useToken();
    if (!token) {
        console.log("RoleSettingsWrapper: No token, redirecting...");
        return <Navigate to="/" />;
    }
    return <RoleSettings token={token} />;
}

// New Wrapper for CompanyProfile
const CompanyProfileWrapper = () => {
    console.log("CompanyProfileWrapper: Rendering...");
    const token = useToken();
    if (!token) {
        console.log("CompanyProfileWrapper: No token, redirecting...");
        return <Navigate to="/" />;
    }
    return <CompanyProfile token={token} />;
}

const PipelineWrapper = () => {
    const { token } = useOutletContext();
    return <PipelineSettings token={token} />;
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
            
            {/* DIRECT SETTINGS ROUTES (No intermediate Settings page) */}
            <Route path="settings/users" element={<UserControlWrapperWithContext />} />
            
            <Route path="settings/customization/roles" element={<RoleSettingsWrapper />} />
            <Route path="settings/customization/company" element={<CompanyProfileWrapper />} />
            <Route path="settings/customization/pipeline" element={<PipelineWrapper />} />
            
            {/* Legacy redirects to ensure old links work */}
            <Route path="settings/roles" element={<Navigate to="customization/roles" replace />} />
            <Route path="settings/company" element={<Navigate to="customization/company" replace />} />

            {/* Fallbacks */}
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