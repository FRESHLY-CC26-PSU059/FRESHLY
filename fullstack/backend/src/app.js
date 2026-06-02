const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const hpp = require('hpp');
const swaggerUi = require('swagger-ui-express');
const { SwaggerTheme, SwaggerThemeNameEnum } = require('swagger-themes');
const config = require('./config/env');
const morganMiddleware = require('./config/morgan');
const logger = require('./config/logger');
const routes = require('./routes');
const healthRoutes = require('./routes/health.routes');
const swaggerDocument = require('./docs');
const ApiError = require('./utils/api-error');
const ERROR_CODES = require('./utils/errorCodes');
const requestId = require('./middlewares/requestId.middleware');
const { rateLimiter } = require('./middlewares/rateLimiter.middleware');
const verifyClientKey = require('./middlewares/client-key.middleware');
const sanitize = require('./middlewares/sanitize.middleware');
const auth = require('./middlewares/auth.middleware');

const app = express();

// Trust first proxy
if (config.env === 'production') {
  app.set('trust proxy', 1);
}

// 1. CORS allowlist (prod reads CORS_ORIGIN; dev reflects any origin).
const configuredOrigins = (config.env === 'production' && config.corsOrigin)
  ? config.corsOrigin
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
  : [];

const corsOptions = {
  origin: config.env === 'production'
    ? (origin, callback) => {
      if (!origin) return callback(null, true);
      if (configuredOrigins.includes('*') || configuredOrigins.length === 0 || configuredOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Origin not allowed by CORS'));
    }
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-Key', 'x-client-key', 'X-Request-Id'],
  maxAge: 86400,
};

app.use(cors(corsOptions));

// 2. Request ID
app.use(requestId);

// 3. HTTP request logging
app.use(morganMiddleware);

// 4. Security headers
const globalHelmet = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "https://www.google.com", "https://www.gstatic.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", 'data:', 'https:'],
      frameSrc: ["'self'", "https://www.google.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Changed from same-site
  dnsPrefetchControl: true,
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: { maxAge: 31536000, includeSubDomains: true },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
});

const docsHelmet = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://www.google.com", "https://www.gstatic.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", 'data:', 'https:', "https://cdn.jsdelivr.net"],
      connectSrc: ["'self'", "https://cdn.jsdelivr.net"],
      frameSrc: ["'self'", "https://www.google.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  dnsPrefetchControl: true,
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: { maxAge: 31536000, includeSubDomains: true },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api/v1/docs')) {
    return docsHelmet(req, res, next);
  }
  return globalHelmet(req, res, next);
});

// 5. Parse request bodies with size limit
// Increased to 2mb to support Tiptap rich-text article content
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// 6. Sanitize input
app.use(sanitize);

// 7. Prevent HTTP parameter pollution
app.use(hpp());

// Global rate limit: 1000 req / 15 min per IP
app.use(rateLimiter);

// Serve uploaded files — scans require auth, avatars/articles are public.
const uploadsDir = path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
app.use('/uploads/scans', auth(), express.static(path.join(uploadsDir, 'scans')));
app.use('/uploads', express.static(uploadsDir));

// Health check — no auth
app.use('/health', healthRoutes);

// Dev-only email template previews
if (config.env !== 'production') {
  app.use('/email-preview', require('./routes/email-preview.routes'));
}

// API Status Check — no auth required
app.get('/api/v1/status', (req, res) => {
  res.status(200).json({
    status: 'active',
    message: 'API is running',
    timestamp: new Date().toISOString(),
    environment: config.env,
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'active',
    message: 'Freshly Backend API',
    timestamp: new Date().toISOString(),
    environment: config.env
  });
});

app.use('/api/v1/docs', async (req, res, next) => {
  try {
    const { apiReference } = await import('@scalar/express-api-reference');
    apiReference({
      theme: 'default',
      spec: { content: swaggerDocument },
      metaData: { title: 'Freshly API Docs' },
      defaultHttpClient: { targetKey: 'javascript', clientKey: 'fetch' },
      authentication: {
        preferredSecurityScheme: 'clientKey',
        apiKey: { token: config.clientKey },
      },
    })(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Swagger UI fallback with one-dark theme
const swaggerTheme = new SwaggerTheme();
// Serve the CSP-safe swagger init script as a static file
app.use('/api/v1/docs/swagger-init.js', express.static(path.join(__dirname, 'docs/swagger-init.js')));
app.use('/api/v1/docs/swagger', swaggerUi.serve);
app.get(
  '/api/v1/docs/swagger',
  (req, res, next) => {
    // Inject client key as a window variable (safe — no inline script execution)
    res.locals.swaggerInitJs = `/api/v1/docs/swagger-init.js`;
    next();
  },
  swaggerUi.setup(swaggerDocument, {
    customSiteTitle: 'Freshly API Docs',
    customCss: swaggerTheme.getBuffer(SwaggerThemeNameEnum.ONE_DARK),
    swaggerOptions: { persistAuthorization: true },
    customJs: '/api/v1/docs/swagger-init.js',
    customHtml: `<script>window.__FRESHLY_CLIENT_KEY__ = '${config.clientKey}';</script>`,
  }),
);

// API v1 routes — client key required
app.use('/api/v1', verifyClientKey, routes);

// 404 handler
app.use((_req, _res, next) => {
  next(new ApiError(404, 'Not found', ERROR_CODES.NOT_FOUND));
});

// Error handler
app.use((err, req, res, _next) => {
  let { statusCode, message, errorCode, isOperational } = err;

  if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = err.errors.map((e) => e.message).join(', ');
    errorCode = ERROR_CODES.VALIDATION_ERROR;
    isOperational = true;
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    message = 'Resource already exists';
    errorCode = ERROR_CODES.ALREADY_EXISTS;
    isOperational = true;
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    errorCode = ERROR_CODES.TOKEN_INVALID;
    isOperational = true;
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    errorCode = ERROR_CODES.TOKEN_EXPIRED;
    isOperational = true;
  }

  if (!isOperational) {
    statusCode = 500;
    message = 'Internal Server Error';
    errorCode = ERROR_CODES.INTERNAL_ERROR;
  }

  const finalStatusCode = statusCode || 500;
  const finalErrorCode = errorCode || ERROR_CODES.INTERNAL_ERROR;

  logger.error({
    errorCode: finalErrorCode,
    message: err.message,
    statusCode: finalStatusCode,
    requestId: req.id,
    url: req.originalUrl,
    method: req.method,
    ...(config.env === 'development' && { stack: err.stack }),
  });

  res.status(finalStatusCode).json({
    code: finalStatusCode,
    errorCode: finalErrorCode,
    message,
    ...(config.env === 'development' && { stack: err.stack }),
  });
});

module.exports = app;
