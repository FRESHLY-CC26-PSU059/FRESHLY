const nodemailer = require('nodemailer');
const config = require('../config/env');
const logger = require('../config/logger');

let transport;

// Initialize transport based on environment and SMTP configuration
const initializeTransport = async () => {
  // Check if SMTP is properly configured
  const hasValidSMTP = config.smtp.host && config.smtp.user && config.smtp.pass;
  
  if (hasValidSMTP) {
    // Always try to use real SMTP (Gmail) first
    try {
      transport = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: true, // SSL for port 465
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass,
        },
        connectionTimeout: 15000,
        socketTimeout: 15000,
      });
      
      // Test connection
      await transport.verify();
      logger.info('✅ Using Real SMTP Email Service (Gmail)');
      logger.info(`📧 Connected as: ${config.smtp.user}`);
      return;
    } catch (error) {
      logger.error('❌ Gmail SMTP Connection Failed:', error.message);
      logger.error('Error Code:', error.code);
      logger.error('Credentials:', {
        host: config.smtp.host,
        port: config.smtp.port,
        user: config.smtp.user,
      });
      
      throw new Error(
        `Email service configuration error. Please check your Gmail credentials:\n` +
        `- SMTP_HOST: ${config.smtp.host}\n` +
        `- SMTP_PORT: ${config.smtp.port}\n` +
        `- SMTP_USER: ${config.smtp.user}\n` +
        `- Error: ${error.message}\n\n` +
        `⚠️ Make sure to use Gmail App Password (not your regular password)\n` +
        `Get it at: https://myaccount.google.com/apppasswords`,
        { cause: error }
      );
    }
  } else {
    // No SMTP configured
    throw new Error(
      'SMTP configuration is required. Please set:\n' +
      '- SMTP_HOST\n' +
      '- SMTP_PORT\n' +
      '- SMTP_USER\n' +
      '- SMTP_PASS'
    );
  }
};

// Initialize transport
const transportReady = initializeTransport().catch((err) => {
  logger.error('❌ Email Service Initialization Failed:');
  logger.error(err.message);
  logger.warn('⚠️ Email service is disabled. Features requiring email (like registration and password reset) will fail.');
});

/**
 * Send an email
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @param {string} html
 * @returns {Promise}
 */
const sendEmail = async (to, subject, text, html) => {
  // Ensure transport is initialized before sending
  await transportReady;
  if (!transport) {
    throw new Error('Email transport is not initialized');
  }
  const msg = { from: config.smtp.from, to, subject, text, html };
  const info = await transport.sendMail(msg);
  
  if (config.env === 'development') {
    logger.info('Email logged to console (Development Mode)');
  }
  
  return info;
};

/**
 * Send verification email
 * @param {string} to
 * @param {string} token
 * @param {string} name
 * @returns {Promise}
 */
const sendVerificationEmail = async (to, token, name) => {
  const subject = 'Konfirmasi Aktivasi Akun Freshly';
  const verificationEmailUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

  const text = `Hi ${name},

Untuk menyelesaikan pendaftaran akun Freshly, konfirmasi alamat email kamu lewat link berikut:

${verificationEmailUrl}

Link ini berlaku 24 jam dan hanya bisa digunakan sekali.

Jika kamu tidak mendaftar di Freshly, abaikan email ini — akun tidak akan diaktifkan.

— Tim Freshly
freshly.web.id`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h2 style="color: #16a34a; text-align: center;">Konfirmasi Aktivasi Akun</h2>
      <p>Hi ${name},</p>
      <p>Untuk menyelesaikan pendaftaran akun Freshly, konfirmasi alamat email kamu lewat tombol di bawah:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationEmailUrl}" style="display: inline-block; background-color: #16a34a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; font-size: 15px;">
          Konfirmasi Email
        </a>
      </div>
      <p style="font-size: 13px; color: #555;">Atau salin link berikut ke browser:</p>
      <p style="font-size: 13px; color: #16a34a; word-break: break-all;">${verificationEmailUrl}</p>
      <p style="color: #d32f2f; font-weight: bold; margin-top: 24px;">
        Link ini berlaku 24 jam dan hanya bisa digunakan sekali.
      </p>
      <p>Jika kamu tidak mendaftar di Freshly, abaikan email ini — akun tidak akan diaktifkan.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #888; text-align: center;">Email otomatis, mohon tidak dibalas. &middot; freshly.web.id</p>
    </div>
  `;

  await sendEmail(to, subject, text, html);
};

/**
 * Send account lockout notification email
 * @param {string} to
 * @param {string} name
 * @param {number} lockoutMinutes
 * @returns {Promise}
 */
const sendAccountLockoutEmail = async (to, name, lockoutMinutes) => {
  const subject = 'Peringatan Keamanan: Akun Terkunci Sementara - Freshly';
  const text = `Halo ${name},

