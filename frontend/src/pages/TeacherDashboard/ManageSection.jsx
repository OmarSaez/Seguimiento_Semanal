import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { PlusCircle, Pencil, Search, X, CheckCircle2, UserCircle2 } from 'lucide-react';
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
        teacher: null
    });

    const authHeader = localStorage.getItem('auth');

    useEffect(() => {
        fetchData();
    }, [authHeader]);

    const fetchData = async () => {
        try {
            const [sectionsRes, teachersRes] = await Promise.all([
                axios.get('http://localhost:8080/api/v1/sections', { headers: { 'Authorization': authHeader } }),
                axios.get('http://localhost:8080/api/v1/teachers', { headers: { 'Authorization': authHeader } })
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
            teacher: { id: formData.teacher.id } // Enviar solo el ID del profesor para simplificar
        };

        try {
            if (formData.id) {
                await axios.put(`http://localhost:8080/api/v1/sections/${formData.id}`, payload, {
                    headers: { 'Authorization': authHeader }
                });
            } else {
                await axios.post('http://localhost:8080/api/v1/sections', payload, {
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
                                <td className="bold">{s.sectionCode}</td>
                                <td>{s.semester}/{s.year}</td>
                                <td>{s.teacher?.name}</td>
                                <td>
                                    <span className={`status-dot ${s.isActive ? 'active' : 'inactive'}`}></span>
                                    {s.isActive ? 'Activo' : 'Inactivo'}
                                </td>
                                <td>
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
                    <div className="modal-content glass animate-fade-in">
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
                                        onChange={e => setFormData({...formData, sectionCode: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Semestre</label>
                                    <select 
                                        value={formData.semester}
                                        onChange={e => setFormData({...formData, semester: parseInt(e.target.value)})}
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
                                        onChange={e => setFormData({...formData, year: parseInt(e.target.value)})}
                                        required
                                    />
                                </div>
                                <div className="form-group checkbox">
                                    <label>
                                        <input 
                                            type="checkbox" 
                                            checked={formData.isActive}
                                            onChange={e => setFormData({...formData, isActive: e.target.checked})}
                                        />
                                        Sección Activa
                                    </label>
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
                                <div className="teacher-list">
                                    {filteredTeachers.map(t => (
                                        <div 
                                            key={t.id} 
                                            className={`teacher-item ${formData.teacher?.id === t.id ? 'selected' : ''}`}
                                            onClick={() => setFormData({...formData, teacher: t})}
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
