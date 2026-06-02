/**
 * Frontend Logger Utility
 * Development-only logging to prevent console statements in production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDev: boolean;

  constructor() {
    this.isDev = import.meta.env.DEV;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDev) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.isDev) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.isDev) {
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  error(message: string, context?: LogContext): void {
    if (this.isDev) {
      console.error(this.formatMessage('error', message, context));
    }
    // In production, you might want to send errors to a monitoring service
    // this.sendToErrorMonitoring(message, context);
  }

  // Group related logs
  group(label: string, collapsed: boolean = false): void {
    if (this.isDev) {
      if (collapsed) {
        console.groupCollapsed(label);
      } else {
        console.group(label);
      }
    }
  }

  groupEnd(): void {
    if (this.isDev) {
      console.groupEnd();
    }
  }

  // Performance timing
  time(label: string): void {
    if (this.isDev) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (this.isDev) {
      console.timeEnd(label);
    }
  }

  // Table display for structured data
  table(data: any[], columns?: string[]): void {
    if (this.isDev) {
      console.table(data, columns);
    }
  }

  // Security: Never log sensitive data
  sanitize(data: any): any {
    if (!data || typeof data !== 'object') return data;
    
    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'auth',
      'accessToken', 'refreshToken', 'apiKey', 'sessionId'
    ];

    const sanitized = { ...data };
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}

// Create singleton instance
const logger = new Logger();

export default logger;
