import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../../components/barra_navegacion/Navbar';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
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
