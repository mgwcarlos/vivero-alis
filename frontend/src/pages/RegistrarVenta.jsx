import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

function RegistrarVenta() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [planta, setPlanta] = useState(null);
  const [cantidad, setCantidad] = useState('');
  const [descuentoUnitario, setDescuentoUnitario] = useState('');
  const [aplicarDescuento, setAplicarDescuento] = useState(false);
  const [nombreCliente, setNombreCliente] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  const usuario = JSON.parse(localStorage.getItem('usuario'));

  useEffect(() => {
    if (!usuario) {
      navigate('/login');
      return;
    }

    cargarPlanta();
  }, []);

  const cargarPlanta = async () => {
    try {
      const respuesta = await api.get('/plantas');

      const plantaEncontrada = respuesta.data.find(
        (item) => item.id_planta === Number(id)
      );

      if (!plantaEncontrada) {
        setMensaje('Planta no encontrada');
        return;
      }

      setPlanta(plantaEncontrada);
    } catch (error) {
      setMensaje('Error al cargar la planta');
    }
  };

  const obtenerUrlImagen = (imagen) => {
    if (!imagen) return null;

    if (imagen.startsWith('http')) {
      return imagen;
    }

return `${import.meta.env.VITE_BACKEND_URL}${imagen}`;  };

  const cambiarAplicarDescuento = () => {
    const nuevoEstado = !aplicarDescuento;
    setAplicarDescuento(nuevoEstado);

    if (!nuevoEstado) {
      setDescuentoUnitario('');
    }
  };

  const registrarVenta = async (e) => {
    e.preventDefault();
    setMensaje('');

    const cantidadNumero = Number(cantidad);
    const descuentoNumero = aplicarDescuento ? Number(descuentoUnitario || 0) : 0;
    const precioUnitario = Number(planta.precio_venta);
    const precioFinal = precioUnitario - descuentoNumero;

    if (!cantidadNumero || cantidadNumero <= 0) {
      setMensaje('Ingresa una cantidad válida');
      return;
    }

    if (descuentoNumero < 0) {
      setMensaje('El descuento no puede ser negativo');
      return;
    }

    if (precioFinal < 0) {
      setMensaje('El descuento no puede ser mayor al precio de la planta');
      return;
    }

    if (cantidadNumero > planta.stock) {
      setMensaje('No hay suficiente stock disponible');
      return;
    }

    try {
      setCargando(true);

      const respuesta = await api.post('/ventas', {
        id_usuario: usuario.id_usuario,
        nombre_cliente: nombreCliente || 'Cliente general',
        productos: [
          {
            id_planta: planta.id_planta,
            cantidad: cantidadNumero,
            descuento_unitario: descuentoNumero
          }
        ]
      });

      navigate(`/ticket/${respuesta.data.id_venta}`);
    } catch (error) {
      setMensaje(
        error.response?.data?.mensaje || 'Error al registrar la venta'
      );
    } finally {
      setCargando(false);
    }
  };

  if (!planta) {
    return (
      <div className="page">
        <div className="container">
          <p>{mensaje || 'Cargando planta...'}</p>

          <button className="btn-primary" onClick={() => navigate('/inventario')}>
            Volver
          </button>
        </div>
      </div>
    );
  }

  const precioUnitario = Number(planta.precio_venta);
  const descuentoNumero = aplicarDescuento ? Number(descuentoUnitario || 0) : 0;
  const precioFinal = Math.max(precioUnitario - descuentoNumero, 0);
  const subtotalSinDescuento = precioUnitario * Number(cantidad || 0);
  const subtotal = precioFinal * Number(cantidad || 0);
  const ahorro = subtotalSinDescuento - subtotal;
  const imagenPlanta = obtenerUrlImagen(planta.imagen);

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand-box">

  <img src="/logo-alis.jpeg" alt="Vivero ALIS" />
          <p>Registrar venta</p>
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
        <div className="venta-card venta-card-pro">
          <h1>Registrar venta</h1>

          <div className="venta-producto">
            {imagenPlanta ? (
              <img
                className="venta-planta-img"
                src={imagenPlanta}
                alt={planta.nombre_comun}
              />
            ) : (
              <div className="venta-sin-imagen">
                Sin imagen
              </div>
            )}

            <div className="venta-info venta-info-pro">
              <p><strong>Planta:</strong> {planta.nombre_comun}</p>
              <p><strong>Stock disponible:</strong> {planta.stock}</p>
              <p><strong>Precio normal:</strong> ${precioUnitario.toFixed(2)}</p>
              <p><strong>Descripción:</strong> {planta.descripcion || 'Sin descripción'}</p>
            </div>
          </div>

          <form onSubmit={registrarVenta}>
            <label>Nombre del cliente</label>
            <input
              type="text"
              placeholder="Cliente general"
              value={nombreCliente}
              onChange={(e) => setNombreCliente(e.target.value)}
            />

            <label>Cantidad</label>
            <input
              type="number"
              placeholder="Cantidad a vender"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
            />

            <div className="descuento-toggle-box">
              <div>
                <strong>¿Agregar descuento?</strong>
                <p>Actívalo si la venta es por mayoreo o precio especial.</p>
              </div>

              <button
                type="button"
                className={aplicarDescuento ? 'toggle-descuento activo' : 'toggle-descuento'}
                onClick={cambiarAplicarDescuento}
              >
                {aplicarDescuento ? 'Sí' : 'No'}
              </button>
            </div>

            {aplicarDescuento && (
              <>
                <label>Descuento por unidad</label>
                <input
                  type="number"
                  placeholder="Ej. 5"
                  value={descuentoUnitario}
                  onChange={(e) => setDescuentoUnitario(e.target.value)}
                />
              </>
            )}

            <div className="descuento-resumen">
              <div>
                <span>Precio normal</span>
                <strong>${precioUnitario.toFixed(2)}</strong>
              </div>

              {aplicarDescuento && (
                <div>
                  <span>Descuento por unidad</span>
                  <strong>${descuentoNumero.toFixed(2)}</strong>
                </div>
              )}

              <div>
                <span>Precio final por planta</span>
                <strong>${precioFinal.toFixed(2)}</strong>
              </div>

              <div>
                <span>Ahorro total</span>
                <strong>${ahorro.toFixed(2)}</strong>
              </div>
            </div>

            <div className="total-box">
              Total: ${subtotal.toFixed(2)}
            </div>

            {mensaje && <div className="error">{mensaje}</div>}

            <button className="btn-primary" type="submit" disabled={cargando}>
              {cargando ? 'Registrando...' : 'Confirmar venta'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default RegistrarVenta;