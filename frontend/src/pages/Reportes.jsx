import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../services/api';

function Reportes() {
  const navigate = useNavigate();

  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [reporte, setReporte] = useState(null);
  const [mensaje, setMensaje] = useState('');

  const usuario = JSON.parse(localStorage.getItem('usuario'));

  useEffect(() => {
    if (!usuario) {
      navigate('/login');
      return;
    }

    if (usuario.rol !== 'Dueño') {
      alert('No tienes permiso para ver reportes');
      navigate('/inventario');
      return;
    }

    const hoy = new Date();
    const hace7Dias = new Date();
    hace7Dias.setDate(hoy.getDate() - 7);

    setFechaInicio(hace7Dias.toISOString().split('T')[0]);
    setFechaFin(hoy.toISOString().split('T')[0]);
  }, []);

  const consultarReporte = async (e) => {
    e.preventDefault();
    setMensaje('');
    setReporte(null);

    if (!fechaInicio || !fechaFin) {
      setMensaje('Selecciona fecha de inicio y fecha final');
      return;
    }

    try {
      const respuesta = await api.get(
        `/reportes/semanal?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`
      );

      setReporte(respuesta.data);
    } catch (error) {
      setMensaje(
        error.response?.data?.mensaje || 'Error al consultar el reporte'
      );
    }
  };

  const exportarExcel = () => {
    if (!reporte) {
      setMensaje('Primero consulta un reporte');
      return;
    }

    const resumenData = [
      ['Reporte semanal - Vivero ALIS'],
      ['Fecha inicio', reporte.rango.fechaInicio],
      ['Fecha fin', reporte.rango.fechaFin],
      ['Total de ventas', reporte.resumen.total_ventas],
      ['Ingresos totales', Number(reporte.resumen.ingresos_totales)]
    ];

    const ventasData = reporte.ventas.map((venta) => ({
      Folio: venta.folio,
      Cliente: venta.nombre_cliente,
      Vendedor: venta.vendedor,
      Fecha: new Date(venta.fecha_venta).toLocaleString(),
      Estado: venta.estado || 'Activa',
      Total: Number(venta.total)
    }));

    const stockData = reporte.stockActual.map((planta) => ({
      Planta: planta.nombre_comun,
      Stock: planta.stock,
      Precio: Number(planta.precio_venta)
    }));

    const libro = XLSX.utils.book_new();

    const hojaResumen = XLSX.utils.aoa_to_sheet(resumenData);
    const hojaVentas = XLSX.utils.json_to_sheet(ventasData);
    const hojaStock = XLSX.utils.json_to_sheet(stockData);

    XLSX.utils.book_append_sheet(libro, hojaResumen, 'Resumen');
    XLSX.utils.book_append_sheet(libro, hojaVentas, 'Ventas');
    XLSX.utils.book_append_sheet(libro, hojaStock, 'Stock');

    XLSX.writeFile(
      libro,
      `reporte-vivero-alis-${reporte.rango.fechaInicio}-a-${reporte.rango.fechaFin}.xlsx`
    );
  };

  const exportarPDF = () => {
    if (!reporte) {
      setMensaje('Primero consulta un reporte');
      return;
    }

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Reporte semanal - Vivero ALIS', 14, 18);

    doc.setFontSize(11);
    doc.text(`Fecha inicio: ${reporte.rango.fechaInicio}`, 14, 30);
    doc.text(`Fecha fin: ${reporte.rango.fechaFin}`, 14, 37);
    doc.text(`Total de ventas: ${reporte.resumen.total_ventas}`, 14, 44);
    doc.text(
      `Ingresos totales: $${Number(reporte.resumen.ingresos_totales).toFixed(2)}`,
      14,
      51
    );

    autoTable(doc, {
      startY: 62,
      head: [['Folio', 'Cliente', 'Vendedor', 'Fecha', 'Estado', 'Total']],
      body: reporte.ventas.map((venta) => [
        venta.folio,
        venta.nombre_cliente,
        venta.vendedor,
        new Date(venta.fecha_venta).toLocaleString(),
        venta.estado || 'Activa',
        `$${Number(venta.total).toFixed(2)}`
      ])
    });

    const finalY = doc.lastAutoTable.finalY + 12;

    doc.setFontSize(14);
    doc.text('Stock actual', 14, finalY);

    autoTable(doc, {
      startY: finalY + 8,
      head: [['Planta', 'Stock', 'Precio']],
      body: reporte.stockActual.map((planta) => [
        planta.nombre_comun,
        planta.stock,
        `$${Number(planta.precio_venta).toFixed(2)}`
      ])
    });

    doc.save(
      `reporte-vivero-alis-${reporte.rango.fechaInicio}-a-${reporte.rango.fechaFin}.pdf`
    );
  };

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <div className="brand-box">
            <img src="/logo-alis.jpeg" alt="Vivero ALIS" />
            <h2>Vivero ALIS</h2>
          </div>
          <p>Reportes semanales</p>
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
            <h1>Reporte semanal</h1>
            <p>Consulta ingresos, ventas y stock actual.</p>
          </div>
        </div>

        <form className="form-card" onSubmit={consultarReporte}>
          <h2>Seleccionar rango de fechas</h2>

          <div className="form-grid reporte-grid">
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />

            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />

            <button className="btn-primary" type="submit">
              Consultar reporte
            </button>

            {reporte && (
              <button
                className="btn-secondary"
                type="button"
                onClick={exportarExcel}
              >
                Exportar Excel
              </button>
            )}

            {reporte && (
              <button
                className="btn-secondary"
                type="button"
                onClick={exportarPDF}
              >
                Exportar PDF
              </button>
            )}
          </div>
        </form>

        {mensaje && <div className="error">{mensaje}</div>}

        {reporte && (
          <>
            <div className="cards-resumen">
              <div className="resumen-card">
                <h3>Total de ventas</h3>
                <p>{reporte.resumen.total_ventas}</p>
              </div>

              <div className="resumen-card">
                <h3>Ingresos totales</h3>
                <p>${Number(reporte.resumen.ingresos_totales).toFixed(2)}</p>
              </div>

              <div className="resumen-card">
                <h3>Rango consultado</h3>
                <p>{reporte.rango.fechaInicio} a {reporte.rango.fechaFin}</p>
              </div>
            </div>

            <div className="table-card reporte-table">
              <h2>Ventas realizadas</h2>

              <table>
                <thead>
                  <tr>
                    <th>Folio</th>
                    <th>Cliente</th>
                    <th>Vendedor</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th>Total</th>
                  </tr>
                </thead>

                <tbody>
                  {reporte.ventas.map((venta) => (
                    <tr key={venta.id_venta}>
                      <td>{venta.folio}</td>
                      <td>{venta.nombre_cliente}</td>
                      <td>{venta.vendedor}</td>
                      <td>{new Date(venta.fecha_venta).toLocaleString()}</td>
                      <td>{venta.estado || 'Activa'}</td>
                      <td>${Number(venta.total).toFixed(2)}</td>
                    </tr>
                  ))}

                  {reporte.ventas.length === 0 && (
                    <tr>
                      <td colSpan="6" className="empty">
                        No hay ventas activas en este rango.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="table-card reporte-table">
              <h2>Stock actual</h2>

              <table>
                <thead>
                  <tr>
                    <th>Planta</th>
                    <th>Stock</th>
                    <th>Precio</th>
                  </tr>
                </thead>

                <tbody>
                  {reporte.stockActual.map((planta) => (
                    <tr key={planta.id_planta}>
                      <td>{planta.nombre_comun}</td>
                      <td>{planta.stock}</td>
                      <td>${Number(planta.precio_venta).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default Reportes;