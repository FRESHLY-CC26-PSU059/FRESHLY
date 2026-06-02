import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import LegalModal from '../components/ui/LegalModal';
import ReCAPTCHAComponent from '../components/ui/ReCAPTCHAComponent';
import { Check, X, RefreshCw, Leaf } from 'lucide-react';
import { toast } from 'sonner';
import api from '../api/axios';
import useSEO from '../hooks/useSEO';
import { LogoMark } from '../components/ui/Logo';
import { BRAND } from '../constants/brand';

const RegisterPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [legalModal, setLegalModal] = useState<'privacy' | 'tos' | null>(null);
  const recaptchaRef = useRef<any>(null);

  useSEO({
    title: 'Daftar',
    description: 'Daftar gratis di Freshly. Mulai scan buah & sayur dengan AI untuk tahu kematangan dan kelayakan konsumsinya.',
    robots: 'noindex, follow',
  });
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const passwordRules = useMemo(() => [
    { label: t('register.rule8Chars'), met: formData.password.length >= 8 },
    { label: t('register.ruleUppercase'), met: /[A-Z]/.test(formData.password) },
    { label: t('register.ruleLowercase'), met: /[a-z]/.test(formData.password) },
    { label: t('register.ruleNumber'), met: /\d/.test(formData.password) },
    { label: t('register.ruleSpecial'), met: /[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/]/.test(formData.password) },
  ], [formData.password, t]);

  const allPasswordRulesMet = passwordRules.every((r) => r.met);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Get reCAPTCHA token (REQUIRED)
      let recaptchaToken = '';
      try {
        if (recaptchaRef.current?.isReady?.()) {
          recaptchaToken = await recaptchaRef.current?.execute?.('register') || '';
        }
        if (!recaptchaToken) {
          throw new Error('not_ready');
        }
      } catch (recaptchaError) {
        throw new Error(t('auth.recaptchaRequired', { defaultValue: 'Security verification required. Please refresh the page and try again.' }));
      }
      
      await register({ ...formData, recaptchaToken });
      setRegistered(true);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleResendVerification = useCallback(async () => {
    try {
      setResending(true);
      await api.post('/auth/resend-verification', { email: formData.email });
      toast.success(t('register.resendSuccess', { defaultValue: 'Email verifikasi berhasil dikirim ulang!' }));
      setResendCooldown(60);
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('register.resendFailed', { defaultValue: 'Gagal mengirim ulang email verifikasi' }));
    } finally {
      setResending(false);
    }
  }, [formData.email, t]);

  if (registered) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden bg-app-bg">
        <div className="absolute -left-32 top-1/4 h-[400px] w-[400px] rounded-full bg-emerald-500/10 blur-[100px] animate-pulse-glow pointer-events-none" />
        <div className="absolute -right-20 -top-20 h-[350px] w-[350px] rounded-full bg-teal-400/8 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 h-[300px] w-[300px] rounded-full bg-lime-400/6 blur-[80px] pointer-events-none" />
        <div className="relative w-full max-w-md glass-card-light rounded-3xl p-8 text-center z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-50 text-primary-500 mb-6 mx-auto">
            <Leaf size={40} fill="currentColor" />
          </div>
          <h2 className="text-2xl font-bold text-app-text-primary mb-4">{t('register.checkEmail')}</h2>
          <p className="text-app-text-secondary mb-6 leading-relaxed">
            {t('register.checkEmailPrefix')}{' '}
            <strong className="text-app-text-primary break-all">{formData.email}</strong>
            {'. '}
            {t('register.checkEmailSuffix')}
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/login')}
              className="w-full h-12 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20"
            >
              {t('register.goToSignIn')}
            </Button>

            <button
              type="button"
              onClick={handleResendVerification}
              disabled={resending || resendCooldown > 0}
              className="w-full h-12 rounded-xl border border-app-border text-app-text-primary font-bold text-sm hover:bg-app-bg/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={16} className={resending ? 'animate-spin' : ''} />
              {resendCooldown > 0
                ? t('register.resendIn', { seconds: resendCooldown, defaultValue: `Kirim ulang (${resendCooldown}s)` })
                : t('register.resendVerification', { defaultValue: 'Kirim Ulang Email Verifikasi' })}
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            {t('register.subtitle')}
          </p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600/80">
            {BRAND.tagline}
          </p>
        </div>

        <div className="glass-card-light rounded-3xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-app-text-primary mb-2 ml-1">
                  {t('register.firstName')}
                </label>
                <Input
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="John"
                  required
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-app-text-primary mb-2 ml-1">
                  {t('register.lastName')}
                </label>
                <Input
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Doe"
                  required
                  className="rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-app-text-primary mb-2 ml-1">
                Email
              </label>
              <Input
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="nama@email.com"
                required
                className="rounded-xl border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-app-text-primary mb-2 ml-1">
                Password
              </label>
              <Input
                name="password"
                type="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                placeholder={t('register.passwordPlaceholder')}
                required
                className="rounded-xl border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20"
              />
              {formData.password.length > 0 && (
                <div className="mt-2 p-3 bg-app-bg rounded-xl border border-app-border">
                  <p className="text-[11px] font-bold text-app-text-secondary uppercase tracking-wider mb-2">
                    {t('register.passwordRequirements')}
                  </p>
                  <div className="grid grid-cols-1 gap-1">
                    {passwordRules.map((rule) => (
                      <div key={rule.label} className="flex items-center gap-2">
                        {rule.met ? (
                          <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        )}
                        <span className={`text-xs font-medium ${rule.met ? 'text-green-600' : 'text-app-text-secondary'}`}>
                          {rule.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <ReCAPTCHAComponent
              ref={recaptchaRef}
              action="register"
              size="invisible"
            />

            <Button
              type="submit"
              disabled={loading || !allPasswordRulesMet}
              className="w-full h-12 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 hover:translate-y-[-1px] transition-all duration-300 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('register.creating') : t('register.createAccount')}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-app-border/50 text-center">
            <p className="text-app-text-secondary text-sm">
              {t('register.hasAccount')}{' '}
              <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-bold ml-1 transition-colors">
                {t('register.signIn')}
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-app-text-secondary font-medium">
          {t('register.termsAgree')}{' '}
          <button type="button" onClick={() => setLegalModal('tos')} className="underline hover:text-app-text-primary transition-colors">
            {t('register.termsOfService')}
          </button>{' '}
          {t('register.and')}{' '}
          <button type="button" onClick={() => setLegalModal('privacy')} className="underline hover:text-app-text-primary transition-colors">
            {t('register.privacyPolicy')}
          </button>.
        </p>
      </div>

      <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />
    </div>
  );
};

export default RegisterPage;
