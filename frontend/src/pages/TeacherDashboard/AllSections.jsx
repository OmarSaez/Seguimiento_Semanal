import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BadgeCheck, BadgeAlert, Users, Calendar, UserRound, X, Mail, User } from 'lucide-react';

const AllSections = () => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const authHeader = localStorage.getItem('auth');
  const [selectedSection, setSelectedSection] = useState(null);

  useEffect(() => {
    const fetchAllSections = async () => {
      try {
        const response = await axios.get('http://localhost:8080/api/v1/sections', {
          headers: { 'Authorization': authHeader }
        });
        setSections(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching all sections:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllSections();
  }, [authHeader]);

  if (loading) return <div className="loading-state">Cargando todas las secciones...</div>;

  return (
    <div className="sections-container">
      <header className="page-header">
        <h2>Todas las Secciones</h2>
        <p>Vista general de todas las secciones registradas en el sistema.</p>
      </header>

      <div className="sections-grid">
        <table className="custom-table glass animate-fade-in">
          <thead>
            <tr>
              <th>Docente a Cargo</th>
              <th>Código Sección</th>
              <th>Periodo (Sem/Año)</th>
              <th>Estado</th>
              <th>Total Alumnos</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => (
              <tr key={section.id}>
                <td>
                  <div className="teacher-cell">
                    <UserRound size={16} color="var(--primary)" />
                    <span>{section.teacher?.name || 'No asignado'}</span>
                  </div>
                </td>
                <td className="bold">{section.sectionCode}</td>
                <td>
                  <div className="period-cell">
                    <Calendar size={14} />
                    {section.semester}/{section.year}
                  </div>
                </td>
                <td>
                  {section.isActive ? (
                    <span className="status-badge active">
                      <BadgeCheck size={14} /> Activo
                    </span>
                  ) : (
                    <span className="status-badge inactive">
                      <BadgeAlert size={14} /> Inactivo
                    </span>
                  )}
                </td>
                <td>
                  <div 
                    className="count-cell clickable"
                    onClick={() => setSelectedSection(section)}
                    title="Ver lista de alumnos"
                  >
                    <Users size={16} />
                    <span>{section.students?.length || 0}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Lista Alumnos */}
      {selectedSection && (
        <div className="modal-overlay" onClick={() => setSelectedSection(null)}>
          <div className="modal-content animate-scale" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Alumnos: {selectedSection.sectionCode}</h3>
              <button className="close-btn icon-btn" onClick={() => setSelectedSection(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '24px', maxHeight: '500px', overflowY: 'auto' }}>
              {selectedSection.students && selectedSection.students.length > 0 ? (
                <div className="student-list">
                  {selectedSection.students.map((student, idx) => (
                    <div key={student.id || idx} className="student-item list-card glass">
                      <div className="student-avatar">
                         <User size={20} />
                      </div>
                      <div className="student-info-modal">
                        <span className="bold">{student.name} {student.lastname}</span>
                        <span className="text-sm"><Mail size={12}/> {student.email}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state glass">No hay alumnos matriculados en esta sección.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllSections;
