import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function Inventario() {
  const navigate = useNavigate();

  const [plantas, setPlantas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [mensaje, setMensaje] = useState('');

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [plantaEditando, setPlantaEditando] = useState(null);
  const [imagenArchivo, setImagenArchivo] = useState(null);
  const [previewImagen, setPreviewImagen] = useState('');

  const [nuevaPlanta, setNuevaPlanta] = useState({
    nombre_comun: '',
    stock: '',
    precio_venta: '',
    descripcion: ''
  });

  const usuario = JSON.parse(localStorage.getItem('usuario'));

  const cargarPlantas = async () => {
    try {
      const respuesta = await api.get('/plantas');
      setPlantas(respuesta.data);
    } catch (error) {
      setMensaje('Error al cargar inventario');
    }
  };

  useEffect(() => {
    if (!usuario) {
      navigate('/login');
      return;
    }

    cargarPlantas();
  }, []);

  const cerrarSesion = () => {
    localStorage.removeItem('usuario');
    navigate('/login');
  };

  const manejarCambio = (e) => {
    setNuevaPlanta({
      ...nuevaPlanta,
      [e.target.name]: e.target.value
    });
  };

  const manejarImagen = (e) => {
    const archivo = e.target.files[0];

    if (!archivo) {
      setImagenArchivo(null);
      setPreviewImagen('');
      return;
    }

    setImagenArchivo(archivo);
    setPreviewImagen(URL.createObjectURL(archivo));
  };

  const guardarPlanta = async (e) => {
    e.preventDefault();
    setMensaje('');

    try {
      const formData = new FormData();

      formData.append('nombre_comun', nuevaPlanta.nombre_comun);
      formData.append('stock', Number(nuevaPlanta.stock));
      formData.append('precio_venta', Number(nuevaPlanta.precio_venta));
      formData.append('descripcion', nuevaPlanta.descripcion);

      if (imagenArchivo) {
        formData.append('imagen', imagenArchivo);
      }

      if (plantaEditando) {
        await api.put(`/plantas/${plantaEditando.id_planta}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        await api.post('/plantas', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      setNuevaPlanta({
        nombre_comun: '',
        stock: '',
        precio_venta: '',
        descripcion: ''
      });

      setImagenArchivo(null);
      setPreviewImagen('');
      setPlantaEditando(null);
      setMostrarFormulario(false);
      cargarPlantas();
    } catch (error) {
      setMensaje(
        error.response?.data?.mensaje || 'Error al guardar la planta'
      );
    }
  };

  const editarPlanta = (planta) => {
    setPlantaEditando(planta);

    setNuevaPlanta({
      nombre_comun: planta.nombre_comun,
      stock: planta.stock,
      precio_venta: planta.precio_venta,
      descripcion: planta.descripcion || ''
    });

    setImagenArchivo(null);
    setPreviewImagen(
planta.imagen ? `${import.meta.env.VITE_BACKEND_URL}${planta.imagen}` : ''    );

    setMostrarFormulario(true);
  };

  const eliminarPlanta = async (id) => {
    const confirmar = window.confirm('¿Seguro que quieres dar de baja esta planta?');

    if (!confirmar) return;

    try {
      await api.delete(`/plantas/${id}`);
      cargarPlantas();
    } catch (error) {
      setMensaje(
        error.response?.data?.mensaje || 'Error al dar de baja la planta'
      );
    }
  };

  const agregarStock = async (id) => {
    const cantidad = window.prompt('¿Cuántas unidades quieres agregar al stock?');

    if (!cantidad) return;

    const cantidadNumero = Number(cantidad);

    if (cantidadNumero <= 0 || Number.isNaN(cantidadNumero)) {
      alert('Ingresa una cantidad válida mayor a 0');
      return;
    }

    try {
      await api.post(`/plantas/${id}/stock`, {
        cantidad: cantidadNumero
      });

      cargarPlantas();
    } catch (error) {
      setMensaje(
        error.response?.data?.mensaje || 'Error al agregar stock'
      );
    }
  };

  const cancelarFormulario = () => {
    setMostrarFormulario(false);
    setPlantaEditando(null);
    setImagenArchivo(null);
    setPreviewImagen('');

    setNuevaPlanta({
      nombre_comun: '',
      stock: '',
      precio_venta: '',
      descripcion: ''
    });
  };

  const obtenerUrlImagen = (imagen) => {
    if (!imagen) return null;

    if (imagen.startsWith('http')) {
      return imagen;
    }

    return `${import.meta.env.VITE_BACKEND_URL}${imagen}`;
  };

  const plantasFiltradas = plantas.filter((planta) =>
    planta.nombre_comun.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand-box">

  <img src="/logo-alis.jpeg" alt="Vivero ALIS" />
          <p>
            Bienvenido: {usuario?.nombre_completo} | Rol: {usuario?.rol}
          </p>
        </div>

        <div className="topbar-buttons">
          <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
            Inicio
          </button>

          <button className="btn-salir" onClick={cerrarSesion}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="container">
        <div className="section-header">
          <div>
            <h1>Inventario de plantas</h1>
            <p>Consulta el stock, precios, imágenes y registra ventas.</p>
          </div>

          <div className="header-buttons">
            <button
              className="btn-secondary"
              onClick={() => navigate('/ventas')}
            >
              Historial de ventas
            </button>

            {usuario?.rol === 'Dueño' && (
              <>
                <button
                  className="btn-secondary"
                  onClick={() => navigate('/reportes')}
                >
                  Ver reportes
                </button>

                <button
                  className="btn-primary"
                  onClick={() => {
                    if (mostrarFormulario) {
                      cancelarFormulario();
                    } else {
                      setMostrarFormulario(true);
                    }
                  }}
                >
                  {mostrarFormulario ? 'Cancelar' : 'Nueva planta'}
                </button>
              </>
            )}
          </div>
        </div>

        {mostrarFormulario && usuario?.rol === 'Dueño' && (
          <form className="form-card" onSubmit={guardarPlanta}>
            <h2>{plantaEditando ? 'Editar planta' : 'Registrar nueva planta'}</h2>

            <div className="form-grid">
              <input
                type="text"
                name="nombre_comun"
                placeholder="Nombre de la planta"
                value={nuevaPlanta.nombre_comun}
                onChange={manejarCambio}
              />

              <input
                type="number"
                name="stock"
                placeholder="Stock inicial"
                value={nuevaPlanta.stock}
                onChange={manejarCambio}
              />

              <input
                type="number"
                name="precio_venta"
                placeholder="Precio de venta"
                value={nuevaPlanta.precio_venta}
                onChange={manejarCambio}
              />

              <input
                type="text"
                name="descripcion"
                placeholder="Descripción"
                value={nuevaPlanta.descripcion}
                onChange={manejarCambio}
              />
            </div>

            <div className="image-upload-box">
              <label>Imagen de la planta</label>

              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={manejarImagen}
              />

              {previewImagen && (
                <img
                  className="preview-planta"
                  src={previewImagen}
                  alt="Vista previa"
                />
              )}
            </div>

            <button className="btn-primary" type="submit">
              {plantaEditando ? 'Actualizar planta' : 'Guardar planta'}
            </button>
          </form>
        )}

        <input
          className="search"
          type="text"
          placeholder="Buscar planta..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        {mensaje && <div className="error">{mensaje}</div>}

        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Imagen</th>
                <th>Planta</th>
                <th>Stock</th>
                <th>Precio</th>
                <th>Descripción</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {plantasFiltradas.map((planta) => (
                <tr key={planta.id_planta}>
                  <td>
                    {obtenerUrlImagen(planta.imagen) ? (
                      <img
                        className="planta-img"
                        src={obtenerUrlImagen(planta.imagen)}
                        alt={planta.nombre_comun}
                      />
                    ) : (
                      <div className="sin-imagen">Sin imagen</div>
                    )}
                  </td>

                  <td>{planta.nombre_comun}</td>
                  <td>
  <div className="stock-cell">
    <strong>{planta.stock}</strong>

    {planta.stock === 0 && (
      <span className="stock-badge agotado">Agotado</span>
    )}

    {planta.stock > 0 && planta.stock <= 5 && (
      <span className="stock-badge bajo">Stock bajo</span>
    )}

    {planta.stock > 5 && (
      <span className="stock-badge disponible">Disponible</span>
    )}
  </div>
</td>
                  <td>${Number(planta.precio_venta).toFixed(2)}</td>
                  <td>{planta.descripcion || 'Sin descripción'}</td>

                  <td>
                    <div className="acciones">
                      <button
                        className="btn-small"
                        onClick={() => navigate(`/venta/${planta.id_planta}`)}
                      >
                        Vender
                      </button>

                      {usuario?.rol === 'Dueño' && (
                        <>
                          <button
                            className="btn-edit"
                            onClick={() => editarPlanta(planta)}
                          >
                            Editar
                          </button>

                          <button
                            className="btn-stock"
                            onClick={() => agregarStock(planta.id_planta)}
                          >
                            + Stock
                          </button>

                          <button
                            className="btn-delete"
                            onClick={() => eliminarPlanta(planta.id_planta)}
                          >
                            Baja
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {plantasFiltradas.length === 0 && (
                <tr>
                  <td colSpan="6" className="empty">
                    No hay plantas registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

export default Inventario;