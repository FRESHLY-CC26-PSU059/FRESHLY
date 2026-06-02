const express = require('express');
const authRoutes = require('./auth.routes');
const usersRoutes = require('./users.routes');
const roleRoutes = require('./role.routes');
const scanRoutes = require('./scan.routes');
const articleRoutes = require('./article.routes');
const knowledgeRoutes = require('./knowledge.routes');
const chatRoutes = require('./chat.routes');
const chatbotRoutes = require('./chatbot.routes');
const statsRoutes = require('./stats.routes');
const feedbackRoutes = require('./feedback.routes');
const testimonialRoutes = require('./testimonial.routes');
const subscriberRoutes = require('./subscriber.routes');
const auditLogRoutes = require('./audit-log.routes');
const notificationRoutes = require('./notification.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/roles', roleRoutes);
router.use('/scans', scanRoutes);
router.use('/articles', articleRoutes);
router.use('/knowledges', knowledgeRoutes);
router.use('/chat', chatRoutes);
router.use('/chatbot', chatbotRoutes);
router.use('/stats', statsRoutes);
router.use('/feedbacks', feedbackRoutes);
router.use('/testimonials', testimonialRoutes);
router.use('/newsletter', subscriberRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;
