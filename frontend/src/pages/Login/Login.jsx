import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, GraduationCap } from 'lucide-react';
import axios from 'axios';
import usachLogo from '../../assets/image/Usach-PB-300x300.png';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Basic Auth Header
      const authHeader = 'Basic ' + btoa(`${email}:${password}`);
      
      const response = await axios.get('http://localhost:8080/api/v1/auth/me', {
        headers: {
          'Authorization': authHeader
        }
      });

      if (response.status === 200) {
        const { roles, email: userEmail } = response.data;
        const isAdmin = roles.includes('ROLE_ADMIN');
        
        // Guardar estado de autenticación
        localStorage.setItem('auth', authHeader);
        localStorage.setItem('user', JSON.stringify({ 
          email: userEmail, 
          role: isAdmin ? 'ADMIN' : 'STUDENT' 
        }));

        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Error de login:', err);
      setError('Credenciales incorrectas o error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="institutional-logo">
        <img src={usachLogo} alt="Logo USACH" />
      </div>
      <div className="login-card glass animate-fade-in">
        <div className="login-header">
          <div className="logo-badge">
            <GraduationCap size={32} color="var(--primary)" />
          </div>
          <h1>Bienvenido</h1>
          <p>Gestiona tu seguimiento semanal con facilidad</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="email">Usuario / Email</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={18} />
              <input
                id="email"
                type="text"
                placeholder="Ingresa tu usuario"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">Contraseña</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-button" disabled={loading}>
            <span>{loading ? 'Cargando...' : 'Ingresar'}</span>
            {!loading && <LogIn size={18} />}
          </button>
        </form>

        <div className="login-footer">
          <p>¿Problemas para acceder? Contacta a tu profesor</p>
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
