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
  User
} from 'lucide-react';
import './TeacherDashboard.css';

const ManageStudents = () => {
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { 
      ...formData,
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
            <button className="primary-btn" onClick={() => handleOpenModal()}>
              <UserPlus size={18} />
              <span>Ingresar Alumno</span>
            </button>
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
          <div className="modal-content glass animate-fade-in">
            <div className="modal-header">
              <h3>{formData.id ? 'Editar Alumno' : 'Nuevo Alumno'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Nombre</label>
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
                <label>Apellido</label>
                <input 
                  type="text" 
                  value={formData.lastname}
                  onChange={e => setFormData({...formData, lastname: e.target.value})}
                  placeholder="Apellido"
                  required
                />
              </div>
              <div className="form-group" style={{ marginTop: '16px' }}>
                <label>Correo Institucional</label>
                <div className="input-with-icon">
                  <Mail size={16} className="input-icon" />
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    placeholder="ejemplo@usach.cl"
                    required
                  />
                </div>
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
    </div>
  );
};

export default ManageStudents;
