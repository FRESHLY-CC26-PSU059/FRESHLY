import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { Leaf, ShieldCheck, ArrowLeft, Clock } from 'lucide-react';
import Button from '../components/ui/Button';
import ReCAPTCHAComponent from '../components/ui/ReCAPTCHAComponent';
import api from '../api/axios';
import { toast } from 'sonner';
import useSEO from '../hooks/useSEO';

const VerifyOTPPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpTimer, setOtpTimer] = useState(300); // 5 minutes (matches backend)
  const [resendCooldown, setResendCooldown] = useState(60); // 60s cooldown before resend
  const recaptchaRef = useRef<any>(null);

  useSEO({
    title: 'Verifikasi OTP',
    description: 'Masukkan kode OTP yang dikirim ke email untuk melanjutkan reset password.',
    robots: 'noindex, nofollow',
  });

  useEffect(() => {
    const state = location.state as { email?: string };
    if (state?.email) {
      setEmail(state.email);
    } else {
      navigate('/forgot-password');
    }
  }, [location, navigate]);

  // OTP expiry countdown
  useEffect(() => {
    if (otpTimer <= 0) return;
    const timeout = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
    return () => clearTimeout(timeout);
  }, [otpTimer]);

  // Resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timeout = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(timeout);
  }, [resendCooldown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    setError('');
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otp || otp.length !== 6) {
      setError(t('verifyOtp.must6Digits'));
      return;
    }

    try {
      setLoading(true);
      await api.post('/auth/verify-otp', { email, otp });
      
      toast.success(t('verifyOtp.otpVerified'));
      
      // Redirect to reset password page
      navigate('/reset-password', { state: { email, otp } });
    } catch (err: any) {
      const message = err.response?.data?.message || t('verifyOtp.invalidOtp');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setLoading(true);
      let recaptchaToken = '';
      try {
        if (recaptchaRef.current?.isReady?.()) {
          recaptchaToken = await recaptchaRef.current?.execute?.('forgot_password') || '';
        }
      } catch (_) { /* skip */ }
      await api.post('/auth/forgot-password', { email, recaptchaToken });
      
      toast.success(t('verifyOtp.newOtpSent'));
      setOtpTimer(300);
      setResendCooldown(60);
      setOtp('');
    } catch (err: any) {
      const message = err.response?.data?.message || t('verifyOtp.resendFailed');
      toast.error(message);
      if (recaptchaRef.current?.reset) recaptchaRef.current.reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen soft-gradient flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl green-gradient text-white mb-4 premium-shadow">
            <Leaf size={32} fill="currentColor" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-app-text-primary mb-2">
            Freshly<span className="text-primary-500">.</span>
          </h1>
          <p className="text-app-text-secondary font-medium">
            {t('verifyOtp.description')}
          </p>
        </div>

        <div className="bg-app-surface border border-app-border rounded-3xl p-8 premium-shadow">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-50 text-primary-500 mb-4">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-xl font-bold text-app-text-primary mb-2">{t('verifyOtp.title')}</h2>
          </div>

          {/* Email Display */}
          <div className="p-4 bg-app-bg rounded-xl border border-app-border mb-6">
            <p className="text-xs text-app-text-secondary font-medium uppercase tracking-widest mb-1">{t('verifyOtp.sentTo')}</p>
            <p className="text-sm font-bold text-app-text-primary break-all">{email}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleVerify} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-app-text-primary mb-2 ml-1">{t('verifyOtp.otpLabel')}</label>
              <input
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={handleOtpChange}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-4 text-center text-2xl font-black tracking-[0.5em] rounded-xl bg-app-bg border border-app-border text-app-text-primary placeholder-app-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-mono"
                disabled={loading}
              />
              {error && (
                <p className="text-sm text-red-500 font-medium mt-2 ml-1">{error}</p>
              )}
            </div>

            {/* OTP Expiry Timer */}
            <div className={`flex items-center justify-center gap-2 text-sm font-bold ${
              otpTimer <= 0 ? 'text-red-500' : otpTimer < 60 ? 'text-red-500' : 'text-amber-500'
            }`}>
              <Clock size={16} />
              {otpTimer <= 0 ? t('verifyOtp.otpExpired', { defaultValue: 'OTP telah kedaluwarsa' }) : `${t('verifyOtp.expiresIn')} ${formatTime(otpTimer)}`}
            </div>

            <Button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full h-12 green-gradient text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-primary-500/30 transition-all duration-300"
            >
              {loading ? t('verifyOtp.verifying') : t('verifyOtp.verifyOtp')}
            </Button>
          </form>

          {/* Resend OTP */}
          <div className="text-center mt-6">
            {resendCooldown <= 0 ? (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                className="text-primary-600 font-bold text-sm hover:text-primary-700 disabled:opacity-50 transition-all"
              >
                {t('verifyOtp.resendOtp')}
              </button>
            ) : (
              <p className="text-xs text-app-text-secondary">
                {t('verifyOtp.requestIn')} <span className="font-bold text-app-text-primary">{formatTime(resendCooldown)}</span>
              </p>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-app-border">
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-app-text-secondary hover:text-primary-600 transition-colors"
            >
              <ArrowLeft size={16} />
              {t('verifyOtp.useDifferentEmail')}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-app-text-secondary">{t('verifyOtp.neverShare')}</p>
        </div>
      </div>

      <ReCAPTCHAComponent ref={recaptchaRef} />
    </div>
  );
};

export default VerifyOTPPage;
