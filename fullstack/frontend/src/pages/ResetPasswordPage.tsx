import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { Leaf, Lock, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import api from '../api/axios';
import { toast } from 'sonner';
import useSEO from '../hooks/useSEO';

const ResetPasswordPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useSEO({
    title: 'Reset Password',
    description: 'Buat password baru untuk akun Freshly Anda.',
    robots: 'noindex, nofollow',
  });

  useEffect(() => {
    const state = location.state as { email?: string; otp?: string };
    if (state?.email && state?.otp) {
      setEmail(state.email);
      setOtp(state.otp);
    } else {
      navigate('/forgot-password');
    }
  }, [location, navigate]);

  const validatePassword = () => {
    if (newPassword.length < 8) {
      setError(t('resetPassword.min8'));
      return false;
    }
    if (newPassword !== confirmPassword) {
      setError(t('resetPassword.noMatch'));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validatePassword()) {
      return;
    }

    try {
      setLoading(true);
      await api.post('/auth/reset-password', {
        email,
        otp,
        newPassword,
      });

      setSuccess(true);
      toast.success(t('resetPassword.resetSuccess'));

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      const message = err.response?.data?.message || t('resetPassword.resetFailed');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
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
          </div>

          <div className="bg-app-surface border border-app-border rounded-3xl p-8 premium-shadow text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-50 text-primary-500 mb-6 mx-auto">
              <CheckCircle size={40} />
            </div>

            <h2 className="text-2xl font-bold text-app-text-primary mb-2">{t('resetPassword.successTitle')}</h2>
            <p className="text-app-text-secondary text-sm mb-8">
              {t('resetPassword.successDesc')}
            </p>

            <Button
              onClick={() => navigate('/login')}
              className="w-full h-12 green-gradient text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-primary-500/30 transition-all duration-300"
            >
              {t('resetPassword.goToSignIn')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
            {t('resetPassword.description')}
          </p>
        </div>

        <div className="bg-app-surface border border-app-border rounded-3xl p-8 premium-shadow">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-50 text-primary-500 mb-4">
              <Lock size={24} />
            </div>
            <h2 className="text-xl font-bold text-app-text-primary mb-2">{t('resetPassword.title')}</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-app-text-primary mb-2 ml-1">{t('resetPassword.newPassword')}</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError('');
                  }}
                  placeholder={t('resetPassword.placeholder')}
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-app-bg border border-app-border text-app-text-primary placeholder-app-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-app-text-secondary hover:text-app-text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {newPassword && (
                <div className="flex items-center gap-2 mt-2">
                  <div className={`h-1 flex-1 rounded-full ${
                    newPassword.length >= 12 ? 'bg-primary-500' : 
                    newPassword.length >= 8 ? 'bg-amber-500' : 'bg-red-500'
                  }`} />
                  <span className="text-xs font-medium text-app-text-secondary">
                    {newPassword.length >= 12 ? t('resetPassword.strong') : 
                     newPassword.length >= 8 ? t('resetPassword.medium') : t('resetPassword.weak')}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-app-text-primary mb-2 ml-1">{t('resetPassword.confirmPassword')}</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError('');
                  }}
                  placeholder={t('resetPassword.repeatPlaceholder')}
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-app-bg border border-app-border text-app-text-primary placeholder-app-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-app-text-secondary hover:text-app-text-primary transition-colors"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {confirmPassword && newPassword === confirmPassword && (
                <p className="text-xs text-primary-500 font-medium flex items-center gap-1 mt-2 ml-1">
                  ✓ {t('resetPassword.passwordsMatch')}
                </p>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-500 font-medium ml-1">{error}</p>
            )}

            <Button
              type="submit"
              disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
              className="w-full h-12 green-gradient text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-primary-500/30 transition-all duration-300"
            >
              {loading ? t('resetPassword.processing') : t('resetPassword.saveNewPassword')}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-app-border">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-app-text-secondary hover:text-primary-600 transition-colors"
            >
              <ArrowLeft size={16} />
              {t('resetPassword.backToSignIn')}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-app-text-secondary space-y-1">
          <p>{t('resetPassword.tip1')}</p>
          <p>{t('resetPassword.tip2')}</p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
