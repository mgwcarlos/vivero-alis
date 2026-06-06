const express = require('express');
const router = express.Router();

const {
  obtenerReporteSemanal
} = require('../controllers/reportes.controller');

router.get('/semanal', obtenerReporteSemanal);

module.exports = router;