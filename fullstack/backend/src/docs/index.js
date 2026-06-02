const swaggerDef = require('./swaggerDef');
const authPaths = require('./auth.swagger');
const statsPaths = require('./stats.swagger');
const usersPaths = require('./users.swagger');
const rolesPaths = require('./roles.swagger');
const scansPaths = require('./scans.swagger');
const articlesPaths = require('./articles.swagger');
const knowledgePaths = require('./knowledge.swagger');
const chatPaths = require('./chat.swagger');
const chatbotPaths = require('./chatbot.swagger');
const feedbackPaths = require('./feedback.swagger');
const testimonialsPaths = require('./testimonials.swagger');
const newsletterPaths = require('./newsletter.swagger');
const notificationsPaths = require('./notifications.swagger');
const auditLogPaths = require('./audit-log.swagger');

const swaggerDocument = {
  ...swaggerDef,
  tags: [
    { name: 'Auth', description: 'Authentication & token management' },
    { name: 'Users', description: 'User profile & admin user management' },
    { name: 'Roles', description: 'Role management (super_admin only)' },
    { name: 'Scans', description: 'AI fruit/vegetable freshness analysis' },
    { name: 'Articles', description: 'Blog & article CMS' },
    { name: 'Knowledge', description: 'AI knowledge base (chatbot training data)' },
    { name: 'Chat', description: 'Persistent AI chat conversations' },
    { name: 'Chatbot', description: 'Stateless AI food assistant' },
    { name: 'Feedback', description: 'User feedback submissions' },
    { name: 'Testimonials', description: 'User testimonials for landing page' },
    { name: 'Newsletter', description: 'Newsletter subscription management' },
    { name: 'Notifications', description: 'Push & in-app notifications' },
    { name: 'Audit Logs', description: 'Admin action audit trail' },
    { name: 'Stats', description: 'Platform statistics & analytics' },
  ],
  paths: {
    ...authPaths,
    ...usersPaths,
    ...rolesPaths,
    ...scansPaths,
    ...articlesPaths,
    ...knowledgePaths,
    ...chatPaths,
    ...chatbotPaths,
    ...feedbackPaths,
    ...testimonialsPaths,
    ...newsletterPaths,
    ...notificationsPaths,
    ...auditLogPaths,
    ...statsPaths,
  },
};

module.exports = swaggerDocument;
