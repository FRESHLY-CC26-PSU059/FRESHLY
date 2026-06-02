import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { getToken } from 'firebase/messaging';
import { auth, googleProvider, microsoftProvider, messaging, FIREBASE_ENABLED } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import LegalModal from '../components/ui/LegalModal';
import ReCAPTCHAComponent from '../components/ui/ReCAPTCHAComponent';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import logger from '../utils/logger';
import useSEO from '../hooks/useSEO';
import { LogoMark } from '../components/ui/Logo';
import { BRAND, COPYRIGHT } from '../constants/brand';

const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, loginWithGoogle, loginWithMicrosoft } = useAuth();
  const recaptchaRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [legalModal, setLegalModal] = useState<'privacy' | 'tos' | null>(null);
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useSEO({
    title: 'Masuk',
    description: 'Masuk ke akun Freshly untuk mulai mendeteksi kematangan dan kelayakan buah & sayur dengan AI.',
    robots: 'noindex, follow',
  });

  const getLoginFcmToken = async () => {
    try {
      if (!messaging || !FIREBASE_ENABLED) {
        logger.info('[useFCMToken] Firebase Messaging not configured or disabled');
        return '';
      }
      
      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
      if (!vapidKey) {
        logger.warn('[useFCMToken] VAPID key not found in environment');
        return '';
      }

      if (typeof Notification === 'undefined') {
        logger.warn('[useFCMToken] Notifications are not supported in this browser');
        return '';
      }

      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          logger.warn('[useFCMToken] Notification permission was not granted');
          return '';
        }
      }

      if (Notification.permission !== 'granted') {
        logger.warn('[useFCMToken] Notification permission is not granted');
        return '';
      }
      
      const serviceWorkerRegistration = await navigator.serviceWorker.ready;
      logger.info('[useFCMToken] Requesting FCM token...');
      const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration });
      
      if (token) {
        setFcmToken(token);
        logger.info('[useFCMToken] Token obtained successfully');
        return token;
      }

      logger.warn('[useFCMToken] No token returned');
      setFcmToken('');
      return '';
    } catch (error: any) {
      if (error.message?.includes('atob') || error.message?.includes('VAPID') || error.code === 'messaging/invalid-vapid-key') {
        logger.warn('[useFCMToken] Push notifications disabled due to invalid VAPID key');
      } else {
        logger.error('[useFCMToken] Error', { error: error.message });
      }
      setFcmToken('');
      return '';
    }
  };

  // Get FCM token on mount (non-blocking, optional)
  useEffect(() => {
    const getFCMToken = async () => {
      try {
        await getLoginFcmToken();
      } catch (error: any) {
        logger.error('[useFCMToken] Unexpected error during FCM setup', {
          name: error.name,
          message: error.message,
          note: 'This should not happen - report this error',
        });
        setFcmToken('');
      }
    };

    // Wait for Service Worker to be fully registered before requesting FCM token
    // Additional delay to ensure browser internals are ready
    const timer = setTimeout(() => {
      logger.info('[useFCMToken] Timer triggered - calling getFCMToken() (1.5s after mount)');
      getFCMToken();
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRecaptchaChange = (token: string | null) => {
    logger.info('reCAPTCHA token received', { hasToken: !!token });
  };

  const handleRecaptchaError = (error: any) => {
    logger.error('reCAPTCHA error', { error: error.message });
  };

  const handleRecaptchaExpired = () => {
    logger.warn('reCAPTCHA token expired');
  };

  // v3 tokens expire in ~2 min; capture fresh on submit instead of mount.

  const handleGoogleLogin = async () => {
    if (!auth || !googleProvider) return;
    
    try {
      setLoading(true);
      
      logger.group('Google Login Process', true);
      logger.info('GOOGLE LOGIN BUTTON CLICKED');
      
      // Get fresh reCAPTCHA token for Google login (REQUIRED)
      let token = '';
      try {
        if (recaptchaRef.current?.isReady?.()) {
          token = await recaptchaRef.current?.execute?.('login');
          logger.info('reCAPTCHA token captured for Google login', { hasToken: !!token, length: token?.length });
        }
        if (!token) {
          throw new Error('not_ready');
        }
      } catch (recaptchaError) {
        logger.warn('reCAPTCHA token error', { error: recaptchaError instanceof Error ? recaptchaError.message : 'Unknown error' });
        throw new Error(t('auth.recaptchaRequired', { defaultValue: 'Security verification required. Please refresh the page and try again.' }));
      }
      
      logger.info('Initiating Firebase Google Sign-In popup...');
      const result = await signInWithPopup(auth, googleProvider);
      logger.info('Firebase sign-in successful, getting ID token...');
      
      const idToken = await result.user.getIdToken();
      logger.info('ID token obtained', { length: idToken?.length });
      
      const currentFcmToken = fcmToken || await getLoginFcmToken();
      logger.info('Calling loginWithGoogle()', { hasIdToken: !!idToken, hasRecaptcha: !!token, hasFcmToken: !!currentFcmToken });
      
      const loggedInUser = await loginWithGoogle(idToken, token, currentFcmToken);
      
      logger.info('Google login successful', { userId: loggedInUser.id, email: loggedInUser.email });
      logger.groupEnd();
      
      const isAdmin = ['admin', 'super_admin'].includes(loggedInUser?.role);
      navigate(isAdmin ? '/admin/dashboard' : '/dashboard');
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        logger.error('Google login error', { error: error.message, code: error.code });
        const errorMessage = error.message || 'Google login failed. Please try again.';
        toast.error(errorMessage);
      }
      if (recaptchaRef.current?.reset) {
        recaptchaRef.current.reset();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    if (!auth || !microsoftProvider) return;
    
    try {
      setLoading(true);
      
      logger.group('Microsoft Login Process', true);
      logger.info('MICROSOFT LOGIN BUTTON CLICKED');
      
      let token = '';
      try {
        if (recaptchaRef.current?.isReady?.()) {
          token = await recaptchaRef.current?.execute?.('login');
          logger.info('reCAPTCHA token captured for Microsoft login', { hasToken: !!token, length: token?.length });
        }
        if (!token) {
          throw new Error('not_ready');
        }
      } catch (recaptchaError) {
        logger.warn('reCAPTCHA token error', { error: recaptchaError instanceof Error ? recaptchaError.message : 'Unknown error' });
        throw new Error(t('auth.recaptchaRequired', { defaultValue: 'Security verification required. Please refresh the page and try again.' }));
      }
      
      logger.info('Initiating Firebase Microsoft Sign-In popup...');
      const result = await signInWithPopup(auth, microsoftProvider);
      logger.info('Firebase sign-in successful, getting ID token...');
      
      const idToken = await result.user.getIdToken();
      logger.info('ID token obtained', { length: idToken?.length });
      
      const currentFcmToken = fcmToken || await getLoginFcmToken();
      logger.info('Calling loginWithMicrosoft()', { hasIdToken: !!idToken, hasRecaptcha: !!token, hasFcmToken: !!currentFcmToken });
      
      const loggedInUser = await loginWithMicrosoft(idToken, token, currentFcmToken);
      
      logger.info('Microsoft login successful', { userId: loggedInUser.id, email: loggedInUser.email });
      logger.groupEnd();
      
      const isAdmin = ['admin', 'super_admin'].includes(loggedInUser?.role);
      navigate(isAdmin ? '/admin/dashboard' : '/dashboard');
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        logger.error('Microsoft login error', { error: error.message, code: error.code });
        const errorMessage = error.message || 'Microsoft login failed. Please try again.';
        toast.error(errorMessage);
      }
      if (recaptchaRef.current?.reset) {
        recaptchaRef.current.reset();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      logger.group('Email Login Process', true);
      logger.info('EMAIL LOGIN FORM SUBMITTED');
      
      // Capture reCAPTCHA token on-demand before login (REQUIRED)
      let token = '';
      try {
        if (recaptchaRef.current?.isReady?.()) {
          token = await recaptchaRef.current?.execute?.('login');
          logger.info('reCAPTCHA token captured for email login', { hasToken: !!token, length: token?.length });
        }
        if (!token) {
          throw new Error('not_ready');
        }
      } catch (recaptchaError) {
        logger.warn('reCAPTCHA token capture error', { error: recaptchaError instanceof Error ? recaptchaError.message : 'Unknown error' });
        throw new Error(t('auth.recaptchaRequired', { defaultValue: 'Security verification required. Please refresh the page and try again.' }));
      }
      
      const currentFcmToken = fcmToken || await getLoginFcmToken();
      logger.info('Calling login()', { email: formData.email, hasRecaptcha: !!token, hasFcmToken: !!currentFcmToken });
      
      const loggedInUser = await login({ 
        ...formData, 
        recaptchaToken: token || '',
        fcmToken: currentFcmToken,
      });
      
      logger.info('Login successful', { userId: loggedInUser.id, email: loggedInUser.email });
      logger.groupEnd();
      
      const isAdmin = ['admin', 'super_admin'].includes(loggedInUser?.role);
      navigate(isAdmin ? '/admin/dashboard' : '/dashboard');
    } catch (error: any) {
      logger.error('Login error', { error: error.message, response: error.response?.data?.message });
      const errorMessage = error.response?.data?.message || error.message || 'Login failed. Please try again.';
      toast.error(errorMessage);
      if (recaptchaRef.current?.reset) {
        recaptchaRef.current.reset();
      }
    } finally {
      setLoading(false);
    }
  };

  
  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden bg-app-bg">
      {/* Background orbs */}
      <div className="absolute -left-32 top-1/4 h-[400px] w-[400px] rounded-full bg-emerald-500/10 blur-[100px] animate-pulse-glow pointer-events-none" />
      <div className="absolute -right-20 -top-20 h-[350px] w-[350px] rounded-full bg-teal-400/8 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 h-[300px] w-[300px] rounded-full bg-lime-400/6 blur-[80px] pointer-events-none" />

      <div className="relative w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4 rounded-2xl shadow-lg shadow-emerald-500/10">
            <LogoMark size={64} />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-app-text-primary mb-2">
            {BRAND.name}<span className="text-primary-500">.</span>
          </h1>
          <p className="text-app-text-secondary font-medium">
            {t('login.welcome')}
          </p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600/80">
            {BRAND.tagline}
          </p>
        </div>

        <div className="glass-card-light rounded-3xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-app-text-primary mb-2 ml-1">
                {t('common.email')}
              </label>
              <Input
                name="email"
                type="email"
                autoComplete="username"
                value={formData.email}
                onChange={handleChange}
                placeholder="nama@email.com"
                required
                className="rounded-xl"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2 ml-1">
                <label className="text-sm font-bold text-app-text-primary">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                  {t('login.forgotPassword')}
                </Link>
              </div>
              <Input
                name="password"
                type="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                placeholder={t('login.passwordPlaceholder')}
                required
                className="rounded-xl"
              />
            </div>

            <ReCAPTCHAComponent
              ref={recaptchaRef}
              onTokenChange={handleRecaptchaChange}
              onError={handleRecaptchaError}
              onExpired={handleRecaptchaExpired}
              action="login"
              size="invisible"
              className="mb-4"
            />

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 hover:translate-y-[-1px] transition-all duration-300"
            >
              {loading ? t('login.signingIn') : t('login.signIn')}
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-app-border/50"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-transparent backdrop-blur-sm px-4 text-app-text-secondary font-bold tracking-widest">{t('common.or')}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {FIREBASE_ENABLED ? (
              <>
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  title={t('login.googleSignIn')}
                  className="flex items-center justify-center p-3 w-full rounded-xl glass-card-light hover:translate-y-[-1px] hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6 mr-2" />
                  <span className="text-sm font-bold text-app-text-primary">Google</span>
                </button>
                <button
                  onClick={handleMicrosoftLogin}
                  disabled={loading}
                  title={t('login.microsoftSignIn')}
                  className="flex items-center justify-center p-3 w-full rounded-xl glass-card-light hover:translate-y-[-1px] hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 21 21" className="mr-2">
                    <path fill="#f25022" d="M1 1h9v9H1z"/>
                    <path fill="#00a4ef" d="M1 11h9v9H1z"/>
                    <path fill="#7fba00" d="M11 1h9v9h-9z"/>
                    <path fill="#ffb900" d="M11 11h9v9h-9z"/>
                  </svg>
                  <span className="text-sm font-bold text-app-text-primary">Microsoft</span>
                </button>
              </>
            ) : (
              <p className="w-full text-center text-xs text-app-text-secondary font-medium col-span-2">
                {t('login.socialUnavailable')}
              </p>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-app-border/50 text-center">
            <p className="text-app-text-secondary text-sm">
              {t('login.noAccount')}{' '}
              <Link to="/register" className="text-emerald-600 hover:text-emerald-700 font-bold ml-1 transition-colors">
                {t('login.registerNow')}
              </Link>
            </p>
          </div>
        </div>
        
        <div className="mt-8 text-center text-xs text-app-text-secondary font-medium space-x-2">
          <span>{COPYRIGHT}</span>
          <button type="button" onClick={() => setLegalModal('privacy')} className="underline hover:text-app-text-primary transition-colors">{t('common.privacy')}</button>
          <span>&middot;</span>
          <button type="button" onClick={() => setLegalModal('tos')} className="underline hover:text-app-text-primary transition-colors">{t('common.terms')}</button>
        </div>
      </div>

      <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />
    </div>
  );
};

export default LoginPage;
