import React, { useRef, useEffect, useState, forwardRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import logger from '../../utils/logger';

interface ReCAPTCHAComponentProps {
  onTokenChange?: (token: string | null) => void;
  onError?: (error: any) => void;
  onExpired?: () => void;
  action?: string;
  size?: 'normal' | 'compact' | 'invisible';
  className?: string;
}

/**
 * Unified reCAPTCHA component with version detection and robust error handling
 */
const ReCAPTCHAComponent = forwardRef<any, ReCAPTCHAComponentProps>(({
  onTokenChange,
  onError,
  onExpired,
  action,
  size = 'invisible',
  className = '',
}, ref) => {
  const internalRef = useRef<ReCAPTCHA>(null);
  const [isReady, setIsReady] = useState(false);
  const [version, setVersion] = useState<'v2' | 'v3' | 'unknown'>('unknown');
  const [lastError, setLastError] = useState<string | null>(null);

  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  
  // Debug environment variable
  if (!siteKey) {
    logger.error('reCAPTCHA: Site key not found in environment');
  } else {
    logger.debug('reCAPTCHA: Site key loaded', {
      keyLength: siteKey.length,
    });
  }

  /**
   * Detect reCAPTCHA version from site key
   */
  const detectVersion = (key: string): 'v2' | 'v3' | 'unknown' => {
    if (!key) return 'unknown';
    
    // V2 site keys typically start with 6Le...
    // V3 site keys also start with 6Le... but have different characteristics
    // We'll use a more reliable method by checking the key length and format
    if (key.length === 40) {
      return key.startsWith('6Le') ? 'v2' : 'v3';
    }
    
    // Default to v3 for newer implementations
    return 'v3';
  };

  /**
   * Execute reCAPTCHA with proper error handling
   */
  const executeRecaptcha = async (customAction?: string) => {
    if (!internalRef.current || !isReady) {
      logger.warn('reCAPTCHA: Not ready to execute', { 
        hasRef: !!internalRef.current, 
        isReady, 
        siteKey: !!siteKey 
      });
      return null;
    }

    try {
      setLastError(null);
      logger.debug('reCAPTCHA: Executing...', {
        action: customAction || action,
        version,
      });
      
      const token = await internalRef.current.executeAsync();
      
      logger.debug('reCAPTCHA: Token generated', {
        action: customAction || action,
        tokenLength: token?.length,
        version,
      });
      return token;
    } catch (error) {
      logger.error('reCAPTCHA: Execution failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        action: customAction || action,
        version
      });
      setLastError(error instanceof Error ? error.message : 'Unknown error');
      if (onError) {
        onError(error);
      }
      return null;
    }
  };

  /**
   * Reset reCAPTCHA
   */
  const resetRecaptcha = () => {
    if (internalRef.current) {
      internalRef.current.reset();
      setLastError(null);
      if (onTokenChange) {
        onTokenChange(null);
      }
    }
  };

  /**
   * Handle token change
   */
  const handleTokenChange = (token: string | null) => {
    logger.info('reCAPTCHA: Token changed', {
      hasToken: !!token,
      tokenLength: token?.length,
      version
    });
    
    setLastError(null);
    if (onTokenChange) {
      onTokenChange(token);
    }
  };

  /**
   * Handle error
   */
  const handleError = (error: any) => {
    logger.error('reCAPTCHA: Error occurred', { error: error.message });
    setLastError(error instanceof Error ? error.message : 'Unknown error');
    if (onError) {
      onError(error);
    }
  };

  /**
   * Handle expiration
   */
  const handleExpired = () => {
    logger.warn('reCAPTCHA: Token expired');
    setLastError('Token expired');
    if (onExpired) {
      onExpired();
    }
    if (onTokenChange) {
      onTokenChange(null);
    }
  };

  // Initialize component
  useEffect(() => {
    if (siteKey) {
      const detectedVersion = detectVersion(siteKey);
      setVersion(detectedVersion);
      setIsReady(true);

      logger.debug('reCAPTCHA: Initialized', {
        version: detectedVersion,
        size,
        hasAction: !!action,
      });
    } else {
      logger.warn('reCAPTCHA: Site key not found');
      setLastError('reCAPTCHA site key not configured');
    }
  }, [siteKey, size, action]);

  // Expose methods via ref
  React.useImperativeHandle(ref, () => ({
    execute: executeRecaptcha,
    reset: resetRecaptcha,
    getVersion: () => version,
    isReady: () => isReady && !!siteKey,
    isConfigured: () => !!siteKey,
    getLastError: () => lastError
  }));

  if (!siteKey) {
    return (
      <div className={`recaptcha-error ${className}`}>
        <p className="text-red-500 text-sm">reCAPTCHA not configured</p>
      </div>
    );
  }

  return (
    <div className={`recaptcha-component ${className}`}>
      {/* Error display */}
      {lastError && (
        <div className="recaptcha-error-message mb-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          <span className="font-medium">reCAPTCHA Error:</span> {lastError}
        </div>
      )}
      
      {/* reCAPTCHA widget */}
      <ReCAPTCHA
        ref={internalRef}
        sitekey={siteKey}
        onChange={handleTokenChange}
        onError={handleError}
        onExpired={handleExpired}
        size={size}
        badge={version === 'v3' ? 'bottomleft' : 'bottomright'}
        theme="light"
        className={lastError ? 'border border-red-300 rounded' : ''}
      />
      
          </div>
  );
});

ReCAPTCHAComponent.displayName = 'ReCAPTCHAComponent';

export default ReCAPTCHAComponent;
