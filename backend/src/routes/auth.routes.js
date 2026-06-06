const express = require('express');
const router = express.Router();

const {
  login,
  registrarUsuario
} = require('../controllers/auth.controller');

router.post('/login', login);
router.post('/registrar', registrarUsuario);

module.exports = router;