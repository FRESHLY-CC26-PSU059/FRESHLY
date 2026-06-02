const admin = require('firebase-admin');
const logger = require('./logger');

const normalizePrivateKey = (privateKey) => {
  if (!privateKey) return privateKey;

  let normalized = privateKey.trim();

  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    normalized = normalized.slice(1, -1);
  }

  return normalized
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\\u003d/g, '=');
};

const parseServiceAccount = (value) => {
  try {
    return JSON.parse(value);
  } catch (error) {
    const decoded = Buffer.from(value, 'base64').toString('utf8');
    return JSON.parse(decoded);
  }
};

const initializeFirebase = () => {
  if (!admin.apps.length) {
    try {
      const isPlaceholder = (val) => !val || val.includes('your-') || val.includes('Your-');
      
      if (
        process.env.FIREBASE_PROJECT_ID && !isPlaceholder(process.env.FIREBASE_PROJECT_ID) && 
        process.env.FIREBASE_PRIVATE_KEY && !isPlaceholder(process.env.FIREBASE_PRIVATE_KEY)
      ) {
        const serviceAccount = {
          type: process.env.FIREBASE_TYPE || 'service_account',
          project_id: process.env.FIREBASE_PROJECT_ID,
          private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
          private_key: normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          client_id: process.env.FIREBASE_CLIENT_ID,
          auth_uri: process.env.FIREBASE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
          token_uri: process.env.FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
          auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
          client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
        };

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        logger.info('Firebase Admin initialized successfully');
      } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT);
        
        if (serviceAccount.private_key) {
          serviceAccount.private_key = normalizePrivateKey(serviceAccount.private_key);
        }

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        logger.info('Firebase Admin initialized successfully (from JSON)');
      } else {
        logger.warn('Firebase configuration missing. Firebase features will be disabled.');
      }
    } catch (error) {
      logger.error('Firebase Admin initialization error:', error);
    }
  }
  return admin;
};

module.exports = {
  admin,
  initializeFirebase,
};
