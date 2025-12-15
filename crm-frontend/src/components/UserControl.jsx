import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { ArrowLeft, User as UserIcon } from 'lucide-react'
import TableLayout from '../TableLayout'
import '../App.css'

const UserControl = ({ token }) => {
  const [userList, setUserList] = useState([])
  const [roles, setRoles] = useState([])
  const [viewMode, setViewMode] = useState('list') // 'list' or 'form'
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [message, setMessage] = useState('')
  
  // Initial Form State
  const initialFormState = { 
    email: '', password: '', role_id: '', 
    first_name: '', last_name: '', gender: '',
    country_code: '+91', phone: '', 
    designation: '', department: '', teams: '', image: ''
  }
  
  const [formData, setFormData] = useState(initialFormState)

  useEffect(() => {
    fetchUsers()
    fetchRoles()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/users', { headers: { Authorization: `Bearer ${token}` } })
      setUserList(res.data)
    } catch (err) { console.error("Failed to load users") }
  }

  const fetchRoles = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/roles', { headers: { Authorization: `Bearer ${token}` } })
      setRoles(res.data)
    } catch (err) { console.error("Failed to load roles") }
  }

  // --- HANDLERS ---

  const handleInputChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleEditClick = (user) => {
      setFormData({
          email: user.email,
          password: '', // Keep empty to not change
          role_id: user.role_id || '',
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          gender: user.gender || '',
          country_code: user.country_code || '+91',
          phone: user.phone || '',
          designation: user.designation || '',
          department: user.department || '',
          teams: user.teams || '',
          image: user.image || ''
      })
      setEditingId(user.id)
      setIsEditing(true)
      setViewMode('form')
  }

  const handleAddNewClick = () => {
      setFormData(initialFormState)
      setIsEditing(false)
      setEditingId(null)
      setViewMode('form')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (isEditing) {
          // UPDATE EXISTING USER
          await axios.put(`http://localhost:3000/api/users/${editingId}`, formData, { 
              headers: { Authorization: `Bearer ${token}` } 
          })
          setMessage(`Success! User updated.`)
      } else {
          // CREATE NEW USER
          await axios.post('http://localhost:3000/api/users/create', formData, { 
              headers: { Authorization: `Bearer ${token}` } 
          })
          setMessage(`Success! User created.`)
      }
      
      // Cleanup
      fetchUsers()
      setTimeout(() => { 
          setMessage('')
          setViewMode('list') 
      }, 1500);

    } catch (err) { 

        console.error(err);
        setMessage(err.response?.data?.message || "Operation failed. Check console.");
    }
  }

  const handleDeleteUser = async (userRow) => {
    if(!window.confirm(`Delete ${userRow.full_name}?`)) return;
    try {
      await axios.delete(`http://localhost:3000/api/users/${userRow.id}`, { headers: { Authorization: `Bearer ${token}` } })
      fetchUsers()
    } catch (err) { alert(err.response?.data?.message || "Failed to delete") }
  }

  // --- CUSTOM COLUMN RENDERER FOR TABLE ---
  // This helps us show the image and details in the table cell
  const NameCell = ({ row }) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {row.image ? (
              <img src={row.image} alt="profile" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                  <UserIcon size={18} />
              </div>
          )}
          <div>
              <div style={{ fontWeight: '500', color: '#0f172a' }}>{row.full_name}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{row.designation || 'No Designation'}</div>
          </div>
      </div>
  )

  // --- RENDER ---
  if (viewMode === 'list') {
    // We map the data to a structure our TableLayout understands
    // Note: We use a custom render function for the Name column manually in TableLayout if we wanted, 
    // but for simplicity, let's pre-process or update TableLayout. 
    // *Simpler approach:* We just pass the data, but for the "Full Name" column, our reusable table currently just prints text.
    // To make it look "Pro", I'll modify the data slightly for the table.
    
    const userColumns = [
      { label: 'Employee', key: 'full_name' }, // We will hijack this in TableLayout or just show text for now.
      { label: 'Role', key: 'role_name' },
      { label: 'Department', key: 'department' },
      { label: 'Status', key: 'is_active' },
    ]

    // Let's create a display-friendly list
    const displayList = userList.map(u => ({
        ...u,
        full_name: `${u.first_name} ${u.last_name}`,
        is_active: u.is_active ? 'Active' : 'Inactive'
    }))

    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <TableLayout 
          title="Employee Directory"
          columns={userColumns}
          data={displayList}
          onAdd={handleAddNewClick} 
          onDelete={handleDeleteUser}      
          onEdit={handleEditClick}
        />
      </div>
    )
  } 
  
  // --- FORM VIEW ---
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <button onClick={() => setViewMode('list')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '15px', color: '#64748b' }}>
        <ArrowLeft size={18} /> Back to Directory
      </button>

      <div className="card">
        <h3 style={{ marginTop: 0, marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px', color: '#1e293b' }}>
            {isEditing ? 'Edit Employee Profile' : 'Onboard New Employee'}
        </h3>
        
        {message && <div style={{ padding: '12px', marginBottom: '20px', borderRadius: '6px', background: message.includes('Success') ? '#dcfce7' : '#fee2e2', color: message.includes('Success') ? '#166534' : '#991b1b' }}>{message}</div>}
        
        <form onSubmit={handleSubmit}>
          
          {/* SECTION 1: PERSONAL INFO */}
          <h4 style={{color:'#64748b', marginBottom: '15px', fontSize:'0.85rem', textTransform:'uppercase'}}>Personal Details</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom:'20px' }}>
            <div className="form-group">
              <label>First Name</label>
              <input type="text" name="first_name" className="form-input" required value={formData.first_name} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input type="text" name="last_name" className="form-input" required value={formData.last_name} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label>Gender</label>
              <select name="gender" className="form-input" value={formData.gender} onChange={handleInputChange}>
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginBottom:'20px' }}>
             <div className="form-group">
                 <label>Profile Image URL</label>
                 <input type="text" name="image" placeholder="https://..." className="form-input" value={formData.image} onChange={handleInputChange} />
             </div>
             {/* Image Preview */}
             {formData.image && (
                 <div style={{display:'flex', alignItems:'flex-end'}}>
                     <img src={formData.image} alt="Preview" style={{width:'40px', height:'40px', borderRadius:'50%', objectFit:'cover', border:'1px solid #ddd'}} />
                 </div>
             )}
          </div>

          {/* SECTION 2: WORK INFO */}
          <h4 style={{color:'#64748b', marginBottom: '15px', fontSize:'0.85rem', textTransform:'uppercase', borderTop:'1px solid #f1f5f9', paddingTop:'20px'}}>Organization</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom:'20px' }}>
             <div className="form-group">
                 <label>Designation</label>
                 <input type="text" name="designation" placeholder="e.g. Senior Manager" className="form-input" value={formData.designation} onChange={handleInputChange} />
             </div>
             <div className="form-group">
                 <label>Department</label>
                 <input type="text" name="department" placeholder="e.g. Sales" className="form-input" value={formData.department} onChange={handleInputChange} />
             </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom:'20px' }}>
             <div className="form-group">
                 <label>Teams</label>
                 <input type="text" name="teams" placeholder="e.g. Alpha, North-Zone" className="form-input" value={formData.teams} onChange={handleInputChange} />
             </div>
             <div className="form-group">
              <label>System Role</label>
              <select name="role_id" className="form-input" value={formData.role_id} onChange={handleInputChange} style={{ background: 'white' }}>
                <option value="">Select Role...</option>
                {roles.map(role => (<option key={role.id} value={role.id}>{role.name}</option>))}
              </select>
             </div>
          </div>

          {/* SECTION 3: CONTACT & LOGIN */}
          <h4 style={{color:'#64748b', marginBottom: '15px', fontSize:'0.85rem', textTransform:'uppercase', borderTop:'1px solid #f1f5f9', paddingTop:'20px'}}>Contact & Login</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 3fr', gap: '20px', marginBottom:'20px' }}>
             <div className="form-group">
                 <label>Code</label>
                 <input type="text" name="country_code" className="form-input" value={formData.country_code} onChange={handleInputChange} />
             </div>
             <div className="form-group">
                 <label>Phone</label>
                 <input type="text" name="phone" className="form-input" value={formData.phone} onChange={handleInputChange} />
             </div>
             <div className="form-group">
                 <label>Email (Login ID)</label>
                 <input type="email" name="email" className="form-input" required value={formData.email} onChange={handleInputChange} disabled={isEditing} style={isEditing ? {background: '#f1f5f9'} : {}} />
             </div>
          </div>

          {!isEditing && (
              <div className="form-group" style={{maxWidth: '50%'}}>
                  <label>Password</label>
                  <input type="password" name="password" className="form-input" required={!isEditing} value={formData.password} onChange={handleInputChange} />
              </div>
          )}

          <button type="submit" className="btn-primary" style={{ marginTop: '20px', width: '100%', padding: '14px', fontSize: '1rem' }}>
              {isEditing ? 'Update Employee Profile' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default UserControl