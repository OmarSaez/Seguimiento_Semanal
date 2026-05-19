import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Layers, 
  PlusSquare, 
  FolderPlus, 
  UserPlus, 
  ShieldPlus, 
  LogOut,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  Key,
  Eye,
  EyeOff,
  X
} from 'lucide-react';
import Swal from 'sweetalert2';
import axios from 'axios';
import usachLogo from '../../assets/image/Usach-PB-300x300.png';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.body.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      Swal.fire({
        title: 'Error',
        text: 'Las contraseñas no coinciden',
        icon: 'error'
      });
      return;
    }

    try {
      const authHeader = localStorage.getItem('auth');
      const payload = {
        password: newPassword
      };

      if (user.role === 'HELPER') {
        await axios.put(`/api/v1/helpers/${user.id}`, payload, {
          headers: { 'Authorization': authHeader }
        });
      } else {
        await axios.put(`/api/v1/teachers/${user.id}`, {
          name: user.name,
          email: user.email,
          password: newPassword
        }, {
          headers: { 'Authorization': authHeader }
        });
      }

      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');

      Swal.fire({
        title: '¡Clave Actualizada!',
        text: 'Tu contraseña ha sido actualizada correctamente. Por seguridad, debes volver a iniciar sesión.',
        icon: 'success',
        confirmButtonText: 'Ir al Login',
        confirmButtonColor: 'var(--primary)',
        allowOutsideClick: false
      }).then(() => {
        localStorage.clear();
        navigate('/login');
      });

    } catch (err) {
      console.error('Error al cambiar contraseña:', err);
      Swal.fire({
        title: 'Error',
        text: err.response?.data?.message || 'No se pudo cambiar la contraseña.',
        icon: 'error'
      });
    }
  };

  const navItems = [
    { name: 'Mis Secciones', path: '/teacher/my-sections', icon: <Layers size={18} />, parts: ['Mis', 'Secciones'] },
    { name: 'Todas las Secciones', path: '/teacher/all-sections', icon: <Users size={18} />, parts: ['Todas las', 'Secciones'] },
    { name: 'Crear/Editar Sección', path: '/teacher/manage-section', icon: <PlusSquare size={18} />, parts: ['Crear/Editar', 'Sección'] },
    { name: 'Ingresar Proyectos', path: '/teacher/add-projects', icon: <FolderPlus size={18} />, parts: ['Ingresar', 'Proyectos'] },
    { name: 'Ingresar Alumnos', path: '/teacher/add-students', icon: <UserPlus size={18} />, parts: ['Ingresar', 'Alumnos'] },
    { name: 'Ingresar Docente', path: '/teacher/add-teacher', icon: <ShieldPlus size={18} />, parts: ['Ingresar', 'Docente'] },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (user.role === 'HELPER') {
      return item.path !== '/teacher/add-teacher' && item.path !== '/teacher/manage-section' && item.path !== '/teacher/all-sections';
    }
    return true;
  });

  const [scrollState, setScrollState] = useState({ left: false, right: false });

  const handleNavScroll = (e) => {
    const el = e.target;
    const canScrollLeft = el.scrollLeft > 5;
    const canScrollRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 5;
    setScrollState({ left: canScrollLeft, right: canScrollRight });
  };

  useEffect(() => {
    const el = document.getElementById('nav-links-scroll');
    if (el) {
      const checkScroll = () => {
        const canScrollLeft = el.scrollLeft > 5;
        const canScrollRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 5;
        setScrollState({ left: canScrollLeft, right: canScrollRight });
      };
      checkScroll();
      window.addEventListener('resize', checkScroll);
      return () => window.removeEventListener('resize', checkScroll);
    }
  }, []);

  return (
    <>
      <nav className="teacher-navbar glass">
        <div className="nav-container">
          <div className="nav-logo" onClick={() => navigate('/dashboard')}>
            <img src={usachLogo} alt="USACH" />
            <div className="logo-divider"></div>
            <span className="platform-name">Seguimiento Semanal</span>
          </div>

          <div className="nav-links-wrapper">
            {scrollState.left && <div className="nav-indicator left"><ChevronLeft size={16} /></div>}
            <ul className="nav-links" id="nav-links-scroll" onScroll={handleNavScroll}>
              {filteredNavItems.map((item) => (
                <li key={item.path}>
                  <NavLink 
                    to={item.path} 
                    className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
                    title={item.name}
                  >
                    {item.icon}
                    <span className="nav-text-full">{item.name}</span>
                    <div className="nav-text-stacked">
                      <span className="stacked-part-1">{item.parts[0]}</span>
                      <span className="stacked-part-2">{item.parts[1]}</span>
                    </div>
                  </NavLink>
                </li>
              ))}
            </ul>
            {scrollState.right && <div className="nav-indicator right"><ChevronRight size={16} /></div>}
          </div>

          <div className="nav-user">
            <div className="user-info">
              <span className="user-name">{user.email?.split('@')[0]}</span>
              <span className="user-role">{user.role === 'HELPER' ? 'Ayudante' : 'Docente'}</span>
            </div>
            <button className="theme-toggle-btn" onClick={() => setShowPasswordModal(true)} title="Cambiar Contraseña">
              <Key size={20} />
            </button>
            <button className="theme-toggle-btn" onClick={toggleTheme} title="Cambiar Tema">
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="logout-btn" onClick={handleLogout} title="Cerrar Sesión">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      {showPasswordModal && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-content glass animate-slide-up" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Modificar Contraseña</h3>
              <button className="close-btn" onClick={() => setShowPasswordModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handlePasswordChangeSubmit} className="modal-form">
              <div className="form-group">
                <label>Nueva Contraseña</label>
                <div className="input-with-icon">
                  <Key size={16} className="input-icon" />
                  <input 
                    type={showNewPassword ? "text" : "password"} 
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Escribe la nueva contraseña"
                    required
                  />
                  <button 
                    type="button" 
                    className="password-toggle"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '16px' }}>
                <label>Confirmar Nueva Contraseña</label>
                <div className="input-with-icon">
                  <Key size={16} className="input-icon" />
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repite la nueva contraseña"
                    required
                  />
                  <button 
                    type="button" 
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="modal-footer" style={{ marginTop: '24px' }}>
                <button type="button" className="secondary-btn" onClick={() => setShowPasswordModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="primary-btn">
                  Cambiar Clave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
