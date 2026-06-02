const express = require('express');
const auth = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const auditLogValidation = require('../validations/audit-log.validation');
const auditLogController = require('../controllers/audit-log.controller');

const router = express.Router();

router.get('/', auth('admin', 'super_admin'), validate(auditLogValidation.getLogs), auditLogController.getLogs);

module.exports = router;
