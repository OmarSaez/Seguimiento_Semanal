import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  ClipboardList, 
  UploadCloud, 
  LogOut 
} from 'lucide-react';
import usachLogo from '../../assets/image/Usach-PB-300x300.png';
import './Navbar.css';

const StudentNavbar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const navItems = [
    { name: 'Avances Pasados', path: '/student/my-advances', icon: <ClipboardList size={18} /> },
    { name: 'Subir un nuevo avance', path: '/student/upload-advance', icon: <UploadCloud size={18} /> },
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
            <span className="user-role">Estudiante</span>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Cerrar Sesión">
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default StudentNavbar;
