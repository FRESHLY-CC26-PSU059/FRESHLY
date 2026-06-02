// Global body sanitizer: strip null bytes only. HTML-rich fields must go
// through utils/html-sanitizer per-route.

// eslint-disable-next-line no-control-regex
const NULL_BYTE_RE = /\x00/g;

const stripNullBytes = (str) => str.replace(NULL_BYTE_RE, '');

const sanitizeValue = (value) => {
  if (typeof value === 'string') {
    return stripNullBytes(value);
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value !== null && typeof value === 'object') {
    return sanitizeObject(value);
  }
  return value;
};

const sanitizeObject = (obj) => {
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeValue(value);
  }
  return sanitized;
};

const sanitize = (req, _res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object' && Object.getOwnPropertyDescriptor(req, 'query')?.writable !== false) {
    try {
      req.query = sanitizeObject(req.query);
    } catch (_) { /* Express 5 read-only query */ }
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }
  next();
};

const stripTags = (str) => {
  let prev;
  let result = str;
  // Loop until stable to handle nested/broken tags like <scr<script>ipt>.
  do {
    prev = result;
    result = result
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  } while (result !== prev);
  return result.trim();
};

const stripHtmlFields = (...fields) => (req, _res, next) => {
  if (!req.body || typeof req.body !== 'object') return next();
  for (const field of fields) {
    if (typeof req.body[field] === 'string') {
      req.body[field] = stripTags(req.body[field]);
    }
  }
  next();
};

module.exports = sanitize;
module.exports.stripHtmlFields = stripHtmlFields;
module.exports.stripTags = stripTags;
