const pool = require('../db');

const registrarVenta = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id_usuario, nombre_cliente, productos } = req.body;

    if (!id_usuario || !productos || productos.length === 0) {
      return res.status(400).json({
        mensaje: 'Faltan datos para registrar la venta'
      });
    }

    let total = 0;

    for (const producto of productos) {
      const [plantas] = await connection.query(
        'SELECT * FROM plantas WHERE id_planta = ? AND activo = 1',
        [producto.id_planta]
      );

      if (plantas.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          mensaje: `La planta con ID ${producto.id_planta} no existe`
        });
      }

      const planta = plantas[0];
      const cantidad = Number(producto.cantidad);
      const descuentoUnitario = Number(producto.descuento_unitario || 0);
      const precioUnitario = Number(planta.precio_venta);
      const precioFinal = precioUnitario - descuentoUnitario;

      if (cantidad <= 0) {
        await connection.rollback();
        return res.status(400).json({
          mensaje: 'La cantidad debe ser mayor a 0'
        });
      }

      if (descuentoUnitario < 0) {
        await connection.rollback();
        return res.status(400).json({
          mensaje: 'El descuento no puede ser negativo'
        });
      }

      if (precioFinal < 0) {
        await connection.rollback();
        return res.status(400).json({
          mensaje: `El descuento no puede ser mayor al precio de ${planta.nombre_comun}`
        });
      }

      if (planta.stock < cantidad) {
        await connection.rollback();
        return res.status(400).json({
          mensaje: `No hay suficiente stock de ${planta.nombre_comun}`
        });
      }

      total += precioFinal * cantidad;
    }

    const [ventaResult] = await connection.query(
      'INSERT INTO ventas (id_usuario, nombre_cliente, total) VALUES (?, ?, ?)',
      [id_usuario, nombre_cliente || 'Cliente general', total]
    );

    const id_venta = ventaResult.insertId;

    for (const producto of productos) {
      const [plantas] = await connection.query(
        'SELECT * FROM plantas WHERE id_planta = ? AND activo = 1',
        [producto.id_planta]
      );

      const planta = plantas[0];

      const cantidad = Number(producto.cantidad);
      const precioUnitario = Number(planta.precio_venta);
      const descuentoUnitario = Number(producto.descuento_unitario || 0);
      const precioFinal = precioUnitario - descuentoUnitario;
      const subtotal = precioFinal * cantidad;

      await connection.query(
        `INSERT INTO detalle_venta 
        (id_venta, id_planta, cantidad, precio_unitario, descuento_unitario, precio_final, subtotal) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id_venta,
          producto.id_planta,
          cantidad,
          precioUnitario,
          descuentoUnitario,
          precioFinal,
          subtotal
        ]
      );

      await connection.query(
        'UPDATE plantas SET stock = stock - ? WHERE id_planta = ?',
        [cantidad, producto.id_planta]
      );
    }

    const folio = `ALIS-${String(id_venta).padStart(5, '0')}`;

    await connection.query(
      'INSERT INTO tickets (id_venta, folio) VALUES (?, ?)',
      [id_venta, folio]
    );

    await connection.commit();

    res.status(201).json({
      mensaje: 'Venta registrada correctamente',
      id_venta,
      folio,
      total
    });
  } catch (error) {
    await connection.rollback();
    console.error(error);

    res.status(500).json({
      mensaje: 'Error al registrar la venta',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

const obtenerTicket = async (req, res) => {
  try {
    const { id } = req.params;

    const [venta] = await pool.query(
      `SELECT 
        v.id_venta,
        v.nombre_cliente,
        v.fecha_venta,
        v.total,
        v.estado,
        u.nombre_completo AS vendedor,
        t.folio,
        t.fecha_generacion
      FROM ventas v
      INNER JOIN usuarios u ON v.id_usuario = u.id_usuario
      INNER JOIN tickets t ON v.id_venta = t.id_venta
      WHERE v.id_venta = ?`,
      [id]
    );

    if (venta.length === 0) {
      return res.status(404).json({
        mensaje: 'Ticket no encontrado'
      });
    }

    const [productos] = await pool.query(
      `SELECT 
        p.nombre_comun,
        d.cantidad,
        d.precio_unitario,
        d.descuento_unitario,
        d.precio_final,
        d.subtotal
      FROM detalle_venta d
      INNER JOIN plantas p ON d.id_planta = p.id_planta
      WHERE d.id_venta = ?`,
      [id]
    );

    res.json({
      vivero: {
        nombre: 'Vivero ALIS',
        direccion: 'San Lorenzo Tlacotepec',
        telefono: 'Sin teléfono registrado'
      },
      venta: venta[0],
      productos
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje: 'Error al obtener el ticket',
      error: error.message
    });
  }
};

const obtenerVentas = async (req, res) => {
  try {
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
      ORDER BY v.id_venta DESC`
    );

    res.json(ventas);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje: 'Error al obtener las ventas',
      error: error.message
    });
  }
};
const cancelarVenta = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;

    const [ventas] = await connection.query(
      'SELECT * FROM ventas WHERE id_venta = ?',
      [id]
    );

    if (ventas.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        mensaje: 'Venta no encontrada'
      });
    }

    const venta = ventas[0];

    if (venta.estado === 'Cancelada') {
      await connection.rollback();
      return res.status(400).json({
        mensaje: 'Esta venta ya está cancelada'
      });
    }

    const [detalles] = await connection.query(
      'SELECT id_planta, cantidad FROM detalle_venta WHERE id_venta = ?',
      [id]
    );

    for (const detalle of detalles) {
      await connection.query(
        'UPDATE plantas SET stock = stock + ? WHERE id_planta = ?',
        [detalle.cantidad, detalle.id_planta]
      );
    }

    await connection.query(
      "UPDATE ventas SET estado = 'Cancelada' WHERE id_venta = ?",
      [id]
    );

    await connection.commit();

    res.json({
      mensaje: 'Venta cancelada correctamente y stock devuelto'
    });
  } catch (error) {
    await connection.rollback();
    console.error(error);

    res.status(500).json({
      mensaje: 'Error al cancelar la venta',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  registrarVenta,
  obtenerTicket,
  obtenerVentas,
  cancelarVenta
};
