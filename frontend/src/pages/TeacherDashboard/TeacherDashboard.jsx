import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../../components/barra_navegacion/Navbar';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const auth = localStorage.getItem('auth');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!auth || (user.role !== 'ADMIN' && user.role !== 'HELPER')) {
      localStorage.clear();
      navigate('/login');
      return;
    }

    // Si es ayudante, bloquear acceso directo a configuración de docentes o de secciones
    if (user.role === 'HELPER') {
      const path = location.pathname;
      if (path.endsWith('/add-teacher') || path.endsWith('/manage-section')) {
        navigate('/teacher/my-sections', { replace: true });
      }
    }
  }, [location, navigate]);

  return (
    <div className="dashboard-layout">
      <Navbar />
      <main className="dashboard-content animate-fade-in">
        <div className="content-inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard;
