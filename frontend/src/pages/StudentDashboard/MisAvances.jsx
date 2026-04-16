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

  useEffect(() => {
    fetchAdvances();
  }, []);

  const fetchAdvances = async () => {
    try {
      const res = await axios.get(`http://localhost:8080/api/v1/advances/student/${user.id}`, {
        headers: { 'Authorization': authHeader }
      });
      setAdvances(res.data);
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
        <p>Historial de reportes enviados ordenados por fecha.</p>
      </header>

      <div className="advances-list">
        {advances.map((advance) => (
          <div key={advance.id} className="advance-item glass animate-slide-up" style={{ marginBottom: '16px' }}>
            <div className="advance-summary" onClick={() => toggleExpand(advance.id)}>
              <div className="summary-info">
                <div className="week-badge">Semana {advance.numberWeek}</div>
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
                
                {advance.problem && (
                  <div className="problem-note">
                    <strong>Problemas reportados:</strong>
                    <p>{advance.problem}</p>
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
                    <h4>Planeado para la próxima semana</h4>
                    <div className="future-list">
                      {advance.futureAdvances?.map(f => (
                        <div key={f.id} className="future-tag">
                          <CheckCircle size={14} />
                          <span>{f.typeAdvance}</span>
                        </div>
                      ))}
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