Akun Anda telah dikunci sementara karena beberapa percobaan login yang gagal.

Untuk keamanan Anda, akun akan terkunci selama ${lockoutMinutes} menit.

Jika ini bukan Anda, segera reset password setelah periode lockout berakhir.

- Tim Keamanan Freshly`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8faf9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8faf9; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
              
              <!-- Header with red gradient for security alert -->
              <tr>
                <td style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 40px 40px 30px; text-align: center;">
                  <div style="display: inline-block; width: 48px; height: 48px; background-color: rgba(255, 255, 255, 0.2); border-radius: 12px; margin-bottom: 16px; padding: 12px;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </div>
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Peringatan Keamanan</h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 24px; font-weight: 700;">Akun Terkunci Sementara</h2>
                  <p style="margin: 0 0 24px; color: #64748b; font-size: 15px; line-height: 1.6;">
                    Halo <strong style="color: #0f172a;">${name}</strong>,
                  </p>
                  <p style="margin: 0 0 32px; color: #64748b; font-size: 15px; line-height: 1.6;">
                    Akun Anda telah dikunci sementara karena beberapa percobaan login yang gagal. Ini adalah tindakan keamanan otomatis untuk melindungi akun Anda.
                  </p>
                  
                  <!-- Warning Box -->
                  <div style="background-color: #fef2f2; border: 2px solid #dc2626; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-bottom: 12px;">
                          <p style="margin: 0; color: #991b1b; font-size: 16px; font-weight: 700;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 4px;">
                              <circle cx="12" cy="12" r="10"></circle>
                              <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            Durasi Lockout
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <p style="margin: 0; color: #7f1d1d; font-size: 32px; font-weight: 800;">
                            ${lockoutMinutes} menit
                          </p>
                        </td>
                      </tr>
                    </table>
                  </div>
                  
                  <!-- Info Box -->
                  <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                    <p style="margin: 0 0 8px; color: #92400e; font-size: 14px; font-weight: 600;">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 4px;">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                      </svg>
                      Tindakan yang Disarankan:
                    </p>
                    <ul style="margin: 8px 0 0; padding-left: 20px; color: #92400e; font-size: 14px;">
                      <li style="margin-bottom: 4px;">Tunggu hingga periode lockout berakhir</li>
                      <li style="margin-bottom: 4px;">Jika ini bukan Anda, segera reset password</li>
                      <li>Pastikan menggunakan password yang kuat dan unik</li>
                    </ul>
                  </div>
                  
                  <p style="margin: 0 0 8px; color: #64748b; font-size: 14px; line-height: 1.6;">
                    Jika Anda yakin ini adalah kesalahan atau memerlukan bantuan, silakan hubungi tim support kami.
                  </p>
                  <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                    <strong style="color: #dc2626;">Jangan bagikan informasi akun Anda kepada siapapun.</strong>
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8faf9; padding: 32px 40px; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0 0 8px; color: #94a3b8; font-size: 13px; text-align: center;">
                    Ini adalah notifikasi keamanan otomatis dari Freshly.
                  </p>
                  <p style="margin: 0; color: #94a3b8; font-size: 13px; text-align: center;">
                    &copy; 2026 Freshly Indonesia. Scan Buah & Sayur. Tahu Layaknya. Dalam Sekejap.
                  </p>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  await sendEmail(to, subject, text, html);
};

module.exports = {
  transport,
  sendEmail,
  sendVerificationEmail,
  sendAccountLockoutEmail,
};
