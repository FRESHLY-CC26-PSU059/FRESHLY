const express = require('express');
const auth = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const rolesValidation = require('../validations/roles.validation');
const roleController = require('../controllers/role.controller');

const router = express.Router();

router.get('/', auth('admin', 'super_admin'), roleController.getRoles);
router.get('/:roleId', auth('admin', 'super_admin'), validate(rolesValidation.getRole), roleController.getRole);
router.post('/', auth('super_admin'), validate(rolesValidation.createRole), roleController.createRole);
router.patch('/:roleId', auth('super_admin'), validate(rolesValidation.updateRole), roleController.updateRole);
router.delete('/:roleId', auth('super_admin'), validate(rolesValidation.deleteRole), roleController.deleteRole);

module.exports = router;
