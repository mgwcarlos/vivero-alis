import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function Login() {
  const navigate = useNavigate();

  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  const iniciarSesion = async (e) => {
    e.preventDefault();
    setMensaje('');
    setCargando(true);

    try {
      const respuesta = await api.post('/auth/login', {
        correo,
        password
      });

      localStorage.setItem('usuario', JSON.stringify(respuesta.data.usuario));

      navigate('/dashboard');
    } catch (error) {
      setMensaje(
        error.response?.data?.mensaje || 'Error al iniciar sesión'
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <img className="login-logo" src="/logo-alis.jpeg" alt="Vivero ALIS" />

        <h1>Vivero ALIS</h1>
        <p>Plantas · Sol · Sombra</p>

        <form onSubmit={iniciarSesion}>
          <label>Correo electrónico</label>
          <input
            type="email"
            placeholder="Ingrese su Usuario"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
          />

          <label>Contraseña</label>
          <input
            type="password"
            placeholder="Ingrese su Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {mensaje && <div className="error">{mensaje}</div>}

          <button type="submit" disabled={cargando}>
            {cargando ? 'Entrando...' : 'Iniciar sesión'}
          </button>
        </form>

        
      </div>
    </div>
  );
}

export default Login;