import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { LogoMark } from '../components/ui/Logo';
import { BRAND } from '../constants/brand';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import ReCAPTCHAComponent from '../components/ui/ReCAPTCHAComponent';
import api from '../api/axios';
import { toast } from 'sonner';
import useSEO from '../hooks/useSEO';

const ForgotPasswordPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const recaptchaRef = useRef<any>(null);

  useSEO({
    title: 'Lupa Password',
    description: 'Reset password akun Freshly Anda lewat OTP yang dikirim ke email.',
    robots: 'noindex, nofollow',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError(t('forgotPassword.emailRequired'));
      return;
    }

    try {
      setLoading(true);

      // Get reCAPTCHA token (REQUIRED)
      let recaptchaToken = '';
      try {
        if (recaptchaRef.current?.isReady?.()) {
          recaptchaToken = await recaptchaRef.current?.execute?.('forgot_password') || '';
        }
        if (!recaptchaToken) {
          throw new Error('not_ready');
        }
      } catch (recaptchaError) {
        setError(t('auth.recaptchaRequired', { defaultValue: 'Security verification required. Please refresh the page and try again.' }));
        toast.error(t('auth.recaptchaRequired', { defaultValue: 'Security verification required. Please refresh the page and try again.' }));
        return;
      }

      await api.post('/auth/forgot-password', { email, recaptchaToken });
      
      toast.success(t('forgotPassword.otpSent'));
      
      // Redirect to OTP verification page with email as state
      navigate('/verify-otp', { state: { email } });
    } catch (err: any) {
      const message = err.response?.data?.message || t('forgotPassword.otpFailed');
      setError(message);
      toast.error(message);
      if (recaptchaRef.current?.reset) {
        recaptchaRef.current.reset();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen soft-gradient flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4 premium-shadow rounded-2xl">
            <LogoMark size={64} />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-app-text-primary mb-2">
            {BRAND.name}<span className="text-primary-500">.</span>
          </h1>
          <p className="text-app-text-secondary font-medium">
            {t('forgotPassword.subtitle')}
          </p>
        </div>

        <div className="bg-app-surface border border-app-border rounded-3xl p-8 premium-shadow">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-50 text-primary-500 mb-4">
              <Mail size={24} />
            </div>
            <h2 className="text-xl font-bold text-app-text-primary mb-2">{t('forgotPassword.title')}</h2>
            <p className="text-sm text-app-text-secondary leading-relaxed">
              {t('forgotPassword.description')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-app-text-primary mb-2 ml-1">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="nama@email.com"
                className="rounded-xl"
                disabled={loading}
              />
              {error && (
                <p className="text-sm text-red-500 font-medium mt-2 ml-1">{error}</p>
              )}
            </div>

            <ReCAPTCHAComponent
              ref={recaptchaRef}
              action="forgot_password"
              size="invisible"
            />

            <Button
              type="submit"
              disabled={loading || !email}
              className="w-full h-12 green-gradient text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-primary-500/30 transition-all duration-300"
            >
              {loading ? t('forgotPassword.sendingOtp') : t('forgotPassword.sendOtp')}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-app-border">
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-sm font-semibold text-app-text-secondary hover:text-primary-600 transition-colors"
            >
              <ArrowLeft size={16} />
              {t('forgotPassword.backToSignIn')}
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-app-text-secondary">
            {t('forgotPassword.footer')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
