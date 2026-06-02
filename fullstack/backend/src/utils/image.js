const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const logger = require('../config/logger');

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';

// ── Cloudflare R2 Configuration ──
// Detect if R2 is configured and not using placeholder values from .env.example
const isPlaceholder = (val) => !val || val.includes('your-') || val === 'freshly-uploads' || val === 'https://pub-xxxx.r2.dev';

const useR2 = !!(
  process.env.R2_ACCOUNT_ID && !isPlaceholder(process.env.R2_ACCOUNT_ID) &&
  process.env.R2_ACCESS_KEY_ID && !isPlaceholder(process.env.R2_ACCESS_KEY_ID) &&
  process.env.R2_SECRET_ACCESS_KEY && !isPlaceholder(process.env.R2_SECRET_ACCESS_KEY) &&
  process.env.R2_BUCKET_NAME && !isPlaceholder(process.env.R2_BUCKET_NAME)
);

let s3Client = null;
if (useR2) {
  const { S3Client } = require('@aws-sdk/client-s3');
  s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
  logger.info(`R2 Storage enabled — bucket: ${process.env.R2_BUCKET_NAME}`);
} else {
  logger.info('R2 not configured — using local filesystem for uploads');
  logger.debug('R2 env check:', {
    R2_ACCOUNT_ID: !!process.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: !!process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: !!process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME: !!process.env.R2_BUCKET_NAME,
  });
}

const R2_BUCKET = process.env.R2_BUCKET_NAME || '';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || ''; // e.g. https://cdn.freshly.id

/**
 * Sanitize filename to prevent path traversal attacks
 * @param {string} filename - Original filename
 * @returns {string} - Sanitized filename
 */
const sanitizeFilename = (filename) => {
  // Remove any path separators and special characters
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/\.+/g, '.') // Replace multiple dots with single dot
    .substring(0, 100); // Limit length
};

const ensureDir = (dir) => {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
  return fullPath;
};

const resizeImage = async (buffer, maxWidth = 1024) => {
  // Guard against image-bomb payloads and honour EXIF orientation.
  const MAX_PIXELS = 50_000_000;
  const MAX_BUFFER_BYTES = 20 * 1024 * 1024;

  if (buffer.length > MAX_BUFFER_BYTES) {
    throw new Error('Image too large to process');
  }

  const pipeline = sharp(buffer, { limitInputPixels: MAX_PIXELS });
  const metadata = await pipeline.metadata();
  if (metadata.width && metadata.height && metadata.width * metadata.height > MAX_PIXELS) {
    throw new Error('Image dimensions exceed allowed pixel budget');
  }

  return pipeline
    .rotate()
    .resize(maxWidth, null, { withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
};

const saveImage = async (buffer, folder) => {
  const filename = `${crypto.randomUUID()}.webp`;
  const resized = await resizeImage(buffer);

  // ── R2 Upload ──
  if (useR2 && s3Client) {
    const { PutObjectCommand } = require('@aws-sdk/client-s3');
    const key = `${folder}/${filename}`;

    await s3Client.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: resized,
      ContentType: 'image/webp',
    }));

    return R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${key}` : `/${UPLOAD_DIR}/${folder}/${filename}`;
  }

  // ── Local Filesystem (dev fallback) ──
  const dir = ensureDir(path.join(UPLOAD_DIR, folder));
  const filepath = path.join(dir, filename);
  fs.writeFileSync(filepath, resized);
  return `/${UPLOAD_DIR}/${folder}/${filename}`;
};

const deleteImage = async (imageUrl) => {
  if (!imageUrl) return;

  // ── R2 Delete ──
  if (useR2 && s3Client && R2_PUBLIC_URL && imageUrl.startsWith(R2_PUBLIC_URL)) {
    try {
      const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
      const key = imageUrl.replace(`${R2_PUBLIC_URL}/`, '');
      await s3Client.send(new DeleteObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
      }));
    } catch (err) {
      logger.error('R2 delete error: %s', err.message);
    }
    return;
  }

  // ── Local Filesystem Delete (dev fallback) ──
  // Sanitize the path to prevent directory traversal
  const sanitizedUrl = imageUrl.replace(/\.\./g, '').replace(/\/\//g, '/');
  const filepath = path.resolve(process.cwd(), sanitizedUrl.startsWith('/') ? sanitizedUrl.substring(1) : sanitizedUrl);
  
  // Ensure the file is within the upload directory
  const uploadPath = path.resolve(process.cwd(), UPLOAD_DIR);
  const relative = path.relative(uploadPath, filepath);
  const isSafe = relative && !relative.startsWith('..') && !path.isAbsolute(relative);
  if (!isSafe) {
    logger.error('Attempted to delete file outside upload directory: %s', filepath);
    return;
  }
  
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }
};

module.exports = { resizeImage, saveImage, deleteImage, sanitizeFilename };
