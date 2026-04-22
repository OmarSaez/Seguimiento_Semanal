import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Send, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Briefcase,
  Calendar,
  UserCircle2
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
  const [teacherName, setTeacherName] = useState(null);
  const [problem, setProblem] = useState('');
  const [noProblem, setNoProblem] = useState(true); // Por defecto "No hubo problemas" (estandarizado como NO)
  const [selectedDetails, setSelectedDetails] = useState([]); // Array of { type, context, hh }
  const [selectedFutures, setSelectedFutures] = useState([]); // Array of strings (types)
  
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [availableWeeks, setAvailableWeeks] = useState([]); // Array of { number, label, isFuture }

  useEffect(() => {
    if (user.sectionId) {
      fetchInitialData();
      generateWeeksList();
    }
  }, []);

  const generateWeeksList = () => {
    if (!user.startDate) return;
    const start = new Date(user.startDate);
    const today = new Date();
    const weeks = [];
    
    // Generar hasta 20 semanas o hasta la fecha de fin si existe
    const maxWeeks = 20; 
    
    for (let i = 0; i < maxWeeks; i++) {
      const weekStart = new Date(start);
      weekStart.setDate(start.getDate() + (i * 7));
      
      const weekNumber = i + 1;
      const isFuture = weekStart > today;
      
      const label = `Semana ${weekNumber} - ${weekStart.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })}`;
      
      weeks.push({ number: weekNumber, label, isFuture, date: weekStart });
      
      // Auto-seleccionar la semana actual (la más cercana al presente que no sea futura)
      if (!isFuture) {
        setCurrentWeek(weekNumber);
      }
    }
    setAvailableWeeks(weeks);
  };

  const fetchInitialData = async () => {
    try {
      const resProj = await axios.get(`http://localhost:8080/api/v1/proyects/section/${user.sectionId}`, {
        headers: { 'Authorization': authHeader }
      });
      setProjects(resProj.data);

      try {
        const resSec = await axios.get(`http://localhost:8080/api/v1/sections/${user.sectionId}`, {
          headers: { 'Authorization': authHeader }
        });
        const fetchedTeacher = resSec.data.teacher?.name;
        setTeacherName(fetchedTeacher ? fetchedTeacher : (user.teacherName || 'No asignado'));
      } catch(e) {
        console.error("Error al obtener la sección para leer el docente:", e);
        setTeacherName(user.teacherName || 'No asignado');
      }

      try {
        const resAdv = await axios.get(`http://localhost:8080/api/v1/advances/student/${user.id}`, {
          headers: { 'Authorization': authHeader }
        });
        if (resAdv.data && resAdv.data.length > 0) {
           const sorted = resAdv.data.sort((a,b) => new Date(b.sendDate) - new Date(a.sendDate));
           setSelectedProject(sorted[0].proyect.id.toString());
        }
      } catch(e) {}

    } catch (err) {
      console.error('Error fetching initial data:', err);
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
      numberWeek: currentWeek,
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
        <div>
          <h2>Subir un nuevo avance</h2>
          <p style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
            <span>Reporte de actividades semanales</span>
            <span>•</span>
            <span>{new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <span>•</span>
            <span style={{ color: 'var(--primary)', fontWeight: '500' }}>Sección {user.sectionCode}</span>
            {teacherName && (
              <>
                <span>•</span>
                <span>Docente: {teacherName}</span>
              </>
            )}
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="advance-form glass">
        {/* Selección de Semana y Proyecto */}
        <div className="selection-header-grid">
          <section className="form-section">
            <h3 className="section-title">
              <Calendar size={20} />
              Semana a reportar
            </h3>
            <div className="form-group">
              <select 
                value={currentWeek} 
                onChange={(e) => setCurrentWeek(parseInt(e.target.value))}
                className="custom-select"
                required
              >
                {availableWeeks.filter(w => !w.isFuture).map(w => (
                  <option key={w.number} value={w.number}>{w.label}</option>
                ))}
              </select>
              {availableWeeks.filter(w => !w.isFuture).length === 0 && (
                <p style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '8px' }}>
                  El semestre aún no ha comenzado.
                </p>
              )}
            </div>
          </section>

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
        </div>

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
                    type="text" 
                    inputMode="numeric"
                    value={detail.hh}
                    onChange={(e) => {
                      // Solo permitir dígitos
                      const val = e.target.value.replace(/\D/g, '');
                      
                      if (val === '') {
                        handleDetailChange(detail.type, 'hh', '');
                        return;
                      }

                      const num = parseInt(val);
                      if (num <= 168) {
                        handleDetailChange(detail.type, 'hh', num.toString());
                      }
                    }}
                    placeholder="Ej: 4"
                    required
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Problemas */}
        <section className="form-section section-problem" style={{ marginTop: '32px' }}>
          <div className="problem-header">
            <h3 className="section-title" style={{ margin: 0 }}>¿Hubo inconvenientes esta semana?</h3>
            <div 
              onClick={() => setNoProblem(!noProblem)}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            >
              <div 
                className={`switch ${noProblem ? 'active' : ''}`} 
                style={{
                  width: '40px',
                  height: '22px',
                  background: noProblem ? 'var(--primary)' : 'var(--border)',
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
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }} />
              </div>
              <span style={{ fontSize: '0.9rem', color: noProblem ? 'var(--primary)' : 'var(--text-muted)', fontWeight: noProblem ? '600' : '400' }}>
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
