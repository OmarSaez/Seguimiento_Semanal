import React from 'react';
import Navbar from '../../components/barra_navegacion/Navbar';

const TeacherDashboard = ({ children }) => {
  return (
    <div className="dashboard-layout">
      <Navbar />
      <main className="dashboard-content animate-fade-in" style={{ padding: '40px', maxWidth: '1600px', margin: '0 auto' }}>
        {children || (
          <div className="welcome-container">
            <h1>Panel de Docente</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
              Selecciona una opción en la barra superior para gestionar tus secciones y proyectos.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default TeacherDashboard;
