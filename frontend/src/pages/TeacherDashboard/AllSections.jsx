import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BadgeCheck, BadgeAlert, Users, Calendar, UserRound } from 'lucide-react';

const AllSections = () => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const authHeader = localStorage.getItem('auth');

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
                  {section.active ? (
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
                  <div className="count-cell">
                    <Users size={16} />
                    <span>{section.students?.length || 0}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AllSections;
