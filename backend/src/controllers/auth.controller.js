const pool = require('../db');
const bcrypt = require('bcryptjs');

const login = async (req, res) => {
  try {
    const { correo, password } = req.body;

    if (!correo || !password) {
      return res.status(400).json({
        mensaje: 'Correo y contraseña son obligatorios'
      });
    }

    const [usuarios] = await pool.query(
      `SELECT id_usuario, nombre_completo, correo, password, rol 
       FROM usuarios 
       WHERE correo = ?`,
      [correo]
    );

    if (usuarios.length === 0) {
      return res.status(401).json({
        mensaje: 'Correo o contraseña incorrectos'
      });
    }

    const usuario = usuarios[0];

    const passwordCorrecto = await bcrypt.compare(password, usuario.password);

    if (!passwordCorrecto) {
      return res.status(401).json({
        mensaje: 'Correo o contraseña incorrectos'
      });
    }

    res.json({
      mensaje: 'Inicio de sesión correcto',
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre_completo: usuario.nombre_completo,
        correo: usuario.correo,
        rol: usuario.rol
      }
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje: 'Error en el servidor',
      error: error.message
    });
  }
};

const registrarUsuario = async (req, res) => {
  try {
    const { nombre_completo, correo, password, rol } = req.body;

    if (!nombre_completo || !correo || !password || !rol) {
      return res.status(400).json({
        mensaje: 'Todos los campos son obligatorios'
      });
    }

    if (rol !== 'Dueño' && rol !== 'Vendedor') {
      return res.status(400).json({
        mensaje: 'Rol no válido'
      });
    }

    const [usuarioExiste] = await pool.query(
      'SELECT id_usuario FROM usuarios WHERE correo = ?',
      [correo]
    );

    if (usuarioExiste.length > 0) {
      return res.status(400).json({
        mensaje: 'Ese correo ya está registrado'
      });
    }

    const passwordEncriptado = await bcrypt.hash(password, 10);

    const [resultado] = await pool.query(
      `INSERT INTO usuarios 
      (nombre_completo, correo, password, rol) 
      VALUES (?, ?, ?, ?)`,
      [nombre_completo, correo, passwordEncriptado, rol]
    );

    res.status(201).json({
      mensaje: 'Usuario registrado correctamente',
      id_usuario: resultado.insertId
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje: 'Error al registrar usuario',
      error: error.message
    });
  }
};

module.exports = {
  login,
  registrarUsuario
};