import { useState, useEffect } from 'react'
import axios from 'axios'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import './App.css'

// Import Modular Components
import Login from './Login'
import Register from './Register'
import RoleBuilder from './RoleBuilder' // (Optional, if you moved this to settings you can remove this route)
import Dashboard from './Dashboard'

// --- GLOBAL AUTH INTERCEPTOR ---
// This component sits inside the Router and watches for 401 errors
const AuthHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Add a response interceptor
    const interceptor = axios.interceptors.response.use(
      (response) => {
        // If the request succeeds, just return the response
        return response;
      },
      (error) => {
        // If the request fails with 401 (Unauthorized)
        if (error.response && error.response.status === 401) {
          console.warn("Session Expired: Redirecting to Login...");
          
          // 1. Clear Local Storage
          localStorage.clear();
          
          // 2. Redirect to Login Page
          navigate('/');
        }
        // Pass the error down so specific components can still show "Error" messages if needed
        return Promise.reject(error);
      }
    );

    // Cleanup when app unmounts
    return () => axios.interceptors.response.eject(interceptor);
  }, [navigate]);

  return null; // This component renders nothing
}

function App() {
  return (
    <BrowserRouter>
      {/* Activate the Security Interceptor */}
      <AuthHandler />
      
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create-role" element={<RoleBuilder />} />
        
        {/* Route for Reset Password (reuses Login component) */}
        <Route path="/reset-password" element={<Login />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App