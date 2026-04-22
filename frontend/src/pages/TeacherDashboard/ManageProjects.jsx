import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  FolderPlus,
  Pencil,
  Trash2,
  ChevronRight,
  X,
  ArrowLeft,
  Search,
  BookOpen
} from 'lucide-react';
import './TeacherDashboard.css';

const ManageProjects = () => {
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [sectionSearch, setSectionSearch] = useState('');
  const [formData, setFormData] = useState({ id: null, name: '', code: '' });

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

  const fetchProjects = async (sectionId) => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:8080/api/v1/proyects/section/${sectionId}`, {
        headers: { 'Authorization': authHeader }
      });
      setProjects(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSection = (section) => {
    setSelectedSection(section);
    fetchProjects(section.id);
  };

  const handleOpenModal = (project = null) => {
    if (project) {
      setFormData({ id: project.id, name: project.name, code: project.code });
    } else {
      setFormData({ id: null, name: '', code: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      code: formData.code,
      section: { id: selectedSection.id }
    };

    try {
      if (formData.id) {
        await axios.put(`http://localhost:8080/api/v1/proyects/${formData.id}`, payload, {
          headers: { 'Authorization': authHeader }
        });
      } else {
        await axios.post('http://localhost:8080/api/v1/proyects', payload, {
          headers: { 'Authorization': authHeader }
        });
      }
      setShowModal(false);
      fetchProjects(selectedSection.id);
    } catch (err) {
      console.error('Error saving project:', err);
      alert('Error al guardar el proyecto');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este proyecto?')) return;
    try {
      await axios.delete(`http://localhost:8080/api/v1/proyects/${id}`, {
        headers: { 'Authorization': authHeader }
      });
      fetchProjects(selectedSection.id);
    } catch (err) {
      console.error('Error deleting project:', err);
      alert('No se pudo eliminar el proyecto');
    }
  };

  const filteredSections = sections.filter(s =>
    s.sectionCode.toLowerCase().includes(sectionSearch.toLowerCase()) ||
    s.teacher?.name.toLowerCase().includes(sectionSearch.toLowerCase())
  );

  if (loading && sections.length === 0) return <div className="loading-state">Cargando...</div>;

  return (
    <div className="manage-projects">
      {!selectedSection ? (
        <div className="section-selection animate-fade-in">
          <header className="page-header">
            <h2>Ingresar Proyectos</h2>
            <p>Selecciona una sección para gestionar sus proyectos.</p>
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
        <div className="project-management animate-fade-in">
          <header className="page-header flex-between">
            <div className="flex-align-center gap-16">
              <button className="icon-btn" onClick={() => setSelectedSection(null)}>
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2>Proyectos: {selectedSection.sectionCode}</h2>
                <p>Gestionando proyectos para el periodo {selectedSection.semester}/{selectedSection.year}</p>
              </div>
            </div>
            <button className="primary-btn" onClick={() => handleOpenModal()}>
              <FolderPlus size={18} />
              <span>Ingresar Proyecto</span>
            </button>
          </header>

          <div className="table-container">
            <table className="custom-table table-simple glass">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre del Proyecto</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '40px' }}>
                      No hay proyectos en esta sección.
                    </td>
                  </tr>
                ) : (
                  projects.map(p => (
                    <tr key={p.id}>
                      <td className="bold">{p.code}</td>
                      <td>{p.name}</td>
                      <td>
                        <div className="flex gap-8">
                          <button className="icon-btn edit" onClick={() => handleOpenModal(p)}>
                            <Pencil size={18} />
                          </button>
                          <button className="icon-btn delete" onClick={() => handleDelete(p.id)}>
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
              <h3>{formData.id ? 'Editar Proyecto' : 'Nuevo Proyecto'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Código del Proyecto</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Ej: P13"
                  required
                />
              </div>
              <div className="form-group" style={{ marginTop: '16px' }}>
                <label>Nombre del Proyecto</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Sistema de Gestión Docente"
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="primary-btn">
                  {formData.id ? 'Guardar Cambios' : 'Ingresar Proyecto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageProjects;
