import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  Clock, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import '../TeacherDashboard/TeacherDashboard.css';

const MisAvances = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const authHeader = localStorage.getItem('auth');
  
  const [advances, setAdvances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [teacherName, setTeacherName] = useState(null);

  const currentActiveWeek = (() => {
    if (!user.startDate) return 0;
    const start = new Date(user.startDate);
    const today = new Date();
    let weekVal = 1;
    for (let i = 0; i < 20; i++) {
      const weekStart = new Date(start);
      weekStart.setDate(start.getDate() + (i * 7));
      if (weekStart > today) break;
      weekVal = i + 1;
    }
    return weekVal;
  })();

  const getWeekRangeString = (numberWeek) => {
    if (!user.startDate) return '';
    const start = new Date(user.startDate);
    
    const weekStart = new Date(start);
    weekStart.setDate(start.getDate() + ((numberWeek - 1) * 7));
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const formatDate = (date) => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };
    
    return `(${formatDate(weekStart)} - ${formatDate(weekEnd)})`;
  };


  useEffect(() => {
    fetchAdvances();
    fetchTeacher();
  }, []);

  const fetchTeacher = async () => {
    if (!user.sectionId) return;
    try {
      const resSec = await axios.get(`/api/v1/sections/${user.sectionId}`, {
        headers: { 'Authorization': authHeader }
      });
      const fetchedTeacher = resSec.data.teacher?.name;
      setTeacherName(fetchedTeacher ? fetchedTeacher : (user.teacherName || 'No asignado'));
    } catch (e) {
      setTeacherName(user.teacherName || 'No asignado');
    }
  };

  const fetchAdvances = async () => {
    try {
      const res = await axios.get(`/api/v1/advances/student/${user.id}`, {
        headers: { 'Authorization': authHeader }
      });
      const sorted = (res.data || []).sort((a, b) => b.numberWeek - a.numberWeek);
      setAdvances(sorted);
    } catch (err) {
      console.error('Error fetching advances:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) return <div className="loading-state">Cargando tus avances...</div>;

  if (advances.length === 0) {
    return (
      <div className="empty-state animate-fade-in">
        <AlertCircle size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
        <h2>No has subido reportes aún</h2>
        <p>Tus avances semanales aparecerán aquí una vez que envíes el primero.</p>
      </div>
    );
  }

  return (
    <div className="my-advances animate-fade-in">
      <header className="page-header">
        <h2>Mis Avances Pasados</h2>
        <p style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
            <span>Historial de reportes enviados ordenados por fecha</span>
            <span>•</span>
            <span style={{ color: 'var(--primary)', fontWeight: '500' }}>Sección {user.sectionCode}</span>
            {teacherName && (
              <>
                <span>•</span>
                <span>Docente: {teacherName}</span>
              </>
            )}
        </p>
      </header>

      <div className="advances-list">
        {advances.map((advance) => (
          <div key={advance.id} className="advance-item glass animate-slide-up" style={{ marginBottom: '16px' }}>
            <div className="advance-summary" onClick={() => toggleExpand(advance.id)}>
              <div className="summary-info">
                <div className="week-badge">Semana {advance.numberWeek}</div>
                {user.startDate && (
                  <div className="week-range-info" style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: '500' }}>
                    {getWeekRangeString(advance.numberWeek)}
                  </div>
                )}
                <div className="date-info">
                  <Calendar size={16} />
                  <span>{new Date(advance.sendDate).toLocaleDateString('es-CL')}</span>
                </div>
                <div className="project-name">
                  <strong>Proyecto:</strong> {advance.proyect?.name}
                </div>
              </div>
              <div className="expand-icon">
                {expandedId === advance.id ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
              </div>
            </div>

            {expandedId === advance.id && (
              <div className="advance-details-expanded">
                <div className="divider"></div>
                
                {advance.problem && advance.problem !== 'Ninguno' && advance.problem !== 'n/r' && (
                  <div className="problem-note" style={{ background: 'rgba(239, 68, 68, 0.03)', borderLeft: '4px solid var(--error)', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
                    <div>
                      <strong>Problema reportado:</strong>
                      <p style={{ marginTop: '4px', fontSize: '0.9rem', color: 'var(--text-main)' }}>{advance.problem}</p>
                    </div>
                    {advance.solution && advance.solution !== 'Ninguna' && advance.solution !== 'n/r' && (
                      <div style={{ marginTop: '12px', borderTop: '1px solid rgba(239, 68, 68, 0.15)', paddingTop: '10px' }}>
                        <strong style={{ color: 'var(--success)' }}>Solución aplicada / Plan de Acción:</strong>
                        <p style={{ marginTop: '4px', fontSize: '0.9rem', color: 'var(--text-main)' }}>{advance.solution}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="details-grid">
                  <div className="details-section">
                    <h4>Realizado esta semana</h4>
                    <div className="detail-cards">
                      {advance.details?.map(d => (
                        <div key={d.id} className="mini-card glass">
                          <div className="mini-header">
                            <span className="type">{d.typeAdvance}</span>
                            <span className="hours"><Clock size={14} /> {d.hh}h</span>
                          </div>
                          <p className="context">{d.context}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="details-section">
                    <h4>
                      {advance.numberWeek === currentActiveWeek
                        ? "Planeado para la próxima semana"
                        : `Lo planeado para la Semana ${advance.numberWeek + 1} ${getWeekRangeString(advance.numberWeek + 1)}`}
                    </h4>
                    <div className="detail-cards">
                      {advance.futureAdvances && advance.futureAdvances.length > 0 ? (
                        advance.futureAdvances.map(f => (
                          <div key={f.id} className="mini-card glass" style={{ borderLeft: '3px solid var(--success)', background: 'rgba(16, 185, 129, 0.02)', marginBottom: '12px', padding: '16px', borderRadius: '12px' }}>
                            <div className="mini-header" style={{ marginBottom: '4px' }}>
                              <span className="type" style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', fontSize: '0.9rem' }}>
                                <CheckCircle size={14} /> {f.typeAdvance}
                              </span>
                            </div>
                            {f.context ? (
                              <p className="context" style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.4' }}>{f.context}</p>
                            ) : (
                              <p className="context" style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sin descripción detallada</p>
                            )}
                          </div>
                        ))
                      ) : (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          color: 'var(--success)',
                          fontSize: '0.88rem',
                          fontWeight: '500',
                          background: 'rgba(16, 185, 129, 0.05)',
                          border: '1px solid rgba(16, 185, 129, 0.1)',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          boxSizing: 'border-box'
                        }}>
                          <CheckCircle size={16} style={{ flexShrink: 0 }} />
                          <span>No se planificaron actividades futuras para esta semana.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .advance-item {
          border-radius: 16px;
          overflow: hidden;
        }
        .advance-summary {
          padding: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .advance-summary:hover {
          background: rgba(255, 255, 255, 0.03);
        }
        .summary-info {
          display: flex;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
        }
        .week-badge {
          background: var(--primary);
          color: white;
          padding: 6px 12px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.9rem;
        }
        .date-info {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-muted);
        }
        .divider {
          height: 1px;
          background: var(--glass-border);
          margin: 0 24px;
        }
        .advance-details-expanded {
          padding: 24px;
        }
        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          margin-top: 20px;
        }
        @media (max-width: 900px) {
          .details-grid { grid-template-columns: 1fr; }
        }
        .details-section h4 {
          margin-bottom: 16px;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
        }
        .mini-card {
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 12px;
        }
        .mini-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .mini-header .type {
          font-weight: 600;
          color: var(--primary);
          font-size: 0.9rem;
        }
        .mini-header .hours {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        .context {
          font-size: 0.9rem;
          color: var(--text-main);
          line-height: 1.4;
        }
        .future-list {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .future-tag {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(16, 185, 129, 0.1);
          color: var(--success);
          border-radius: 50px;
          font-size: 0.85rem;
          font-weight: 500;
        }
        .problem-note {
          background: rgba(239, 68, 68, 0.05);
          border-left: 4px solid var(--error);
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 24px;
        }
        .problem-note p {
          margin-top: 8px;
          font-size: 0.9rem;
          color: var(--text-main);
        }
      `}} />
    </div>
  );
};

export default MisAvances;
