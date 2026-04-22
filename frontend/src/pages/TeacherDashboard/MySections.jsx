import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BadgeCheck, BadgeAlert, Users, Calendar, Download, X, Mail, User, Archive } from 'lucide-react';
import './TeacherDashboard.css';

const MySections = () => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const authHeader = localStorage.getItem('auth');
  const [selectedSection, setSelectedSection] = useState(null);

  const handleDownloadExcel = async (section) => {
    try {
      const response = await axios.get(`http://localhost:8080/api/v1/reports/section/${section.id}/excel`, {
        headers: { 'Authorization': authHeader },
        responseType: 'blob' // Importante para manejar binarios
      });

      // Crear un link temporal para la descarga
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Reporte_AvanceSemanal_${section.sectionCode}_${section.semester}-${section.year}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading excel:', error);
      alert('Error al descargar el archivo Excel');
    }
  };

  const handleDownloadAllZip = async () => {
    try {
      const response = await axios.get(`http://localhost:8080/api/v1/reports/teacher/excel-zip`, {
        headers: { 'Authorization': authHeader },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const docName = user.name ? user.name.replace(/\s+/g, '') : "Docente";
      link.setAttribute('download', `${docName}_MiSecciones_PINGESO.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading zip:', error);
      alert('Error al empaquetar el archivo ZIP de las secciones');
    }
  };

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/api/v1/sections/teacher/${user.email}`, {
          headers: { 'Authorization': authHeader }
        });
        // Asegurarse de que la respuesta sea un arreglo
        setSections(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching my sections:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSections();
  }, [user.email, authHeader]);

  if (loading) return <div className="loading-state">Cargando secciones...</div>;

  return (
    <div className="sections-container">
      <header className="page-header flex-between">
        <div>
          <h2>Mis Secciones</h2>
          <p>Listado de cursos a tu cargo.</p>
        </div>
        {sections.length > 0 && (
          <button className="primary-btn" onClick={handleDownloadAllZip} title="Empaquetar ambas secciones activas e inactivas en un '.zip'">
            <Archive size={18} />
            <span>Descargar todos los excel</span>
          </button>
        )}
      </header>

      <div className="sections-grid">
        {sections.length === 0 ? (
          <div className="empty-state glass">No tienes secciones asignadas.</div>
        ) : (
          <table className="custom-table glass animate-fade-in">
            <thead>
              <tr>
                <th>Código Sección</th>
                <th>Periodo (Sem/Año)</th>
                <th>Estado</th>
                <th>Total Alumnos</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sections.map((section) => (
                <tr key={section.id}>
                  <td className="bold" data-label="Código">{section.sectionCode}</td>
                  <td data-label="Periodo">
                    <div className="period-cell">
                      <Calendar size={14} />
                      {section.semester}/{section.year}
                    </div>
                  </td>
                  <td data-label="Estado">
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
                  <td data-label="Alumnos">
                    <div
                      className="count-cell clickable"
                      onClick={() => setSelectedSection(section)}
                      title="Ver lista de alumnos"
                    >
                      <Users size={16} />
                      <span>{section.students?.length || 0}</span>
                    </div>
                  </td>
                  <td data-label="Acciones">
                    <button
                      className="download-btn-mini"
                      title="Descargar Reporte Excel"
                      onClick={() => handleDownloadExcel(section)}
                    >
                      <Download size={18} />
                      <span>Excel</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
                        <span className="text-sm"><Mail size={12} /> {student.email}</span>
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

export default MySections;
