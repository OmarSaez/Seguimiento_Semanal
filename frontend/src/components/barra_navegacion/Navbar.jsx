import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Layers, 
  PlusSquare, 
  FolderPlus, 
  UserPlus, 
  ShieldPlus, 
  LogOut 
} from 'lucide-react';
import usachLogo from '../../assets/image/Usach-PB-300x300.png';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

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

  return (
    <nav className="teacher-navbar glass">
      <div className="nav-container">
        <div className="nav-logo" onClick={() => navigate('/dashboard')}>
          <img src={usachLogo} alt="USACH" />
          <div className="logo-divider"></div>
          <span className="platform-name">Seguimiento Semanal</span>
        </div>

        <ul className="nav-links">
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

        <div className="nav-user">
          <div className="user-info">
            <span className="user-name">{user.email?.split('@')[0]}</span>
            <span className="user-role">Docente</span>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Cerrar Sesión">
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
