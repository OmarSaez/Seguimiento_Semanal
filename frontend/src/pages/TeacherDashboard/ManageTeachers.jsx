import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  UserPlus, 
  Pencil, 
  Trash2, 
  X, 
  Mail, 
  User, 
  Key,
  Eye,
  EyeOff,
  BookOpen,
  Calendar,
  Users,
  AlertTriangle
} from 'lucide-react';
import Swal from 'sweetalert2';
import './TeacherDashboard.css';

const ManageTeachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTeacherSections, setSelectedTeacherSections] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ 
    id: null, 
    name: '', 
    email: '',
    password: ''
  });

  const authHeader = localStorage.getItem('auth');
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchTeachers();
  }, [authHeader]);

  const fetchTeachers = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/v1/teachers', {
        headers: { 'Authorization': authHeader }
      });
      setTeachers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (teacher = null) => {
    if (teacher) {
      setFormData({ 
        id: teacher.id, 
        name: teacher.name, 
        email: teacher.email,
        password: teacher.password || ''
      });
    } else {
      setFormData({ id: null, name: '', email: '', password: '' });
    }
    setShowModal(true);
  };

  const handleEmailChange = (e) => {
    const email = e.target.value;
    const newFormData = { ...formData, email };

    if (email.includes('@usach.cl')) {
      const parts = email.split('@')[0].split('.');
      if (parts.length >= 2) {
        const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
        // Para docentes, el formato suele ser Nombre Apellido
        newFormData.name = `${capitalize(parts[0])} ${capitalize(parts[1])}`;
      }
    }
    setFormData(newFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      email: formData.email,
      password: formData.password
    };

    try {
      if (formData.id) {
        await axios.put(`http://localhost:8080/api/v1/teachers/${formData.id}`, payload, {
          headers: { 'Authorization': authHeader }
        });
      } else {
        await axios.post('http://localhost:8080/api/v1/teachers', payload, {
          headers: { 'Authorization': authHeader }
        });
      }
      
      const isSelfEditing = formData.id === currentUser.id;
      
      if (isSelfEditing) {
        setShowModal(false);
        Swal.fire({
          title: '¡Clave Actualizada!',
          text: 'Has modificado tu propia contraseña. Por seguridad y para aplicar los cambios, debes volver a iniciar sesión.',
          icon: 'success',
          confirmButtonText: 'Ir al Login',
          confirmButtonColor: 'var(--primary)',
          allowOutsideClick: false
        }).then(() => {
          localStorage.removeItem('auth');
          localStorage.removeItem('user');
          window.location.href = '/login';
        });
      } else {
        setShowModal(false);
        Swal.fire({
          title: 'Éxito',
          text: 'Docente guardado correctamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        fetchTeachers();
      }
    } catch (err) {
      console.error('Error saving teacher:', err);
      Swal.fire({
        title: 'Error',
        text: 'No se pudo guardar el docente',
        icon: 'error'
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este docente?')) return;
    try {
      await axios.delete(`http://localhost:8080/api/v1/teachers/${id}`, {
        headers: { 'Authorization': authHeader }
      });
      fetchTeachers();
    } catch (err) {
      console.error('Error deleting teacher:', err);
      const errorMessage = err.response?.data || 'No se pudo eliminar el docente';
      alert(errorMessage);
    }
  };

  if (loading) return <div className="loading-state">Cargando docentes...</div>;

  return (
    <div className="manage-teachers animate-fade-in">
      <header className="page-header flex-between">
        <div>
          <h2>Ingresar Docente</h2>
          <p>Administra las cuentas de profesores con acceso al sistema.</p>
        </div>
        <button className="primary-btn" onClick={() => handleOpenModal()}>
          <UserPlus size={18} />
          <span>Ingresar Docente</span>
        </button>
      </header>

      <div className="table-container">
        <table className="custom-table table-simple glass">
          <thead>
            <tr>
              <th>Nombre Completo</th>
              <th>Correo Institucional</th>
              <th>Secciones a Cargo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map(t => (
              <tr key={t.id}>
                <td className="bold">{t.name}</td>
                <td>{t.email}</td>
                <td>
                  <div 
                    className="count-cell clickable"
                    onClick={() => setSelectedTeacherSections(t)}
                    title="Ver secciones asignadas"
                  >
                    <BookOpen size={16} />
                    <span>{t.sections?.length || 0}</span>
                  </div>
                </td>
                <td>
                  <div className="flex gap-8">
                    <button className="icon-btn edit" onClick={() => handleOpenModal(t)}>
                      <Pencil size={18} />
                    </button>
                    {t.email !== currentUser.email && (
                      <button className="icon-btn delete" onClick={() => handleDelete(t.id)}>
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
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
              <h3>{formData.id ? 'Editar Docente' : 'Nuevo Docente'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              {formData.id === currentUser.id && (
                <div className="alert-warning sutil-note">
                  <AlertTriangle size={20} />
                  <span>
                    <strong>Nota Importante:</strong> Al cambiar tu propia contraseña, se cerrará tu sesión automáticamente por seguridad. Deberás ingresar de nuevo con tu nueva clave.
                  </span>
                </div>
              )}
              <div className="form-group">
                <label>Correo Institucional</label>
                <div className="input-with-icon">
                  <Mail size={16} className="input-icon" />
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={handleEmailChange}
                    placeholder="nombre.apellido@usach.cl"
                    required
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '16px' }}>
                <label>Nombre Completo (Auto-completado)</label>
                <div className="input-with-icon">
                  <User size={16} className="input-icon" />
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="Ej: Juan Perez"
                    required
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '16px' }}>
                <label>Contraseña</label>
                <div className="input-with-icon">
                  <Key size={16} className="input-icon" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    placeholder="Indica una contraseña segura"
                    required
                  />
                  <button 
                    type="button" 
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="primary-btn">
                  {formData.id ? 'Guardar Cambios' : 'Ingresar Docente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Lista de Secciones a Cargo */}
      {selectedTeacherSections && (
        <div className="modal-overlay" onClick={() => setSelectedTeacherSections(null)}>
          <div className="modal-content animate-scale" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Secciones de: {selectedTeacherSections.name}</h3>
              <button className="close-btn icon-btn" onClick={() => setSelectedTeacherSections(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '24px', maxHeight: '500px', overflowY: 'auto' }}>
              {selectedTeacherSections.sections && selectedTeacherSections.sections.length > 0 ? (
                <div className="student-list">
                  {selectedTeacherSections.sections.map((sec, idx) => (
                    <div key={sec.id || idx} className="student-item list-card glass" style={{ padding: '16px 20px' }}>
                      <div className="student-avatar" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                         <BookOpen size={20} />
                      </div>
                      <div className="student-info-modal">
                        <span className="bold" style={{ fontSize: '1.05rem' }}>Código: {sec.sectionCode}</span>
                        <span className="text-sm">
                          <Calendar size={14}/> Semestre: {sec.semester}/{sec.year}
                        </span>
                      </div>
                      <div 
                        className="count-cell clickable" 
                        onClick={() => setSelectedSection(sec)} 
                        title="Ver lista de alumnos" 
                        style={{ marginLeft: 'auto', marginRight: '16px' }}
                      >
                         <Users size={16} />
                         <span>{sec.students?.length || 0}</span>
                      </div>
                      <div>
                         <span className={`status-badge ${sec.isActive ? 'active' : 'inactive'}`}>
                           {sec.isActive ? 'Activa' : 'Inactiva'}
                         </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state glass">Este docente no tiene secciones asignadas actualmente.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sub-Modal Lista Alumnos */}
      {selectedSection && (
        <div className="modal-overlay" style={{ zIndex: 1050 }} onClick={() => setSelectedSection(null)}>
          <div className="modal-content animate-scale" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Alumnos: {selectedSection.sectionCode}</h3>
              <button className="close-btn icon-btn" onClick={() => setSelectedSection(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '24px', maxHeight: '500px', overflowY: 'auto' }}>
              {selectedSection.students && selectedSection.students.length > 0 ? (
                <div className="student-list">
                  {selectedSection.students.map((student, idx) => (
                    <div key={student.id || idx} className="student-item list-card glass">
                      <div className="student-avatar">
                         <User size={20} />
                      </div>
                      <div className="student-info-modal">
                        <span className="bold">{student.name} {student.lastname}</span>
                        <span className="text-sm"><Mail size={12}/> {student.email}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state glass">No hay alumnos matriculados en esta sección.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageTeachers;
