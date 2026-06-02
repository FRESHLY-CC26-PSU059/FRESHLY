const express = require('express');
const auth = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const scanValidation = require('../validations/scan.validation');
const scanController = require('../controllers/scan.controller');
const upload = require('../middlewares/upload.middleware');
const { validateImageBuffer } = require('../middlewares/upload.middleware');

const router = express.Router();

router.post(
  '/analyze',
  auth(),
  upload.single('image'),
  validateImageBuffer,
  validate(scanValidation.analyzeScan),
  scanController.analyze,
);
router.delete('/clear-all', auth(), scanController.clearAllScans);
router.get('/', auth(), validate(scanValidation.getScans), scanController.getScans);
router.get('/:id', auth(), validate(scanValidation.getScan), scanController.getScan);
router.delete('/:id', auth(), validate(scanValidation.deleteScan), scanController.deleteScan);

module.exports = router;
