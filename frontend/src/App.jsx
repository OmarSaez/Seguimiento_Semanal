import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login/Login';
import TeacherDashboard from './pages/TeacherDashboard/TeacherDashboard';
import MySections from './pages/TeacherDashboard/MySections';
import AllSections from './pages/TeacherDashboard/AllSections';
import ManageSection from './pages/TeacherDashboard/ManageSection';
import ManageProjects from './pages/TeacherDashboard/ManageProjects';
import ManageStudents from './pages/TeacherDashboard/ManageStudents';
import ManageTeachers from './pages/TeacherDashboard/ManageTeachers';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Rutas de Docente */}
        <Route path="/teacher" element={<TeacherDashboard />}>
          <Route index element={<Navigate to="my-sections" replace />} />
          <Route path="my-sections" element={<MySections />} />
          <Route path="all-sections" element={<AllSections />} />
          <Route path="manage-section" element={<ManageSection />} />
          <Route path="add-projects" element={<ManageProjects />} />
          <Route path="add-students" element={<ManageStudents />} />
          <Route path="add-teacher" element={<ManageTeachers />} />
        </Route>

        <Route path="/dashboard" element={<Navigate to="/teacher" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
