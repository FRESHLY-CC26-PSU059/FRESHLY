const express = require('express');
const auth = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const articleValidation = require('../validations/article.validation');
const articleController = require('../controllers/article.controller');
const upload = require('../middlewares/upload.middleware');
const { validateImageBuffer } = require('../middlewares/upload.middleware');

const router = express.Router();

router.get('/', validate(articleValidation.getArticles), articleController.getArticles);
router.get('/id/:id', auth('admin', 'super_admin'), validate(articleValidation.getArticleById), articleController.getArticleById);
router.get('/models', auth('admin', 'super_admin'), articleController.getAvailableModels);
router.get('/:slug', validate(articleValidation.getArticle), articleController.getArticle);
router.post('/', auth('admin', 'super_admin'), upload.single('image'), validateImageBuffer, validate(articleValidation.createArticle), articleController.createArticle);
router.post('/generate', auth('admin', 'super_admin'), validate(articleValidation.generateArticle), articleController.generateArticle);
router.put('/:id', auth('admin', 'super_admin'), upload.single('image'), validateImageBuffer, validate(articleValidation.updateArticle), articleController.updateArticle);
router.delete('/:id', auth('admin', 'super_admin'), validate(articleValidation.deleteArticle), articleController.deleteArticle);

module.exports = router;
