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
  const [sectionStudents, setSectionStudents] = useState([]);
  const [checkedStudentIds, setCheckedStudentIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [sectionSearch, setSectionSearch] = useState('');
  const [formData, setFormData] = useState({ id: null, name: '', code: '' });
  const [viewingStudentsProject, setViewingStudentsProject] = useState(null);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');

  const authHeader = localStorage.getItem('auth');

  useEffect(() => {
    fetchSections();
  }, [authHeader]);

  const fetchSections = async () => {
    try {
      const res = await axios.get('/api/v1/sections', {
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
      const res = await axios.get(`/api/v1/proyects/section/${sectionId}`, {
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
    fetchSectionStudents(section.id);
  };

  const fetchSectionStudents = async (sectionId) => {
    try {
      const res = await axios.get(`/api/v1/students/section/${sectionId}`, {
        headers: { 'Authorization': authHeader }
      });
      setSectionStudents(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching section students:', err);
    }
  };

  const handleOpenModal = (project = null) => {
    setStudentSearchTerm('');
    if (project) {
      setFormData({ id: project.id, name: project.name, code: project.code });
      const ids = project.students ? project.students.map(s => s.id) : [];
      setCheckedStudentIds(ids);
    } else {
      setFormData({ id: null, name: '', code: '' });
      setCheckedStudentIds([]);
    }
    setShowModal(true);
  };

  const handleToggleStudent = (studentId) => {
    if (checkedStudentIds.includes(studentId)) {
      setCheckedStudentIds(checkedStudentIds.filter(id => id !== studentId));
    } else {
      setCheckedStudentIds([...checkedStudentIds, studentId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      code: formData.code,
      section: { id: selectedSection.id },
      students: checkedStudentIds.map(id => ({ id }))
    };

    try {
      if (formData.id) {
        await axios.put(`/api/v1/proyects/${formData.id}`, payload, {
          headers: { 'Authorization': authHeader }
        });
      } else {
        await axios.post('/api/v1/proyects', payload, {
          headers: { 'Authorization': authHeader }
        });
      }
      setShowModal(false);
      fetchProjects(selectedSection.id);
      fetchSectionStudents(selectedSection.id);
    } catch (err) {
      console.error('Error saving project:', err);
      alert('Error al guardar el proyecto');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este proyecto?')) return;
    try {
      await axios.delete(`/api/v1/proyects/${id}`, {
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
                  <th>Alumnos Integrantes</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>
                      No hay proyectos en esta sección.
                    </td>
                  </tr>
                ) : (
                  projects.map(p => (
                    <tr key={p.id}>
                      <td className="bold">{p.code}</td>
                      <td>{p.name}</td>
                      <td>
                        {p.students && p.students.length > 0 ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); setViewingStudentsProject(p); }}
                            style={{
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              color: 'var(--primary)',
                              fontWeight: '600',
                              fontSize: '0.85rem',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              outline: 'none',
                              transition: 'all 0.2s ease'
                            }}
                            className="dropdown-toggle-btn"
                          >
                            <span>Desplegar alumnos integrantes</span>
                            <span style={{
                              background: 'var(--primary)',
                              color: '#fff',
                              padding: '1px 6px',
                              borderRadius: '10px',
                              fontSize: '0.75rem',
                              fontWeight: 'bold'
                            }}>
                              {p.students.length}
                            </span>
                          </button>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                            Sin alumnos asignados
                          </span>
                        )}
                      </td>
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
              <div className="form-group" style={{ marginTop: '20px' }}>
                <label style={{ marginBottom: '8px', display: 'block' }}>Alumnos Integrantes (Selección rápida)</label>
                {sectionStudents.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                    No hay alumnos matriculados en esta sección para asignar.
                  </p>
                ) : (
                  <>
                    <div className="search-box-wrapper" style={{ marginBottom: '10px', position: 'relative' }}>
                      <input
                        type="text"
                        placeholder="Buscar alumno por nombre o correo..."
                        value={studentSearchTerm}
                        onChange={e => setStudentSearchTerm(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 14px 10px 36px',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          background: 'rgba(255, 255, 255, 0.03)',
                          color: 'var(--text-light)',
                          fontSize: '0.88rem',
                          boxSizing: 'border-box',
                          transition: 'all 0.3s ease'
                        }}
                      />
                      <Search size={16} style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)',
                        pointerEvents: 'none'
                      }} />
                      {studentSearchTerm && (
                        <button
                          type="button"
                          onClick={() => setStudentSearchTerm('')}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            padding: 0
                          }}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    <div className="students-checklist glass" style={{
                      maxHeight: '180px',
                      overflowY: 'auto',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}>
                      {(() => {
                        const filtered = sectionStudents.filter(student => {
                          const term = studentSearchTerm.toLowerCase();
                          const fullName = `${student.name} ${student.lastname}`.toLowerCase();
                          const email = (student.email || '').toLowerCase();
                          return fullName.includes(term) || email.includes(term);
                        });
                        
                        if (filtered.length === 0) {
                          return (
                            <p style={{
                              color: 'var(--text-muted)',
                              fontSize: '0.85rem',
                              fontStyle: 'italic',
                              textAlign: 'center',
                              margin: '20px 0'
                            }}>
                              No se encontraron alumnos coincidentes.
                            </p>
                          );
                        }

                        return filtered.map(student => {
                          const isChecked = checkedStudentIds.includes(student.id);
                          return (
                            <label key={student.id} style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              cursor: 'pointer',
                              fontSize: '0.9rem',
                              color: 'var(--text-light)',
                              userSelect: 'none'
                            }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleStudent(student.id)}
                                style={{
                                  width: '16px',
                                  height: '16px',
                                  cursor: 'pointer',
                                  accentColor: 'var(--primary)'
                                }}
                              />
                              <span>{student.name} {student.lastname} ({student.email})</span>
                            </label>
                          );
                        });
                      })()}
                    </div>
                  </>
                )}
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

      {viewingStudentsProject && (
        <div className="modal-overlay" onClick={() => setViewingStudentsProject(null)}>
          <div 
            className="modal-content glass animate-slide-up" 
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '90%',
              maxWidth: '420px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              color: 'var(--text-main)'
            }}
          >
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-main)' }}>
                  Integrantes del Proyecto
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {viewingStudentsProject.code} - {viewingStudentsProject.name}
                </p>
              </div>
              <button className="close-btn" onClick={() => setViewingStudentsProject(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{
              maxHeight: '260px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              paddingRight: '4px'
            }}>
              {viewingStudentsProject.students.map(std => (
                <div key={std.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '0.92rem',
                  color: 'var(--text-main)',
                  textAlign: 'left'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'var(--primary)'
                  }}></div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: '500' }}>{std.name} {std.lastname}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{std.email}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="modal-footer" style={{ marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <button 
                type="button" 
                className="primary-btn" 
                onClick={() => setViewingStudentsProject(null)}
                style={{ width: '100%', justifyContent: 'center' }}
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

export default ManageProjects;
