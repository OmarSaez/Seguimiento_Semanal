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
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const handleDownloadExcel = async (section) => {
    try {
      const response = await axios.get(`/api/v1/reports/section/${section.id}/excel`, {
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
      const response = await axios.get(`/api/v1/reports/teacher/excel-zip`, {
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

  const handleDownloadSelectedZip = async () => {
    if (selectedIds.length === 0) {
      alert('Por favor, selecciona al menos una sección para descargar.');
      return;
    }
    try {
      const response = await axios.get(`/api/v1/reports/selected-zip`, {
        params: { ids: selectedIds.join(',') },
        headers: { 'Authorization': authHeader },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Reportes_Seleccionados_PINGESO.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading selected zip:', error);
      alert('Error al descargar los reportes seleccionados');
    }
  };

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const response = await axios.get(`/api/v1/sections/teacher/${user.email}`, {
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
          isSelectionMode ? (
            <div className="flex-align-center gap-16 animate-fade-in">
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginRight: '8px' }}>
                {selectedIds.length} seleccionados
              </span>
              <button 
                className="primary-btn flex-align-center gap-8" 
                onClick={handleDownloadSelectedZip} 
                disabled={selectedIds.length === 0}
                style={selectedIds.length === 0 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
              >
                <Download size={18} />
                <span>Descargar Selección</span>
              </button>
              <button className="secondary-btn flex-align-center gap-8" onClick={() => { setIsSelectionMode(false); setSelectedIds([]); }}>
                <X size={18} />
                <span>Cancelar</span>
              </button>
            </div>
          ) : (
            <div className="flex-align-center gap-16">
              <button className="secondary-btn flex-align-center gap-8" onClick={() => setIsSelectionMode(true)} title="Seleccionar secciones específicas para descargar">
                <BadgeCheck size={18} />
                <span>Seleccionar Excels</span>
              </button>
              <button className="primary-btn flex-align-center gap-8" onClick={handleDownloadAllZip} title="Empaquetar todas tus secciones en un '.zip'">
                <Archive size={18} />
                <span>Descargar todos los excel</span>
              </button>
            </div>
          )
        )}
      </header>

      <div className="sections-grid">
        {sections.length === 0 ? (
          <div className="empty-state glass">No tienes secciones asignadas.</div>
        ) : (
          <table className="custom-table glass animate-fade-in">
            <thead>
              <tr>
                {isSelectionMode && (
                  <th style={{ width: '50px', textAlign: 'center' }}>
                    <input 
                      type="checkbox"
                      checked={sections.length > 0 && sections.filter(s => !(user.role === 'HELPER' && !s.isActive)).every(s => selectedIds.includes(s.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          const eligible = sections
                            .filter(s => !(user.role === 'HELPER' && !s.isActive))
                            .map(s => s.id);
                          setSelectedIds(eligible);
                        } else {
                          setSelectedIds([]);
                        }
                      }}
                      style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                    />
                  </th>
                )}
                <th>Código Sección</th>
                <th>Periodo (Sem/Año)</th>
                <th>Estado</th>
                <th>Total Alumnos</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sections.map((section) => {
                const isHelperAndInactive = user.role === 'HELPER' && !section.isActive;
                return (
                  <tr 
                    key={section.id} 
                    style={isHelperAndInactive ? { opacity: 0.5, filter: 'grayscale(0.8)' } : {}}
                  >
                    {isSelectionMode && (
                      <td style={{ width: '50px', textAlign: 'center' }}>
                        <input 
                          type="checkbox"
                          checked={selectedIds.includes(section.id)}
                          disabled={isHelperAndInactive}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds([...selectedIds, section.id]);
                            } else {
                              setSelectedIds(selectedIds.filter(id => id !== section.id));
                            }
                          }}
                          style={{ cursor: isHelperAndInactive ? 'not-allowed' : 'pointer', transform: 'scale(1.2)' }}
                        />
                      </td>
                    )}
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
                        className={`count-cell ${isHelperAndInactive ? '' : 'clickable'}`}
                        onClick={() => {
                          if (isHelperAndInactive) return;
                          setSelectedSection(section);
                        }}
                        title={isHelperAndInactive ? "Sección inactiva - No disponible para ayudante" : "Ver lista de alumnos"}
                        style={isHelperAndInactive ? { cursor: 'not-allowed' } : {}}
                      >
                        <Users size={16} />
                        <span>{section.students?.length || 0}</span>
                      </div>
                    </td>
                    <td data-label="Acciones">
                      <button
                        className="download-btn-mini"
                        title={isHelperAndInactive ? "Sección inactiva - No disponible para ayudante" : "Descargar Reporte Excel"}
                        onClick={() => {
                          if (isHelperAndInactive) return;
                          handleDownloadExcel(section);
                        }}
                        disabled={isHelperAndInactive}
                        style={isHelperAndInactive ? { cursor: 'not-allowed', opacity: 0.5, pointerEvents: 'none' } : {}}
                      >
                        <Download size={18} />
                        <span>Excel</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
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
