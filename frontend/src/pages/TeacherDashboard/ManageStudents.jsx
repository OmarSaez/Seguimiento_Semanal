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
  FileSpreadsheet
} from 'lucide-react';
import './TeacherDashboard.css';

const ManageStudents = () => {
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [students, setStudents] = useState([]);
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
    email: '' 
  });

  const authHeader = localStorage.getItem('auth');

  useEffect(() => {
    fetchSections();
  }, [authHeader]);

  const fetchSections = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/v1/sections', {
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
      const res = await axios.get(`http://localhost:8080/api/v1/students/section/${sectionId}`, {
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
    setSelectedSection(section);
    fetchStudents(section.id);
  };

  const handleOpenModal = (student = null) => {
    if (student) {
      setFormData({ 
        id: student.id, 
        name: student.name, 
        lastname: student.lastname, 
        email: student.email 
      });
    } else {
      setFormData({ id: null, name: '', lastname: '', email: '' });
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
    const payload = { 
      name: formData.name,
      lastname: formData.lastname,
      email: formData.email,
      section: { id: selectedSection.id } 
    };

    try {
      if (formData.id) {
        await axios.put(`http://localhost:8080/api/v1/students/${formData.id}`, payload, {
          headers: { 'Authorization': authHeader }
        });
      } else {
        await axios.post('http://localhost:8080/api/v1/students', payload, {
          headers: { 'Authorization': authHeader }
        });
      }
      setShowModal(false);
      fetchStudents(selectedSection.id);
    } catch (err) {
      console.error('Error saving student:', err);
      alert('Error al guardar el estudiante');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este estudiante?')) return;
    try {
      await axios.delete(`http://localhost:8080/api/v1/students/${id}`, {
        headers: { 'Authorization': authHeader }
      });
      fetchStudents(selectedSection.id);
    } catch (err) {
      console.error('Error deleting student:', err);
      alert('No se pudo eliminar el estudiante');
    }
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

    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      await axios.post(`http://localhost:8080/api/v1/students/section/${selectedSection.id}/upload`, formData, {
        headers: { 
          'Authorization': authHeader,
          'Content-Type': 'multipart/form-data'
        }
      });
      setShowUploadModal(false);
      setUploadFile(null);
      fetchStudents(selectedSection.id);
      alert('Alumnos cargados exitosamente');
    } catch (err) {
      console.error('Error uploading file:', err);
      alert('Error al subir el archivo Excel. Asegúrate de que los correos tengan el formato correcto.');
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
            {filteredSections.map(s => (
              <div key={s.id} className="selection-card glass" onClick={() => handleSelectSection(s)}>
                <div className="card-icon">
                  <BookOpen size={24} color="var(--primary)" />
                </div>
                <div className="card-info">
                  <h3>{s.sectionCode}</h3>
                  <p>{s.semester}/{s.year} - {s.teacher?.name}</p>
                </div>
                <ChevronRight size={20} className="arrow" />
              </div>
            ))}
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
            <table className="custom-table glass">
              <thead>
                <tr>
                  <th>Nombre Completo</th>
                  <th>Correo</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '40px' }}>
                      No hay alumnos en esta sección.
                    </td>
                  </tr>
                ) : (
                  students.map(s => (
                    <tr key={s.id}>
                      <td className="bold">{s.name} {s.lastname}</td>
                      <td>
                        <div className="flex-align-center gap-8">
                          <Mail size={14} color="var(--text-muted)" />
                          {s.email}
                        </div>
                      </td>
                      <td>
                        <div className="flex gap-8">
                          <button className="icon-btn edit" onClick={() => handleOpenModal(s)}>
                            <Pencil size={18} />
                          </button>
                          <button className="icon-btn delete" onClick={() => handleDelete(s.id)}>
                            <Trash2 size={18} />
                          </button>
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
    </div>
  );
};

export default ManageStudents;
