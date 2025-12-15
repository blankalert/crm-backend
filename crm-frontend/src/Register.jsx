import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'
import { RefreshCw, CheckCircle, AlertCircle, MessageSquare, Mail, ArrowLeft, Lock } from 'lucide-react'
import './App.css'

function Register() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    company_name: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: ''
  })
  
  // Registration Flow State
  const [step, setStep] = useState(1) // 1: Details, 2: Verification
  const [verificationMethod, setVerificationMethod] = useState('email') // 'email' or 'whatsapp'
  const [otp, setOtp] = useState('')
  const [generatedOtp, setGeneratedOtp] = useState(null)

  // Captcha State
  const [captchaInput, setCaptchaInput] = useState('')
  const [captchaResult, setCaptchaResult] = useState(null)
  const canvasRef = useRef(null)

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Generate Captcha on Load (Only for Step 1)
  useEffect(() => {
    if (step === 1) generateCaptcha()
  }, [step])

  const generateCaptcha = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Clear previous
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Generate Numbers
    const num1 = Math.floor(Math.random() * 10);
    const num2 = Math.floor(Math.random() * 10);
    const result = num1 + num2;
    setCaptchaResult(result);

    // Draw Text with Distortion
    ctx.font = '30px Arial';
    ctx.fillStyle = '#374151';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    
    // Add noise lines
    for(let i=0; i<5; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.strokeStyle = '#cbd5e1';
        ctx.stroke();
    }

    ctx.fillText(`${num1} + ${num2} = ?`, canvas.width / 2, canvas.height / 2);
    setCaptchaInput('');
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // --- STEP 1: SEND OTP ---
  const handleSendOtp = (e) => {
    e.preventDefault()
    setError('')

    // 1. Validate Captcha
    if (parseInt(captchaInput) !== captchaResult) {
        setError('Incorrect Captcha answer. Please try again.');
        generateCaptcha(); 
        return;
    }

    // 2. Simulate OTP Generation
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);

    // 3. Log OTP to Console (Simulation)
    console.log("========================================");
    console.log(`[SIMULATION] Sending ${verificationMethod.toUpperCase()} OTP to: ${verificationMethod === 'email' ? formData.email : formData.phone}`);
    console.log(`[SIMULATION] OTP CODE: ${code}`);
    console.log("========================================");

    alert(`Verification code sent to your ${verificationMethod === 'email' ? 'Email' : 'WhatsApp'}! (Check Console)`);
    setStep(2);
  }

  // --- STEP 2: VERIFY & REGISTER ---
  const handleFinalRegister = async (e) => {
    e.preventDefault()
    setError('')

    if (otp !== generatedOtp) {
        setError('Invalid OTP Code. Please try again.');
        return;
    }

    setLoading(true)

    try {
      const res = await axios.post('http://localhost:3000/api/register-company', formData)
      alert("Registration Successful! Please Login.")
      navigate('/')
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.message || 'Registration Failed')
      // If failed, maybe go back or stay here? staying here allows retry
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container" style={{ alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', overflowY: 'auto' }}>
      <div className="card" style={{ width: '100%', maxWidth: '600px', margin: '40px 20px' }}>
        <h2 style={{ textAlign: 'center', color: '#1e293b', marginBottom: '10px' }}>Register Your Company</h2>
        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '30px', fontSize: '0.9rem' }}>
            {step === 1 ? "Create a new tenant environment." : "Verify your contact details."}
        </p>
        
        {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '6px', marginBottom: '20px' }}>
                <AlertCircle size={20} />
                {error}
            </div>
        )}

        {/* --- STEP 1: DETAILS FORM --- */}
        {step === 1 && (
            <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Company Section */}
            <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h4 style={{margin: '0 0 15px 0', color: '#334155', fontSize: '0.9rem', textTransform: 'uppercase'}}>Company Details</h4>
                <input 
                    name="company_name" placeholder="Company Name (e.g. Jindal Texofab)" 
                    value={formData.company_name} onChange={handleChange} required 
                    className="form-input"
                />
            </div>

            {/* Owner Section */}
            <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h4 style={{margin: '0 0 15px 0', color: '#334155', fontSize: '0.9rem', textTransform: 'uppercase'}}>Super Admin Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                    <input name="first_name" placeholder="First Name" className="form-input" value={formData.first_name} onChange={handleChange} required />
                    <input name="last_name" placeholder="Last Name" className="form-input" value={formData.last_name} onChange={handleChange} required />
                </div>
                <input name="phone" placeholder="Phone Number" className="form-input" value={formData.phone} onChange={handleChange} style={{marginBottom: '15px'}} required />
                <input name="email" type="email" placeholder="Owner Email (Login ID)" className="form-input" value={formData.email} onChange={handleChange} required style={{marginBottom: '15px'}} />
                <input name="password" type="password" placeholder="Password" className="form-input" value={formData.password} onChange={handleChange} required />
            </div>

            {/* Verification Method & Captcha */}
            <div style={{ padding: '20px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', color: '#334155', marginBottom: '10px', fontWeight: '500' }}>Verify via:</label>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <div 
                        onClick={() => setVerificationMethod('email')}
                        style={{ 
                            flex: 1, padding: '10px', borderRadius: '6px', cursor: 'pointer', border: '1px solid',
                            borderColor: verificationMethod === 'email' ? '#2563eb' : '#e2e8f0',
                            background: verificationMethod === 'email' ? '#eff6ff' : 'white',
                            color: verificationMethod === 'email' ? '#2563eb' : '#64748b',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                        }}
                    >
                        <Mail size={18} /> Email
                    </div>
                    <div 
                        onClick={() => setVerificationMethod('whatsapp')}
                        style={{ 
                            flex: 1, padding: '10px', borderRadius: '6px', cursor: 'pointer', border: '1px solid',
                            borderColor: verificationMethod === 'whatsapp' ? '#16a34a' : '#e2e8f0',
                            background: verificationMethod === 'whatsapp' ? '#dcfce7' : 'white',
                            color: verificationMethod === 'whatsapp' ? '#16a34a' : '#64748b',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                        }}
                    >
                        <MessageSquare size={18} /> WhatsApp
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '15px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '5px' }}>Solve Math</label>
                        <canvas ref={canvasRef} width="120" height="40" style={{ border: '1px solid #e2e8f0', borderRadius: '4px' }}></canvas>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input 
                            type="number" placeholder="??" value={captchaInput} onChange={e => setCaptchaInput(e.target.value)} 
                            className="form-input" style={{ width: '80px', textAlign: 'center', fontSize: '1.2rem', padding: '8px' }} required
                        />
                        <button type="button" onClick={generateCaptcha} style={{ padding: '8px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', color: '#475569' }}>
                            <RefreshCw size={18} />
                        </button>
                    </div>
                </div>
            </div>

            <button type="submit" className="btn-primary" style={{ padding: '15px', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                Next: Verify Info <CheckCircle size={20} />
            </button>
            </form>
        )}

        {/* --- STEP 2: VERIFICATION --- */}
        {step === 2 && (
            <form onSubmit={handleFinalRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ textAlign: 'center', padding: '30px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ 
                        width: '60px', height: '60px', background: verificationMethod === 'email' ? '#eff6ff' : '#dcfce7', 
                        borderRadius: '50%', margin: '0 auto 15px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: verificationMethod === 'email' ? '#2563eb' : '#16a34a'
                    }}>
                        {verificationMethod === 'email' ? <Mail size={30} /> : <MessageSquare size={30} />}
                    </div>
                    
                    <h3 style={{ margin: '0 0 10px 0', color: '#334155' }}>Enter Verification Code</h3>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                        We sent a 6-digit code to <br/>
                        <strong>{verificationMethod === 'email' ? formData.email : formData.phone}</strong>
                    </p>

                    <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'center' }}>
                        <input 
                            type="text" 
                            placeholder="000000"
                            maxLength="6"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                            style={{ 
                                fontSize: '2rem', letterSpacing: '8px', textAlign: 'center', 
                                width: '200px', padding: '10px', borderRadius: '8px', border: '2px solid #cbd5e1', outline: 'none'
                            }}
                            autoFocus
                        />
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '10px' }}>(Check your console for the code)</p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                        type="button" 
                        onClick={() => setStep(1)} 
                        className="btn-danger" 
                        style={{ flex: 1, background: 'white', color: '#64748b', border: '1px solid #cbd5e1' }}
                    >
                        <ArrowLeft size={18} style={{marginRight:'5px'}}/> Back
                    </button>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="btn-primary" 
                        style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                    >
                        {loading ? 'Creating Tenant...' : (
                            <><Lock size={18} /> Verify & Register</>
                        )}
                    </button>
                </div>
            </form>
        )}

        <p style={{ marginTop: '20px', textAlign: 'center', color: '#64748b' }}>
          Already have an account? <Link to="/" style={{ color: '#2563eb', fontWeight: 'bold', textDecoration: 'none' }}>Login here</Link>
        </p>
      </div>
    </div>
  )
}

export default Register