import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useOutletContext, useParams, useNavigate } from 'react-router-dom';
import { Layout, CheckSquare, Users, GripVertical, Eye, X } from 'lucide-react';

// Define System Fields that should always be available
const SYSTEM_FIELDS = {
  leads: [
    { field_key: 'leadRID', field_label: 'Lead ID (System)', is_system: true },
    { field_key: 'name', field_label: 'Lead Name *', is_system: true },
    { field_key: 'company_name', field_label: 'Company', is_system: true },
    { field_key: 'lead_date', field_label: 'Date', is_system: true },
    { field_key: 'req_amount', field_label: 'Value ($)', is_system: true },
    { field_key: 'pipeline', field_label: 'Pipeline', is_system: true },
    { field_key: 'status', field_label: 'Status', is_system: true },
    { field_key: 'priority', field_label: 'Priority', is_system: true },
    { field_key: 'lead_type', field_label: 'Lead Type', is_system: true },
    { field_key: 'source', field_label: 'Source', is_system: true },
    { field_key: 'company_email', field_label: 'Primary Email', is_system: true },
    { field_key: 'company_phone', field_label: 'Primary Phone', is_system: true },
    { field_key: 'phones', field_label: 'Secondary Phones', is_system: true },
    { field_key: 'emails', field_label: 'Secondary Emails', is_system: true },
    { field_key: 'address', field_label: 'Address', is_system: true },
    { field_key: 'owner', field_label: 'Owner', is_system: true },
    { field_key: 'category', field_label: 'Category', is_system: true },
    { field_key: 'lead_message', field_label: 'Description', is_system: true },
    { field_key: 'remark', field_label: 'Remarks', is_system: true }
  ],
  tasks: [
    { field_key: 'task_name', field_label: 'Task Name *', is_system: true },
    { field_key: 'task_type', field_label: 'Type', is_system: true },
    { field_key: 'status', field_label: 'Status', is_system: true },
    { field_key: 'priority', field_label: 'Priority', is_system: true },
    { field_key: 'due_date', field_label: 'Due Date', is_system: true },
    { field_key: 'owner_id', field_label: 'Assigned To', is_system: true },
    { field_key: 'description', field_label: 'Description', is_system: true }
  ]
};

