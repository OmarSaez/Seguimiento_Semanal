import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Send, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Briefcase 
} from 'lucide-react';
import '../TeacherDashboard/TeacherDashboard.css';

const ACTIVITY_TYPES = [
  "Coordinacion/Planificacion",
  "Reuniones con cliente",
  "Diseño/Desarrollo de Software",
  "Instalaciones/Despliegue",
  "Pruebas/QA",
  "Documentacion",
  "Entrega/Capacitacion"
];

const SubirAvance = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const authHeader = localStorage.getItem('auth');
  
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [problem, setProblem] = useState('');
  const [noProblem, setNoProblem] = useState(true); // Por defecto "No hubo problemas" (estandarizado como NO)
  const [selectedDetails, setSelectedDetails] = useState([]); // Array of { type, context, hh }
  const [selectedFutures, setSelectedFutures] = useState([]); // Array of strings (types)
  
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (user.sectionId) {
      fetchProjects();
    }
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await axios.get(`http://localhost:8080/api/v1/proyects/section/${user.sectionId}`, {
        headers: { 'Authorization': authHeader }
      });
      setProjects(res.data);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  const handleToggleDetail = (type) => {
    if (selectedDetails.find(d => d.type === type)) {
      setSelectedDetails(selectedDetails.filter(d => d.type !== type));
    } else {
      setSelectedDetails([...selectedDetails, { type, context: '', hh: '' }]);
    }
  };

  const handleDetailChange = (type, field, value) => {
    setSelectedDetails(selectedDetails.map(d => 
      d.type === type ? { ...d, [field]: value } : d
    ));
  };

  const handleToggleFuture = (type) => {
    if (selectedFutures.includes(type)) {
      setSelectedFutures(selectedFutures.filter(t => t !== type));
    } else {
      setSelectedFutures([...selectedFutures, type]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProject) return alert('Selecciona un proyecto');
    if (selectedDetails.length === 0) return alert('Debes agregar al menos una actividad realizada');

    setLoading(true);
    const payload = {
      student: { id: user.id },
      proyect: { id: parseInt(selectedProject) },
      sendDate: new Date().toISOString(),
      numberWeek: 5, // Mockup de semana 5
      problem: noProblem ? 'Ninguno' : (problem || 'Ninguno'),
      details: selectedDetails.map(d => ({
        typeAdvance: d.type,
        context: d.context,
        hh: parseInt(d.hh)
      })),
      futureAdvances: selectedFutures.map(type => ({
        typeAdvance: type
      }))
    };

    try {
      await axios.post('http://localhost:8080/api/v1/advances', payload, {
        headers: { 'Authorization': authHeader }
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting advance:', err);
      alert('Error al enviar el reporte');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="empty-state animate-fade-in">
        <div className="success-icon" style={{ color: 'var(--success)', marginBottom: '16px' }}>
          <CheckCircle2 size={64} />
        </div>
        <h2>¡Reporte Enviado con Éxito!</h2>
        <p>Tu avance semanal ha sido registrado correctamente.</p>
        <button className="primary-btn" style={{ margin: '24px auto' }} onClick={() => window.location.reload()}>
          Subir otro reporte
        </button>
      </div>
    );
  }

  return (
    <div className="upload-advance animate-fade-in">
      <header className="page-header">
        <h2>Subir un nuevo avance</h2>
        <p>Completa los detalles de tu trabajo semanal para el equipo docente.</p>
      </header>

      <form onSubmit={handleSubmit} className="advance-form glass">
        {/* Selección de Proyecto */}
        <section className="form-section">
          <h3 className="section-title">
            <Briefcase size={20} />
            Proyecto en el que participó
          </h3>
          <div className="form-group">
            <select 
              value={selectedProject} 
              onChange={(e) => setSelectedProject(e.target.value)}
              className="custom-select"
              required
            >
              <option value="">Selecciona un proyecto...</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
              ))}
            </select>
          </div>
        </section>

        {/* Actividades Realizadas */}
        <section className="form-section" style={{ marginTop: '32px' }}>
          <h3 className="section-title">
            <FileText size={20} />
            Indique en qué tipo de actividades trabajó esta semana
          </h3>
          
          <div className="type-selection-grid">
            {ACTIVITY_TYPES.map(type => (
              <label key={type} className={`type-chip ${selectedDetails.find(d => d.type === type) ? 'active' : ''}`}>
                <input 
                  type="checkbox" 
                  checked={!!selectedDetails.find(d => d.type === type)}
                  onChange={() => handleToggleDetail(type)}
                  hidden
                />
                {type}
              </label>
            ))}
          </div>

          <div className="details-inputs">
            {selectedDetails.map(detail => (
              <div key={detail.type} className="detail-item glass animate-slide-up">
                <h4>{detail.type}</h4>
                <div className="form-group">
                  <label>¿Qué fue lo realizado?</label>
                  <textarea 
                    value={detail.context}
                    onChange={(e) => handleDetailChange(detail.type, 'context', e.target.value)}
                    maxLength={256}
                    placeholder="Describe brevemente tu trabajo (máx. 256 caracteres)..."
                    required
                  />
                </div>
                <div className="form-group" style={{ marginTop: '12px' }}>
                  <label>
                    <Clock size={14} style={{ marginRight: '4px' }} />
                    Horas humanas dedicadas
                  </label>
                  <input 
                    type="number" 
                    value={detail.hh}
                    onChange={(e) => handleDetailChange(detail.type, 'hh', e.target.value)}
                    placeholder="Ej: 4"
                    min="1"
                    required
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Problemas */}
        <section className="form-section" style={{ marginTop: '32px' }}>
          <div style={{ 
            marginBottom: '16px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '20px',
            flexWrap: 'wrap'
          }}>
            <h3 className="section-title" style={{ margin: 0 }}>¿Presentó algún inconveniente o problema esta semana?</h3>
            <div 
              onClick={() => setNoProblem(!noProblem)}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            >
              <div 
                className={`switch ${noProblem ? 'active' : ''}`} 
                style={{
                  width: '40px',
                  height: '22px',
                  background: noProblem ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                  borderRadius: '20px',
                  position: 'relative',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{
                  width: '16px',
                  height: '16px',
                  background: 'white',
                  borderRadius: '50%',
                  position: 'absolute',
                  top: '3px',
                  left: noProblem ? '21px' : '3px',
                  transition: 'all 0.3s ease'
                }} />
              </div>
              <span style={{ fontSize: '0.85rem', color: noProblem ? 'white' : 'var(--text-muted)', fontWeight: noProblem ? '600' : '400' }}>
                No hubo problemas
              </span>
            </div>
          </div>
          
          {!noProblem && (
            <div className="form-group animate-slide-up">
              <textarea 
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                placeholder="Describe cualquier problema que haya afectado tu avance..."
                required={!noProblem}
              />
            </div>
          )}
        </section>

        {/* Actividades Planeadas */}
        <section className="form-section" style={{ marginTop: '32px' }}>
          <h3 className="section-title">
            <CheckCircle2 size={20} />
            Seleccione qué actividades tiene planeada realizar la próxima semana
          </h3>
          <div className="type-selection-grid">
            {ACTIVITY_TYPES.map(type => (
              <label key={type} className={`type-chip ${selectedFutures.includes(type) ? 'active' : ''}`}>
                <input 
                  type="checkbox" 
                  checked={selectedFutures.includes(type)}
                  onChange={() => handleToggleFuture(type)}
                  hidden
                />
                {type}
              </label>
            ))}
          </div>
        </section>

        <div className="form-footer" style={{ marginTop: '40px' }}>
          <button type="submit" className="primary-btn big-btn" disabled={loading}>
            {loading ? 'Enviando...' : (
              <>
                <Send size={18} />
                <span>Enviar Reporte Semanal</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubirAvance;
