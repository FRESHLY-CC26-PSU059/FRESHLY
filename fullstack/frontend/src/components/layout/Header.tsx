import { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import ThemeToggle from '../theme/ThemeToggle';
import Avatar from '../ui/Avatar';
import { TestimonialForm, Modal } from '../ui';
import { Menu, PanelLeftClose, Search, Bell, X, User, LogOut, Settings, ChevronDown, Loader, MessageSquare } from 'lucide-react';
import notificationService, { type Notification } from '../../services/notification';
import testimonialApi from '../../services/testimonials';

const ADMIN_ROLES = ['admin', 'super_admin'];

// Quick search menu items
const SEARCH_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', adminPath: '/admin/dashboard', keywords: 'dashboard beranda home' },
  { label: 'Scan Buah', path: '/scans', adminPath: '/admin/scans', keywords: 'scan buah analisis foto kamera' },
  { label: 'Asisten AI', path: '/conversations', adminPath: '/admin/conversations', keywords: 'chat ai asisten percakapan tanya' },
  { label: 'Ensiklopedia', path: '/ensiklopedia', adminPath: '/admin/ensiklopedia', keywords: 'ensiklopedia buah artikel edukasi' },
  { label: 'Pengaturan', path: '/settings', adminPath: '/admin/settings', keywords: 'settings pengaturan tema bahasa' },
  { label: 'Profil', path: '/profile', adminPath: '/admin/profile', keywords: 'profil akun user' },
  { label: 'Users', path: '/admin/users', adminPath: '/admin/users', adminOnly: true, keywords: 'users pengguna kelola' },
  { label: 'Roles', path: '/admin/roles', adminPath: '/admin/roles', adminOnly: true, keywords: 'roles hak akses' },
  { label: 'Artikel', path: '/admin/articles', adminPath: '/admin/articles', adminOnly: true, keywords: 'artikel konten tulis' },
  { label: 'Knowledge Base', path: '/admin/knowledge', adminPath: '/admin/knowledge', adminOnly: true, keywords: 'knowledge base pengetahuan' },
  { label: 'Testimoni', path: '/admin/testimonials', adminPath: '/admin/testimonials', adminOnly: true, keywords: 'testimoni feedback ulasan' },
  { label: 'Newsletter', path: '/admin/newsletter', adminPath: '/admin/newsletter', adminOnly: true, keywords: 'newsletter email kirim subscriber' },
  { label: 'Audit Logs', path: '/admin/audit-logs', adminPath: '/admin/audit-logs', adminOnly: true, keywords: 'audit log aktivitas riwayat' },
];

interface HeaderProps {
  onMenuToggle?: () => void;
  sidebarOpen?: boolean;
}

