import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  UserPlus, 
  Pencil, 
  Trash2, 
  ChevronRight, 
  X, 
  ArrowLeft,
  Search,
  BookOpen,
  Mail,
  User,
  Upload,
  UploadCloud,
  FileSpreadsheet,
  AlertTriangle,
  UserCheck,
  HelpCircle,
  CheckCircle
} from 'lucide-react';
import './TeacherDashboard.css';

const ManageStudents = () => {
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [students, setStudents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [sectionSearch, setSectionSearch] = useState('');
  const [formData, setFormData] = useState({ 
    id: null, 
    name: '', 
    lastname: '', 
    email: '',
    proyectId: ''
  });
  const [sortConfig, setSortConfig] = useState({ key: 'lastname', direction: 'asc' });
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflicts, setConflicts] = useState([]);
  const [conflictIndex, setConflictIndex] = useState(0);
  const [resolutions, setResolutions] = useState([]);
  const [applyToAll, setApplyToAll] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [activeSummaryTab, setActiveSummaryTab] = useState('invalid');
  const [summaryData, setSummaryData] = useState({
    total: 0,
    processed: 0,
    replaced: 0,
    skipped: 0,
    invalidEmails: [],
    processedEmails: [],
    replacedEmails: [],
    skippedEmails: [],
    message: ''
  });
  const [pendingSummary, setPendingSummary] = useState({
    total: 0,
    processed: 0,
    invalidEmails: [],
    processedEmails: [],
    message: ''
  });

  const requestConfirm = (title, message, onConfirm, isDanger = false) => {
    setConfirmConfig({
      title,
      message,
      isDanger,
      onConfirm: () => {
        onConfirm();
        setConfirmConfig(null);
      },
      onCancel: () => {
        setConfirmConfig(null);
      }
    });
  };

  const authHeader = localStorage.getItem('auth');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchSections();
  }, [authHeader]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const sortedStudents = React.useMemo(() => {
    let sortableStudents = [...students];
    if (sortConfig.key) {
      sortableStudents.sort((a, b) => {
        let aVal = '';
        let bVal = '';

        if (sortConfig.key === 'name') {
          aVal = a.name || '';
          bVal = b.name || '';
        } else if (sortConfig.key === 'lastname') {
          aVal = a.lastname || '';
          bVal = b.lastname || '';
        } else if (sortConfig.key === 'email') {
          aVal = a.email || '';
          bVal = b.email || '';
        } else if (sortConfig.key === 'proyect') {
          aVal = a.proyect ? `${a.proyect.code} - ${a.proyect.name}` : 'zzz';
          bVal = b.proyect ? `${b.proyect.code} - ${b.proyect.name}` : 'zzz';
        }

        if (aVal.toLowerCase() < bVal.toLowerCase()) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aVal.toLowerCase() > bVal.toLowerCase()) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableStudents;
  }, [students, sortConfig]);

  const fetchSections = async () => {
    try {
      const url = user.role === 'HELPER' ? `/api/v1/sections/teacher/${user.email}` : '/api/v1/sections';
      const res = await axios.get(url, {
        headers: { 'Authorization': authHeader }
      });
      setSections(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching sections:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (sectionId) => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/v1/students/section/${sectionId}`, {
        headers: { 'Authorization': authHeader }
      });
      setStudents(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSection = (section) => {
    if (user.role === 'HELPER' && !section.isActive) {
      return;
    }
    setSelectedSection(section);
    fetchStudents(section.id);
    fetchProjects(section.id);
  };

  const fetchProjects = async (sectionId) => {
    try {
      const res = await axios.get(`/api/v1/proyects/section/${sectionId}`, {
        headers: { 'Authorization': authHeader }
      });
      setProjects(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  const handleOpenModal = (student = null) => {
    if (student) {
      setFormData({ 
        id: student.id, 
        name: student.name, 
        lastname: student.lastname, 
        email: student.email,
        proyectId: student.proyect ? student.proyect.id.toString() : ''
      });
    } else {
      setFormData({ id: null, name: '', lastname: '', email: '', proyectId: '' });
    }
    setShowModal(true);
  };

  const handleEmailChange = (e) => {
    const email = e.target.value;
    const newFormData = { ...formData, email };

    if (email.includes('@usach.cl')) {
      const parts = email.split('@')[0].split('.');
      if (parts.length >= 2) {
        // Capitalizar primera letra de cada parte
        const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
        
        newFormData.name = capitalize(parts[0]);
        newFormData.lastname = capitalize(parts[1]);
      }
    }
    setFormData(newFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email.toLowerCase().endsWith('@usach.cl')) {
      alert('El correo del alumno debe pertenecer a la institución (@usach.cl)');
      return;
    }

    const payload = { 
      name: formData.name,
      lastname: formData.lastname,
      email: formData.email,
      section: { id: selectedSection.id },
      proyect: formData.proyectId ? { id: parseInt(formData.proyectId) } : null
    };

    try {
      if (formData.id) {
        // Modo Edición: Se puede guardar directamente sin validaciones de transferencia
        await axios.put(`/api/v1/students/${formData.id}`, payload, {
          headers: { 'Authorization': authHeader }
        });
        setShowModal(false);
        fetchStudents(selectedSection.id);
      } else {
        // Modo Creación: Primero validamos si ya existe el estudiante en el sistema
        const checkRes = await axios.get(`/api/v1/students/check?email=${formData.email}&currentSectionId=${selectedSection.id}`, {
          headers: { 'Authorization': authHeader }
        });

        if (checkRes.data.exists) {
          const sData = checkRes.data;
          if (sData.inCurrentSection) {
            // Ya está en esta sección
            requestConfirm(
              'Alumno ya Inscrito',
              'Este alumno ya está registrado en la sección actual. ¿Deseas cargar sus datos para modificarlos?',
              () => {
                setFormData({
                  id: sData.student.id,
                  name: sData.student.name,
                  lastname: sData.student.lastname,
                  email: sData.student.email,
                  proyectId: sData.student.proyect ? sData.student.proyect.id.toString() : ''
                });
              }
            );
          } else {
            // Está en otra sección
            const warningTitle = 'Traslado de Alumno';
            const warningMsg = sData.sectionActive 
              ? `El alumno ya está inscrito en la sección ACTIVA "${sData.sectionCode}". ¿Deseas trasladar al alumno a la sección actual?`
              : `El alumno está inscrito en la sección histórica/inactiva "${sData.sectionCode}". ¿Deseas trasladar al alumno a la sección actual?`;

            requestConfirm(
              warningTitle,
              warningMsg,
              async () => {
                // 1. Ejecutar transferencia
                await axios.post('/api/v1/students/transfer', {
                  email: formData.email,
                  targetSectionId: selectedSection.id
                }, {
                  headers: { 'Authorization': authHeader }
                });

                // 2. Actualizar los datos del alumno (nombre, apellido, proyecto)
                await axios.put(`/api/v1/students/${sData.student.id}`, payload, {
                  headers: { 'Authorization': authHeader }
                });

                setShowModal(false);
                fetchStudents(selectedSection.id);
                alert('Alumno trasladado y actualizado con éxito.');
              }
            );
          }
        } else {
          // No existe, crear uno nuevo
          await axios.post('/api/v1/students', payload, {
            headers: { 'Authorization': authHeader }
          });
          setShowModal(false);
          fetchStudents(selectedSection.id);
        }
      }
    } catch (err) {
      console.error('Error saving student:', err);
      alert(err.response?.data || 'Error al guardar el estudiante');
    }
  };

  const handleDelete = async (id) => {
    requestConfirm(
      'Eliminar Alumno',
      '¿Estás seguro de que deseas eliminar permanentemente a este estudiante? Esta acción no se puede deshacer y retirará su ficha del listado.',
      async () => {
        try {
          await axios.delete(`/api/v1/students/${id}`, {
            headers: { 'Authorization': authHeader }
          });
          fetchStudents(selectedSection.id);
        } catch (err) {
          console.error('Error deleting student:', err);
          alert('No se pudo eliminar el estudiante');
        }
      },
      true // isDanger
    );
  };

  const validateAndSetFile = (file) => {
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      setUploadFile(file);
    } else {
      alert('Por favor, selecciona un archivo Excel válido (.xlsx o .xls)');
      setUploadFile(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    const fileData = new FormData();
    fileData.append('file', uploadFile);

    try {
      setLoading(true);
      const res = await axios.post(`/api/v1/students/section/${selectedSection.id}/upload`, fileData, {
        headers: { 
          'Authorization': authHeader,
          'Content-Type': 'multipart/form-data'
        }
      });
      setShowUploadModal(false);
      setUploadFile(null);
      fetchStudents(selectedSection.id);
      
      const { conflicts: excelConflicts, processed, message, invalidEmails, processedEmails, total } = res.data;
      
      setPendingSummary({
        total: total || 0,
        processed,
        invalidEmails: invalidEmails || [],
        processedEmails: processedEmails || [],
        message
      });

      const defaultTab = (invalidEmails && invalidEmails.length > 0) ? 'invalid' : 'new';
      setActiveSummaryTab(defaultTab);

      if (excelConflicts && excelConflicts.length > 0) {
        // Ordenar: primero los de la misma sección (isSameSection = true), luego los de otras secciones
        const sortedConflicts = [...excelConflicts].sort((a, b) => {
          if (a.isSameSection && !b.isSameSection) return -1;
          if (!a.isSameSection && b.isSameSection) return 1;
          return 0;
        });
        setConflicts(sortedConflicts);
        setConflictIndex(0);
        setResolutions([]);
        setApplyToAll(false);
        setShowConflictModal(true);
      } else {
        setSummaryData({
          total: total || 0,
          processed,
          replaced: 0,
          skipped: 0,
          invalidEmails: invalidEmails || [],
          processedEmails: processedEmails || [],
          replacedEmails: [],
          skippedEmails: [],
          message: 'Carga de alumnos finalizada con éxito.'
        });
        setShowSummaryModal(true);
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      alert('Error al subir el archivo Excel. Asegúrate de que los correos tengan el formato correcto.');
    } finally {
      setLoading(false);
    }
  };

  const executeConflictResolutions = async (allResolutions) => {
    try {
      setLoading(true);
      await axios.post('/api/v1/students/resolve-conflicts', {
        targetSectionId: selectedSection.id,
        resolutions: allResolutions
      }, {
        headers: { 'Authorization': authHeader }
      });
      
      setShowConflictModal(false);
      fetchStudents(selectedSection.id);
      
      const replacedResolutions = allResolutions.filter(r => r.action === 'replace');
      const skippedResolutions = allResolutions.filter(r => r.action === 'skip');
      
      const defaultTab = (pendingSummary.invalidEmails && pendingSummary.invalidEmails.length > 0) ? 'invalid' : 'new';
      setActiveSummaryTab(defaultTab);

      setSummaryData({
        total: pendingSummary.total,
        processed: pendingSummary.processed,
        replaced: replacedResolutions.length,
        skipped: skippedResolutions.length,
        invalidEmails: pendingSummary.invalidEmails,
        processedEmails: pendingSummary.processedEmails,
        replacedEmails: replacedResolutions,
        skippedEmails: skippedResolutions,
        message: 'Resolución de conflictos y carga finalizada con éxito.'
      });
      setShowSummaryModal(true);
    } catch (err) {
      console.error('Error resolving conflicts:', err);
      alert('Ocurrió un error al procesar las resoluciones de conflictos.');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveConflict = (action) => {
    const currentConf = conflicts[conflictIndex];
    const newRes = { 
      email: currentConf.email, 
      action: action, 
      name: currentConf.suggestedName, 
      lastname: currentConf.suggestedLastname,
      isSameSection: currentConf.isSameSection,
      currentSectionCode: currentConf.currentSectionCode
    };

    if (applyToAll) {
      const isSame = currentConf.isSameSection;
      const nextResolutions = [...resolutions];
      
      conflicts.forEach((conf, idx) => {
        if (idx < conflictIndex) return;
        if (idx === conflictIndex) {
          nextResolutions.push(newRes);
          return;
        }
        if (conf.isSameSection === isSame) {
          nextResolutions.push({
            email: conf.email,
            action: action,
            name: conf.suggestedName,
            lastname: conf.suggestedLastname,
            isSameSection: conf.isSameSection,
            currentSectionCode: conf.currentSectionCode
          });
        }
      });

      const nextDiffIndex = conflicts.findIndex((c, idx) => idx > conflictIndex && c.isSameSection !== isSame);
      setResolutions(nextResolutions);
      setApplyToAll(false);

      if (nextDiffIndex !== -1) {
        setConflictIndex(nextDiffIndex);
      } else {
        executeConflictResolutions(nextResolutions);
      }
    } else {
      const nextResolutions = [...resolutions, newRes];
      setResolutions(nextResolutions);
      if (conflictIndex < conflicts.length - 1) {
        setConflictIndex(conflictIndex + 1);
      } else {
        executeConflictResolutions(nextResolutions);
      }
    }
  };

  const filteredSections = sections.filter(s => 
    s.sectionCode.toLowerCase().includes(sectionSearch.toLowerCase()) ||
    s.teacher?.name.toLowerCase().includes(sectionSearch.toLowerCase())
  );

  if (loading && sections.length === 0) return <div className="loading-state">Cargando...</div>;

  return (
    <div className="manage-students">
      {!selectedSection ? (
        <div className="section-selection animate-fade-in">
          <header className="page-header">
            <h2>Ingresar Alumnos</h2>
            <p>Selecciona una sección para gestionar sus estudiantes.</p>
          </header>

          <div className="search-box glass" style={{ marginBottom: '24px' }}>
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              placeholder="Buscar sección por código o profesor..." 
              value={sectionSearch}
              onChange={e => setSectionSearch(e.target.value)}
            />
          </div>

          <div className="selection-grid">
            {filteredSections.map(s => {
              const isHelperAndInactive = user.role === 'HELPER' && !s.isActive;
              return (
                <div 
                  key={s.id} 
                  className={`selection-card glass ${isHelperAndInactive ? 'disabled-card' : ''}`} 
                  onClick={() => handleSelectSection(s)}
                  style={isHelperAndInactive ? { opacity: 0.5, filter: 'grayscale(0.8)', cursor: 'not-allowed' } : {}}
                  title={isHelperAndInactive ? "Sección inactiva - No disponible para ayudante" : ""}
                >
                  <div className="card-icon">
                    <BookOpen size={24} color={isHelperAndInactive ? "var(--text-muted)" : "var(--primary)"} />
                  </div>
                  <div className="card-info">
                    <h3 style={isHelperAndInactive ? { color: 'var(--text-muted)' } : {}}>{s.sectionCode}</h3>
                    <p>{s.semester}/{s.year} - {s.teacher?.name}</p>
                    {isHelperAndInactive && <span style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 'bold' }}>Inactivo</span>}
                  </div>
                  {!isHelperAndInactive && <ChevronRight size={20} className="arrow" />}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="student-management animate-fade-in">
          <header className="page-header flex-between">
            <div className="flex-align-center gap-16">
              <button className="icon-btn" onClick={() => setSelectedSection(null)}>
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2>Alumnos: {selectedSection.sectionCode}</h2>
                <p>Gestionando estudiantes para el periodo {selectedSection.semester}/{selectedSection.year}</p>
              </div>
            </div>
            <div className="flex-align-center gap-16">
              <button className="secondary-btn flex-align-center gap-8" onClick={() => setShowUploadModal(true)}>
                <Upload size={18} />
                <span>Subir Listado</span>
              </button>
              <button className="primary-btn flex-align-center gap-8" onClick={() => handleOpenModal()}>
                <UserPlus size={18} />
                <span>Ingresar Alumno</span>
              </button>
            </div>
          </header>

          <div className="table-container">
            <table className="custom-table table-simple glass">
              <thead>
                <tr>
                  <th style={{ width: '60px', textAlign: 'center' }}>N°</th>
                  <th onClick={() => requestSort('name')} style={{ cursor: 'pointer', userSelect: 'none' }} className="sortable-header">
                    Nombre <span style={{ fontSize: '0.75rem', opacity: 0.8, marginLeft: '4px' }}>{getSortIcon('name')}</span>
                  </th>
                  <th onClick={() => requestSort('lastname')} style={{ cursor: 'pointer', userSelect: 'none' }} className="sortable-header">
                    Apellido <span style={{ fontSize: '0.75rem', opacity: 0.8, marginLeft: '4px' }}>{getSortIcon('lastname')}</span>
                  </th>
                  <th onClick={() => requestSort('email')} style={{ cursor: 'pointer', userSelect: 'none' }} className="sortable-header">
                    Correo <span style={{ fontSize: '0.75rem', opacity: 0.8, marginLeft: '4px' }}>{getSortIcon('email')}</span>
                  </th>
                  <th onClick={() => requestSort('proyect')} style={{ cursor: 'pointer', userSelect: 'none' }} className="sortable-header">
                    Proyecto <span style={{ fontSize: '0.75rem', opacity: 0.8, marginLeft: '4px' }}>{getSortIcon('proyect')}</span>
                  </th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sortedStudents.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                      No hay alumnos en esta sección.
                    </td>
                  </tr>
                ) : (
                  sortedStudents.map((s, index) => (
                    <tr key={s.id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.88rem', fontWeight: '600', textAlign: 'center' }}>{index + 1}</td>
                      <td className="bold">{s.name}</td>
                      <td className="bold">{s.lastname}</td>
                      <td>
                        <div className="flex-align-center gap-8">
                          <Mail size={14} color="var(--text-muted)" />
                          {s.email}
                        </div>
                      </td>
                      <td>
                        {s.proyect ? (
                          <span className="badge-project" style={{
                            background: 'rgba(78, 126, 255, 0.1)',
                            color: 'var(--primary)',
                            padding: '4px 12px',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            fontWeight: '600'
                          }}>
                            {s.proyect.code} - {s.proyect.name}
                          </span>
                        ) : (
                          <span className="badge-unassigned" style={{
                            color: 'var(--text-muted)',
                            fontSize: '0.85rem',
                            fontStyle: 'italic'
                          }}>
                            No asignado
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="flex gap-8">
                          <button className="icon-btn edit" onClick={() => handleOpenModal(s)}>
                            <Pencil size={18} />
                          </button>
                          {user.role !== 'HELPER' && (
                            <button className="icon-btn delete" onClick={() => handleDelete(s.id)}>
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content glass animate-slide-up">
            <div className="modal-header">
              <h3>{formData.id ? 'Editar Alumno' : 'Nuevo Alumno'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group" style={{ marginTop: '16px' }}>
                <label>Correo Institucional</label>
                <div className="input-with-icon">
                  <Mail size={16} className="input-icon" />
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={handleEmailChange}
                    placeholder="ejemplo@usach.cl"
                    required
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '16px' }}>
                <label>Nombre (Auto-completado)</label>
                <div className="input-with-icon">
                  <User size={16} className="input-icon" />
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="Nombre"
                    required
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '16px' }}>
                <label>Apellido (Auto-completado)</label>
                <input 
                  type="text" 
                  value={formData.lastname}
                  onChange={e => setFormData({...formData, lastname: e.target.value})}
                  placeholder="Apellido"
                  required
                />
              </div>
              <div className="form-group" style={{ marginTop: '16px' }}>
                <label>Proyecto Asignado</label>
                <select
                  value={formData.proyectId}
                  onChange={e => setFormData({ ...formData, proyectId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'var(--text-light)',
                    marginTop: '8px',
                    outline: 'none'
                  }}
                >
                  <option value="">No asignado</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                  ))}
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="primary-btn">
                  {formData.id ? 'Guardar Cambios' : 'Ingresar Alumno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal-content glass animate-slide-up" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Subir Listado de Alumnos</h3>
              <button className="close-btn" onClick={() => { setShowUploadModal(false); setUploadFile(null); setIsDragging(false); }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ margin: '16px 0 24px', fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: '1.5' }}>
              Sube un archivo Excel donde la primera columna (Columna A) contenga los correos de los alumnos. El sistema extraerá automáticamente el nombre y apellido.
            </div>
            <form onSubmit={handleUploadSubmit} className="modal-form">
              <div className="form-group">
                <div 
                  className={`drag-drop-zone ${isDragging ? 'dragging' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('excel-upload-input').click()}
                  style={{
                    border: `2px dashed ${isDragging ? 'var(--primary)' : 'rgba(255, 255, 255, 0.2)'}`,
                    borderRadius: '12px',
                    padding: '40px 20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: isDragging ? 'rgba(78, 126, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px'
                  }}
                >
                  <input 
                    type="file" 
                    id="excel-upload-input"
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  {uploadFile ? (
                    <>
                      <FileSpreadsheet size={48} color="#4ade80" />
                      <div style={{ pointerEvents: 'none' }}>
                        <p style={{ fontWeight: '600', color: 'var(--text-light)', marginBottom: '4px' }}>Archivo seleccionado</p>
                        <p style={{ color: 'var(--primary)', wordBreak: 'break-all' }}>{uploadFile.name}</p>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', pointerEvents: 'none' }}>Haz clic o arrastra otro archivo para cambiar</p>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={48} color={isDragging ? 'var(--primary)' : 'var(--text-muted)'} />
                      <p style={{ color: 'var(--text-light)', fontWeight: '500', pointerEvents: 'none', margin: '0' }}>
                        {isDragging ? '¡Suelta el archivo aquí!' : 'Arrastra tu archivo Excel aquí'}
                      </p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', pointerEvents: 'none', margin: '0' }}>
                        o haz clic para explorar en tu computadora
                      </p>
                      <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '12px', marginTop: '8px', pointerEvents: 'none' }}>
                        Solo .xlsx o .xls
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="modal-footer" style={{ marginTop: '32px' }}>
                <button type="button" className="secondary-btn" onClick={() => { setShowUploadModal(false); setUploadFile(null); setIsDragging(false); }}>
                  Cancelar
                </button>
                <button type="submit" className="primary-btn" disabled={!uploadFile}>
                  <Upload size={18} />
                  <span>Procesar Excel</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showConflictModal && conflicts[conflictIndex] && (() => {
        const currentConf = conflicts[conflictIndex];
        const isSame = currentConf.isSameSection;
        const remainingSameType = conflicts.slice(conflictIndex + 1).filter(c => c.isSameSection === isSame).length;

        return (
          <div className="modal-overlay">
            <div className="modal-content glass animate-slide-up" style={{ maxWidth: '600px', padding: '24px' }}>
              <div className="modal-header" style={{ paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <h3 style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <AlertTriangle size={22} />
                    {isSame ? 'Conflicto: Alumno en Sección Actual' : 'Conflicto: Alumno en Otra Sección'}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Resolviendo {isSame ? 'duplicado' : 'traslado'} {conflictIndex + 1} de {conflicts.length}
                  </span>
                </div>
                <button className="close-btn" onClick={() => setShowConflictModal(false)}>
                  <X size={20} />
                </button>
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden', marginTop: '1px' }}>
                <div style={{ width: `${((conflictIndex + 1) / conflicts.length) * 100}%`, height: '100%', background: 'var(--warning)', transition: 'width 0.3s ease' }}></div>
              </div>
              
              <div style={{ margin: '16px 0', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                El correo <strong>{currentConf.email}</strong> ya existe en el sistema. Selecciona qué acción deseas aplicar sobre este registro.
              </div>

              {/* Collision Panels */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '16px', 
                marginBottom: '20px' 
              }}>
                {/* Current in System */}
                <div style={{ 
                  background: 'rgba(239, 68, 68, 0.03)', 
                  border: '1px solid rgba(239, 68, 68, 0.15)', 
                  borderRadius: '8px', 
                  padding: '12px 14px' 
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#dc2626', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Datos en el Sistema
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '4px' }}>
                    {currentConf.name} {currentConf.lastname}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', wordBreak: 'break-all' }}>
                    {currentConf.email}
                  </div>
                  <div style={{ 
                    display: 'inline-block', 
                    fontSize: '0.75rem', 
                    background: 'rgba(239, 68, 68, 0.08)', 
                    border: '1px solid rgba(239, 68, 68, 0.15)',
                    padding: '3px 8px', 
                    borderRadius: '4px', 
                    color: '#dc2626',
                    fontWeight: '600'
                  }}>
                    Sección: {currentConf.currentSectionCode}
                  </div>
                </div>

                {/* Excel suggested */}
                <div style={{ 
                  background: 'rgba(34, 197, 94, 0.03)', 
                  border: '1px solid rgba(34, 197, 94, 0.15)', 
                  borderRadius: '8px', 
                  padding: '12px 14px' 
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#16a34a', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Datos Nuevos (Excel)
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '4px' }}>
                    {currentConf.suggestedName} {currentConf.suggestedLastname}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', wordBreak: 'break-all' }}>
                    {currentConf.email}
                  </div>
                  <div style={{ 
                    display: 'inline-block', 
                    fontSize: '0.75rem', 
                    background: 'rgba(34, 197, 94, 0.08)', 
                    border: '1px solid rgba(34, 197, 94, 0.15)',
                    padding: '3px 8px', 
                    borderRadius: '4px', 
                    color: '#16a34a',
                    fontWeight: '600'
                  }}>
                    Sección: {selectedSection.sectionCode}
                  </div>
                </div>
              </div>

              {/* Dynamic Warning info */}
              {isSame ? (
                <div style={{ 
                  padding: '12px 14px', 
                  background: 'rgba(13, 148, 136, 0.05)', 
                  border: '1px solid rgba(13, 148, 136, 0.15)',
                  borderLeft: '4px solid var(--primary)', 
                  borderRadius: '6px',
                  color: 'var(--text-main)',
                  fontSize: '0.82rem',
                  lineHeight: '1.45',
                  marginBottom: '20px'
                }}>
                  <strong style={{ color: 'var(--primary)', marginRight: '4px' }}>Actualización de Ficha:</strong> El alumno ya pertenece a la sección actual. Si decides reemplazar, se actualizarán su nombre y apellido en el sistema con los datos del Excel. No se modificará su proyecto asignado ni sus reportes semanales.
                </div>
              ) : (
                <div style={{ 
                  padding: '12px 14px', 
                  background: 'rgba(59, 130, 246, 0.05)', 
                  border: '1px solid rgba(59, 130, 246, 0.15)',
                  borderLeft: '4px solid #2563eb', 
                  borderRadius: '6px',
                  color: 'var(--text-main)',
                  fontSize: '0.82rem',
                  lineHeight: '1.45',
                  marginBottom: '20px'
                }}>
                  <strong style={{ color: '#2563eb', marginRight: '4px' }}>Traslado Seguro:</strong> El alumno pertenece a otra sección. Si decides trasladarlo, se le reubicará en la sección actual y su historial de reportes semanales anteriores se conservará intacto en su sección original.
                </div>
              )}

              {/* Checkbox Apply to Remaining of the same category */}
              {remainingSameType > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', cursor: 'pointer' }} onClick={() => setApplyToAll(!applyToAll)}>
                  <input 
                    type="checkbox"
                    checked={applyToAll}
                    onChange={() => {}} // handled by click
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', userSelect: 'none' }}>
                    {isSame 
                      ? `Aplicar esta elección a los ${remainingSameType} duplicados restantes de esta sección` 
                      : `Aplicar esta elección a los ${remainingSameType} traslados restantes de otras secciones`}
                  </span>
                </div>
              )}

              {/* OS style Actions footer */}
              <div className="modal-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button 
                  type="button" 
                  className="secondary-btn" 
                  onClick={() => handleResolveConflict('skip')}
                  style={{ minWidth: '100px' }}
                >
                  Omitir
                </button>
                
                <button 
                  type="button" 
                  className="primary-btn" 
                  onClick={() => handleResolveConflict('replace')}
                  style={{ background: 'var(--primary)', minWidth: '180px' }}
                >
                  {isSame ? 'Reemplazar (Actualizar)' : 'Trasladar'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {confirmConfig && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content glass animate-slide-up" style={{ maxWidth: '450px', padding: '24px', textAlign: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ 
                width: '56px', 
                height: '56px', 
                borderRadius: '50%', 
                background: confirmConfig.isDanger ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: confirmConfig.isDanger ? '#ef4444' : '#3b82f6'
              }}>
                {confirmConfig.isDanger ? <AlertTriangle size={28} /> : <HelpCircle size={28} />}
              </div>
              
              <div style={{ width: '100%' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text)' }}>
                  {confirmConfig.title}
                </h3>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.5' }}>
                  {confirmConfig.message}
                </p>
              </div>

              {/* Warnings style banner inside confirm dialog if transferring */}
              {confirmConfig.title === 'Traslado de Alumno' && (
                <div style={{ 
                  padding: '10px 12px', 
                  background: 'rgba(59, 130, 246, 0.05)', 
                  border: '1px solid rgba(59, 130, 246, 0.15)',
                  borderLeft: '4px solid #2563eb', 
                  borderRadius: '6px',
                  color: 'var(--text-main)',
                  fontSize: '0.8rem',
                  lineHeight: '1.4',
                  textAlign: 'left',
                  width: '100%'
                }}>
                  <strong style={{ color: '#2563eb', marginRight: '4px' }}>Historial Preservado:</strong> Su historial de reportes semanales anteriores se conservará intacto en su sección original.
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '8px' }}>
                <button 
                  type="button" 
                  className="secondary-btn" 
                  onClick={confirmConfig.onCancel}
                  style={{ flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="primary-btn" 
                  onClick={confirmConfig.onConfirm}
                  style={{ 
                    flex: 1, 
                    padding: '10px', 
                    background: confirmConfig.isDanger ? '#ef4444' : 'var(--primary)',
                    borderColor: confirmConfig.isDanger ? '#ef4444' : 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  Aceptar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSummaryModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content glass animate-slide-up" style={{ maxWidth: '680px', padding: '24px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={24} color="var(--success)" />
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text)' }}>
                  Resumen del Proceso
                </h3>
              </div>
              <button className="close-btn" onClick={() => setShowSummaryModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ 
              background: 'rgba(0, 164, 153, 0.03)', 
              border: '1px solid rgba(0, 164, 153, 0.15)', 
              borderRadius: '8px', 
              padding: '12px 16px', 
              marginBottom: '20px', 
              fontSize: '0.9rem',
              color: 'var(--text-main)',
              lineHeight: '1.5'
            }}>
              Se procesaron un total de <strong style={{ color: 'var(--primary)', fontSize: '1rem' }}>{summaryData.total}</strong> correos desde el archivo subido. 
              Haz clic en cualquiera de las tarjetas de abajo para ver la lista detallada de correos correspondientes.
            </div>

            {/* Metrics Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '12px', 
              marginBottom: '20px' 
            }}>
              {/* Processed/New */}
              <div 
                onClick={() => setActiveSummaryTab('new')}
                style={{ 
                  background: 'rgba(78, 126, 255, 0.03)', 
                  border: activeSummaryTab === 'new' ? '2px solid var(--primary)' : '1px solid rgba(78, 126, 255, 0.15)', 
                  borderRadius: '8px', 
                  padding: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  transform: activeSummaryTab === 'new' ? 'scale(1.02)' : 'none',
                  boxShadow: activeSummaryTab === 'new' ? '0 4px 12px rgba(0, 164, 153, 0.1)' : 'none'
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
                  Alumnos Nuevos Cargados
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)', marginTop: '4px' }}>
                  {summaryData.processed}
                </div>
              </div>

              {/* Replaced/Transferred */}
              <div 
                onClick={() => setActiveSummaryTab('replaced')}
                style={{ 
                  background: 'rgba(234, 179, 8, 0.03)', 
                  border: activeSummaryTab === 'replaced' ? '2px solid var(--warning)' : '1px solid rgba(234, 179, 8, 0.15)', 
                  borderRadius: '8px', 
                  padding: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  transform: activeSummaryTab === 'replaced' ? 'scale(1.02)' : 'none',
                  boxShadow: activeSummaryTab === 'replaced' ? '0 4px 12px rgba(234, 179, 8, 0.1)' : 'none'
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
                  Actualizados / Trasladados
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--warning)', marginTop: '4px' }}>
                  {summaryData.replaced}
                </div>
              </div>

              {/* Omitted/Skipped */}
              <div 
                onClick={() => setActiveSummaryTab('skipped')}
                style={{ 
                  background: 'rgba(255, 255, 255, 0.01)', 
                  border: activeSummaryTab === 'skipped' ? '2px solid var(--text-muted)' : '1px solid var(--border)', 
                  borderRadius: '8px', 
                  padding: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  transform: activeSummaryTab === 'skipped' ? 'scale(1.02)' : 'none',
                  boxShadow: activeSummaryTab === 'skipped' ? '0 4px 12px rgba(255, 255, 255, 0.05)' : 'none'
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
                  Omitidos
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)', marginTop: '4px' }}>
                  {summaryData.skipped}
                </div>
              </div>

              {/* Invalid Emails count */}
              <div 
                onClick={() => setActiveSummaryTab('invalid')}
                style={{ 
                  background: summaryData.invalidEmails.length > 0 ? 'rgba(239, 68, 68, 0.03)' : 'rgba(255, 255, 255, 0.01)', 
                  border: activeSummaryTab === 'invalid' ? '2px solid #ef4444' : (summaryData.invalidEmails.length > 0 ? '1px solid rgba(239, 68, 68, 0.15)' : '1px solid var(--border)'), 
                  borderRadius: '8px', 
                  padding: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  transform: activeSummaryTab === 'invalid' ? 'scale(1.02)' : 'none',
                  boxShadow: activeSummaryTab === 'invalid' ? '0 4px 12px rgba(239, 68, 68, 0.1)' : 'none'
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
                  Correos con Formato Inválido
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: summaryData.invalidEmails.length > 0 ? '#ef4444' : 'var(--text-main)', marginTop: '4px' }}>
                  {summaryData.invalidEmails.length}
                </div>
              </div>
            </div>

            {/* Dynamic List Section */}
            {(() => {
              const tabDetails = {
                new: {
                  title: 'Correos cargados exitosamente como nuevos alumnos:',
                  emails: summaryData.processedEmails || [],
                  color: 'var(--primary)',
                  type: 'simple'
                },
                replaced: {
                  title: 'Correos de alumnos actualizados o trasladados:',
                  emails: summaryData.replacedEmails || [],
                  color: 'var(--warning)',
                  type: 'resolved'
                },
                skipped: {
                  title: 'Correos de duplicados o traslados omitidos:',
                  emails: summaryData.skippedEmails || [],
                  color: 'var(--text-muted)',
                  type: 'skipped'
                },
                invalid: {
                  title: 'Correos omitidos por no ser @usach.cl o tener errores de formato:',
                  emails: summaryData.invalidEmails || [],
                  color: '#ef4444',
                  type: 'simple'
                }
              }[activeSummaryTab] || { title: '', emails: [], color: 'var(--text-muted)', type: 'simple' };

              return (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: tabDetails.color, textTransform: 'uppercase', marginBottom: '8px' }}>
                    {tabDetails.title} ({tabDetails.emails.length})
                  </div>
                  <div style={{ 
                    maxHeight: '220px', 
                    overflowY: 'auto', 
                    background: 'var(--bg-dark)', 
                    border: '1px solid var(--border)',
                    borderRadius: '6px', 
                    padding: '8px 12px',
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    color: 'var(--text-main)',
                    textAlign: 'left'
                  }}>
                    {tabDetails.emails.length === 0 ? (
                      <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '4px 0' }}>
                        No hay correos en esta categoría.
                      </div>
                    ) : (
                      tabDetails.emails.map((item, idx) => {
                        const isLast = idx < tabDetails.emails.length - 1;
                        const borderStyle = { padding: '4px 0', borderBottom: isLast ? '1px solid var(--border)' : 'none' };
                        
                        if (tabDetails.type === 'resolved') {
                          return (
                            <div key={idx} style={borderStyle}>
                              • {item.isSameSection ? (
                                <span>[Actualización] <strong>{item.email}</strong></span>
                              ) : (
                                <span>[Traslado] <strong>{item.email}</strong> (desde Sección: <em>{item.currentSectionCode}</em>)</span>
                              )}
                            </div>
                          );
                        } else if (tabDetails.type === 'skipped') {
                          return (
                            <div key={idx} style={borderStyle}>
                              • {item.isSameSection ? (
                                <span>[Omitido - Actualización] <strong>{item.email}</strong></span>
                              ) : (
                                <span>[Omitido - Traslado] <strong>{item.email}</strong> (permanece en Sección: <em>{item.currentSectionCode}</em>)</span>
                              )}
                            </div>
                          );
                        } else {
                          return (
                            <div key={idx} style={borderStyle}>
                              • {item}
                            </div>
                          );
                        }
                      })
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Modal Footer */}
            <div className="modal-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className="primary-btn" 
                onClick={() => setShowSummaryModal(false)}
                style={{ minWidth: '120px', background: 'var(--primary)', borderColor: 'var(--primary)' }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageStudents;
