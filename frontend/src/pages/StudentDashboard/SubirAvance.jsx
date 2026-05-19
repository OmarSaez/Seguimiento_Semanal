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
  const [studentProject, setStudentProject] = useState(null);
  const [studentLoaded, setStudentLoaded] = useState(false);
  const [teacherName, setTeacherName] = useState(null);
  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [noProblem, setNoProblem] = useState(false); // Por defecto desactivado (obliga a marcar "No hubo problemas" si corresponde)
  const [selectedDetails, setSelectedDetails] = useState([]); // Array of { type, context, hh }
  const [selectedFutures, setSelectedFutures] = useState([]); // Array of { type, context }

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [availableWeeks, setAvailableWeeks] = useState([]); // Array of { number, label, isFuture }
  const [reportedWeeks, setReportedWeeks] = useState([]); // Array of week numbers already reported

  useEffect(() => {
    if (availableWeeks.length > 0) {
      const validWeeks = availableWeeks.filter(w => !w.isFuture && !reportedWeeks.includes(w.number));
      if (validWeeks.length > 0) {
        if (!validWeeks.some(w => w.number === currentWeek)) {
          const highestValid = Math.max(...validWeeks.map(w => w.number));
          setCurrentWeek(highestValid);
        }
      }
    }
  }, [availableWeeks, reportedWeeks, currentWeek]);

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
      try {
        const resStudent = await axios.get(`/api/v1/students/${user.id}`, {
          headers: { 'Authorization': authHeader }
        });
        if (resStudent.data.proyect) {
          setStudentProject(resStudent.data.proyect);
          setSelectedProject(resStudent.data.proyect.id.toString());
        }
      } catch (e) {
        console.error("Error fetching student profile:", e);
      } finally {
        setStudentLoaded(true);
      }

      try {
        const resSec = await axios.get(`/api/v1/sections/${user.sectionId}`, {
          headers: { 'Authorization': authHeader }
        });
        const fetchedTeacher = resSec.data.teacher?.name;
        setTeacherName(fetchedTeacher ? fetchedTeacher : (user.teacherName || 'No asignado'));
      } catch (e) {
        console.error("Error al obtener la sección para leer el docente:", e);
        setTeacherName(user.teacherName || 'No asignado');
      }

      try {
        const resAdv = await axios.get(`/api/v1/advances/student/${user.id}`, {
          headers: { 'Authorization': authHeader }
        });
        if (resAdv.data && resAdv.data.length > 0) {
          const weeks = resAdv.data.map(adv => adv.numberWeek);
          setReportedWeeks(weeks);
        }
      } catch (e) { }

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
    if (selectedFutures.find(f => f.type === type)) {
      setSelectedFutures(selectedFutures.filter(f => f.type !== type));
    } else {
      setSelectedFutures([...selectedFutures, { type, context: '' }]);
    }
  };

  const handleFutureChange = (type, field, value) => {
    setSelectedFutures(selectedFutures.map(f =>
      f.type === type ? { ...f, [field]: value } : f
    ));
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
      solution: noProblem ? 'Ninguna' : (solution || 'Ninguna'),
      details: selectedDetails.map(d => ({
        typeAdvance: d.type,
        context: d.context,
        hh: parseInt(d.hh)
      })),
      futureAdvances: selectedFutures.map(f => ({
        typeAdvance: f.type,
        context: f.context
      }))
    };

    try {
      await axios.post('/api/v1/advances', payload, {
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
                disabled={availableWeeks.filter(w => !w.isFuture && !reportedWeeks.includes(w.number)).length === 0}
              >
                {availableWeeks.filter(w => !w.isFuture && !reportedWeeks.includes(w.number)).map(w => (
                  <option key={w.number} value={w.number}>{w.label}</option>
                ))}
              </select>
              {availableWeeks.filter(w => !w.isFuture).length === 0 ? (
                <p style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '8px' }}>
                  El semestre aún no ha comenzado.
                </p>
              ) : availableWeeks.filter(w => !w.isFuture && !reportedWeeks.includes(w.number)).length === 0 ? (
                <p style={{ color: 'var(--success)', fontSize: '0.8rem', marginTop: '8px' }}>
                  ¡Al día! Has reportado todos tus avances para las semanas transcurridas.
                </p>
              ) : null}
            </div>
          </section>

          <section className="form-section">
            <h3 className="section-title">
              <Briefcase size={20} />
              Proyecto asignado
            </h3>
            <div className="form-group">
              {studentLoaded ? (
                studentProject ? (
                  <div className="assigned-project-box glass" style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    fontWeight: '600',
                    color: 'var(--text-light)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Briefcase size={16} color="var(--primary)" />
                    <span>{studentProject.code} - {studentProject.name}</span>
                  </div>
                ) : (
                  <div className="assigned-project-box glass" style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.05)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    fontWeight: '500',
                    color: 'var(--error)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>Sin proyecto asignado. Debes solicitar a tu docente que te asigne a un proyecto para poder reportar.</span>
                  </div>
                )
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>Cargando información del proyecto...</p>
              )}
            </div>
          </section>
        </div>

        {/* Actividades Realizadas */}
        <section className="form-section" style={{ marginTop: '32px' }}>
          <style>{`
            .activity-list-container {
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
              backdrop-filter: blur(10px);
            }
            @media (max-width: 850px) {
              .activity-list-header {
                display: none !important;
              }
              .activity-row-item {
                grid-template-columns: 1fr !important;
                gap: 12px !important;
                padding: 20px 16px !important;
              }
              .activity-row-item > div:nth-child(2) {
                margin-top: 4px;
              }
              .activity-row-item > div:nth-child(3) {
                justify-content: flex-start !important;
                margin-top: 4px;
              }
            }
          `}</style>

          <h3 className="section-title">
            <FileText size={20} />
            Seleccione los tipos de actividades en los que trabajó esta semana
          </h3>

          <div className="activity-list-container glass" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(255, 255, 255, 0.01)',
            marginTop: '20px'
          }}>
            {/* Cabecera del Listado (Headers) */}
            <div className="activity-list-header" style={{
              display: 'grid',
              gridTemplateColumns: '300px 1fr 140px',
              gap: '20px',
              padding: '12px 20px',
              background: 'rgba(255, 255, 255, 0.04)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              fontWeight: '600',
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-muted)'
            }}>
              <div>Tipo de Actividad</div>
              <div>¿Qué fue lo realizado? (Descripción de Avance)</div>
              <div style={{ textAlign: 'center' }}>Horas Dedicadas</div>
            </div>

            {/* Listado de Actividades */}
            {ACTIVITY_TYPES.map(type => {
              const detail = selectedDetails.find(d => d.type === type);
              const isSelected = !!detail;

              return (
                <div key={type} className={`activity-row-item ${isSelected ? 'active' : ''}`} style={{
                  display: 'grid',
                  gridTemplateColumns: '300px 1fr 140px',
                  gap: '20px',
                  alignItems: 'center',
                  padding: '16px 20px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                  transition: 'background 0.2s ease',
                  background: isSelected ? 'rgba(78, 126, 255, 0.02)' : 'transparent'
                }}>
                  {/* Columna 1: Tipo de Actividad */}
                  <div>
                    <label className={`activity-toggle-label ${isSelected ? 'selected' : ''}`} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: isSelected ? 'rgba(78, 126, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected ? '1px solid var(--primary)' : '1px solid rgba(255, 255, 255, 0.08)',
                      transition: 'all 0.2s ease',
                      userSelect: 'none',
                      fontWeight: '600',
                      color: isSelected ? 'var(--primary)' : 'var(--text-light)'
                    }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleDetail(type)}
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '4px',
                          accentColor: 'var(--primary)',
                          cursor: 'pointer'
                        }}
                      />
                      <span style={{ fontSize: '0.92rem' }}>{type}</span>
                    </label>
                  </div>

                  {/* Columna 2: Descripción (Sólo si está seleccionada) */}
                  <div style={{ display: 'flex', alignItems: 'center', minHeight: '44px' }}>
                    {isSelected ? (
                      <div className="animate-fade-in" style={{ width: '100%', position: 'relative' }}>
                        <textarea
                          value={detail.context}
                          onChange={(e) => handleDetailChange(type, 'context', e.target.value)}
                          maxLength={256}
                          placeholder="Describe brevemente tu trabajo para esta actividad (máx. 256 caracteres)..."
                          required
                          rows={2}
                          style={{
                            width: '100%',
                            margin: 0,
                            padding: '10px 12px 24px 12px',
                            background: 'rgba(0, 0, 0, 0.2)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            color: 'var(--text-light)',
                            fontSize: '0.9rem',
                            resize: 'none',
                            fontFamily: 'inherit',
                            outline: 'none',
                            transition: 'border-color 0.2s ease'
                          }}
                          onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                          onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                        />
                        <span style={{
                          position: 'absolute',
                          bottom: '4px',
                          right: '12px',
                          fontSize: '0.72rem',
                          color: (detail.context || '').length >= 250 ? 'var(--error)' : 'var(--text-muted)',
                          fontWeight: '500',
                          pointerEvents: 'none',
                          opacity: 0.8
                        }}>
                          {256 - (detail.context || '').length} carac.
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem', fontStyle: 'italic' }}>
                        Selecciona el tipo de actividad para detallar tu avance
                      </span>
                    )}
                  </div>

                  {/* Columna 3: Horas Dedicadas (Sólo si está seleccionada) */}
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '44px' }}>
                    {isSelected ? (
                      <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={detail.hh}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            if (val === '') {
                              handleDetailChange(type, 'hh', '');
                              return;
                            }
                            const num = parseInt(val);
                            if (num <= 168) {
                              handleDetailChange(type, 'hh', num.toString());
                            }
                          }}
                          placeholder="HH"
                          required
                          style={{
                            width: '64px',
                            textAlign: 'center',
                            margin: 0,
                            padding: '10px 8px',
                            background: 'rgba(0, 0, 0, 0.2)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            color: 'var(--text-light)',
                            fontSize: '0.95rem',
                            fontWeight: '600'
                          }}
                        />
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>hrs</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>—</span>
                    )}
                  </div>
                </div>
              );
            })}
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
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-light)' }}>
                  ¿Cuáles fueron los inconvenientes/problemas presentados?
                </label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <textarea
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                    placeholder="Describe detalladamente los problemas que afectaron tu avance..."
                    required={!noProblem}
                    maxLength={256}
                    style={{
                      width: '100%',
                      minHeight: '80px',
                      padding: '10px 12px 28px 12px',
                      background: 'rgba(0, 0, 0, 0.2)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: 'var(--text-light)',
                      fontSize: '0.9rem',
                      lineHeight: '1.4',
                      resize: 'vertical',
                      outline: 'none',
                      transition: 'border-color 0.2s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                  />
                  <span style={{
                    position: 'absolute',
                    bottom: '6px',
                    right: '12px',
                    fontSize: '0.75rem',
                    color: (problem || '').length >= 250 ? 'var(--error)' : 'var(--text-muted)',
                    fontWeight: '500',
                    pointerEvents: 'none',
                    opacity: 0.8
                  }}>
                    {256 - (problem || '').length} carac.
                  </span>
                </div>
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-light)' }}>
                  ¿Qué hizo para solucionarlo? (Solución)
                </label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <textarea
                    value={solution}
                    onChange={(e) => setSolution(e.target.value)}
                    placeholder="Describe la solución aplicada o el plan de acción para resolver el inconveniente..."
                    required={!noProblem}
                    maxLength={256}
                    style={{
                      width: '100%',
                      minHeight: '80px',
                      padding: '10px 12px 28px 12px',
                      background: 'rgba(0, 0, 0, 0.2)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: 'var(--text-light)',
                      fontSize: '0.9rem',
                      lineHeight: '1.4',
                      resize: 'vertical',
                      outline: 'none',
                      transition: 'border-color 0.2s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                  />
                  <span style={{
                    position: 'absolute',
                    bottom: '6px',
                    right: '12px',
                    fontSize: '0.75rem',
                    color: (solution || '').length >= 250 ? 'var(--error)' : 'var(--text-muted)',
                    fontWeight: '500',
                    pointerEvents: 'none',
                    opacity: 0.8
                  }}>
                    {256 - (solution || '').length} carac.
                  </span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Actividades Planeadas */}
        <section className="form-section" style={{ marginTop: '32px' }}>
          <style>{`
            .future-list-container {
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
              backdrop-filter: blur(10px);
            }
            @media (max-width: 850px) {
              .future-list-header {
                display: none !important;
              }
              .future-row-item {
                grid-template-columns: 1fr !important;
                gap: 12px !important;
                padding: 20px 16px !important;
              }
              .future-row-item > div:nth-child(2) {
                margin-top: 4px;
              }
            }
          `}</style>

          <h3 className="section-title">
            <CheckCircle2 size={20} />
            Seleccione qué actividades tiene planeada realizar la próxima semana
          </h3>

          <div className="future-list-container glass" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(255, 255, 255, 0.01)',
            marginTop: '20px'
          }}>
            {/* Cabecera del Listado (Headers) */}
            <div className="future-list-header" style={{
              display: 'grid',
              gridTemplateColumns: '300px 1fr',
              gap: '20px',
              padding: '12px 20px',
              background: 'rgba(255, 255, 255, 0.04)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              fontWeight: '600',
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-muted)'
            }}>
              <div>Tipo de Actividad</div>
              <div>¿Qué se planea realizar? (Descripción de Actividad Futura)</div>
            </div>

            {/* Listado de Actividades Futuras */}
            {ACTIVITY_TYPES.map(type => {
              const future = selectedFutures.find(f => f.type === type);
              const isSelected = !!future;

              return (
                <div key={type} className={`future-row-item ${isSelected ? 'active' : ''}`} style={{
                  display: 'grid',
                  gridTemplateColumns: '300px 1fr',
                  gap: '20px',
                  alignItems: 'center',
                  padding: '16px 20px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                  transition: 'background 0.2s ease',
                  background: isSelected ? 'rgba(78, 126, 255, 0.02)' : 'transparent'
                }}>
                  {/* Columna 1: Tipo de Actividad */}
                  <div>
                    <label className={`activity-toggle-label ${isSelected ? 'selected' : ''}`} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: isSelected ? 'rgba(78, 126, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected ? '1px solid var(--primary)' : '1px solid rgba(255, 255, 255, 0.08)',
                      transition: 'all 0.2s ease',
                      userSelect: 'none',
                      fontWeight: '600',
                      color: isSelected ? 'var(--primary)' : 'var(--text-light)'
                    }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleFuture(type)}
                        style={{
                          width: '18px',
                          height: '18px',
                          accentColor: 'var(--primary)',
                          cursor: 'pointer'
                        }}
                      />
                      <span>{type}</span>
                    </label>
                  </div>

                  {/* Columna 2: Descripción Planeada */}
                  <div>
                    {isSelected ? (
                      <div style={{ position: 'relative', width: '100%' }}>
                        <textarea
                          value={future.context}
                          onChange={(e) => handleFutureChange(type, 'context', e.target.value)}
                          placeholder={`Describe brevemente lo que planeas realizar en ${type}...`}
                          required={isSelected}
                          maxLength={256}
                          style={{
                            width: '100%',
                            minHeight: '60px',
                            padding: '10px 12px 28px 12px',
                            background: 'rgba(0, 0, 0, 0.2)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            color: 'var(--text-light)',
                            fontSize: '0.9rem',
                            lineHeight: '1.4',
                            resize: 'vertical',
                            outline: 'none',
                            transition: 'border-color 0.2s ease'
                          }}
                          onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                          onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                        />
                        <span style={{
                          position: 'absolute',
                          bottom: '6px',
                          right: '12px',
                          fontSize: '0.75rem',
                          color: (future.context || '').length >= 250 ? 'var(--error)' : 'var(--text-muted)',
                          fontWeight: '500',
                          pointerEvents: 'none',
                          opacity: 0.8
                        }}>
                          {256 - (future.context || '').length} carac.
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                        Selecciona esta actividad para describir lo planeado...
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="form-footer" style={{ marginTop: '40px' }}>
          <button type="submit" className="primary-btn big-btn" disabled={loading || !studentProject || availableWeeks.filter(w => !w.isFuture && !reportedWeeks.includes(w.number)).length === 0}>
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
