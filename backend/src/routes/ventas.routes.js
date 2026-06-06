const express = require('express');
const router = express.Router();

const {
  registrarVenta,
  obtenerTicket,
  obtenerVentas,
  cancelarVenta
} = require('../controllers/ventas.controller');

router.get('/', obtenerVentas);
router.post('/', registrarVenta);
router.put('/:id/cancelar', cancelarVenta);
router.get('/:id/ticket', obtenerTicket);

module.exports = router;