const multer = require('multer');
const ApiError = require('../utils/api-error');
const ERROR_CODES = require('../utils/errorCodes');

const MAGIC_BYTES = {
  'image/jpeg': [Buffer.from([0xff, 0xd8, 0xff])],
  'image/png': [Buffer.from([0x89, 0x50, 0x4e, 0x47])],
  'image/webp': [Buffer.from('RIFF')],
};

const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedMimes.includes(file.mimetype)) {
    return cb(
      new ApiError(
        400,
        'Only JPEG, PNG, and WebP images are allowed',
        ERROR_CODES.VALIDATION_ERROR,
      ),
      false,
    );
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024,
  },
});

/**
 * Validate file magic bytes after multer processes the upload.
 * Use as middleware AFTER upload.single('image').
 */
const validateImageBuffer = (req, _res, next) => {
  if (!req.file) return next();

  const buffer = req.file.buffer;
  const mime = req.file.mimetype;
  const signatures = MAGIC_BYTES[mime];

  if (!signatures) {
    return next(new ApiError(400, 'Unsupported image format', ERROR_CODES.VALIDATION_ERROR));
  }

  const isValid = signatures.some((sig) => {
    if (mime === 'image/webp') {
      return (
        buffer.length >= 12 &&
        buffer.subarray(0, 4).toString() === 'RIFF' &&
        buffer.subarray(8, 12).toString() === 'WEBP'
      );
    }
    return buffer.subarray(0, sig.length).equals(sig);
  });

  if (!isValid) {
    return next(
      new ApiError(
        400,
        'File content does not match declared image type',
        ERROR_CODES.VALIDATION_ERROR,
      ),
    );
  }

  next();
};

module.exports = upload;
module.exports.validateImageBuffer = validateImageBuffer;