const FormLayoutEditor = () => {
  const { token } = useOutletContext() || {};
  const authToken = token || localStorage.getItem('token');
  const { id } = useParams(); // Get ID if editing
  const navigate = useNavigate();

  const [fields, setFields] = useState([]);
  const [sections, setSections] = useState([
    { title: "General Information", fields: [] }
  ]);
  const [layoutName, setLayoutName] = useState("");
  const [targetModule, setTargetModule] = useState(null); // 'leads', 'tasks', etc.
  const [selectedSectionIndex, setSelectedSectionIndex] = useState(0);
  const [loading, setLoading] = useState(!!id); // Start loading if editing
  const [draggedItem, setDraggedItem] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch Existing Layout if Editing
  useEffect(() => {
    if (id && authToken) {
        const fetchLayout = async () => {
            try {
                const res = await axios.get(`http://localhost:3000/api/layouts/detail/${id}`, {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                setLayoutName(res.data.layout_name);
                setSections(res.data.layout_config);
                setTargetModule(res.data.module_name);
            } catch (err) {
                console.error("Failed to load layout", err);
                setLoading(false);
            }
        };
        fetchLayout();
    }
  }, [id, authToken]);

  // Fetch Fields
  useEffect(() => {
    const fetchFields = async () => {
      if (!targetModule) return;
      setLoading(true);
      try {
        const response = await axios.get(`http://localhost:3000/api/form-fields/fields/${targetModule}`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const apiFields = Array.isArray(response.data) ? response.data : [];
        const systemFields = SYSTEM_FIELDS[targetModule] || [];
        
        // Merge System Fields with API Fields (API fields take precedence if duplicates exist, though keys should be unique)
        // We filter out system fields from API response if they are already in our hardcoded list to avoid duplicates
        const mergedFields = [
            ...systemFields,
            ...apiFields.filter(apiF => !systemFields.some(sysF => sysF.field_key === apiF.field_key))
        ];

        setFields(mergedFields);
      } catch (error) {
        console.error("Error fetching fields:", error);
        setFields([]);
      } finally {
        setLoading(false);
      }
    };
    if (authToken && targetModule) fetchFields();
  }, [authToken, targetModule]);

  // Derived state: Available fields (not in any section)
  const usedFieldKeys = new Set(sections.flatMap(s => s.fields));
  const availableFields = fields.filter(f => !usedFieldKeys.has(f.field_key));

  const addSection = () => {
    setSections([...sections, { title: "New Section", fields: [] }]);
    setSelectedSectionIndex(sections.length); // Select the new one
  };

  const removeSection = (index) => {
    if (sections.length === 1) return alert("At least one section is required.");
    const newSections = sections.filter((_, i) => i !== index);
    setSections(newSections);
    if (selectedSectionIndex >= index && selectedSectionIndex > 0) {
      setSelectedSectionIndex(selectedSectionIndex - 1);
    }
  };

  const updateSectionTitle = (index, title) => {
    const newSections = [...sections];
    newSections[index].title = title;
    setSections(newSections);
  };

  const addFieldToSection = (fieldKey) => {
    const newSections = [...sections];
    newSections[selectedSectionIndex].fields.push(fieldKey);
    setSections(newSections);
  };

  const removeFieldFromSection = (sectionIndex, fieldKey) => {
    const newSections = [...sections];
    newSections[sectionIndex].fields = newSections[sectionIndex].fields.filter(k => k !== fieldKey);
    setSections(newSections);
  };

  const saveLayout = async () => {
    if (!layoutName.trim()) return alert("Please enter a Layout Name.");
    if (sections.some(s => s.fields.length === 0)) return alert("Remove empty sections before saving.");

    try {
      if (id) {
          // UPDATE
          await axios.put(`http://localhost:3000/api/layouts/${id}`, {
              layout_name: layoutName,
              layout_config: sections
          }, {
            headers: { 'Authorization': `Bearer ${authToken}` }
          });
      } else {
          // CREATE
          await axios.post('http://localhost:3000/api/layouts', {
              module_name: targetModule,
              layout_name: layoutName,
              layout_config: sections
          }, {
            headers: { 'Authorization': `Bearer ${authToken}` }
          });
      }

      alert("Layout saved successfully!");
      navigate('/dashboard/settings/form-layouts'); // Go back to manager
      
    } catch (error) {
      console.error(error);
      alert("Failed to save layout: " + (error.response?.data?.error || error.message));
    }
  };

  // --- DRAG AND DROP HANDLERS ---
  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    // Optional: set drag image or styling
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDropSection = (e, targetIndex) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.type !== 'section') return;

    const newSections = [...sections];
    const [moved] = newSections.splice(draggedItem.index, 1);
    newSections.splice(targetIndex, 0, moved);
    setSections(newSections);
    setSelectedSectionIndex(targetIndex);
    setDraggedItem(null);
  };

  const handleDropField = (e, sectionIndex, fieldIndex) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent bubbling to section drop
    if (!draggedItem) return;
    if (draggedItem.type === 'section') return;

    const newSections = [...sections];
    let keyToAdd = draggedItem.key;

    // If moving existing field, remove it first
    if (draggedItem.type === 'section-field') {
        const sourceFields = newSections[draggedItem.sectionIndex].fields;
        sourceFields.splice(draggedItem.fieldIndex, 1);
        keyToAdd = draggedItem.key;
    }

    // Add to target
    const targetFields = newSections[sectionIndex].fields;
    if (fieldIndex === -1) targetFields.push(keyToAdd);
    else targetFields.splice(fieldIndex, 0, keyToAdd);

    setSections(newSections);
    setDraggedItem(null);
  };

  // --- MODULE SELECTION VIEW (For New Layouts) ---
  if (!targetModule && !id) {
      return (
        <div style={{ maxWidth: '800px', margin: '40px auto', textAlign: 'center' }}>
            <h2 style={{ color: '#1e293b', marginBottom: '10px' }}>Select Module</h2>
            <p style={{ color: '#64748b', marginBottom: '30px' }}>Which module do you want to create a form layout for?</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div 
                    onClick={() => setTargetModule('leads')}
                    className="card" 
                    style={{ cursor: 'pointer', padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', transition: 'all 0.2s', border: '2px solid transparent' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                    <div style={{ width: '50px', height: '50px', background: '#eff6ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                        <Users size={24} />
                    </div>
                    <h3 style={{ margin: 0, color: '#1e293b' }}>Leads</h3>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Sales Pipeline & Contacts</p>
                </div>

                <div 
                    onClick={() => setTargetModule('tasks')}
                    className="card" 
                    style={{ cursor: 'pointer', padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', transition: 'all 0.2s', border: '2px solid transparent' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                    <div style={{ width: '50px', height: '50px', background: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                        <CheckSquare size={24} />
                    </div>
                    <h3 style={{ margin: 0, color: '#1e293b' }}>Tasks</h3>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Follow-ups & Todos</p>
                </div>
            </div>
        </div>
      );
  }

  if (loading) return <div className="p-8">Loading fields...</div>;

  return (
    <div className="layout-editor-wrapper">
      {/* SIDEBAR: Available Fields */}
      <div className="layout-sidebar">
        <div className="layout-sidebar-header">
            <h2>Available Fields</h2>
            <p className="text-xs text-gray-500">Click + to add to selected section.</p>
        </div>
        
        <div className="layout-sidebar-content">
          {availableFields.map(field => (
            <div 
                key={field.id} 
                className="sidebar-field-item"
                draggable
                onDragStart={(e) => handleDragStart(e, { type: 'sidebar-field', key: field.field_key })}
            >
              <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                <GripVertical size={14} color="#cbd5e1" />
                <span>{field.field_label}</span>
              </div>
              <button 
                onClick={() => addFieldToSection(field.field_key)}
                className="add-btn-icon"
              >
                +
              </button>
            </div>
          ))}
          {availableFields.length === 0 && (
            <p className="text-gray-400 text-sm italic text-center mt-4">All fields used.</p>
          )}
        </div>
      </div>

      {/* MAIN AREA: Editor */}
      <div className="layout-canvas">
        <div className="layout-header-bar">
          <h1 className="text-xl font-bold text-slate-800 m-0">{id ? 'Edit Layout' : 'New Layout'} ({targetModule})</h1>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Layout Name (e.g. Sales View)" 
              className="form-input"
              style={{ width: '250px' }}
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value)}
            />
            <button 
              onClick={() => setShowPreview(true)}
              className="btn-secondary"
              title="Preview Layout"
            >
              <Eye size={18} /> Preview
            </button>
            <button 
              onClick={saveLayout}
              className="btn-primary"
            >
              Save Layout
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {sections.map((section, idx) => (
            <div 
              key={idx} 
              onClick={() => setSelectedSectionIndex(idx)}
              draggable
              onDragStart={(e) => handleDragStart(e, { type: 'section', index: idx })}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDropSection(e, idx)}
              className={`layout-section ${selectedSectionIndex === idx ? 'selected' : ''}`}
            >
              <div className="layout-section-header">
                <div style={{display:'flex', alignItems:'center', gap:'10px', flex:1}}>
                <GripVertical size={16} color="white" style={{cursor:'grab', opacity: 0.8}} />
                <input 
                  type="text" 
                  value={section.title}
                  onChange={(e) => updateSectionTitle(idx, e.target.value)}
                  className="section-title-input"
                  placeholder="Section Title"
                />
                </div>
                <button onClick={(e) => { e.stopPropagation(); removeSection(idx); }} className="text-white text-sm hover:underline font-medium" style={{ opacity: 0.9 }}>
                  Remove Section
                </button>
              </div>

              <div 
                className="layout-fields-grid"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropField(e, idx, -1)} // Drop on grid = append
              >
                {section.fields.map((fieldKey, fIdx) => {
                  const fieldInfo = fields.find(f => f.field_key === fieldKey);
                  return (
                    <div 
                        key={fieldKey} 
                        className="field-chip"
                        draggable
                        onDragStart={(e) => {
                            e.stopPropagation();
                            handleDragStart(e, { type: 'section-field', sectionIndex: idx, fieldIndex: fIdx, key: fieldKey });
                        }}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={(e) => handleDropField(e, idx, fIdx)}
                    >
                      <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                        <GripVertical size={14} color="#cbd5e1" />
                        <span>{fieldInfo?.field_label || fieldKey}</span>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeFieldFromSection(idx, fieldKey); }}
                        className="text-gray-400 hover:text-red-500 px-1"
                        style={{ fontSize: '1.2rem', lineHeight: 0.5 }}
                      >
                        &times;
                      </button>
                    </div>
                  );
                })}
                {section.fields.length === 0 && (
                  <div className="empty-state-box">
                    Select this section and add fields from sidebar
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <button 
          onClick={addSection}
          className="btn-add-section"
        >
          + Add New Section
        </button>
      </div>

      {/* PREVIEW MODAL */}
      {showPreview && (
        <div className="preview-modal-overlay">
          <div className="preview-modal-container">
            <div className="preview-modal-header">
              <h3>Form Preview ({targetModule})</h3>
              <button onClick={() => setShowPreview(false)} className="btn-icon">
                <X size={24} color="#64748b" />
              </button>
            </div>
            <div className="preview-modal-body">
              <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {sections.map((section, idx) => (
                  <div key={idx} className="card" style={{ marginBottom: '20px' }}>
                    <h4 style={{borderBottom:'1px solid #f1f5f9', paddingBottom:'10px', color:'#94a3b8', marginBottom:'20px'}}>{section.title}</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                      {section.fields.map(key => {
                        const field = fields.find(f => f.field_key === key);
                        return (
                          <div key={key} className="form-group">
                            <label>{field?.field_label || key}</label>
                            <input className="form-input" value="Sample Data" disabled style={{ background: '#f8fafc', cursor: 'default' }} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormLayoutEditor;