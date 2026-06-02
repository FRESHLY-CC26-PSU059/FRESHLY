import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import Button from '../components/ui/Button';
import { Leaf, CheckCircle, XCircle, Loader2, Mail, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';
import useSEO from '../hooks/useSEO';

const VerifyEmailPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(5);

  useSEO({
    title: 'Verifikasi Email',
    description: 'Verifikasi alamat email Anda untuk mengaktifkan akun Freshly.',
    robots: 'noindex, nofollow',
  });

  const token = searchParams.get('token');

  useEffect(() => {
    const verify = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (!token) {
        setStatus('error');
        setMessage(t('verifyEmail.tokenNotFound'));
        return;
      }

      try {
        const response = await api.get(`/auth/verify-email?token=${token}`);
        setStatus('success');
        setMessage(response.data.message || t('verifyEmail.success'));
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.message || t('verifyEmail.failedDefault'));
      }
    };

    verify();
  }, [token]);

  // Auto-redirect countdown on success
  useEffect(() => {
    if (status !== 'success') return;
    if (countdown <= 0) {
      navigate('/login');
      return;
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [status, countdown, navigate]);

  return (
    <div className="min-h-screen soft-gradient flex items-center justify-center p-6 overflow-hidden relative">
      {/* Background decorative elements */}
      {status === 'success' && (
        <>
          <div className="absolute top-10 right-10 w-40 h-40 bg-primary-500/15 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-10 w-48 h-48 bg-primary-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </>
      )}
      {status === 'error' && (
        <>
          <div className="absolute top-10 right-10 w-40 h-40 bg-red-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-10 w-48 h-48 bg-red-500/5 rounded-full blur-3xl" />
        </>
      )}

      <div className="w-full max-w-md relative z-10">
        <div className="bg-app-surface border border-app-border rounded-3xl premium-shadow overflow-hidden">

          {/* Dynamic Header Banner */}
          <div className={`px-8 pt-10 pb-8 text-center ${
            status === 'success' ? 'bg-gradient-to-b from-primary-500/10 to-transparent' :
            status === 'error' ? 'bg-gradient-to-b from-red-500/10 to-transparent' :
            'bg-gradient-to-b from-primary-500/5 to-transparent'
          }`}>
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl green-gradient text-white mb-5 premium-shadow">
              <Leaf size={28} fill="currentColor" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-app-text-primary">
              Freshly<span className="text-primary-500">.</span>
            </h1>
          </div>

          <div className="px-8 pb-8">
            {/* Loading State */}
            {status === 'loading' && (
              <div className="py-8 text-center">
                <div className="flex justify-center mb-6">
                  <div className="relative w-16 h-16">
                    <Loader2 className="w-16 h-16 text-primary-500 animate-spin" />
                    <Mail className="w-6 h-6 text-primary-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-app-text-primary mb-2">{t('verifyEmail.verifying')}</h2>
                <p className="text-app-text-secondary text-sm leading-relaxed">
                  {t('verifyEmail.pleaseWait')}
                </p>
                <div className="mt-6 flex gap-1.5 justify-center">
                  <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                  <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>
            )}

            {/* Success State */}
            {status === 'success' && (
              <div className="py-4 text-center">
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary-500/20 rounded-full blur-xl animate-pulse" />
                    <div className="relative z-10 w-20 h-20 rounded-full bg-primary-500/10 flex items-center justify-center">
                      <CheckCircle className="w-12 h-12 text-primary-500" />
                    </div>
                  </div>
                </div>

                <h2 className="text-2xl font-black text-app-text-primary mb-2">{t('verifyEmail.success')}</h2>
                <p className="text-app-text-secondary text-sm leading-relaxed mb-1">
                  {message}
                </p>
                <p className="text-app-text-secondary text-xs">
                  {t('verifyEmail.successDesc')}
                </p>

                <div className="mt-8">
                  <Button
                    onClick={() => navigate('/login')}
                    className="w-full h-12 green-gradient text-white rounded-xl font-bold hover:shadow-lg hover:shadow-primary-500/30 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    {t('verifyEmail.continueSignIn')}
                    <ArrowRight size={18} />
                  </Button>
                </div>

                <p className="mt-4 text-xs text-app-text-secondary">
                  {t('verifyEmail.redirecting', { seconds: countdown })}
                </p>
              </div>
            )}

            {/* Error State */}
            {status === 'error' && (
              <div className="py-4 text-center">
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-red-500/15 rounded-full blur-xl" />
                    <div className="relative z-10 w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
                      <XCircle className="w-12 h-12 text-red-500" />
                    </div>
                  </div>
                </div>

                <h2 className="text-2xl font-black text-app-text-primary mb-2">{t('verifyEmail.failed')}</h2>
                <p className="text-app-text-secondary text-sm leading-relaxed mb-6">
                  {message}
                </p>

                <div className="bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 rounded-xl p-4 mb-6 text-left">
                  <div className="flex gap-3 items-start">
                    <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-700 dark:text-red-400 font-semibold text-sm mb-1.5">{t('verifyEmail.whatToDo')}</p>
                      <ul className="text-red-600/80 dark:text-red-400/70 text-xs space-y-1.5">
                        <li className="flex items-start gap-1.5">
                          <span className="mt-0.5">•</span>
                          <span>{t('verifyEmail.tip1')}</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="mt-0.5">•</span>
                          <span>{t('verifyEmail.tip2')}</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="mt-0.5">•</span>
                          <span>{t('verifyEmail.tip3')}</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Link to="/register" className="block">
                    <Button className="w-full h-12 green-gradient text-white rounded-xl font-bold hover:shadow-lg hover:shadow-primary-500/30 transition-all duration-300 flex items-center justify-center gap-2">
                      <RefreshCw size={16} />
                      {t('verifyEmail.registerAgain')}
                    </Button>
                  </Link>

                  <Link
                    to="/login"
                    className="block w-full h-12 rounded-xl border border-app-border font-bold text-sm text-app-text-primary hover:bg-app-bg/50 transition-all flex items-center justify-center gap-2"
                  >
                    {t('verifyEmail.backToSignIn')}
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 pb-6 pt-4 border-t border-app-border/50 text-center">
            <p className="text-app-text-secondary text-xs">
              {t('common.copyright')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
