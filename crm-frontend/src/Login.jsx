import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Mail, Lock, LogIn, Building2, ArrowLeft, KeyRound } from 'lucide-react'
import './App.css'

function Login() {
  // State for Login vs Forgot Password
  const [view, setView] = useState('login') // 'login', 'forgot', 'reset'
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  
  const navigate = useNavigate()
  const [searchParams] = useSearchParams() // To grab ?token=xyz from URL

  // Check URL for Reset Token on load
  useEffect(() => {
      const token = searchParams.get('token');
      if (token) setView('reset');
  }, [searchParams])

  // --- HANDLER: LOGIN ---
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true); setError('');
    try {
      const response = await axios.post('http://localhost:3000/api/login', { email, password })
      localStorage.setItem('token', response.data.token)
      if (response.data.user?.name) localStorage.setItem('user_name', response.data.user.name)
      else localStorage.setItem('user_name', 'Admin User')
      navigate('/dashboard')
    } catch (err) {
      setError('Invalid credentials.')
    } finally { setLoading(false) }
  }

  // --- HANDLER: FORGOT PASSWORD REQUEST ---
  const handleForgot = async (e) => {
      e.preventDefault();
      setLoading(true); setError(''); setSuccess('');
      try {
          await axios.post('http://localhost:3000/api/forgot-password', { email });
          setSuccess("Reset link sent! Check your email (or server console).");
      } catch (err) {
          setError(err.response?.data?.message || "Error sending link");
      } finally { setLoading(false) }
  }

  // --- HANDLER: RESET NEW PASSWORD ---
  const handleReset = async (e) => {
      e.preventDefault();
      setLoading(true); setError(''); setSuccess('');
      const token = searchParams.get('token');
      try {
          await axios.post('http://localhost:3000/api/reset-password', { token, newPassword });
          setSuccess("Password Reset Successful! Please Login.");
          setTimeout(() => {
              setView('login');
              navigate('/'); // Clear URL token
          }, 3000);
      } catch (err) {
          setError(err.response?.data?.message || "Failed to reset");
      } finally { setLoading(false) }
  }

  return (
    <div className="app-container" style={{ alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '40px', borderTop: '4px solid #2563eb' }}>
          
          {/* HEADER SECTION */}
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{ width: '60px', height: '60px', background: '#eff6ff', borderRadius: '12px', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
                {view === 'reset' ? <KeyRound size={32} /> : <Building2 size={32} />}
            </div>
            <h2 style={{ margin: '0 0 5px 0', color: '#1e293b' }}>
                {view === 'login' && 'Jindal CRM'}
                {view === 'forgot' && 'Reset Password'}
                {view === 'reset' && 'Set New Password'}
            </h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                {view === 'login' && 'Sign in to access your tenant environment'}
                {view === 'forgot' && 'Enter your email to receive a reset link'}
                {view === 'reset' && 'Enter your new secure password'}
            </p>
          </div>
          
          {/* NOTIFICATIONS */}
          {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '6px', fontSize: '0.9rem', marginBottom: '20px', textAlign: 'center' }}>{error}</div>}
          {success && <div style={{ background: '#dcfce7', color: '#166534', padding: '12px', borderRadius: '6px', fontSize: '0.9rem', marginBottom: '20px', textAlign: 'center' }}>{success}</div>}
          
          {/* --- VIEW 1: LOGIN FORM --- */}
          {view === 'login' && (
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="form-group" style={{ margin: 0, position: 'relative' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '500', color: '#475569' }}>Email Address</label>
                    <div style={{ position: 'relative' }}>
                        <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input type="email" className="form-input" placeholder="name@company.com" value={email} onChange={e => setEmail(e.target.value)} style={{ paddingLeft: '40px' }} required />
                    </div>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: '500', color: '#475569' }}>Password</label>
                        <span onClick={() => setView('forgot')} style={{ fontSize: '0.8rem', color: '#2563eb', cursor: 'pointer' }}>Forgot password?</span>
                    </div>
                    <div style={{ position: 'relative' }}>
                        <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input type="password" className="form-input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} style={{ paddingLeft: '40px' }} required />
                    </div>
                </div>
                <button type="submit" className="btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', fontSize: '1rem' }}>
                    {loading ? 'Signing in...' : <><LogIn size={18} /> Sign In</>}
                </button>
              </form>
          )}

          {/* --- VIEW 2: FORGOT PASSWORD FORM --- */}
          {view === 'forgot' && (
              <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="form-group" style={{ margin: 0, position: 'relative' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '500', color: '#475569' }}>Email Address</label>
                    <div style={{ position: 'relative' }}>
                        <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input type="email" className="form-input" placeholder="name@company.com" value={email} onChange={e => setEmail(e.target.value)} style={{ paddingLeft: '40px' }} required />
                    </div>
                </div>
                <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '12px', fontSize: '1rem' }}>
                    {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
                <div style={{ textAlign: 'center' }}>
                    <span onClick={() => setView('login')} style={{ fontSize: '0.9rem', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                        <ArrowLeft size={16} /> Back to Login
                    </span>
                </div>
              </form>
          )}

          {/* --- VIEW 3: RESET FORM (Token in URL) --- */}
          {view === 'reset' && (
              <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '500', color: '#475569', marginBottom: '8px', display: 'block' }}>New Password</label>
                    <div style={{ position: 'relative' }}>
                        <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input type="password" className="form-input" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ paddingLeft: '40px' }} required />
                    </div>
                </div>
                <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '12px', fontSize: '1rem' }}>
                    {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
          )}

          {view === 'login' && (
            <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '0.9rem', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                Don't have a company account? <br/>
                <a href="/register" style={{ color: '#2563eb', fontWeight: '600', textDecoration: 'none', display: 'inline-block', marginTop: '5px' }}>Register New Company</a>
            </div>
          )}
        </div>
    </div>
  )
}

export default Login