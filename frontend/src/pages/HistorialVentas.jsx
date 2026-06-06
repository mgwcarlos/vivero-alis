import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function HistorialVentas() {
  const navigate = useNavigate();

  const [ventas, setVentas] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [exito, setExito] = useState('');

  const usuario = JSON.parse(localStorage.getItem('usuario'));

  useEffect(() => {
    if (!usuario) {
      navigate('/login');
      return;
    }

    cargarVentas();
  }, []);

  const cargarVentas = async () => {
    try {
      const respuesta = await api.get('/ventas');
      setVentas(respuesta.data);
    } catch (error) {
      setMensaje('Error al cargar historial de ventas');
    }
  };

  const cancelarVenta = async (idVenta) => {
    const confirmar = window.confirm(
      '¿Seguro que quieres cancelar esta venta? El stock será devuelto al inventario.'
    );

    if (!confirmar) return;

    setMensaje('');
    setExito('');

    try {
      await api.put(`/ventas/${idVenta}/cancelar`);

      setExito('Venta cancelada correctamente y stock devuelto');
      cargarVentas();
    } catch (error) {
      setMensaje(
        error.response?.data?.mensaje || 'Error al cancelar la venta'
      );
    }
  };

  if (!usuario) {
    return null;
  }

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <h2>Vivero ALIS</h2>
          <p>Historial de ventas</p>
        </div>

        <div className="topbar-buttons">
          <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
            Inicio
          </button>

          <button className="btn-salir" onClick={() => navigate('/inventario')}>
            Volver
          </button>
        </div>
      </header>

      <main className="container">
        <div className="section-header">
          <div>
            <h1>Historial de ventas</h1>
            <p>Consulta ventas registradas, tickets y cancelaciones.</p>
          </div>
        </div>

        {mensaje && <div className="error">{mensaje}</div>}
        {exito && <div className="success">{exito}</div>}

        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Folio</th>
                <th>Cliente</th>
                <th>Vendedor</th>
                <th>Fecha</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {ventas.map((venta) => (
                <tr
                  key={venta.id_venta}
                  className={venta.estado === 'Cancelada' ? 'venta-cancelada-row' : ''}
                >
                  <td>{venta.folio}</td>
                  <td>{venta.nombre_cliente}</td>
                  <td>{venta.vendedor}</td>
                  <td>{new Date(venta.fecha_venta).toLocaleString()}</td>
                  <td>${Number(venta.total).toFixed(2)}</td>

                  <td>
                    {venta.estado === 'Cancelada' ? (
                      <span className="estado-badge cancelada">Cancelada</span>
                    ) : (
                      <span className="estado-badge activa">Activa</span>
                    )}
                  </td>

                  <td>
                    <div className="acciones">
                      <button
                        className="btn-small"
                        onClick={() => navigate(`/ticket/${venta.id_venta}`)}
                      >
                        Ver ticket
                      </button>

                      {venta.estado !== 'Cancelada' && usuario?.rol === 'Dueño' && (
                        <button
                          className="btn-delete"
                          onClick={() => cancelarVenta(venta.id_venta)}
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {ventas.length === 0 && (
                <tr>
                  <td colSpan="7" className="empty">
                    No hay ventas registradas.
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

export default HistorialVentas;