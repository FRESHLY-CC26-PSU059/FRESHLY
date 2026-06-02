import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/useTheme';
import { Sun, Moon, Bell, Shield, Globe, Palette, Lock, Trash2, Key, AlertCircle, Mail, Loader2 } from 'lucide-react';
import { Card, Button, Modal, Input, ConfirmDialog } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import api from '../api/axios';
import useSEO from '../hooks/useSEO';

interface SettingsSectionProps {
  icon: any;
  title: string;
  description: string;
  colorClass: string;
  children: React.ReactNode;
}

const SettingsSection = ({ icon: Icon, title, description, colorClass, children }: SettingsSectionProps) => (
  <Card className="p-6 h-full flex flex-col">
    <div className="flex items-center gap-3 mb-6">
      <div className={`p-2.5 ${colorClass} rounded-2xl shrink-0`}><Icon size={20} /></div>
      <div>
        <h3 className="text-sm font-black text-app-text-primary uppercase tracking-tight">{title}</h3>
        <p className="text-xs font-medium text-app-text-secondary mt-0.5">{description}</p>
      </div>
    </div>
    <div className="flex-1">
      {children}
    </div>
  </Card>
);


const SettingsPage = () => {
  useSEO({
    title: 'Pengaturan',
    description: 'Kelola preferensi tema, bahasa, notifikasi, dan keamanan akun Anda di Freshly.',
    robots: 'noindex, nofollow',
  });

  const { t, i18n } = useTranslation();
  const { mode, toggleColorMode } = useTheme();
  const { logout, user } = useAuth();

  // Password State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });

  // Delete State
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState('');

  // Newsletter State
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterChecking, setNewsletterChecking] = useState(true);

  const checkNewsletterStatus = useCallback(async () => {
    try {
      setNewsletterChecking(true);
      const res = await api.get('/newsletter/status');
      setNewsletterSubscribed(res.data.data?.subscribed || false);
    } catch { /* silent */ } finally { setNewsletterChecking(false); }
  }, []);

  useEffect(() => { checkNewsletterStatus(); }, [checkNewsletterStatus]);

  const toggleNewsletter = async () => {
    try {
      setNewsletterLoading(true);
      const userEmail = user?.email;
      if (!userEmail) return;
      if (newsletterSubscribed) {
        await api.post('/newsletter/unsubscribe', { email: userEmail });
        setNewsletterSubscribed(false);
        toast.success('Berhasil berhenti berlangganan newsletter');
      } else {
        await api.post('/newsletter/subscribe', { email: userEmail });
        setNewsletterSubscribed(true);
        toast.success('Berhasil berlangganan newsletter!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengubah status langganan');
    } finally { setNewsletterLoading(false); }
  };

  const currentLang = i18n.language?.startsWith('id') ? 'id' : 'en';

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(t('settings.passwordMismatch'));
      return;
    }

    try {
      setPasswordLoading(true);
      await api.post('/auth/change-password', {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success(t('settings.passwordUpdated'));
      setShowPasswordModal(false);
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('settings.passwordUpdateFailed'));
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteConfirmPassword) {
      toast.error(t('settings.enterPasswordConfirm'));
      return;
    }

    try {
      setDeleteLoading(true);
      await api.delete('/auth/delete-me', {
        data: { password: deleteConfirmPassword }
      });
      toast.success(t('settings.accountDeleted'));
      logout();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('settings.deleteFailed'));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-8 pt-4 max-w-5xl mx-auto">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-black text-app-text-primary tracking-tight">{t('settings.title')}</h2>
        <p className="text-sm text-app-text-secondary font-medium">{t('settings.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Appearance */}
        <SettingsSection 
          icon={Palette} 
          title={t('settings.appearance')} 
          description={t('settings.appearanceDesc')} 
          colorClass="bg-violet-500/10 text-violet-600"
        >
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'light', label: t('settings.light'), desc: t('settings.lightDesc'), icon: Sun },
              { key: 'dark', label: t('settings.dark'), desc: t('settings.darkDesc'), icon: Moon },
            ].map(({ key, label, desc, icon: Icon }) => (
              <button 
                key={key} 
                type="button" 
                onClick={() => { if (mode !== key) toggleColorMode(); }}
                className={`flex flex-col items-center text-center gap-2 p-4 rounded-2xl border-2 transition-all duration-300 ${
                  mode === key 
                    ? 'border-primary-500 bg-primary-500/5 premium-shadow' 
                    : 'border-app-border hover:border-app-text-secondary/20 hover:bg-app-bg'
                }`}
              >
                <div className={`p-2 rounded-xl ${mode === key ? 'bg-primary-500 text-white' : 'bg-app-bg text-app-text-secondary'}`}>
                  <Icon size={20} />
                </div>
                <div>
                  <span className={`block text-xs font-black uppercase tracking-widest ${mode === key ? 'text-primary-600' : 'text-app-text-primary'}`}>{label}</span>
                  <span className="text-[10px] font-bold text-app-text-secondary opacity-60">{desc}</span>
                </div>
              </button>
            ))}
          </div>
        </SettingsSection>

        {/* Language */}
        <SettingsSection 
          icon={Globe} 
          title={t('settings.language')} 
          description={t('settings.languageDesc')} 
          colorClass="bg-blue-500/10 text-blue-600"
        >
          <div className="flex flex-col justify-center h-full">
            <label className="block text-sm font-bold text-app-text-primary mb-2">{t('settings.appLanguage')}</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'en', label: 'English', flag: '🇺🇸' },
                { key: 'id', label: 'Indonesia', flag: '🇮🇩' },
              ].map(({ key, label, flag }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleLanguageChange(key)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all duration-300 ${
                    currentLang === key
                      ? 'border-primary-500 bg-primary-500/5 premium-shadow'
                      : 'border-app-border hover:border-app-text-secondary/20 hover:bg-app-bg'
                  }`}
                >
                  <span className="text-xl">{flag}</span>
                  <span className={`text-sm font-bold ${currentLang === key ? 'text-primary-600' : 'text-app-text-primary'}`}>{label}</span>
                </button>
              ))}
            </div>
            <p className="text-[10px] font-bold text-app-text-secondary/50 mt-3 px-1 italic">{t('settings.langNote')}</p>
          </div>
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection 
          icon={Bell} 
          title={t('settings.notifications')} 
          description={t('settings.notificationsDesc')} 
          colorClass="bg-amber-500/10 text-amber-600"
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4 py-3 border-b border-app-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-xl">
                  <Mail size={16} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-app-text-primary">Newsletter</p>
                  <p className="text-xs text-app-text-secondary mt-0.5">Terima tips buah & update terbaru via email</p>
                </div>
              </div>
              {newsletterChecking ? (
                <Loader2 size={18} className="animate-spin text-app-text-secondary" />
              ) : (
                <button
                  onClick={toggleNewsletter}
                  disabled={newsletterLoading}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${
                    newsletterSubscribed ? 'bg-emerald-500' : 'bg-app-border'
                  } ${newsletterLoading ? 'opacity-50' : ''}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
                    newsletterSubscribed ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              )}
            </div>
          </div>
        </SettingsSection>

        {/* Security & Account */}
        <SettingsSection 
          icon={Shield} 
          title={t('settings.security')} 
          description={t('settings.securityDesc')} 
          colorClass="bg-rose-500/10 text-rose-600"
        >
          <div className="space-y-4">
            <div className="flex flex-col gap-3">
              <Button variant="secondary" className="justify-start px-4" onClick={() => setShowPasswordModal(true)}>
                <Lock size={14} className="mr-3 opacity-60" /> {t('settings.changePassword')}
              </Button>
              <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 mt-2">
                <p className="text-[11px] font-black text-red-600 uppercase tracking-widest mb-1">{t('settings.dangerZone')}</p>
                <p className="text-[10px] font-bold text-red-500/70 mb-3">{t('settings.dangerDesc')}</p>
                <Button variant="danger" className="w-full bg-red-500 text-white shadow-red-500/20 py-2" onClick={() => setShowDeleteDialog(true)}>
                  <Trash2 size={14} className="mr-2" /> {t('settings.deleteAccount')}
                </Button>
              </div>
            </div>
          </div>
        </SettingsSection>
      </div>

      {/* Change Password Modal */}
      <Modal 
        isOpen={showPasswordModal} 
        onClose={() => setShowPasswordModal(false)} 
        title={t('settings.changePassword')}
        maxWidth="max-w-md"
        showFooter={false}
      >
        <form onSubmit={handleChangePassword} className="space-y-4 py-2">
          <input type="hidden" name="username" autoComplete="username" value={user?.email || ''} />
          <Input 
            label={t('settings.currentPassword')} 
            type="password" 
            autoComplete="current-password"
            required 
            placeholder={t('settings.currentPasswordPlaceholder')}
            value={passwordForm.oldPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
          />
          <div className="border-t border-app-border my-2" />
          <Input 
            label={t('settings.newPassword')} 
            type="password" 
            autoComplete="new-password"
            required 
            placeholder={t('settings.newPasswordPlaceholder')}
            helperText={t('settings.passwordHelper')}
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
          />
          <Input 
            label={t('settings.confirmNewPassword')} 
            type="password" 
            autoComplete="new-password"
            required 
            placeholder={t('settings.confirmNewPasswordPlaceholder')}
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
          />
          <div className="flex gap-3 pt-4">
            <Button type="submit" isLoading={passwordLoading} className="flex-1">
              <Key size={14} className="mr-2" /> {t('settings.savePassword')}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowPasswordModal(false)} disabled={passwordLoading}>
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Account Confirmation */}
      <ConfirmDialog 
        isOpen={showDeleteDialog}
        onClose={() => { setShowDeleteDialog(false); setDeleteConfirmPassword(''); }}
        onConfirm={handleDeleteAccount}
        isLoading={deleteLoading}
        title={t('settings.deleteTitle')}
        message={t('settings.deleteMessage')}
        confirmText={t('settings.deleteConfirm')}
        variant="danger"
      >
        <form className="mt-4 px-1" onSubmit={(e) => e.preventDefault()}>
          <input type="hidden" name="username" autoComplete="username" value={user?.email || ''} />
          <Input 
            label={t('settings.confirmPassword')} 
            placeholder={t('settings.deletePlaceholder')} 
            type="password"
            autoComplete="current-password"
            value={deleteConfirmPassword}
            onChange={(e) => setDeleteConfirmPassword(e.target.value)}
          />
          <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-xl mt-2">
            <AlertCircle size={16} className="text-amber-600 shrink-0" />
            <p className="text-[10px] font-bold text-amber-700 leading-tight">{t('settings.backupWarning')}</p>
          </div>
        </form>
      </ConfirmDialog>
    </div>
  );
};

export default SettingsPage;
