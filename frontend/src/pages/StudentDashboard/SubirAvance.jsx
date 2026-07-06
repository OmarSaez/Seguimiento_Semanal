import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Send,
  CheckCircle2,
  Clock,
  FileText,
  Briefcase,
  Calendar,
  UserCircle2,
  AlertCircle
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
  const navigate = useNavigate();
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
  const [validationErrors, setValidationErrors] = useState({
    detailsSection: false,
    detailContexts: [],
    detailHhs: [],
    problem: false,
    solution: false,
    futureContexts: []
  });
  const [globalErrorMsg, setGlobalErrorMsg] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    if (showConfirmModal) {
      // Guardar la posición de scroll actual
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      // Recuperar la posición de scroll al cerrar
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
    return () => {
      // Cleanup en caso de que el componente se desmonte inesperadamente
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
    };
  }, [showConfirmModal]);

  const getFirstErrorField = () => {
    // 1. Actividades de la semana en orden de ACTIVITY_TYPES
    for (const type of ACTIVITY_TYPES) {
      if (validationErrors.detailContexts.includes(type)) {
        return { section: 'detailContext', type };
      }
      if (validationErrors.detailHhs.includes(type)) {
        return { section: 'detailHh', type };
      }
    }
    // 2. Problemas
    if (!noProblem) {
      if (validationErrors.problem) {
        return { section: 'problem' };
      }
      if (validationErrors.solution) {
        return { section: 'solution' };
      }
    }
    // 3. Actividades Futuras en orden de ACTIVITY_TYPES
    for (const type of ACTIVITY_TYPES) {
      if (validationErrors.futureContexts.includes(type)) {
        return { section: 'futureContext', type };
      }
    }
    return null;
  };

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
    setGlobalErrorMsg('');
    if (selectedDetails.find(d => d.type === type)) {
      setSelectedDetails(selectedDetails.filter(d => d.type !== type));
      setValidationErrors(prev => ({
        ...prev,
        detailContexts: prev.detailContexts.filter(t => t !== type),
        detailHhs: prev.detailHhs.filter(t => t !== type)
      }));
    } else {
      setSelectedDetails([...selectedDetails, { type, context: '', hh: '' }]);
      setValidationErrors(prev => ({
        ...prev,
        detailsSection: false
      }));
    }
  };

  const handleDetailChange = (type, field, value) => {
    setGlobalErrorMsg('');
    setSelectedDetails(selectedDetails.map(d =>
      d.type === type ? { ...d, [field]: value } : d
    ));

    if (field === 'context' && value.trim()) {
      setValidationErrors(prev => ({
        ...prev,
        detailContexts: prev.detailContexts.filter(t => t !== type)
      }));
    }
    if (field === 'hh' && value && !isNaN(value) && parseFloat(value) > 0 && (parseFloat(value) * 2) % 1 === 0) {
      setValidationErrors(prev => ({
        ...prev,
        detailHhs: prev.detailHhs.filter(t => t !== type)
      }));
    }
  };

  const handleToggleFuture = (type) => {
    setGlobalErrorMsg('');
    if (selectedFutures.find(f => f.type === type)) {
      setSelectedFutures(selectedFutures.filter(f => f.type !== type));
      setValidationErrors(prev => ({
        ...prev,
        futureContexts: prev.futureContexts.filter(t => t !== type)
      }));
    } else {
      setSelectedFutures([...selectedFutures, { type, context: '' }]);
    }
  };

  const handleFutureChange = (type, field, value) => {
    setGlobalErrorMsg('');
    setSelectedFutures(selectedFutures.map(f =>
      f.type === type ? { ...f, [field]: value } : f
    ));
    if (field === 'context' && value.trim()) {
      setValidationErrors(prev => ({
        ...prev,
        futureContexts: prev.futureContexts.filter(t => t !== type)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProject) return alert('Selecciona un proyecto');

    const newErrors = {
      detailsSection: false,
      detailContexts: [],
      detailHhs: [],
      problem: false,
      solution: false,
      futureContexts: []
    };

    let hasError = false;

    // 1. Validar Actividades de la Semana
    if (selectedDetails.length === 0) {
      newErrors.detailsSection = true;
      hasError = true;
    } else {
      selectedDetails.forEach(d => {
        if (!d.context || !d.context.trim()) {
          newErrors.detailContexts.push(d.type);
          hasError = true;
        }
        const hhVal = parseFloat(d.hh);
        if (!d.hh || isNaN(hhVal) || hhVal <= 0 || (hhVal * 2) % 1 !== 0) {
          newErrors.detailHhs.push(d.type);
          hasError = true;
        }
      });
    }

    // 2. Validar Problemas / Inconvenientes
    if (!noProblem) {
      if (!problem || !problem.trim()) {
        newErrors.problem = true;
        hasError = true;
      }
      if (!solution || !solution.trim()) {
        newErrors.solution = true;
        hasError = true;
      }
    }

    // 3. Validar Actividades Futuras
    if (selectedFutures.length > 0) {
      selectedFutures.forEach(f => {
        if (!f.context || !f.context.trim()) {
          newErrors.futureContexts.push(f.type);
          hasError = true;
        }
      });
    }

    if (hasError) {
      setValidationErrors(newErrors);
      
      // Calcular primer mensaje de error global a mostrar según prioridad
      let errorMsg = '';
      if (selectedDetails.length === 0) {
        errorMsg = 'Debes seleccionar al menos una actividad y rellenar este campo';
      } else {
        const hasEmptyDetailContext = selectedDetails.some(d => !d.context || !d.context.trim());
        if (hasEmptyDetailContext) {
          errorMsg = 'Debes rellenar este campo';
        } else {
          const hasEmptyDetailHh = selectedDetails.some(d => {
            const hhVal = parseFloat(d.hh);
            return !d.hh || isNaN(hhVal) || hhVal <= 0 || (hhVal * 2) % 1 !== 0;
          });
          if (hasEmptyDetailHh) {
            errorMsg = 'Debes indicar las Horas Humanas';
          }
        }
      }

      if (!errorMsg && !noProblem) {
        if (!problem || !problem.trim() || !solution || !solution.trim()) {
          errorMsg = 'Debes rellenar este campo';
        }
      }

      if (!errorMsg && selectedFutures.length > 0) {
        const hasEmptyFutureContext = selectedFutures.some(f => !f.context || !f.context.trim());
        if (hasEmptyFutureContext) {
          errorMsg = 'Debes rellenar este campo';
        }
      }

      setGlobalErrorMsg(errorMsg);
      
      // Encontrar a cuál selector hacer scroll
      let errorSelector = '';
      if (newErrors.detailsSection || newErrors.detailContexts.length > 0 || newErrors.detailHhs.length > 0) {
        errorSelector = '.activity-list-container';
      } else if (newErrors.problem || newErrors.solution) {
        errorSelector = '.problems-section';
      } else if (newErrors.futureContexts.length > 0) {
        errorSelector = '.future-list-container';
      }

      if (errorSelector) {
        const section = document.querySelector(errorSelector);
        if (section) {
          section.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }

    setValidationErrors({
      detailsSection: false,
      detailContexts: [],
      detailHhs: [],
      problem: false,
      solution: false,
      futureContexts: []
    });
    setGlobalErrorMsg('');
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    const payload = {
      student: { id: user.id },
      proyect: { id: parseInt(selectedProject) },
      sendDate: new Date().toISOString(),
      numberWeek: currentWeek,
      problem: noProblem ? 'n/r' : (problem || 'n/r'),
      solution: noProblem ? 'n/r' : (solution || 'n/r'),
      details: selectedDetails.map(d => ({
        typeAdvance: d.type,
        context: d.context,
        hh: parseFloat(d.hh)
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
      <div className="empty-state animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px 20px' }}>
        <div className="success-icon" style={{ color: 'var(--success)', marginBottom: '16px' }}>
          <CheckCircle2 size={64} />
        </div>
        <h2>¡Reporte Enviado con Éxito!</h2>
        <p style={{ fontSize: '1.05rem', color: 'var(--text-light)', maxWidth: '400px', lineHeight: '1.5' }}>
          Tu avance semanal de la <strong style={{ color: 'var(--primary)' }}>Semana {currentWeek}</strong> ha sido registrado correctamente.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '32px', width: '100%', maxWidth: '280px' }}>
          <button 
            className="primary-btn" 
            style={{ 
              margin: 0, 
              width: '100%', 
              justifyContent: 'center', 
              padding: '12px 24px',
              fontSize: '0.95rem'
            }} 
            onClick={() => window.location.reload()}
          >
            Subir otro reporte
          </button>
          <button 
            className="secondary-btn" 
            style={{ 
              margin: 0, 
              width: '100%', 
              justifyContent: 'center',
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(0, 0, 0, 0.02)',
              border: '1px solid var(--border)',
              padding: '12px 24px',
              fontSize: '0.95rem',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
              transition: 'all 0.2s ease'
            }} 
            onClick={() => navigate('/student/my-advances')}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.06)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.02)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.02)';
            }}
          >
            Ver mis reportes
          </button>
        </div>
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

      <form onSubmit={handleSubmit} className="advance-form glass" noValidate>
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
            border: validationErrors.detailsSection ? '2px solid rgba(239, 68, 68, 0.8)' : '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: validationErrors.detailsSection ? '0 0 16px rgba(239, 68, 68, 0.25)' : 'none',
            background: 'rgba(255, 255, 255, 0.01)',
            marginTop: '20px',
            transition: 'border 0.2s ease, box-shadow 0.2s ease'
          }}>
            {validationErrors.detailsSection && (
              <div className="animate-slide-up" style={{
                background: 'rgba(239, 68, 68, 0.1)',
                borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
                color: 'var(--error)',
                padding: '12px 20px',
                fontSize: '0.88rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} />
                <span>Debes seleccionar al menos una actividad realizada de la lista.</span>
              </div>
            )}
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
                            border: validationErrors.detailContexts.includes(type)
                              ? '1px solid rgba(239, 68, 68, 0.8)'
                              : '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: validationErrors.detailContexts.includes(type)
                              ? '0 0 8px rgba(239, 68, 68, 0.2)'
                              : 'none',
                            borderRadius: '8px',
                            color: 'var(--text-light)',
                            fontSize: '0.9rem',
                            resize: 'none',
                            fontFamily: 'inherit',
                            outline: 'none',
                            transition: 'all 0.2s ease'
                          }}
                          onFocus={(e) => e.target.style.borderColor = validationErrors.detailContexts.includes(type) ? 'rgba(239, 68, 68, 0.9)' : 'var(--primary)'}
                          onBlur={(e) => e.target.style.borderColor = validationErrors.detailContexts.includes(type) ? 'rgba(239, 68, 68, 0.8)' : 'rgba(255, 255, 255, 0.1)'}
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
                        {(() => {
                          const firstErr = getFirstErrorField();
                          if (firstErr && firstErr.section === 'detailContext' && firstErr.type === type) {
                            return (
                              <span style={{
                                color: 'var(--error)',
                                fontSize: '0.82rem',
                                marginTop: '6px',
                                display: 'block',
                                fontWeight: '600'
                              }}>
                                Debes rellenar este campo
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem', fontStyle: 'italic' }}>
                        Selecciona el tipo de actividad para detallar tu avance
                      </span>
                    )}
                  </div>

                  {/* Columna 3: Horas Dedicadas (Sólo si está seleccionada) */}
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '44px', flexDirection: 'column' }}>
                    {isSelected ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={detail.hh}
                            onChange={(e) => {
                              // Permite ingresar enteros o decimales. Convierte la coma a punto y previene múltiples puntos.
                              let val = e.target.value.replace(/[^0-9.,]/g, '');
                              val = val.replace(',', '.');
                              const dotIndex = val.indexOf('.');
                              if (dotIndex !== -1) {
                                val = val.slice(0, dotIndex + 1) + val.slice(dotIndex + 1).replace(/\./g, '');
                              }
                              
                              if (val === '') {
                                handleDetailChange(type, 'hh', '');
                                return;
                              }
                              
                              const parsed = parseFloat(val);
                              if (isNaN(parsed)) {
                                handleDetailChange(type, 'hh', val);
                              } else if (parsed <= 168) {
                                handleDetailChange(type, 'hh', val);
                              }
                            }}
                            onBlur={() => {
                              if (!detail.hh) return;
                              const parsed = parseFloat(detail.hh);
                              if (isNaN(parsed) || parsed <= 0) {
                                handleDetailChange(type, 'hh', '');
                                return;
                              }
                              // Redondea la hora ingresada al múltiplo de 0.5 más cercano (e.g. 1.2 -> 1.0, 1.3 -> 1.5)
                              let rounded = Math.round(parsed * 2) / 2;
                              if (rounded <= 0) {
                                rounded = 0.5; // El piso mínimo es media hora (0.5 hh)
                              }
                              if (rounded > 168) {
                                rounded = 168; // Cota máxima de horas en una semana
                              }
                              handleDetailChange(type, 'hh', rounded.toString());
                            }}
                            placeholder="HH"
                            required
                            style={{
                              width: '64px',
                              textAlign: 'center',
                              margin: 0,
                              padding: '10px 8px',
                              background: 'rgba(0, 0, 0, 0.2)',
                              border: validationErrors.detailHhs.includes(type)
                                ? '1px solid rgba(239, 68, 68, 0.8)'
                                : '1px solid rgba(255, 255, 255, 0.1)',
                              boxShadow: validationErrors.detailHhs.includes(type)
                                ? '0 0 8px rgba(239, 68, 68, 0.2)'
                                : 'none',
                              borderRadius: '8px',
                              color: 'var(--text-light)',
                              fontSize: '0.95rem',
                              fontWeight: '600',
                              outline: 'none',
                              transition: 'all 0.2s ease'
                            }}
                          />
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>hrs</span>
                        </div>
                        {(() => {
                          const firstErr = getFirstErrorField();
                          if (firstErr && firstErr.section === 'detailHh' && firstErr.type === type) {
                            return (
                              <span style={{
                                color: 'var(--error)',
                                fontSize: '0.78rem',
                                marginTop: '6px',
                                display: 'block',
                                fontWeight: '600',
                                whiteSpace: 'nowrap'
                              }}>
                                Debes indicar las Horas Humanas
                              </span>
                            );
                          }
                          return null;
                        })()}
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
        <section className="form-section problems-section" style={{ marginTop: '32px' }}>
          <div className="problem-header">
            <h3 className="section-title" style={{ margin: 0 }}>¿Hubo inconvenientes esta semana?</h3>
            <div
              onClick={() => {
                const newVal = !noProblem;
                setNoProblem(newVal);
                if (newVal) {
                  setValidationErrors(prev => ({ ...prev, problem: false, solution: false }));
                }
              }}
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
                    onChange={(e) => {
                      setProblem(e.target.value);
                      setGlobalErrorMsg('');
                      if (e.target.value.trim()) {
                        setValidationErrors(prev => ({ ...prev, problem: false }));
                      }
                    }}
                    placeholder="Describe detalladamente los problemas que afectaron tu avance..."
                    required={!noProblem}
                    maxLength={256}
                    style={{
                      width: '100%',
                      minHeight: '80px',
                      padding: '10px 12px 28px 12px',
                      background: 'rgba(0, 0, 0, 0.2)',
                      border: validationErrors.problem
                        ? '1px solid rgba(239, 68, 68, 0.8)'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      boxShadow: validationErrors.problem
                        ? '0 0 8px rgba(239, 68, 68, 0.2)'
                        : 'none',
                      borderRadius: '8px',
                      color: 'var(--text-light)',
                      fontSize: '0.9rem',
                      lineHeight: '1.4',
                      resize: 'vertical',
                      outline: 'none',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = validationErrors.problem ? 'rgba(239, 68, 68, 0.9)' : 'var(--primary)'}
                    onBlur={(e) => e.target.style.borderColor = validationErrors.problem ? 'rgba(239, 68, 68, 0.8)' : 'rgba(255, 255, 255, 0.1)'}
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
                  {(() => {
                    const firstErr = getFirstErrorField();
                    if (firstErr && firstErr.section === 'problem') {
                      return (
                        <span style={{
                          color: 'var(--error)',
                          fontSize: '0.85rem',
                          marginTop: '6px',
                          display: 'block',
                          fontWeight: '600'
                        }}>
                          Debes rellenar este campo
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-light)' }}>
                  ¿Qué hizo para solucionarlo? (Solución)
                </label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <textarea
                    value={solution}
                    onChange={(e) => {
                      setSolution(e.target.value);
                      setGlobalErrorMsg('');
                      if (e.target.value.trim()) {
                        setValidationErrors(prev => ({ ...prev, solution: false }));
                      }
                    }}
                    placeholder="Describe la solución aplicada o el plan de acción para resolver el inconveniente..."
                    required={!noProblem}
                    maxLength={256}
                    style={{
                      width: '100%',
                      minHeight: '80px',
                      padding: '10px 12px 28px 12px',
                      background: 'rgba(0, 0, 0, 0.2)',
                      border: validationErrors.solution
                        ? '1px solid rgba(239, 68, 68, 0.8)'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      boxShadow: validationErrors.solution
                        ? '0 0 8px rgba(239, 68, 68, 0.2)'
                        : 'none',
                      borderRadius: '8px',
                      color: 'var(--text-light)',
                      fontSize: '0.9rem',
                      lineHeight: '1.4',
                      resize: 'vertical',
                      outline: 'none',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = validationErrors.solution ? 'rgba(239, 68, 68, 0.9)' : 'var(--primary)'}
                    onBlur={(e) => e.target.style.borderColor = validationErrors.solution ? 'rgba(239, 68, 68, 0.8)' : 'rgba(255, 255, 255, 0.1)'}
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
                  {(() => {
                    const firstErr = getFirstErrorField();
                    if (firstErr && firstErr.section === 'solution') {
                      return (
                        <span style={{
                          color: 'var(--error)',
                          fontSize: '0.85rem',
                          marginTop: '6px',
                          display: 'block',
                          fontWeight: '600'
                        }}>
                          Debes rellenar este campo
                        </span>
                      );
                    }
                    return null;
                  })()}
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
                            border: validationErrors.futureContexts.includes(type)
                              ? '1px solid rgba(239, 68, 68, 0.8)'
                              : '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: validationErrors.futureContexts.includes(type)
                              ? '0 0 8px rgba(239, 68, 68, 0.2)'
                              : 'none',
                            borderRadius: '8px',
                            color: 'var(--text-light)',
                            fontSize: '0.9rem',
                            lineHeight: '1.4',
                            resize: 'vertical',
                            outline: 'none',
                            transition: 'all 0.2s ease'
                          }}
                          onFocus={(e) => e.target.style.borderColor = validationErrors.futureContexts.includes(type) ? 'rgba(239, 68, 68, 0.9)' : 'var(--primary)'}
                          onBlur={(e) => e.target.style.borderColor = validationErrors.futureContexts.includes(type) ? 'rgba(239, 68, 68, 0.8)' : 'rgba(255, 255, 255, 0.1)'}
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
                        {(() => {
                          const firstErr = getFirstErrorField();
                          if (firstErr && firstErr.section === 'futureContext' && firstErr.type === type) {
                            return (
                              <span style={{
                                color: 'var(--error)',
                                fontSize: '0.85rem',
                                marginTop: '6px',
                                display: 'block',
                                fontWeight: '600'
                              }}>
                                Debes rellenar este campo
                              </span>
                            );
                          }
                          return null;
                        })()}
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

      {showConfirmModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '20px',
          boxSizing: 'border-box'
        }}>
          <style>{`
            @media (max-width: 600px) {
              .confirm-modal-header {
                padding: 16px 20px !important;
                gap: 8px !important;
              }
              .confirm-modal-title {
                font-size: 1.05rem !important;
              }
              .confirm-modal-subtitle {
                font-size: 0.78rem !important;
              }
              .confirm-modal-body {
                padding: 16px 20px !important;
                gap: 16px !important;
              }
              .confirm-modal-footer {
                flex-direction: column !important;
                align-items: stretch !important;
                padding: 16px 20px !important;
                gap: 12px !important;
              }
              .confirm-modal-footer-text {
                text-align: center !important;
                margin-right: 0 !important;
                font-size: 0.85rem !important;
              }
              .confirm-modal-buttons-group {
                display: grid !important;
                grid-template-columns: 1fr 1fr !important;
                gap: 10px !important;
                width: 100% !important;
              }
              .confirm-modal-buttons-group button {
                width: 100% !important;
                min-width: 0 !important;
                margin: 0 !important;
                justify-content: center !important;
                text-align: center !important;
              }
            }
          `}</style>
          <div className="animate-scale-up" style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--glass-border)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '80vh',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div className="confirm-modal-header" style={{
              padding: '20px 28px',
              borderBottom: '1px solid var(--glass-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <AlertCircle size={24} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <div>
                <h3 className="confirm-modal-title" style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)', fontWeight: '700' }}>
                  Resumen y Confirmación de Envío
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                  <span style={{ 
                    fontSize: '0.82rem', 
                    background: 'rgba(0, 164, 153, 0.1)', 
                    color: 'var(--primary)', 
                    padding: '2px 10px', 
                    borderRadius: '20px', 
                    fontWeight: '700' 
                  }}>
                    {availableWeeks.find(w => w.number === currentWeek)?.label || `Semana ${currentWeek}`}
                  </span>
                  <span className="confirm-modal-subtitle" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    • Revisa el detalle antes de enviar
                  </span>
                </div>
              </div>
            </div>

            {/* Content (Scrollable) */}
            <div className="confirm-modal-body" style={{
              padding: '24px 28px',
              overflowY: 'auto',
              flex: '1 1 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              boxSizing: 'border-box'
            }}>
              {/* Semana actual */}
              <div>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.82rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>
                  Actividades Realizadas esta Semana
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedDetails.map(d => (
                    <div key={d.type} style={{
                      background: 'var(--bg-dark)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '8px',
                      padding: '12px 16px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.9rem' }}>{d.type}</span>
                        <span style={{ fontSize: '0.8rem', background: 'rgba(0, 164, 153, 0.08)', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>
                          {d.hh} hrs
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{d.context}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Problemas / Inconvenientes */}
              <div>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.82rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>
                  Problemas & Soluciones
                </h4>
                {noProblem ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'var(--success)',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    background: 'rgba(16, 185, 129, 0.05)',
                    border: '1px solid rgba(16, 185, 129, 0.1)',
                    padding: '12px 16px',
                    borderRadius: '8px'
                  }}>
                    <CheckCircle2 size={16} />
                    <span>No se presentaron inconvenientes esta semana.</span>
                  </div>
                ) : (
                  <div style={{
                    background: 'var(--bg-dark)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '8px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Inconveniente:</span>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: '1.4' }}>{problem}</p>
                    </div>
                    <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '12px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Solución aplicada:</span>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: '1.4' }}>{solution}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Actividades Futuras */}
              <div>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.82rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>
                  Actividades Planeadas para la Próxima Semana
                </h4>
                {selectedFutures.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {selectedFutures.map(f => (
                      <div key={f.type} style={{
                        background: 'var(--bg-dark)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '8px',
                        padding: '12px 16px'
                      }}>
                        <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.9rem', display: 'block', marginBottom: '6px' }}>{f.type}</span>
                        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{f.context}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'var(--success)',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    background: 'rgba(16, 185, 129, 0.05)',
                    border: '1px solid rgba(16, 185, 129, 0.1)',
                    padding: '12px 16px',
                    borderRadius: '8px'
                  }}>
                    <CheckCircle2 size={16} />
                    <span>Has indicado que no hay actividades futuras para la próxima semana.</span>
                  </div>
                )}
              </div>

              {/* Advertencia final */}
              <div style={{
                background: 'rgba(239, 68, 68, 0.05)',
                border: '1px solid rgba(239, 68, 68, 0.15)',
                borderRadius: '8px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginTop: '4px'
              }}>
                <AlertCircle size={20} style={{ color: 'var(--error)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.85rem', color: 'var(--error)', fontWeight: '600', lineHeight: '1.4' }}>
                  Esta acción es irreversible y no se podrá modificar posteriormente.
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="confirm-modal-footer" style={{
              padding: '20px 28px',
              borderTop: '1px solid var(--glass-border)',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '16px'
            }}>
              <span className="confirm-modal-footer-text" style={{ marginRight: 'auto', fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: '600' }}>
                ¿Estás seguro que quieres enviar el reporte?
              </span>
              <div className="confirm-modal-buttons-group" style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setShowConfirmModal(false)}
                  style={{ padding: '10px 20px', fontSize: '0.9rem', minWidth: '80px', borderRadius: '12px', margin: 0 }}
                >
                  No, volver
                </button>
                <button
                  type="button"
                  className="primary-btn"
                  onClick={handleConfirmSubmit}
                  style={{ padding: '10px 24px', fontSize: '0.9rem', minWidth: '100px', borderRadius: '12px', margin: 0 }}
                >
                  Sí, enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SubirAvance;
