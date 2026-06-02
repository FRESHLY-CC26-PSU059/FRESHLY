const express = require('express');
const auth = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const knowledgeValidation = require('../validations/knowledge.validation');
const knowledgeController = require('../controllers/knowledge.controller');

const router = express.Router();

router.get('/', auth('admin', 'super_admin'), validate(knowledgeValidation.getKnowledges), knowledgeController.getKnowledges);
router.post('/', auth('admin', 'super_admin'), validate(knowledgeValidation.createKnowledge), knowledgeController.createKnowledge);
router.put('/:id', auth('admin', 'super_admin'), validate(knowledgeValidation.updateKnowledge), knowledgeController.updateKnowledge);
router.delete('/:id', auth('admin', 'super_admin'), validate(knowledgeValidation.deleteKnowledge), knowledgeController.deleteKnowledge);

module.exports = router;
