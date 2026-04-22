import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { PlusCircle, Pencil, Search, X, CheckCircle2, UserCircle2, ChevronUp, ChevronDown } from 'lucide-react';
import './TeacherDashboard.css';

const ManageSection = () => {
    const [sections, setSections] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [teacherSearch, setTeacherSearch] = useState('');
    const [formData, setFormData] = useState({
        id: null,
        sectionCode: '',
        semester: 1,
        year: new Date().getFullYear(),
        isActive: true,
        startDate: '',
        finishDate: '',
        teacher: null
    });
    const [scrollState, setScrollState] = useState({ top: false, bottom: true });

    const authHeader = localStorage.getItem('auth');

    useEffect(() => {
        fetchData();
    }, [authHeader]);

    const fetchData = async () => {
        try {
            const [sectionsRes, teachersRes] = await Promise.all([
                axios.get('/api/v1/sections', { headers: { 'Authorization': authHeader } }),
                axios.get('/api/v1/teachers', { headers: { 'Authorization': authHeader } })
            ]);
            setSections(Array.isArray(sectionsRes.data) ? sectionsRes.data : []);
            setTeachers(Array.isArray(teachersRes.data) ? teachersRes.data : []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (section = null) => {
        if (section) {
            setFormData({
                id: section.id,
                sectionCode: section.sectionCode,
                semester: section.semester,
                year: section.year,
                isActive: section.isActive,
                startDate: section.startDate || '',
                finishDate: section.finishDate || '',
                teacher: section.teacher
            });
        } else {
            setFormData({
                id: null,
                sectionCode: '',
                semester: 1,
                year: new Date().getFullYear(),
                isActive: true,
                teacher: null
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.teacher) {
            alert('Por favor selecciona un docente');
            return;
        }

        const payload = {
            sectionCode: formData.sectionCode,
            semester: formData.semester,
            year: formData.year,
            isActive: formData.isActive,
            startDate: formData.startDate === '' ? null : formData.startDate,
            finishDate: formData.finishDate === '' ? null : formData.finishDate,
            teacher: formData.teacher ? { id: formData.teacher.id } : null
        };

        try {
            if (formData.id) {
                await axios.put(`/api/v1/sections/${formData.id}`, payload, {
                    headers: { 'Authorization': authHeader }
                });
            } else {
                await axios.post('/api/v1/sections', payload, {
                    headers: { 'Authorization': authHeader }
                });
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            console.error('Error saving section:', error);
            alert('Error al guardar la sección');
        }
    };

    const filteredTeachers = teachers.filter(t =>
        t.name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
        t.email.toLowerCase().includes(teacherSearch.toLowerCase())
    );

    useEffect(() => {
        if (!showModal) return;
        const el = document.getElementById('teacher-list-scroll');
        if (el) {
            setScrollState(prev => {
                const isTop = el.scrollTop > 0;
                const isBottom = el.scrollHeight > el.clientHeight && Math.ceil(el.scrollTop + el.clientHeight) < el.scrollHeight;
                if (prev.top === isTop && prev.bottom === isBottom) return prev;
                return { top: isTop, bottom: isBottom };
            });
        }
    }, [teacherSearch, teachers.length, showModal]);

    const handleScroll = (e) => {
        const el = e.target;
        setScrollState(prev => {
            const isTop = el.scrollTop > 0;
            const isBottom = el.scrollHeight > el.clientHeight && Math.ceil(el.scrollTop + el.clientHeight) < el.scrollHeight;
            if (prev.top === isTop && prev.bottom === isBottom) return prev;
            return { top: isTop, bottom: isBottom };
        });
    };

    if (loading) return <div className="loading-state">Cargando gestión de secciones...</div>;

    return (
        <div className="manage-sections">
            <header className="page-header flex-between">
                <div>
                    <h2>Gestión de Secciones</h2>
                    <p>Crea nuevas secciones o edita las existentes.</p>
                </div>
                <button className="primary-btn" onClick={() => handleOpenModal()}>
                    <PlusCircle size={18} />
                    <span>Crear Sección</span>
                </button>
            </header>

            <div className="sections-list table-container">
                <table className="custom-table glass animate-fade-in">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Periodo</th>
                            <th>Docente</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sections.map(s => (
                            <tr key={s.id}>
                                <td className="bold" data-label="Código">{s.sectionCode}</td>
                                <td data-label="Periodo">{s.semester}/{s.year}</td>
                                <td data-label="Docente">
                                    {s.teacher?.name ? (
                                        s.teacher.name
                                    ) : (
                                        <span className="text-muted" style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>No asignado</span>
                                    )}
                                </td>
                                <td data-label="Estado">
                                    <span className={`status-dot ${s.isActive ? 'active' : 'inactive'}`}></span>
                                    {s.isActive ? 'Activo' : 'Inactivo'}
                                </td>
                                <td data-label="Acciones">
                                    <button className="icon-btn edit" onClick={() => handleOpenModal(s)}>
                                        <Pencil size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content glass animate-slide-up">
                        <div className="modal-header">
                            <h3>{formData.id ? 'Editar Sección' : 'Nueva Sección'}</h3>
                            <button className="close-btn" onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Código de Sección</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: INF-612"
                                        value={formData.sectionCode}
                                        onChange={e => setFormData({ ...formData, sectionCode: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group" style={{ display: 'flex', flexDirection: 'column' }}>
                                    <label>Estado de Accesibilidad</label>
                                    <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                                        <label className="custom-switch">
                                            <input
                                                type="checkbox"
                                                checked={formData.isActive}
                                                onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                            />
                                            <span className="slider"></span>
                                        </label>
                                        <span style={{
                                            fontWeight: '600',
                                            color: formData.isActive ? 'var(--success)' : 'var(--error)'
                                        }}>
                                            {formData.isActive ? 'Sección Activa' : 'Sección Inactiva'}
                                        </span>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Semestre</label>
                                    <select
                                        value={formData.semester}
                                        onChange={e => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                                    >
                                        <option value={1}>1</option>
                                        <option value={2}>2</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Año</label>
                                    <input
                                        type="number"
                                        value={formData.year}
                                        onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Inicio Semestre</label>
                                    <input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Fin Semestre</label>
                                    <input
                                        type="date"
                                        value={formData.finishDate}
                                        onChange={e => setFormData({ ...formData, finishDate: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="teacher-picker">
                                <label>Asignar Docente</label>
                                <div className="search-box">
                                    <Search className="search-icon" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Buscar docente por nombre o correo..."
                                        value={teacherSearch}
                                        onChange={e => setTeacherSearch(e.target.value)}
                                    />
                                </div>
                                <div className="teacher-list-wrapper" style={{ position: 'relative', marginTop: '8px' }}>
                                    {scrollState.top && (
                                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '30px', background: 'linear-gradient(to bottom, var(--bg-card) 20%, transparent)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '4px', zIndex: 5, pointerEvents: 'none' }}>
                                            <ChevronUp size={18} color="var(--primary)" />
                                        </div>
                                    )}
                                    <div
                                        id="teacher-list-scroll"
                                        className="teacher-list"
                                        onScroll={handleScroll}
                                        style={{ maxHeight: '135px', overflowY: 'auto' }}
                                    >
                                        {filteredTeachers.map(t => (
                                            <div
                                                key={t.id}
                                                className={`teacher-item ${formData.teacher?.id === t.id ? 'selected' : ''}`}
                                                onClick={() => setFormData({ ...formData, teacher: t })}
                                            >
                                                <div className="teacher-avatar">
                                                    <UserCircle2 size={24} />
                                                </div>
                                                <div className="teacher-info">
                                                    <div className="name">{t.name}</div>
                                                    <div className="email">{t.email}</div>
                                                </div>
                                                {formData.teacher?.id === t.id && (
                                                    <CheckCircle2 size={18} className="check-icon" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {scrollState.bottom && filteredTeachers.length > 2 && (
                                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '30px', background: 'linear-gradient(to top, var(--bg-card) 20%, transparent)', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', paddingBottom: '4px', zIndex: 5, pointerEvents: 'none' }}>
                                            <ChevronDown size={18} color="var(--primary)" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="primary-btn">
                                    {formData.id ? 'Guardar Cambios' : 'Crear Sección'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageSection;
