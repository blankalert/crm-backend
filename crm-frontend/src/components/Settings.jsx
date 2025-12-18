import React from 'react'

// This component is DEPRECATED.
// The sidebar now links directly to the specific settings pages:
// - Role Settings: /dashboard/settings/customization/roles
// - Company Profile: /dashboard/settings/customization/company

const Settings = () => {
  return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
        <h3>Settings</h3>
        <p>Please select a specific setting from the sidebar menu.</p>
    </div>
  )
}

export default Settings