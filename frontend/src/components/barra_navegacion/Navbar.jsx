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
  ChevronRight
} from 'lucide-react';
import usachLogo from '../../assets/image/Usach-PB-300x300.png';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

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

  const navItems = [
    { name: 'Mis Secciones', path: '/teacher/my-sections', icon: <Layers size={18} /> },
    { name: 'Todas las Secciones', path: '/teacher/all-sections', icon: <Users size={18} /> },
    { name: 'Crear/Editar Sección', path: '/teacher/manage-section', icon: <PlusSquare size={18} /> },
    { name: 'Ingresar Proyectos', path: '/teacher/add-projects', icon: <FolderPlus size={18} /> },
    { name: 'Ingresar Alumnos', path: '/teacher/add-students', icon: <UserPlus size={18} /> },
    { name: 'Ingresar Docente', path: '/teacher/add-teacher', icon: <ShieldPlus size={18} /> },
  ];

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
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink 
                  to={item.path} 
                  className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
          {scrollState.right && <div className="nav-indicator right"><ChevronRight size={16} /></div>}
        </div>

        <div className="nav-user">
          <div className="user-info">
            <span className="user-name">{user.email?.split('@')[0]}</span>
            <span className="user-role">Docente</span>
          </div>
          <button className="theme-toggle-btn" onClick={toggleTheme} title="Cambiar Tema">
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button className="logout-btn" onClick={handleLogout} title="Cerrar Sesión">
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
