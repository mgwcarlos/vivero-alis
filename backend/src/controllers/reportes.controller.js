const pool = require('../db');

const obtenerReporteSemanal = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        mensaje: 'Debes enviar fechaInicio y fechaFin'
      });
    }

    const [resumen] = await pool.query(
      `SELECT 
        COUNT(*) AS total_ventas,
        IFNULL(SUM(total), 0) AS ingresos_totales
      FROM ventas
      WHERE DATE(fecha_venta) BETWEEN ? AND ?
      AND estado = 'Activa'`,
      [fechaInicio, fechaFin]
    );

    const [ventas] = await pool.query(
      `SELECT 
        v.id_venta,
        v.nombre_cliente,
        v.fecha_venta,
        v.total,
        v.estado,
        u.nombre_completo AS vendedor,
        t.folio
      FROM ventas v
      INNER JOIN usuarios u ON v.id_usuario = u.id_usuario
      INNER JOIN tickets t ON v.id_venta = t.id_venta
      WHERE DATE(v.fecha_venta) BETWEEN ? AND ?
      AND v.estado = 'Activa'
      ORDER BY v.fecha_venta DESC`,
      [fechaInicio, fechaFin]
    );

    const [stockActual] = await pool.query(
      `SELECT 
        id_planta,
        nombre_comun,
        stock,
        precio_venta
      FROM plantas
      WHERE activo = 1
      ORDER BY nombre_comun ASC`
    );

    res.json({
      rango: {
        fechaInicio,
        fechaFin
      },
      resumen: resumen[0],
      ventas,
      stockActual
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje: 'Error al obtener el reporte semanal',
      error: error.message
    });
  }
};

module.exports = {
  obtenerReporteSemanal
};