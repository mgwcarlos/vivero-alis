import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function AgregarUsuario() {
  const navigate = useNavigate();

  const [formulario, setFormulario] = useState({
    nombre_completo: '',
    correo: '',
    password: '',
    rol: 'Vendedor'
  });

  const [mensaje, setMensaje] = useState('');
  const [exito, setExito] = useState('');

  const usuario = JSON.parse(localStorage.getItem('usuario'));

  useEffect(() => {
    if (!usuario) {
      navigate('/login');
      return;
    }

    if (usuario.rol !== 'Dueño') {
      alert('No tienes permiso para agregar usuarios');
      navigate('/dashboard');
    }
  }, []);

  const manejarCambio = (e) => {
    setFormulario({
      ...formulario,
      [e.target.name]: e.target.value
    });
  };

  const guardarUsuario = async (e) => {
    e.preventDefault();
    setMensaje('');
    setExito('');

    try {
      await api.post('/auth/registrar', formulario);

      setExito('Usuario registrado correctamente');

      setFormulario({
        nombre_completo: '',
        correo: '',
        password: '',
        rol: 'Vendedor'
      });
    } catch (error) {
      setMensaje(
        error.response?.data?.mensaje || 'Error al registrar usuario'
      );
    }
  };

  if (!usuario) {
    return null;
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand-box">

  <img src="/logo-alis.jpeg" alt="Vivero ALIS" />
          <p>Administración de usuarios</p>
        </div>

        <div className="topbar-buttons">
          <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
            Inicio
          </button>

          <button className="btn-salir" onClick={() => navigate('/dashboard')}>
            Volver
          </button>
        </div>
      </header>

      <main className="container">
        <div className="usuario-card">
          <div className="usuario-header">
            <span className="eyebrow-dark">Nuevo usuario</span>
            <h1>Agregar usuario</h1>
            <p>
              Registra nuevos vendedores o administradores para acceder al sistema.
            </p>
          </div>

          <form onSubmit={guardarUsuario} className="usuario-form">
            <label>Nombre completo</label>
            <input
              type="text"
              name="nombre_completo"
              placeholder="Ej. Juan Pérez López"
              value={formulario.nombre_completo}
              onChange={manejarCambio}
            />

            <label>Correo electrónico</label>
            <input
              type="email"
              name="correo"
              placeholder="usuario@alis.com"
              value={formulario.correo}
              onChange={manejarCambio}
            />

            <label>Contraseña</label>
            <input
              type="text"
              name="password"
              placeholder="Agrega una Contraseña"
              value={formulario.password}
              onChange={manejarCambio}
            />

            <label>Rol del usuario</label>
            <select
              name="rol"
              value={formulario.rol}
              onChange={manejarCambio}
            >
              <option value="Vendedor">Vendedor</option>
              <option value="Dueño">Dueño</option>
            </select>

            {mensaje && <div className="error">{mensaje}</div>}
            {exito && <div className="success">{exito}</div>}

            <button className="btn-primary" type="submit">
              Guardar usuario
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default AgregarUsuario;