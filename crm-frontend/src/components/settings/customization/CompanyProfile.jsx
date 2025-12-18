import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Building2, AlertTriangle, Save, MapPin, Globe, Phone, Mail } from 'lucide-react'
import '../../../App.css'

const CompanyProfile = ({ token }) => {
  const [companyForm, setCompanyForm] = useState({})
  const [loading, setLoading] = useState(false)
  const [deactivateData, setDeactivateData] = useState({ password: '', confirmPassword: '' })

  useEffect(() => {
    // SECURITY CHECK: Only fetch if token is available
    if (token) {
        const fetchCompanyProfile = async () => {
            try { 
                const res = await axios.get('http://localhost:3000/api/tenant/profile', { 
                    headers: { Authorization: `Bearer ${token}` } 
                }); 
                setCompanyForm(res.data); 
            } catch(e){
                console.error("Failed to load company profile", e);
            }
        }
        fetchCompanyProfile()
    }
  }, [token])

  const handleCompanyUpdate = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
          await axios.put('http://localhost:3000/api/tenant/profile', companyForm, { headers: { Authorization: `Bearer ${token}` } });
          alert("Company Profile Updated!");
      } catch (err) {
          alert("Update Failed: " + (err.response?.data?.message || "Server Error"));
      } finally { setLoading(false); }
  }

  const handleDeactivate = async () => {
      if (!window.confirm("WARNING: Lock ALL users out?")) return;
      try {
          await axios.post('http://localhost:3000/api/tenant/deactivate', deactivateData, { headers: { Authorization: `Bearer ${token}` } });
          alert("Account Deactivated."); window.location.href = "/";
      } catch (err) { alert("Deactivation Failed"); }
  }

  // Generic handler for form changes
  const handleChange = (e) => {
      setCompanyForm({ ...companyForm, [e.target.name]: e.target.value });
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div className="card" style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px' }}>
                <div style={{ width: '50px', height: '50px', background: '#eff6ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}><Building2 size={24} /></div>
                <div><h2 style={{ margin: 0, color: '#1e293b' }}>Company Settings</h2><p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Manage branding and details.</p></div>
            </div>
            
            <form onSubmit={handleCompanyUpdate}>
                
                {/* --- BASIC INFO --- */}
                <h4 style={{ color:'#94a3b8', fontSize:'0.8rem', fontWeight:'700', textTransform:'uppercase', marginBottom:'15px' }}>Identity</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div className="form-group">
                        <label>Company Name</label>
                        <input className="form-input" disabled value={companyForm.company_name || ''} style={{ background: '#f8fafc', cursor: 'not-allowed' }} />
                        <small style={{color:'#94a3b8', fontSize:'0.75rem'}}>Cannot be changed.</small>
                    </div>
                    <div className="form-group">
                        <label>Brand Name</label>
                        <input className="form-input" name="brand_name" value={companyForm.brand_name || ''} onChange={handleChange} placeholder="Display Name" />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                    <div className="form-group">
                        <label>Industry</label>
                        <input className="form-input" name="industry" value={companyForm.industry || ''} onChange={handleChange} placeholder="e.g. Technology" />
                    </div>
                    <div className="form-group">
                        <label>Employees</label>
                        <input type="number" className="form-input" name="employee_count" value={companyForm.employee_count || ''} onChange={handleChange} placeholder="e.g. 50" />
                    </div>
                    <div className="form-group">
                        <label>GSTIN / Tax ID</label>
                        <input className="form-input" name="gstin" value={companyForm.gstin || ''} onChange={handleChange} placeholder="Tax Identification Number" />
                    </div>
                </div>

                {/* --- CONTACT INFO --- */}
                <h4 style={{ color:'#94a3b8', fontSize:'0.8rem', fontWeight:'700', textTransform:'uppercase', marginBottom:'15px', borderTop:'1px solid #f1f5f9', paddingTop:'20px' }}>Contact Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div className="form-group">
                        <label>Company Email</label>
                        <div style={{position:'relative'}}>
                            <Mail size={16} style={{position:'absolute', top:'12px', left:'10px', color:'#94a3b8'}} />
                            <input className="form-input" name="comp_email" value={companyForm.comp_email || ''} onChange={handleChange} style={{paddingLeft:'35px'}} placeholder="info@company.com" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Phone</label>
                        <div style={{position:'relative'}}>
                            <Phone size={16} style={{position:'absolute', top:'12px', left:'10px', color:'#94a3b8'}} />
                            <input className="form-input" name="comp_phone" value={companyForm.comp_phone || ''} onChange={handleChange} style={{paddingLeft:'35px'}} placeholder="+1 234 567 890" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Website</label>
                        <div style={{position:'relative'}}>
                            <Globe size={16} style={{position:'absolute', top:'12px', left:'10px', color:'#94a3b8'}} />
                            <input className="form-input" name="website" value={companyForm.website || ''} onChange={handleChange} style={{paddingLeft:'35px'}} placeholder="www.example.com" />
                        </div>
                    </div>
                </div>

                {/* --- ADDRESS --- */}
                <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label>Address</label>
                    <div style={{position:'relative'}}>
                        <MapPin size={16} style={{position:'absolute', top:'12px', left:'10px', color:'#94a3b8'}} />
                        <input className="form-input" name="address" value={companyForm.address || ''} onChange={handleChange} style={{paddingLeft:'35px'}} placeholder="Street Address" />
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div className="form-group"><label>City</label><input className="form-input" name="city" value={companyForm.city || ''} onChange={handleChange} /></div>
                    <div className="form-group"><label>State</label><input className="form-input" name="state" value={companyForm.state || ''} onChange={handleChange} /></div>
                    <div className="form-group"><label>Zipcode</label><input className="form-input" name="zipcode" value={companyForm.zipcode || ''} onChange={handleChange} /></div>
                    <div className="form-group"><label>Country</label><input className="form-input" name="country" value={companyForm.country || ''} onChange={handleChange} /></div>
                </div>

                <div style={{ textAlign: 'right', marginTop:'30px', borderTop:'1px solid #f1f5f9', paddingTop:'20px' }}>
                    <button type="submit" className="btn-primary" disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 30px' }}>
                        <Save size={18} /> {loading ? 'Saving...' : 'Save Profile'}
                    </button>
                </div>
            </form>
        </div>

        {/* --- DANGER ZONE --- */}
        <div className="card" style={{ border: '1px solid #fee2e2' }}>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                <div style={{ padding: '10px', background: '#fee2e2', borderRadius: '8px', color: '#dc2626' }}><AlertTriangle size={24} /></div>
                <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 5px 0', color: '#dc2626' }}>Deactivate Account</h3>
                    <p style={{ margin: '0 0 15px 0', color: '#7f1d1d', fontSize: '0.9rem' }}>This will immediately lock all users out of the system. Data will be preserved but inaccessible until reactivated by support.</p>
                    
                    <div style={{ marginTop: '15px', background: '#fef2f2', padding: '15px', borderRadius: '6px' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems:'flex-end' }}>
                            <div style={{flex:1}}>
                                <label style={{fontSize:'0.8rem', color:'#991b1b', marginBottom:'5px', display:'block'}}>Owner Password</label>
                                <input type="password" className="form-input" style={{ border: '1px solid #fecaca' }} value={deactivateData.password} onChange={e => setDeactivateData({...deactivateData, password: e.target.value})} />
                            </div>
                            <div style={{flex:1}}>
                                <label style={{fontSize:'0.8rem', color:'#991b1b', marginBottom:'5px', display:'block'}}>Confirm Password</label>
                                <input type="password" className="form-input" style={{ border: '1px solid #fecaca' }} value={deactivateData.confirmPassword} onChange={e => setDeactivateData({...deactivateData, confirmPassword: e.target.value})} />
                            </div>
                            <button onClick={handleDeactivate} className="btn-danger" style={{height:'42px'}}>Deactivate</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  )
}

export default CompanyProfile