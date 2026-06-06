const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const router = express.Router();

const {
  obtenerPlantas,
  crearPlanta,
  actualizarPlanta,
  eliminarPlanta,
  agregarStock
} = require('../controllers/plantas.controller');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'vivero-alis/plantas',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      {
        width: 800,
        height: 800,
        crop: 'limit',
        quality: 'auto'
      }
    ]
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
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

router.get('/', obtenerPlantas);
router.post('/', upload.single('imagen'), crearPlanta);
router.put('/:id', upload.single('imagen'), actualizarPlanta);
router.delete('/:id', eliminarPlanta);
router.post('/:id/stock', agregarStock);

module.exports = router;