import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function Dashboard() {
  const navigate = useNavigate();

  const [totalPlantas, setTotalPlantas] = useState(0);
  const [totalVentas, setTotalVentas] = useState(0);
  const [ingresos, setIngresos] = useState(0);
  const [rangoSemana, setRangoSemana] = useState('');

  const [ventasHoy, setVentasHoy] = useState(0);
  const [ingresosHoy, setIngresosHoy] = useState(0);
  const [ventasCanceladasHoy, setVentasCanceladasHoy] = useState(0);
  const [totalFinalDia, setTotalFinalDia] = useState(0);
  const [fechaDia, setFechaDia] = useState('');

  const usuario = JSON.parse(localStorage.getItem('usuario'));
  const esDueno = usuario?.rol === 'Dueño';

  useEffect(() => {
    if (!usuario) {
      navigate('/login');
      return;
    }

    if (esDueno) {
      cargarResumen();
    }
  }, []);

  const formatearFecha = (fecha) => {
    return fecha.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const esMismaFecha = (fechaVenta, fechaActual) => {
    return (
      fechaVenta.getFullYear() === fechaActual.getFullYear() &&
      fechaVenta.getMonth() === fechaActual.getMonth() &&
      fechaVenta.getDate() === fechaActual.getDate()
    );
  };

  const cargarResumen = async () => {
    try {
      const plantasRes = await api.get('/plantas');
      const ventasRes = await api.get('/ventas');

      const ventas = ventasRes.data;

      setTotalPlantas(plantasRes.data.length);
      setTotalVentas(ventas.length);

      const hoy = new Date();
      setFechaDia(formatearFecha(hoy));

      const inicioSemana = new Date(hoy);
      inicioSemana.setDate(hoy.getDate() - hoy.getDay() + 1);
      inicioSemana.setHours(0, 0, 0, 0);

      const finSemana = new Date(inicioSemana);
      finSemana.setDate(inicioSemana.getDate() + 6);
      finSemana.setHours(23, 59, 59, 999);

      setRangoSemana(
        `Del ${formatearFecha(inicioSemana)} al ${formatearFecha(finSemana)}`
      );

      const ventasSemanaActivas = ventas.filter((venta) => {
        const fechaVenta = new Date(venta.fecha_venta);

        return (
          fechaVenta >= inicioSemana &&
          fechaVenta <= finSemana &&
          venta.estado !== 'Cancelada'
        );
      });

      const totalIngresosSemana = ventasSemanaActivas.reduce((acumulado, venta) => {
        return acumulado + Number(venta.total);
      }, 0);

      setIngresos(totalIngresosSemana);

      const ventasDelDia = ventas.filter((venta) => {
        const fechaVenta = new Date(venta.fecha_venta);
        return esMismaFecha(fechaVenta, hoy);
      });

      const ventasActivasHoy = ventasDelDia.filter(
        (venta) => venta.estado !== 'Cancelada'
      );

      const ventasCanceladasDelDia = ventasDelDia.filter(
        (venta) => venta.estado === 'Cancelada'
      );

      const ingresosActivosHoy = ventasActivasHoy.reduce((acumulado, venta) => {
        return acumulado + Number(venta.total);
      }, 0);

      setVentasHoy(ventasActivasHoy.length);
      setIngresosHoy(ingresosActivosHoy);
      setVentasCanceladasHoy(ventasCanceladasDelDia.length);
      setTotalFinalDia(ingresosActivosHoy);
    } catch (error) {
      console.log('Error al cargar resumen', error);
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem('usuario');
    navigate('/login');
  };

  if (!usuario) {
    return null;
  }

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <div className="brand-box">
            <img src="/logo-alis.jpeg" alt="Vivero ALIS" />
            <h2>Vivero ALIS</h2>
          </div>

          <p>
            {usuario.nombre_completo} · {usuario.rol}
          </p>
        </div>

        <button className="btn-salir" onClick={cerrarSesion}>
          Cerrar sesión
        </button>
      </header>

      <main className="dashboard-container">
        <section className="dashboard-hero empresa-hero">
          <div>
            <span className="eyebrow">Panel administrativo</span>
            <h1>Gestión integral del vivero</h1>
            <p>
              Controla inventario, ventas, tickets e información operativa desde
              una plataforma centralizada.
            </p>
          </div>
        </section>

        {esDueno && (
          <>
            <section className="stats-grid">
              <div className="stat-card">
                <span>Plantas activas</span>
                <strong>{totalPlantas}</strong>
                <p>Productos disponibles en inventario</p>
              </div>

              <div className="stat-card">
                <span>Ventas registradas</span>
                <strong>{totalVentas}</strong>
                <p>Operaciones guardadas en el sistema</p>
              </div>

              <div className="stat-card">
                <span>Ingresos de esta semana</span>
                <strong>${ingresos.toFixed(2)}</strong>
                <p>{rangoSemana}</p>
              </div>
            </section>

            <section className="corte-dia-section">
              <div className="section-header corte-header">
                <div>
                  <h1>Corte del día</h1>
                  <p>Resumen de ventas activas y canceladas de hoy.</p>
                  <span className="fecha-corte-dia">Fecha: {fechaDia}</span>
                </div>
              </div>

              <div className="corte-dia-grid">
                <div className="corte-card">
                  <span>Ventas de hoy</span>
                  <strong>{ventasHoy}</strong>
                  <p>Ventas activas registradas hoy</p>
                </div>

                <div className="corte-card">
                  <span>Ingresos de hoy</span>
                  <strong>${ingresosHoy.toFixed(2)}</strong>
                  <p>Ingresos de ventas activas</p>
                </div>

                <div className="corte-card canceladas">
                  <span>Ventas canceladas</span>
                  <strong>{ventasCanceladasHoy}</strong>
                  <p>Cancelaciones registradas hoy</p>
                </div>

                <div className="corte-card final">
                  <span>Total final</span>
                  <strong>${totalFinalDia.toFixed(2)}</strong>
                  <p>Total válido del día</p>
                </div>
              </div>
            </section>
          </>
        )}

        <section className="dashboard-grid empresa-grid">
          <div
            className="dashboard-card empresa-card"
            onClick={() => navigate('/inventario')}
          >
            <div className="dashboard-icon">🌱</div>
            <h2>Inventario</h2>
            <p>Consulta existencias, precios y disponibilidad de plantas.</p>
            <span className="card-link">Abrir módulo →</span>
          </div>

          <div
            className="dashboard-card empresa-card"
            onClick={() => navigate('/venta-carrito')}
          >
            <div className="dashboard-icon">🛒</div>
            <h2>Nueva venta</h2>
            <p>Agrega una o varias plantas al carrito y registra la venta.</p>
            <span className="card-link">Registrar venta →</span>
          </div>

          <div
            className="dashboard-card empresa-card"
            onClick={() => navigate('/ventas')}
          >
            <div className="dashboard-icon">🧾</div>
            <h2>Historial de ventas</h2>
            <p>Consulta ventas realizadas y vuelve a imprimir tickets.</p>
            <span className="card-link">Ver historial →</span>
          </div>

          {esDueno && (
            <>
              <div
                className="dashboard-card empresa-card"
                onClick={() => navigate('/reportes')}
              >
                <div className="dashboard-icon">📊</div>
                <h2>Reportes</h2>
                <p>Analiza ingresos semanales y stock actual del vivero.</p>
                <span className="card-link">Ver reportes →</span>
              </div>

              <div
                className="dashboard-card empresa-card"
                onClick={() => navigate('/usuarios/nuevo')}
              >
                <div className="dashboard-icon">👤</div>
                <h2>Agregar usuario</h2>
                <p>Registra vendedores o administradores para el sistema.</p>
                <span className="card-link">Crear usuario →</span>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default Dashboard;