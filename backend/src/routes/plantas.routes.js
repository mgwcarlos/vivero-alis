const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

const {
  obtenerPlantas,
  crearPlanta,
  actualizarPlanta,
  eliminarPlanta,
  agregarStock
} = require('../controllers/plantas.controller');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const nombreUnico = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, nombreUnico + extension);
  }
});

const fileFilter = (req, file, cb) => {
  const tiposPermitidos = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

  if (tiposPermitidos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes JPG, PNG o WEBP'), false);
  }
};

const upload = multer({
  storage,
  fileFilter
});

router.get('/', obtenerPlantas);
router.post('/', upload.single('imagen'), crearPlanta);
router.put('/:id', upload.single('imagen'), actualizarPlanta);
router.delete('/:id', eliminarPlanta);
router.post('/:id/stock', agregarStock);

module.exports = router;