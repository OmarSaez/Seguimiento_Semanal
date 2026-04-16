import React from 'react';
import { Outlet } from 'react-router-dom';
import StudentNavbar from '../../components/barra_navegacion/StudentNavbar';
import '../TeacherDashboard/TeacherDashboard.css'; // Reutilizar estilos base

const StudentDashboard = () => {
  return (
    <div className="dashboard-layout">
      <StudentNavbar />
      <main className="dashboard-content animate-fade-in">
        <div className="content-inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
