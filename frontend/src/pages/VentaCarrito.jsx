import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function VentaCarrito() {
  const navigate = useNavigate();

  const [plantas, setPlantas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [plantaSeleccionada, setPlantaSeleccionada] = useState(null);

  const [cantidad, setCantidad] = useState('');
  const [descuentoUnitario, setDescuentoUnitario] = useState('');
  const [aplicarDescuento, setAplicarDescuento] = useState(false);
  const [nombreCliente, setNombreCliente] = useState('');

  const [carrito, setCarrito] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  const usuario = JSON.parse(localStorage.getItem('usuario'));

  useEffect(() => {
    if (!usuario) {
      navigate('/login');
      return;
    }

    cargarPlantas();
  }, []);

  const cargarPlantas = async () => {
    try {
      const respuesta = await api.get('/plantas');
      setPlantas(respuesta.data);
    } catch (error) {
      setMensaje('Error al cargar plantas');
    }
  };

  const obtenerUrlImagen = (imagen) => {
    if (!imagen) return null;
    if (imagen.startsWith('http')) return imagen;
return `${import.meta.env.VITE_BACKEND_URL}${imagen}`;  };

  const plantasFiltradas = plantas.filter((planta) =>
    planta.nombre_comun.toLowerCase().includes(busqueda.toLowerCase())
  );

  const seleccionarPlanta = (planta) => {
    setPlantaSeleccionada(planta);
    setCantidad('1');
    setDescuentoUnitario('');
    setAplicarDescuento(false);
    setMensaje('');
  };

  const cambiarAplicarDescuento = () => {
    const nuevoEstado = !aplicarDescuento;
    setAplicarDescuento(nuevoEstado);

    if (!nuevoEstado) {
      setDescuentoUnitario('');
    }
  };

  const agregarAlCarrito = () => {
    setMensaje('');

    if (!plantaSeleccionada) {
      setMensaje('Selecciona una planta');
      return;
    }

    const cantidadNumero = Number(cantidad);
    const descuentoNumero = aplicarDescuento ? Number(descuentoUnitario || 0) : 0;
    const precioUnitario = Number(plantaSeleccionada.precio_venta);
    const precioFinal = precioUnitario - descuentoNumero;

    if (!cantidadNumero || cantidadNumero <= 0) {
      setMensaje('Ingresa una cantidad válida');
      return;
    }

    if (cantidadNumero > plantaSeleccionada.stock) {
      setMensaje('No hay suficiente stock disponible');
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

    const existe = carrito.find(
      (item) => item.id_planta === plantaSeleccionada.id_planta
    );

    if (existe) {
      setMensaje('Esa planta ya está en el carrito. Quita el producto para cambiarlo.');
      return;
    }

    const nuevoProducto = {
      id_planta: plantaSeleccionada.id_planta,
      nombre_comun: plantaSeleccionada.nombre_comun,
      imagen: plantaSeleccionada.imagen,
      cantidad: cantidadNumero,
      stock: plantaSeleccionada.stock,
      precio_unitario: precioUnitario,
      descuento_unitario: descuentoNumero,
      precio_final: precioFinal,
      subtotal: precioFinal * cantidadNumero
    };

    setCarrito([...carrito, nuevoProducto]);
    setPlantaSeleccionada(null);
    setCantidad('');
    setDescuentoUnitario('');
    setAplicarDescuento(false);
    setBusqueda('');
  };

  const eliminarDelCarrito = (id) => {
    setCarrito(carrito.filter((item) => item.id_planta !== id));
  };

  const totalSinDescuento = carrito.reduce((total, item) => {
    return total + item.precio_unitario * item.cantidad;
  }, 0);

  const totalCarrito = carrito.reduce((total, item) => {
    return total + item.subtotal;
  }, 0);

  const descuentoTotal = totalSinDescuento - totalCarrito;

  const confirmarVenta = async () => {
    setMensaje('');

    if (carrito.length === 0) {
      setMensaje('Agrega al menos una planta al carrito');
      return;
    }

    try {
      setCargando(true);

      const productos = carrito.map((item) => ({
        id_planta: item.id_planta,
        cantidad: item.cantidad,
        descuento_unitario: item.descuento_unitario
      }));

      const respuesta = await api.post('/ventas', {
        id_usuario: usuario.id_usuario,
        nombre_cliente: nombreCliente || 'Cliente general',
        productos
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

  if (!usuario) return null;

  const precioUnitario = plantaSeleccionada
    ? Number(plantaSeleccionada.precio_venta)
    : 0;

  const descuentoNumero = aplicarDescuento ? Number(descuentoUnitario || 0) : 0;
  const precioFinal = Math.max(precioUnitario - descuentoNumero, 0);
  const subtotalPreview = precioFinal * Number(cantidad || 0);

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand-box">

  <img src="/logo-alis.jpeg" alt="Vivero ALIS" />
          <p>Nueva venta · Carrito</p>
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
        <div className="venta-carrito-header">
          <div>
            <h1>Nueva venta</h1>
            <p>Selecciona plantas, aplica descuentos y confirma la compra.</p>
          </div>

          <div className="venta-cliente-box">
            <label>Cliente</label>
            <input
              type="text"
              placeholder="Cliente general"
              value={nombreCliente}
              onChange={(e) => setNombreCliente(e.target.value)}
            />
          </div>
        </div>

        {mensaje && <div className="error">{mensaje}</div>}

        <div className="venta-pos-layout">
          <section className="plantas-panel">
            <h2>Plantas disponibles</h2>

            <input
              className="search"
              type="text"
              placeholder="Buscar planta..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />

            <div className="plantas-lista">
              {plantasFiltradas.map((planta) => {
                const imagen = obtenerUrlImagen(planta.imagen);
                const seleccionada =
                  plantaSeleccionada?.id_planta === planta.id_planta;

                return (
                  <button
                    type="button"
                    key={planta.id_planta}
                    className={`planta-opcion ${seleccionada ? 'planta-opcion-activa' : ''}`}
                    onClick={() => seleccionarPlanta(planta)}
                  >
                    {imagen ? (
                      <img src={imagen} alt={planta.nombre_comun} />
                    ) : (
                      <div className="planta-opcion-sin-img">Sin imagen</div>
                    )}

                    <div>
                      <strong>{planta.nombre_comun}</strong>
                      <span>Stock: {planta.stock}</span>
                      <span>${Number(planta.precio_venta).toFixed(2)}</span>
                    </div>
                  </button>
                );
              })}

              {plantasFiltradas.length === 0 && (
                <div className="carrito-vacio">
                  No se encontraron plantas.
                </div>
              )}
            </div>
          </section>

          <section className="agregar-panel">
            <h2>Agregar producto</h2>

            {!plantaSeleccionada ? (
              <div className="seleccion-vacia">
                Selecciona una planta de la lista para agregarla al carrito.
              </div>
            ) : (
              <>
                <div className="producto-preview">
                  {obtenerUrlImagen(plantaSeleccionada.imagen) ? (
                    <img
                      src={obtenerUrlImagen(plantaSeleccionada.imagen)}
                      alt={plantaSeleccionada.nombre_comun}
                    />
                  ) : (
                    <div className="producto-preview-sin-img">Sin imagen</div>
                  )}

                  <div>
                    <h3>{plantaSeleccionada.nombre_comun}</h3>
                    <p>Precio normal: ${precioUnitario.toFixed(2)}</p>
                    <p>Stock disponible: {plantaSeleccionada.stock}</p>
                  </div>
                </div>

                <label>Cantidad</label>
                <input
                  type="number"
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

                <div className="precio-preview">
                  <p>
                    <span>Precio normal</span>
                    <strong>${precioUnitario.toFixed(2)}</strong>
                  </p>

                  {aplicarDescuento && (
                    <p>
                      <span>Descuento por unidad</span>
                      <strong>-${descuentoNumero.toFixed(2)}</strong>
                    </p>
                  )}

                  <p>
                    <span>Precio final por planta</span>
                    <strong>${precioFinal.toFixed(2)}</strong>
                  </p>

                  <p>
                    <span>Subtotal</span>
                    <strong>${subtotalPreview.toFixed(2)}</strong>
                  </p>
                </div>

                <button className="btn-primary" type="button" onClick={agregarAlCarrito}>
                  Agregar al carrito
                </button>
              </>
            )}
          </section>

          <section className="resumen-carrito-panel">
            <div className="resumen-carrito-header">
              <h2>Carrito</h2>
              <span>{carrito.length} producto(s)</span>
            </div>

            {carrito.length === 0 ? (
              <div className="carrito-vacio">
                El carrito está vacío.
              </div>
            ) : (
              <>
                <div className="carrito-mini-lista">
                  {carrito.map((item) => (
                    <div className="carrito-mini-item" key={item.id_planta}>
                      <div>
                        <h3>{item.nombre_comun}</h3>
                        <p>
                          {item.cantidad} × ${item.precio_final.toFixed(2)}
                        </p>
                        {item.descuento_unitario > 0 && (
                          <p className="descuento-texto">
                            Desc. ${item.descuento_unitario.toFixed(2)} por unidad
                          </p>
                        )}
                      </div>

                      <div className="mini-total">
                        <strong>${item.subtotal.toFixed(2)}</strong>
                        <button
                          type="button"
                          onClick={() => eliminarDelCarrito(item.id_planta)}
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="carrito-resumen">
                  <p>
                    <span>Subtotal normal:</span>
                    <strong>${totalSinDescuento.toFixed(2)}</strong>
                  </p>

                  <p>
                    <span>Descuento:</span>
                    <strong>-${descuentoTotal.toFixed(2)}</strong>
                  </p>

                  <p className="carrito-total-final">
                    <span>Total:</span>
                    <strong>${totalCarrito.toFixed(2)}</strong>
                  </p>
                </div>

                <button
                  className="btn-primary carrito-confirmar"
                  type="button"
                  onClick={confirmarVenta}
                  disabled={cargando}
                >
                  {cargando ? 'Registrando...' : 'Confirmar venta'}
                </button>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default VentaCarrito;