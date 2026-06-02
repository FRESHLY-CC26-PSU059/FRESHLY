const winston = require('winston');

const enumerateErrorFormat = winston.format((info) => {
  if (info instanceof Error) {
    Object.assign(info, { message: info.stack });
  }
  return info;
});

// Prod default is `http` so morgan access logs survive; LOG_LEVEL overrides.
const defaultLevel = process.env.NODE_ENV === 'development' ? 'debug' : 'http';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || defaultLevel,
  format: winston.format.combine(
    enumerateErrorFormat(),
    process.env.NODE_ENV === 'development'
      ? winston.format.combine(winston.format.colorize(), winston.format.simple())
      : winston.format.combine(winston.format.timestamp(), winston.format.json()),
  ),
  transports: [new winston.transports.Console()],
  exitOnError: false,
});

module.exports = logger;
