import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, GraduationCap, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import usachLogo from '../../assets/image/Usach-PB-300x300.png';
import usachColorLogo from '../../assets/image/Usach-Logotipo_Color.png';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userRole, setUserRole] = useState(null); // null, 'STUDENT', 'TEACHER'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Si es estudiante, usamos la contraseña fija definida en el backend
      const loginPassword = userRole === 'STUDENT' ? 'student_access' : password;
      const authHeader = 'Basic ' + btoa(`${email}:${loginPassword}`);

      const response = await axios.get('http://localhost:8080/api/v1/auth/me', {
        headers: {
          'Authorization': authHeader
        }
      });

      if (response.status === 200) {
        const { roles, email: userEmail } = response.data;
        const isAdmin = roles.includes('ROLE_ADMIN');

        // Verificar que el rol coincida con lo seleccionado (opcional pero recomendado)
        if (userRole === 'TEACHER' && !isAdmin) {
          throw new Error('No tienes permisos de docente');
        }
        if (userRole === 'STUDENT' && isAdmin) {
          throw new Error('Por favor ingresa como docente');
        }

        localStorage.setItem('auth', authHeader);
        localStorage.setItem('user', JSON.stringify({
          ...response.data,
          role: isAdmin ? 'ADMIN' : 'STUDENT'
        }));

        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Error de login:', err);
      setError(err.message === 'No tienes permisos de docente' || err.message === 'Por favor ingresa como docente'
        ? err.message
        : 'Credenciales incorrectas o usuario no registrado');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setUserRole(null);
    setEmail('');
    setPassword('');
    setError('');
  };

  return (
    <div className="login-container">
      <div className="institutional-logo">
        <img src={usachLogo} alt="Logo USACH" />
      </div>

      <div className="login-card glass animate-fade-in">
        <div className="login-header">
          <div className="logo-badge" style={{ background: 'transparent', border: 'none', width: '100%', height: 'auto', marginBottom: '24px' }}>
            <img src={usachColorLogo} alt="Logo Color" style={{ height: '90px', width: 'auto', objectFit: 'contain' }} />
          </div>
          <h1>{userRole === null ? 'Bienvenido' : userRole === 'STUDENT' ? 'Acceso Estudiante' : 'Acceso Docente'}</h1>
          <p>{userRole === null ? 'Selecciona tu perfil para ingresar' : 'Ingresa tus datos para continuar'}</p>
        </div>

        {userRole === null ? (
          <div className="role-selection">
            <button className="role-button glass" onClick={() => setUserRole('STUDENT')}>
              <div className="role-icon student">
                <GraduationCap size={28} />
              </div>
              <span>Soy Estudiante</span>
            </button>
            <button className="role-button glass" onClick={() => setUserRole('TEACHER')}>
              <div className="role-icon teacher">
                <Lock size={28} />
              </div>
              <span>Soy Docente</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <label htmlFor="email">Correo Institucional</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={18} />
                <input
                  id="email"
                  type="email"
                  placeholder="ejemplo@usach.cl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {userRole === 'TEACHER' && (
              <div className="input-group">
                <label htmlFor="password">Contraseña</label>
                <div className="input-wrapper">
                  <Lock className="input-icon" size={18} />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button" 
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {error && <div className="error-message">{error}</div>}

            <div className="button-group">
              <button type="submit" className="login-button" disabled={loading}>
                <span>{loading ? 'Cargando...' : 'Ingresar'}</span>
                {!loading && <LogIn size={18} />}
              </button>
              <button type="button" className="back-button" onClick={handleBack}>
                Volver
              </button>
            </div>
          </form>
        )}

        <div className="login-footer">
          <p>Plataforma de Seguimiento Semanal de PINGESO</p>
        </div>
      </div>

      <div className="login-decoration">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>
    </div>
  );
};

export default Login;