const Header = ({ onMenuToggle, sidebarOpen = true }: HeaderProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [hasTestimonial, setHasTestimonial] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkTestimonial = async () => {
      if (user) {
        try {
          const response = await testimonialApi.getUserTestimonials();
          if (response.data?.data?.testimonials && response.data.data.testimonials.length > 0) {
            setHasTestimonial(true);
          } else {
            setHasTestimonial(false);
          }
        } catch {
          setHasTestimonial(false);
        }
      } else {
        setHasTestimonial(false);
      }
    };

    checkTestimonial();

    const handleTestimonialSubmitted = () => {
      checkTestimonial();
    };

    window.addEventListener('testimonial-submitted', handleTestimonialSubmitted);
    return () => {
      window.removeEventListener('testimonial-submitted', handleTestimonialSubmitted);
    };
  }, [user]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchFocused(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Fetch notifications when dropdown is opened
  useEffect(() => {
    if (showNotifications && notifications.length === 0) {
      fetchNotifications();
    }
  }, [showNotifications]);

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const result = await notificationService.getNotifications(10, 0);
      setNotifications(result?.data || []);
    } catch (error) {
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
    } catch { /* silent */ }
  };

  const handleNotificationClick = async (notif: Notification) => {
    setSelectedNotification(notif);
    setShowNotifications(false);
    if (!notif.isRead) {
      await handleMarkAsRead(notif.id);
    }
  };

  const isAdmin = useMemo(() => ADMIN_ROLES.includes(user?.role || ''), [user?.role]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return SEARCH_ITEMS
      .filter(item => {
        if (item.adminOnly && !isAdmin) return false;
        return item.label.toLowerCase().includes(q) || item.keywords.includes(q);
      })
      .slice(0, 6);
  }, [searchQuery, isAdmin]);

  const handleSearchSelect = (item: typeof SEARCH_ITEMS[0]) => {
    navigate(isAdmin ? item.adminPath : item.path);
    setSearchQuery('');
    setSearchFocused(false);
  };

  const API_URL = 'http://localhost:5000';
  const avatarSrc = user?.imgUrl ? (user.imgUrl.startsWith('http') ? user.imgUrl : `${API_URL}${user.imgUrl}`) : null;
  const fullName = user ? `${user.first_name} ${user.last_name}`.trim() : 'User';

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center border-b border-app-border px-4 md:px-6" style={{ backgroundColor: 'var(--app-side-bg)' }}>
      <button type="button" onClick={onMenuToggle} className="rounded-xl p-2 text-app-text-secondary hover:bg-app-bg hover:text-app-text-primary transition-all shrink-0 mr-3">
        {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Search with floating results */}
      <div className="relative flex-1 max-w-none sm:max-w-md" ref={searchRef}>
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-app-text-secondary/40" />
        <input
          type="text"
          placeholder="Cari menu..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          className="w-full rounded-xl border border-app-border bg-app-bg/40 py-2.5 pl-10 pr-4 text-sm font-medium text-app-text-primary placeholder:text-app-text-secondary/40 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 focus:outline-none transition-all"
        />
        {/* Floating search results */}
        {searchFocused && searchResults.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 rounded-xl border border-app-border bg-app-surface shadow-2xl overflow-hidden z-50">
            {searchResults.map(item => (
              <button
                key={item.label}
                type="button"
                onClick={() => handleSearchSelect(item)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-app-bg transition-all"
              >
                <Search className="w-3.5 h-3.5 text-app-text-secondary/40 shrink-0" />
                <span className="text-sm font-medium text-app-text-primary">{item.label}</span>
                {item.adminOnly && <span className="text-[9px] font-bold text-app-text-secondary/40 uppercase tracking-wider ml-auto">Admin</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="hidden sm:block flex-1" />

      <div className="flex items-center gap-1 sm:gap-2">
        {!isAdmin && !hasTestimonial && (
          <button 
            type="button"
            onClick={() => setFeedbackModalOpen(true)}
            title="Berikan Feedback"
            className="rounded-xl p-2 text-app-text-secondary hover:bg-app-bg hover:text-app-text-primary transition-all"
          >
            <MessageSquare className="h-5 w-5" />
          </button>
        )}
        <ThemeToggle />

        <div className="relative" ref={notifRef}>
          <button type="button" onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }} className="relative rounded-xl p-2 text-app-text-secondary hover:bg-app-bg hover:text-app-text-primary transition-all">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <div className="fixed sm:absolute right-2 sm:right-0 top-16 sm:top-full sm:mt-2 w-[calc(100vw-1rem)] sm:w-80 rounded-2xl border border-app-border bg-app-surface shadow-2xl overflow-hidden z-50">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-app-border">
                <h3 className="text-sm font-bold text-app-text-primary">Notifikasi</h3>
                <button onClick={() => setShowNotifications(false)} className="p-1 rounded-lg text-app-text-secondary hover:text-app-text-primary"><X className="w-4 h-4" /></button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {loadingNotifications ? (
                  <div className="p-8 text-center">
                    <Loader className="w-5 h-5 text-primary-500 mx-auto mb-3 animate-spin" />
                    <p className="text-xs text-app-text-secondary font-medium">Memuat notifikasi...</p>
                  </div>
                ) : notifications.length > 0 ? (
                  <div className="divide-y divide-app-border">
                    {notifications.map(notif => (
                      <button
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`w-full text-left px-5 py-3 hover:bg-app-bg/50 transition-all ${notif.isRead ? 'opacity-60' : 'bg-primary-500/5'}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-bold text-app-text-primary">{notif.title}</p>
                            <p className="text-xs text-app-text-secondary mt-1 line-clamp-2">{notif.body}</p>
                          </div>
                          {!notif.isRead && <div className="mt-1.5 w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />}
                        </div>
                        <p className="text-[10px] text-app-text-secondary/50 mt-2">
                          {new Date(notif.createdAt).toLocaleDateString('id-ID')}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Bell className="w-8 h-8 text-app-text-secondary/20 mx-auto mb-3" />
                    <p className="text-sm font-bold text-app-text-secondary">Belum ada notifikasi</p>
                  </div>
                )}
              </div>
              {isAdmin && (
                <div className="border-t border-app-border p-3">
                  <Link 
                    to="/admin/notifications" 
                    onClick={() => setShowNotifications(false)}
                    className="block w-full text-center px-4 py-2.5 rounded-xl bg-primary-500/10 text-primary-600 font-bold text-sm hover:bg-primary-500/20 transition-all"
                  >
                    📢 Pusat Notifikasi
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {user && (
          <div className="relative" ref={profileRef}>
            <button type="button" onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }} className="flex items-center gap-2 ml-1 pl-3 border-l border-app-border rounded-xl py-1.5 pr-2 hover:bg-app-bg transition-all">
              <Avatar src={avatarSrc} name={fullName} size="md" />
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-app-text-primary leading-none">{user.first_name}</p>
                <p className="text-[10px] text-app-text-secondary capitalize leading-tight mt-0.5">{user.role}</p>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-app-text-secondary transition-transform ${showProfile ? 'rotate-180' : ''}`} />
            </button>
            {showProfile && (
              <div className="fixed sm:absolute right-2 sm:right-0 top-16 sm:top-full sm:mt-2 w-[calc(100vw-1rem)] sm:w-60 rounded-2xl border border-app-border bg-app-surface shadow-2xl overflow-hidden z-50">
                <div className="p-4 border-b border-app-border">
                  <p className="text-sm font-bold text-app-text-primary">{user.first_name} {user.last_name}</p>
                  <p className="text-xs text-app-text-secondary truncate mt-0.5">{user.email}</p>
                </div>
                <div className="p-2">
                  <Link 
                    to={isAdmin ? "/admin/profile" : "/user/profile"} 
                    onClick={() => setShowProfile(false)} 
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-app-text-secondary hover:bg-app-bg hover:text-app-text-primary transition-all"
                  >
                    <User className="w-4 h-4" /> Profil Saya
                  </Link>
                  <Link 
                    to={isAdmin ? "/admin/settings" : "/user/settings"} 
                    onClick={() => setShowProfile(false)} 
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-app-text-secondary hover:bg-app-bg hover:text-app-text-primary transition-all"
                  >
                    <Settings className="w-4 h-4" /> Pengaturan
                  </Link>
                  <div className="border-t border-app-border my-1" />
                  <button type="button" onClick={() => { setShowProfile(false); logout(); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 transition-all"><LogOut className="w-4 h-4" /> Keluar</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      <TestimonialForm 
        isOpen={feedbackModalOpen} 
        onClose={() => setFeedbackModalOpen(false)} 
      />

      <Modal
        isOpen={selectedNotification !== null}
        onClose={() => setSelectedNotification(null)}
        title={selectedNotification?.title || 'Detail Notifikasi'}
        showFooter={true}
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs text-app-text-secondary/60">
            <span className="font-black uppercase tracking-wider bg-primary-500/10 text-primary-600 px-2.5 py-1 rounded-lg">
              {selectedNotification?.type || 'info'}
            </span>
            <span>•</span>
            <span>
              {selectedNotification?.createdAt && new Date(selectedNotification.createdAt).toLocaleString('id-ID', {
                dateStyle: 'long',
                timeStyle: 'short'
              })}
            </span>
          </div>
          <div className="text-sm font-medium text-app-text-primary leading-relaxed whitespace-pre-line">
            {selectedNotification?.body}
          </div>
        </div>
      </Modal>
    </header>
  );
};

export default Header;
