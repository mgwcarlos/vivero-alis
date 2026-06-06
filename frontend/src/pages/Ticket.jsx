import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

function Ticket() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [mensaje, setMensaje] = useState('');

  const usuario = JSON.parse(localStorage.getItem('usuario'));

  useEffect(() => {
    if (!usuario) {
      navigate('/login');
      return;
    }

    cargarTicket();
  }, []);

  const cargarTicket = async () => {
    try {
      const respuesta = await api.get(`/ventas/${id}/ticket`);
      setTicket(respuesta.data);
    } catch (error) {
      setMensaje(
        error.response?.data?.mensaje || 'Error al cargar el ticket'
      );
    }
  };

  const imprimirTicket = () => {
    window.print();
  };

  if (!ticket) {
    return (
      <div className="page">
        <div className="container">
          <p>{mensaje || 'Cargando ticket...'}</p>

          <button className="btn-primary" onClick={() => navigate('/inventario')}>
            Volver al inventario
          </button>
        </div>
      </div>
    );
  }

  const { vivero, venta, productos } = ticket;

  const totalDescuento = productos.reduce((acumulado, producto) => {
    return acumulado + Number(producto.descuento_unitario || 0) * Number(producto.cantidad);
  }, 0);

  const totalSinDescuento = productos.reduce((acumulado, producto) => {
    return acumulado + Number(producto.precio_unitario || 0) * Number(producto.cantidad);
  }, 0);

  return (
    <div className="page">
      <header className="topbar no-print">
        <div>
          <h2>Vivero ALIS</h2>
          <p>Ticket generado correctamente</p>
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
        <div className="ticket-actions no-print">
          <button className="btn-primary" onClick={imprimirTicket}>
            Imprimir ticket
          </button>

          <button className="btn-secondary" onClick={() => navigate('/inventario')}>
            Nueva venta
          </button>
        </div>

        <div className="ticket-card">
          {venta.estado === 'Cancelada' && (
            <div className="ticket-cancelado">
              VENTA CANCELADA
            </div>
          )}

          <div className="ticket-header">
            <h1>{vivero.nombre}</h1>
            <p>{vivero.direccion}</p>
            <p>Tel: {vivero.telefono}</p>
          </div>

          <div className="ticket-data">
            <p><strong>Folio:</strong> {venta.folio}</p>
            <p><strong>Fecha:</strong> {new Date(venta.fecha_venta).toLocaleString()}</p>
            <p><strong>Cliente:</strong> {venta.nombre_cliente}</p>
            <p><strong>Vendedor:</strong> {venta.vendedor}</p>
            <p>
              <strong>Estado:</strong>{' '}
              {venta.estado === 'Cancelada' ? (
                <span className="estado-texto-cancelado">Cancelada</span>
              ) : (
                <span className="estado-texto-activo">Activa</span>
              )}
            </p>
          </div>

          <table className="ticket-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cant.</th>
                <th>Precio</th>
                <th>Desc.</th>
                <th>Final</th>
                <th>Subtotal</th>
              </tr>
            </thead>

            <tbody>
              {productos.map((producto, index) => (
                <tr key={index}>
                  <td>{producto.nombre_comun}</td>
                  <td>{producto.cantidad}</td>
                  <td>${Number(producto.precio_unitario).toFixed(2)}</td>
                  <td>${Number(producto.descuento_unitario || 0).toFixed(2)}</td>
                  <td>${Number(producto.precio_final || producto.precio_unitario).toFixed(2)}</td>
                  <td>${Number(producto.subtotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="ticket-resumen-descuento">
            <p>
              <span>Total sin descuento:</span>
              <strong>${totalSinDescuento.toFixed(2)}</strong>
            </p>

            <p>
              <span>Descuento aplicado:</span>
              <strong>-${totalDescuento.toFixed(2)}</strong>
            </p>
          </div>

          <div className="ticket-total">
            Total a pagar: ${Number(venta.total).toFixed(2)}
          </div>

          {venta.estado === 'Cancelada' && (
            <div className="ticket-nota-cancelado">
              Este ticket pertenece a una venta cancelada. El stock fue devuelto al inventario.
            </div>
          )}

          <div className="ticket-footer">
            <p>Gracias por su compra</p>
            <p>Conserve este ticket como comprobante</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Ticket;