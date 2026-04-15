import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BadgeCheck, BadgeAlert, Users, Calendar } from 'lucide-react';

const MySections = () => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const authHeader = localStorage.getItem('auth');

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
      <header className="page-header">
        <h2>Mis Secciones</h2>
        <p>Listado de cursos a tu cargo para este periodo.</p>
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
              </tr>
            </thead>
            <tbody>
              {sections.map((section) => (
                <tr key={section.id}>
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
        )}
      </div>
    </div>
  );
};

export default MySections;
