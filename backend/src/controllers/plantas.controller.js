const pool = require('../db');

const obtenerPlantas = async (req, res) => {
  try {
    const [plantas] = await pool.query(
      'SELECT * FROM plantas WHERE activo = 1 ORDER BY id_planta DESC'
    );

    res.json(plantas);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje: 'Error al obtener las plantas',
      error: error.message
    });
  }
};

const crearPlanta = async (req, res) => {
  try {
    const { nombre_comun, stock, precio_venta, descripcion } = req.body;
    const imagen = req.file ? `/uploads/${req.file.filename}` : null;

    if (!nombre_comun || stock === undefined || precio_venta === undefined) {
      return res.status(400).json({
        mensaje: 'Nombre, stock y precio son obligatorios'
      });
    }

    const [resultado] = await pool.query(
      `INSERT INTO plantas 
      (nombre_comun, stock, precio_venta, descripcion, imagen, activo) 
      VALUES (?, ?, ?, ?, ?, 1)`,
      [nombre_comun, stock, precio_venta, descripcion || null, imagen]
    );

    res.status(201).json({
      mensaje: 'Planta registrada correctamente',
      id_planta: resultado.insertId
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje: 'Error al registrar la planta',
      error: error.message
    });
  }
};
const actualizarPlanta = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_comun, stock, precio_venta, descripcion } = req.body;
    const imagen = req.file ? `/uploads/${req.file.filename}` : null;

    if (!nombre_comun || stock === undefined || precio_venta === undefined) {
      return res.status(400).json({
        mensaje: 'Nombre, stock y precio son obligatorios'
      });
    }

    let query = `
      UPDATE plantas 
      SET nombre_comun = ?, stock = ?, precio_venta = ?, descripcion = ?
    `;

    const valores = [
      nombre_comun,
      stock,
      precio_venta,
      descripcion || null
    ];

    if (imagen) {
      query += ', imagen = ?';
      valores.push(imagen);
    }

    query += ' WHERE id_planta = ?';
    valores.push(id);

    const [resultado] = await pool.query(query, valores);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        mensaje: 'Planta no encontrada'
      });
    }

    res.json({
      mensaje: 'Planta actualizada correctamente'
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje: 'Error al actualizar la planta',
      error: error.message
    });
  }
};

const eliminarPlanta = async (req, res) => {
  try {
    const { id } = req.params;

    const [resultado] = await pool.query(
      'UPDATE plantas SET activo = 0 WHERE id_planta = ?',
      [id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        mensaje: 'Planta no encontrada'
      });
    }

    res.json({
      mensaje: 'Planta dada de baja correctamente'
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje: 'Error al dar de baja la planta',
      error: error.message
    });
  }
};

const agregarStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidad } = req.body;

    if (!cantidad || cantidad <= 0) {
      return res.status(400).json({
        mensaje: 'La cantidad debe ser mayor a 0'
      });
    }

    const [plantaExiste] = await pool.query(
      'SELECT * FROM plantas WHERE id_planta = ? AND activo = 1',
      [id]
    );

    if (plantaExiste.length === 0) {
      return res.status(404).json({
        mensaje: 'Planta no encontrada'
      });
    }

    await pool.query(
      'UPDATE plantas SET stock = stock + ? WHERE id_planta = ?',
      [cantidad, id]
    );

    await pool.query(
      'INSERT INTO entrada_mercancia (id_planta, cantidad) VALUES (?, ?)',
      [id, cantidad]
    );

    res.json({
      mensaje: 'Stock agregado correctamente'
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje: 'Error al agregar stock',
      error: error.message
    });
  }
};

module.exports = {
  obtenerPlantas,
  crearPlanta,
  actualizarPlanta,
  eliminarPlanta,
  agregarStock
};