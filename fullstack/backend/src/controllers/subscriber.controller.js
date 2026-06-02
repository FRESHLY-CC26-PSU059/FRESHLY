const catchAsync = require('../utils/catch-async');
const { Subscriber } = require('../models');
const ApiError = require('../utils/api-error');
const ERROR_CODES = require('../utils/errorCodes');
const { sendEmail } = require('../services/email.service');
const logger = require('../config/logger');
const { sanitizeRichText, sanitizePlainText } = require('../utils/html-sanitizer');
const notificationService = require('../services/notification.service');

const subscribe = catchAsync(async (req, res) => {
  const { email } = req.body;

  const existing = await Subscriber.findOne({ where: { email } });
  if (existing) {
    if (!existing.is_active) {
      await existing.update({ is_active: true });
      return res.json({ status: 'success', message: 'Berhasil berlangganan kembali' });
    }
    return res.json({ status: 'success', message: 'Email sudah terdaftar' });
  }

  await Subscriber.create({ email });
  res.status(201).json({ status: 'success', message: 'Berhasil berlangganan newsletter' });
});

const unsubscribe = catchAsync(async (req, res) => {
  const { email } = req.body;
  const subscriber = await Subscriber.findOne({ where: { email } });
  if (!subscriber) throw new ApiError(404, 'Email tidak ditemukan', ERROR_CODES.NOT_FOUND);
  await subscriber.update({ is_active: false });
  res.json({ status: 'success', message: 'Berhasil berhenti berlangganan' });
});

const getSubscribers = catchAsync(async (req, res) => {
  const subscribers = await Subscriber.findAll({
    where: { is_active: true },
    attributes: ['id', 'email', 'createdAt'],
    order: [['createdAt', 'DESC']],
  });
  res.json({ status: 'success', data: { subscribers } });
});

const checkStatus = catchAsync(async (req, res) => {
  const email = req.user.email;
  const subscriber = await Subscriber.findOne({ where: { email } });
  res.json({
    status: 'success',
    data: { subscribed: !!(subscriber && subscriber.is_active) },
  });
});

const sendNewsletter = catchAsync(async (req, res) => {
  const { subject, content } = req.body;
  if (!subject || !content) {
    throw new ApiError(400, 'Subject and content are required', ERROR_CODES.VALIDATION_ERROR);
  }

  const safeSubject = sanitizePlainText(subject);
  const safeContent = sanitizeRichText(content);

  const subscribers = await Subscriber.findAll({ where: { is_active: true }, attributes: ['email'] });
  if (subscribers.length === 0) {
    throw new ApiError(404, 'No active subscribers found', ERROR_CODES.NOT_FOUND);
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background-color:#f8faf9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8faf9;padding:40px 20px;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
            <tr><td style="background:linear-gradient(135deg,#1ea85f 0%,#16a34a 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;">Freshly Newsletter</h1>
            </td></tr>
            <tr><td style="padding:32px 40px;">
              <h2 style="margin:0 0 16px;color:#0f172a;font-size:22px;font-weight:700;">${safeSubject}</h2>
              <div style="color:#64748b;font-size:15px;line-height:1.7;">${safeContent}</div>
            </td></tr>
            <tr><td style="background-color:#f8faf9;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">&copy; 2026 Freshly Indonesia. Scan Buah & Sayur. Tahu Layaknya. Dalam Sekejap.</p>
              <p style="margin:8px 0 0;color:#94a3b8;font-size:11px;">Tidak ingin menerima email ini? Buka pengaturan akun untuk berhenti berlangganan.</p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;

  let sent = 0;
  let failed = 0;
  for (const sub of subscribers) {
    try {
      await sendEmail(sub.email, safeSubject, safeSubject, html);
      sent++;
    } catch (err) {
      logger.warn(`Newsletter send failed for ${sub.email}: ${err.message}`);
      failed++;
    }
  }

  // Send broadcast notification to all registered users about the newsletter
  try {
    const plainTextBody = safeContent
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    const previewMessage = plainTextBody.length > 200
      ? plainTextBody.substring(0, 200) + '...'
      : plainTextBody;

    await notificationService.sendBroadcastNotification({
      title: `Newsletter Baru: ${safeSubject}`,
      body: previewMessage,
      type: 'promo',
      data: {
        newsletterSubject: safeSubject,
      },
    });
  } catch (err) {
    logger.error(`Failed to send newsletter broadcast notification: ${err.message}`);
  }

  res.json({
    status: 'success',
    message: `Newsletter sent to ${sent} subscribers${failed > 0 ? `, ${failed} failed` : ''}`,
    data: { sent, failed, total: subscribers.length },
  });
});

module.exports = { subscribe, unsubscribe, getSubscribers, checkStatus, sendNewsletter };
