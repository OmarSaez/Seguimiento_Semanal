import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BadgeCheck, BadgeAlert, Users, Calendar, UserRound, X, Mail, User, Download, Archive } from 'lucide-react';
import './TeacherDashboard.css';

const AllSections = () => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const authHeader = localStorage.getItem('auth');
  const [selectedSection, setSelectedSection] = useState(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    const fetchAllSections = async () => {
      try {
        const response = await axios.get('/api/v1/sections', {
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

  const handleDownloadExcel = async (section) => {
    try {
      const response = await axios.get(`/api/v1/reports/section/${section.id}/excel`, {
        headers: { 'Authorization': authHeader },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Reporte_Seccion_${section.sectionCode}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading excel:', error);
      alert('Error al descargar el reporte de Excel para esta sección');
    }
  };

  const handleDownloadAllZip = async () => {
    if (sections.length === 0) return;
    try {
      const allIds = sections.map(s => s.id);
      const response = await axios.get(`/api/v1/reports/selected-zip`, {
        params: { ids: allIds.join(',') },
        headers: { 'Authorization': authHeader },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `TodasSecciones_PINGESO.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading all zip:', error);
      alert('Error al empaquetar todas las secciones');
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

  if (loading) return <div className="loading-state">Cargando todas las secciones...</div>;

  return (
    <div className="sections-container">
      <header className="page-header flex-between">
        <div>
          <h2>Todas las Secciones</h2>
          <p>Vista general de todas las secciones registradas en el sistema.</p>
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
              <button className="primary-btn flex-align-center gap-8" onClick={handleDownloadAllZip} title="Empaquetar todas las secciones registradas en un '.zip'">
                <Archive size={18} />
                <span>Descargar todos los excel</span>
              </button>
            </div>
          )
        )}
      </header>

      <div className="sections-grid">
        <table className="custom-table glass animate-fade-in">
          <thead>
            <tr>
              {isSelectionMode && (
                <th style={{ width: '50px', textAlign: 'center' }}>
                  <input 
                    type="checkbox"
                    checked={sections.length > 0 && sections.every(s => selectedIds.includes(s.id))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(sections.map(s => s.id));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                    style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                  />
                </th>
              )}
              <th>Docente a Cargo</th>
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
                {isSelectionMode && (
                  <td style={{ width: '50px', textAlign: 'center' }}>
                    <input 
                      type="checkbox"
                      checked={selectedIds.includes(section.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds([...selectedIds, section.id]);
                        } else {
                          setSelectedIds(selectedIds.filter(id => id !== section.id));
                        }
                      }}
                      style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                    />
                  </td>
                )}
                <td data-label="Docente">
                  <div className="teacher-cell">
                    <UserRound size={16} color="var(--primary)" />
                    <span>{section.teacher?.name || 'No asignado'}</span>
                  </div>
                </td>
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
                    onClick={() => handleDownloadExcel(section)}
                    title="Descargar Excel"
                  >
                    <Download size={18} />
                    <span>Excel</span>
                  </button>
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
