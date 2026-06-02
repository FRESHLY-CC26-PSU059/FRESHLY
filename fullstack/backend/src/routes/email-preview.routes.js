const express = require('express');
const router = express.Router();
const logger = require('../config/logger');

// Dev-only email preview. Escapes query params; refuses to serve in prod.

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const productionGuard = (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    logger.warn('[email-preview] attempt to access preview routes in production', {
      url: req.originalUrl,
    });
    return res.status(404).send('Not found');
  }
  return next();
};

router.use(productionGuard);

router.get('/preview/otp', (req, res) => {
  const name = escapeHtml(req.query.name || 'John Doe');
  const otp = escapeHtml(req.query.otp || '123456');

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background-color:#f8faf9;font-family:sans-serif;">
      <div style="max-width:600px;margin:40px auto;padding:40px;background:#fff;border-radius:16px;">
        <h1 style="color:#16a34a;">Freshly — OTP Preview</h1>
        <p>Halo <strong>${name}</strong>,</p>
        <p>Kode OTP reset password Anda:</p>
        <div style="font-family:monospace;font-size:32px;letter-spacing:8px;color:#16a34a;padding:24px;background:#f0fdf4;border:2px solid #16a34a;border-radius:12px;text-align:center;">
          ${otp}
        </div>
        <p>Kode berlaku 5 menit.</p>
      </div>
    </body>
    </html>
  `);
});

router.get('/preview/verification', (req, res) => {
  const name = escapeHtml(req.query.name || 'John Doe');
  const verificationUrl = escapeHtml(req.query.url || 'http://localhost:3000/verify-email?token=sample');

  res.send(`
    <!DOCTYPE html>
    <html>
    <body style="font-family:sans-serif;padding:40px;">
      <h1>Freshly — Verification Preview</h1>
      <p>Halo <strong>${name}</strong>,</p>
      <p>Klik tautan berikut untuk memverifikasi email Anda:</p>
      <p><a href="${verificationUrl}">${verificationUrl}</a></p>
    </body>
    </html>
  `);
});

router.get('/preview/lockout', (req, res) => {
  const name = escapeHtml(req.query.name || 'John Doe');
  const lockoutMinutes = escapeHtml(req.query.minutes || '15');

  res.send(`
    <!DOCTYPE html>
    <html>
    <body style="font-family:sans-serif;padding:40px;">
      <h1 style="color:#dc2626;">Freshly — Lockout Preview</h1>
      <p>Halo <strong>${name}</strong>,</p>
      <p>Akun Anda dikunci sementara selama <strong>${lockoutMinutes} menit</strong>.</p>
    </body>
    </html>
  `);
});

router.get('/preview', (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <body style="font-family:sans-serif;max-width:800px;margin:40px auto;padding:20px;">
      <h1>Freshly — Email Template Previews (dev only)</h1>
      <ul>
        <li><a href="/email-preview/preview/otp?name=Budi%20Santoso&amp;otp=123456">OTP Preview</a></li>
        <li><a href="/email-preview/preview/verification?name=Siti%20Nurhaliza">Verification Preview</a></li>
        <li><a href="/email-preview/preview/lockout?name=Ahmad%20Wijaya&amp;minutes=15">Lockout Preview</a></li>
      </ul>
    </body>
    </html>
  `);
});

module.exports = router;
