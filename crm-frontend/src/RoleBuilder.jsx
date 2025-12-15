import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

function RoleBuilder() {
  const [permissions, setPermissions] = useState([])
  const [roleName, setRoleName] = useState('')
  const [selectedPerms, setSelectedPerms] = useState([]) // Stores UUIDs of checked boxes
  const [loading, setLoading] = useState(false)
  
  const token = localStorage.getItem('token')
  const navigate = useNavigate()

  // 1. Fetch the list of Checkboxes on load
  useEffect(() => {
    const fetchPerms = async () => {
        try {
            const res = await axios.get('http://localhost:3000/api/permissions', {
                headers: { Authorization: `Bearer ${token}` }
            })
            setPermissions(res.data)
        } catch (err) {
            alert("Error loading system permissions")
        }
    }
    fetchPerms()
  }, [])

  // 2. Handle Checkbox Click
  const handleCheckboxChange = (permId) => {
    if (selectedPerms.includes(permId)) {
        // Uncheck: Remove from array
        setSelectedPerms(selectedPerms.filter(id => id !== permId))
    } else {
        // Check: Add to array
        setSelectedPerms([...selectedPerms, permId])
    }
  }

  // 3. Save the Role
  const handleSave = async () => {
    if (!roleName) return alert("Please enter a Role Name")
    if (selectedPerms.length === 0) return alert("Please select at least one permission")

    setLoading(true)
    try {
        await axios.post('http://localhost:3000/api/roles', 
            { name: roleName, permissionIds: selectedPerms },
            { headers: { Authorization: `Bearer ${token}` } }
        )
        alert("Role Created Successfully!")
        navigate('/dashboard') // Go back to dashboard
    } catch (err) {
        alert("Failed to save role")
    } finally {
        setLoading(false)
    }
  }

  return (
    <div style={{ padding: '40px', maxWidth: '600px', fontFamily: 'Arial' }}>
      <h2>Create New Role</h2>
      <p>Define what users with this role can do.</p>

      {/* Role Name Input */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Role Name</label>
        <input 
            type="text" 
            placeholder="e.g. Sales Intern" 
            value={roleName}
            onChange={e => setRoleName(e.target.value)}
            style={{ padding: '10px', width: '100%' }}
        />
      </div>

      {/* Checkbox Grid */}
      <div style={{ marginBottom: '20px', border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Select Permissions:</label>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {permissions.map(perm => (
                <div key={perm.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input 
                        type="checkbox" 
                        checked={selectedPerms.includes(perm.id)}
                        onChange={() => handleCheckboxChange(perm.id)}
                    />
                    <span>{perm.description}</span> {/* We show the friendly description */}
                </div>
            ))}
        </div>
      </div>

      <button 
        onClick={handleSave} 
        disabled={loading}
        style={{ padding: '12px 20px', background: '#28a745', color: 'white', border: 'none', cursor: 'pointer' }}
      >
        {loading ? "Saving..." : "Save Custom Role"}
      </button>
    </div>
  )
}

export default RoleBuilder