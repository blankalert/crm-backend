import React, { useState, useEffect, useRef, useMemo } from 'react'
import { 
  Search, Settings, Filter, Plus, Save, X, 
  GripVertical, Check, ChevronDown, Trash2, Edit2, 
  ChevronLeft, ChevronRight, ArrowDown, ArrowUp, XCircle // <-- CHANGED HERE
} from 'lucide-react'
import '../App.css'

const AdvancedTable = ({ 
    tableName, title, columns, data, onAdd, onEdit, onDelete, 
    customRenderer, headerActions, onRowClick // <-- Prop used here
}) => {
  // ... [ALL STATE & EFFECTS REMAIN THE SAME] ...
  const [searchQuery, setSearchQuery] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [visibleColumns, setVisibleColumns] = useState([]) 
  const [columnOrder, setColumnOrder] = useState([])       
  const [columnWidths, setColumnWidths] = useState({})
  const [showColSelector, setShowColSelector] = useState(false)
  const [draggedCol, setDraggedCol] = useState(null)
  
  const [showFilters, setShowFilters] = useState(false)
  const [activeFilters, setActiveFilters] = useState([]) 
  const [savedFilterSets, setSavedFilterSets] = useState([]) 
  const [selectedSavedFilter, setSelectedSavedFilter] = useState('')
  const [newFilter, setNewFilter] = useState({ colKey: '', operator: 'contains', value: '' })
  const [filterSetName, setFilterSetName] = useState('')

  const resizingRef = useRef(null)
  const startXRef = useRef(null)
  const startWidthRef = useRef(null)

  useEffect(() => {
    const savedOrder = localStorage.getItem(`${tableName}_colOrder`)
    const savedVis = localStorage.getItem(`${tableName}_colVis`)
    const savedWidths = localStorage.getItem(`${tableName}_colWidths`)
    const savedSets = localStorage.getItem(`${tableName}_filterSets`)

    if (savedOrder) setColumnOrder(JSON.parse(savedOrder))
    else setColumnOrder(columns.map(c => c.key)) 

    if (savedVis) setVisibleColumns(JSON.parse(savedVis))
    else setVisibleColumns(columns.map(c => c.key)) 

    if (savedWidths) setColumnWidths(JSON.parse(savedWidths))
    if (savedSets) setSavedFilterSets(JSON.parse(savedSets))
  }, [columns, tableName])

  const processedData = useMemo(() => {
    let result = [...data]

    if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase()
        result = result.filter(row => 
            columns.some(col => String(row[col.key] || '').toLowerCase().includes(lowerQuery))
        )
    }

    if (activeFilters.length > 0) {
        result = result.filter(row => {
            return activeFilters.every(filter => {
                const rowVal = String(row[filter.colKey] || '').toLowerCase()
                const filterVal = filter.value.toLowerCase()
                switch(filter.operator) {
                    case 'equals': return rowVal === filterVal;
                    case 'contains': return rowVal.includes(filterVal);
                    case 'starts': return rowVal.startsWith(filterVal);
                    case 'ends': return rowVal.endsWith(filterVal);
                    case 'not': return rowVal !== filterVal;
                    default: return true;
                }
            })
        })
    }

    if (sortConfig.key) {
        result.sort((a, b) => {
            const valA = a[sortConfig.key] || ''
            const valB = b[sortConfig.key] || ''
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1
            return 0
        })
    }
    return result
  }, [data, searchQuery, activeFilters, sortConfig, columns])

  const totalPages = Math.ceil(processedData.length / itemsPerPage)
  const paginatedData = processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleSort = (key) => setSortConfig(current => ({ key, direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc' }))
  
  const toggleColumn = (colKey) => {
      let newVis = visibleColumns.includes(colKey) ? visibleColumns.filter(k => k !== colKey) : [...visibleColumns, colKey]
      setVisibleColumns(newVis)
      localStorage.setItem(`${tableName}_colVis`, JSON.stringify(newVis))
  }

  const handleDragStart = (e, colKey) => { setDraggedCol(colKey); e.dataTransfer.effectAllowed = 'move'; e.target.classList.add('dragging') }
  const handleDragOver = (e, targetColKey) => {
      e.preventDefault(); if (!draggedCol || draggedCol === targetColKey) return;
      const newOrder = [...columnOrder]; const draggedIdx = newOrder.indexOf(draggedCol); const targetIdx = newOrder.indexOf(targetColKey);
      newOrder.splice(draggedIdx, 1); newOrder.splice(targetIdx, 0, draggedCol); setColumnOrder(newOrder);
  }
  const handleDragEnd = (e) => { e.target.classList.remove('dragging'); setDraggedCol(null); localStorage.setItem(`${tableName}_colOrder`, JSON.stringify(columnOrder)) }

  const startResize = (e, colKey) => {
      e.preventDefault(); resizingRef.current = colKey; startXRef.current = e.pageX; startWidthRef.current = columnWidths[colKey] || 150;
      document.addEventListener('mousemove', doResize); document.addEventListener('mouseup', stopResize); document.body.style.cursor = 'col-resize';
  }
  const doResize = (e) => { if (!resizingRef.current) return; const diff = e.pageX - startXRef.current; setColumnWidths(prev => ({ ...prev, [resizingRef.current]: Math.max(50, startWidthRef.current + diff) })) }
  const stopResize = () => { localStorage.setItem(`${tableName}_colWidths`, JSON.stringify(columnWidths)); resizingRef.current = null; document.removeEventListener('mousemove', doResize); document.removeEventListener('mouseup', stopResize); document.body.style.cursor = 'default'; }

  const addFilter = () => { if(!newFilter.colKey || !newFilter.value) return; setActiveFilters([...activeFilters, newFilter]); setNewFilter({ colKey: '', operator: 'contains', value: '' }); setCurrentPage(1); }
  const removeFilter = (idx) => setActiveFilters(activeFilters.filter((_, i) => i !== idx))
  const saveCurrentFilterSet = () => {
      if(!filterSetName) return alert("Enter name"); const newSet = { id: Date.now(), name: filterSetName, filters: activeFilters };
      const updated = [...savedFilterSets, newSet]; setSavedFilterSets(updated); localStorage.setItem(`${tableName}_filterSets`, JSON.stringify(updated)); setFilterSetName('');
  }
  const loadFilterSet = (e) => {
      const setId = Number(e.target.value); const set = savedFilterSets.find(s => s.id === setId);
      if(set) { setActiveFilters(set.filters); setSelectedSavedFilter(setId); setCurrentPage(1); } else { setActiveFilters([]); setSelectedSavedFilter(''); }
  }
  const deleteFilterSet = (setId, e) => {
      e.stopPropagation(); if(!window.confirm("Delete?")) return;
      const updated = savedFilterSets.filter(s => s.id !== setId); setSavedFilterSets(updated); localStorage.setItem(`${tableName}_filterSets`, JSON.stringify(updated));
      if(selectedSavedFilter === setId) { setActiveFilters([]); setSelectedSavedFilter(''); }
  }
  const getColDef = (key) => columns.find(c => c.key === key) || { label: key }

  return (
    <div className="adv-table-card">
        {/* --- TOOLBAR --- */}
        <div className="adv-table-toolbar" style={{ flexWrap: 'wrap', gap: '12px' }}>
            
            {/* 1. SEARCH (First & Wide) */}
            <div className="adv-search-box" style={{ flex: '1 1 300px', minWidth: '250px' }}>
                <Search size={18} />
                <input 
                    placeholder={`Search ${title}...`} 
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                />
                {searchQuery && <X size={14} style={{cursor:'pointer', position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', color:'#94a3b8'}} onClick={() => setSearchQuery('')} />}
            </div>

            {/* 2. SAVED VIEWS */}
            <div className="adv-select-wrapper">
                <select 
                    value={selectedSavedFilter} 
                    onChange={loadFilterSet}
                    className="btn-secondary"
                    style={{ borderColor: '#e2e8f0', color: '#64748b', height: '40px' }}
                >
                    <option value="">📂 Saved Views</option>
                    {savedFilterSets.map(set => <option key={set.id} value={set.id}>{set.name}</option>)}
                </select>
            </div>

            {/* 3. FILTERS */}
            <button 
                className={`btn-secondary ${showFilters || activeFilters.length > 0 ? 'active' : ''}`}
                onClick={() => setShowFilters(!showFilters)}
                style={{ height: '40px' }}
            >
                <Filter size={16} /> Filter
                {activeFilters.length > 0 && <span className="badge">{activeFilters.length}</span>}
            </button>

            {/* 4. CUSTOM ACTIONS (View Toggles) */}
            {headerActions}

            {/* 5. COLUMNS (Toggle Visibility) */}
            <div style={{ position: 'relative' }}>
                <button className="btn-secondary" onClick={() => setShowColSelector(!showColSelector)} style={{ height: '40px' }}>
                    <Settings size={16} /> Columns
                </button>
                {showColSelector && (
                    <div className="adv-dropdown-menu">
                        <div className="menu-header">Show/Hide Columns</div>
                        {columns.map(col => (
                            <div key={col.key} className="menu-item" onClick={() => toggleColumn(col.key)}>
                                <div className={`checkbox ${visibleColumns.includes(col.key) ? 'checked' : ''}`}>
                                    {visibleColumns.includes(col.key) && <Check size={12} />}
                                </div>
                                <span>{col.label}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 6. ADD NEW */}
            {onAdd && (
                <button onClick={onAdd} className="btn-primary" style={{ padding: '0 20px', height: '40px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <Plus size={18} /> Add New
                </button>
            )}
        </div>

        {/* --- FILTER PANEL --- */}
        {showFilters && (
            <div className="adv-filter-panel">
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '15px' }}>
                    <span style={{fontSize:'0.85rem', fontWeight:'600', color:'#475569'}}>Where:</span>
                    <select className="form-input" style={{ width: '140px' }} value={newFilter.colKey} onChange={e => setNewFilter({...newFilter, colKey: e.target.value})}>
                        <option value="">Select Column</option>
                        {columns.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                    </select>
                    <select className="form-input" style={{ width: '110px' }} value={newFilter.operator} onChange={e => setNewFilter({...newFilter, operator: e.target.value})}>
                        <option value="contains">Contains</option>
                        <option value="equals">Equals</option>
                        <option value="starts">Starts With</option>
                        <option value="ends">Ends With</option>
                        <option value="not">Not Equal</option>
                    </select>
                    <input className="form-input" style={{ width: '140px' }} placeholder="Value..." value={newFilter.value} onChange={e => setNewFilter({...newFilter, value: e.target.value})} />
                    <button onClick={addFilter} className="btn-secondary">Add</button>
                </div>

                {activeFilters.length > 0 && (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {activeFilters.map((f, i) => (
                            <span key={i} className="filter-tag">
                                {getColDef(f.colKey).label} <span style={{opacity:0.6, fontSize:'0.7em', margin:'0 4px'}}>{f.operator}</span> <b>{f.value}</b>
                                <X size={12} style={{cursor:'pointer', marginLeft:'5px'}} onClick={() => removeFilter(i)} />
                            </span>
                        ))}
                        <button onClick={saveCurrentFilterSet} className="btn-xs primary" style={{marginLeft:'auto'}}>Save View</button>
                    </div>
                )}
            </div>
        )}

        {/* --- BODY --- */}
        {customRenderer ? (
            <div style={{ flex: 1, overflow: 'auto', padding: '15px', background: '#f1f5f9' }}>
                {customRenderer(processedData, visibleColumns)}
            </div>
        ) : (
            <>
                <div className="adv-table-container">
                    <table>
                        <thead>
                            <tr>
                                {columnOrder.map(colKey => {
                                    if (!visibleColumns.includes(colKey)) return null;
                                    const colDef = getColDef(colKey);
                                    const width = columnWidths[colKey] || 150;
                                    return (
                                        <th 
                                            key={colKey} draggable
                                            onDragStart={(e) => handleDragStart(e, colKey)}
                                            onDragOver={(e) => handleDragOver(e, colKey)}
                                            onDragEnd={handleDragEnd}
                                            onClick={() => handleSort(colKey)}
                                            style={{ width: `${width}px` }}
                                            className={sortConfig.key === colKey ? 'sorted' : ''}
                                        >
                                            <div className="th-content">
                                                <GripVertical size={14} className="drag-handle" />
                                                <span>{colDef.label}</span>
                                                {sortConfig.key === colKey && (sortConfig.direction === 'asc' ? <ArrowDown size={14} /> : <ArrowUp size={14} />)} {/* <-- UPDATED ICONS */}
                                            </div>
                                            <div className="resize-handle" onMouseDown={(e) => startResize(e, colKey)} onClick={(e) => e.stopPropagation()} />
                                        </th>
                                    )
                                })}
                                {(onEdit || onDelete) && <th style={{ width: '100px', textAlign: 'center' }}>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.length > 0 ? (
                                paginatedData.map((row, i) => (
                                    <tr 
                                        key={i} 
                                        onClick={() => onRowClick && onRowClick(row)} // <-- CLICK EVENT
                                        style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                                    >
                                        {columnOrder.map(colKey => {
                                            if (!visibleColumns.includes(colKey)) return null;
                                            return <td key={colKey}><div className="td-content" title={row[colKey]}>{row[colKey]}</div></td>
                                        })}
                                        {(onEdit || onDelete) && (
                                            <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                                                {onEdit && <button onClick={() => onEdit(row)} className="action-btn edit"><Edit2 size={16} /></button>}
                                                {onDelete && <button onClick={() => onDelete(row)} className="action-btn delete"><Trash2 size={16} /></button>}
                                            </td>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="100%" className="no-data">No records found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Pagination */}
                <div className="adv-pagination">
                    <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Showing <b>{(currentPage - 1) * itemsPerPage + 1}</b> to <b>{Math.min(currentPage * itemsPerPage, processedData.length)}</b> of <b>{processedData.length}</b> entries</div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <select value={itemsPerPage} onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="form-input" style={{ width: 'auto', padding: '5px 10px', height: '32px' }}>
                            <option value={10}>10 / page</option><option value={25}>25 / page</option><option value={50}>50 / page</option><option value={100}>100 / page</option>
                        </select>
                        <div className="page-controls">
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft size={16} /></button>
                            <span>Page {currentPage} of {totalPages || 1}</span>
                            <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)}><ChevronRight size={16} /></button>
                        </div>
                    </div>
                </div>
            </>
        )}
    </div>
  )
}

export default AdvancedTable