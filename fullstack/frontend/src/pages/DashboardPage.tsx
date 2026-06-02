import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import TIPS from '../data/tips.json';
import '../styles/tiptap.css';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';
import { sanitizeHtml } from '../utils/sanitize';
import { 
  Scan, 
  BookOpen, 
  MessageSquare, 
  Camera,
  ArrowRight,
  Leaf,
  Clock,
  CheckCircle,
  XCircle,
  Sparkles,
  Library,
} from 'lucide-react';
import { Skeleton, SkeletonList } from '../components/ui/PageLoader';
import { LottiePlayer } from '../components/ui/LottiePlayer';
import useSEO from '../hooks/useSEO';

interface ScanItem {
  id: number;
  object_name: string;
  is_consumable: boolean;
  confidence: number;
  createdAt: string;
}

interface Article {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string;
  image_url: string;
  createdAt: string;
}

const getDailyTipIndex = () => {
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  return dayOfYear % TIPS.length;
};

const DashboardPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const routePrefix = location.pathname.startsWith('/admin') ? '/admin' : '/user';
  const { t, i18n } = useTranslation();

  useSEO({
    title: 'Dashboard',
    description: t('dashboard.welcomeSubtitle'),
    robots: 'noindex, nofollow',
  });
  const [recentScans, setRecentScans] = useState<ScanItem[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingScans, setLoadingScans] = useState(true);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const tipIndex = getDailyTipIndex();

  const fetchRecentScans = useCallback(async () => {
    try {
      setLoadingScans(true);
      const res = await api.get('/scans?limit=5');
      setRecentScans((res.data.data || []).slice(0, 5));
    } catch { /* silent */ } finally { setLoadingScans(false); }
  }, []);

  const fetchArticles = useCallback(async () => {
    try {
      setLoadingArticles(true);
      const res = await api.get('/articles?published=true&limit=3');
      setArticles((res.data.data || []).slice(0, 3));
    } catch { /* silent */ } finally { setLoadingArticles(false); }
  }, []);

  useEffect(() => { fetchRecentScans(); fetchArticles(); }, [fetchRecentScans, fetchArticles]);

  const greetingKey = () => {
    const h = new Date().getHours();
    if (h < 12) return 'dashboard.greeting.morning';
    if (h < 17) return 'dashboard.greeting.afternoon';
    return 'dashboard.greeting.evening';
  };

  const tip = TIPS[tipIndex];

  return (
    <div className="space-y-6 pb-12 pt-4 max-w-6xl mx-auto">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl green-gradient p-6 sm:p-8 text-white">
        <div className="relative z-10">
          <p className="text-emerald-100/80 text-sm font-medium">{t(greetingKey())} 👋</p>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
            {user?.first_name || 'User'}
          </h1>
          <p className="text-emerald-100/70 text-sm mt-2 max-w-md">
            {t('dashboard.welcomeSubtitle')}
          </p>
        </div>
        <Leaf className="absolute -right-6 -bottom-6 w-40 h-40 text-white/5 rotate-12" />
        <Sparkles className="absolute right-8 top-6 w-6 h-6 text-white/20" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t('dashboard.quickActions.scan'), icon: Camera, to: `${routePrefix}/scans`, color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
          { label: t('dashboard.quickActions.askAI'), icon: MessageSquare, to: `${routePrefix}/conversations`, color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
          { label: t('dashboard.quickActions.encyclopedia'), icon: Library, to: '/ensiklopedia', color: 'bg-violet-500/10 text-violet-600 border-violet-500/20' },
          { label: t('dashboard.quickActions.history'), icon: Scan, to: `${routePrefix}/scans`, color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
        ].map(action => (
          <Link
            key={action.to}
            to={action.to}
            className={`flex flex-col items-center gap-2.5 p-5 rounded-2xl border ${action.color} hover:shadow-lg hover:-translate-y-0.5 transition-all group`}
          >
            <action.icon className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold">{action.label}</span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Scans */}
        <div className="lg:col-span-2 bg-app-surface border border-app-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-app-border">
            <div className="flex items-center gap-2">
              <Scan className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-black text-app-text-primary uppercase tracking-wider">{t('dashboard.recentScans')}</h3>
            </div>
            <Link to={`${routePrefix}/scans`} className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1">
              {t('dashboard.seeAll')} <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-app-border">
            {loadingScans ? (
              <div className="px-2 py-3"><SkeletonList rows={4} /></div>
            ) : recentScans.length === 0 ? (
              <div className="p-8 text-center">
                <LottiePlayer animation="empty" className="w-28 h-28 mx-auto -mb-2" />
                <p className="text-sm font-semibold text-app-text-secondary">{t('dashboard.noScansYet')}</p>
                <Link to={`${routePrefix}/scans`} className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl green-gradient text-white text-xs font-bold shadow-lg shadow-emerald-500/20 hover:brightness-110 transition-all">
                  <Camera className="w-3.5 h-3.5" /> {t('dashboard.scanNow')}
                </Link>
              </div>
            ) : recentScans.map(scan => (
              <div key={scan.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-app-bg/50 transition-colors">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 ${scan.is_consumable ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                  {scan.is_consumable ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-app-text-primary truncate">{scan.object_name || 'Buah'}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-black uppercase tracking-wider ${scan.is_consumable ? 'text-emerald-600' : 'text-red-600'}`}>
                      {scan.is_consumable ? t('dashboard.consumable') : t('dashboard.notConsumable')}
                    </span>
                    <span className="text-[10px] text-app-text-secondary">•</span>
                    <span className="text-[10px] text-app-text-secondary font-medium">{scan.confidence ? `${(scan.confidence * 100).toFixed(0)}%` : '-'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-app-text-secondary/60">
                  <Clock className="w-3 h-3" />
                  <span className="text-[10px] font-medium">{new Date(scan.createdAt).toLocaleDateString(i18n.language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short' })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tips of the Day */}
        <div className="bg-app-surface border border-app-border rounded-2xl p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl"><Leaf className="w-4 h-4" /></div>
            <h3 className="text-sm font-black text-app-text-primary uppercase tracking-wider">{t('dashboard.tipsOfDay')}</h3>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <div className="text-4xl mb-3">{tip.icon}</div>
            <h4 className="text-base font-bold text-app-text-primary mb-2">{tip.title}</h4>
            <p className="text-sm text-app-text-secondary leading-relaxed">{tip.body}</p>
          </div>
          <div className="mt-5 pt-4 border-t border-app-border">
            <Link to="/ensiklopedia" className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1">
              {t('dashboard.learnMore')} <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Latest Articles */}
      <div>
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-violet-600" />
            <h3 className="text-sm font-black text-app-text-primary uppercase tracking-wider">{t('dashboard.latestArticles')}</h3>
          </div>
          <Link to="/ensiklopedia" className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1">
            {t('dashboard.seeAll')} <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {loadingArticles ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-2xl border border-app-border bg-app-surface overflow-hidden">
                <Skeleton className="h-36 w-full rounded-none" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="bg-app-surface border border-app-border rounded-2xl p-8 text-center">
            <LottiePlayer animation="empty" className="w-28 h-28 mx-auto -mb-2" />
            <p className="text-sm font-semibold text-app-text-secondary">{t('dashboard.noArticles')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {articles.map(article => (
              <button
                key={article.id}
                type="button"
                onClick={() => setSelectedArticle(article)}
                className="text-left group bg-app-surface border border-app-border rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                {article.image_url ? (
                  <div className="h-36 overflow-hidden">
                    <img src={article.image_url} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                ) : (
                  <div className="h-36 bg-gradient-to-br from-primary-500/5 to-primary-500/10 flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-primary-500/20" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {article.category && (
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-primary-500/10 text-primary-600">
                        {article.category}
                      </span>
                    )}
                    <span className="text-[10px] text-app-text-secondary/50">
                      {new Date(article.createdAt).toLocaleDateString(i18n.language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-app-text-primary group-hover:text-primary-600 transition-colors line-clamp-2 leading-snug">
                    {article.title}
                  </h4>
                  {article.excerpt && (
                    <p className="text-xs text-app-text-secondary mt-1.5 line-clamp-2 leading-relaxed">{article.excerpt}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      {/* Article Detail Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto" onClick={() => setSelectedArticle(null)}>
          <div className="w-full max-w-3xl bg-app-surface rounded-2xl border border-app-border shadow-2xl my-8 overflow-hidden" onClick={e => e.stopPropagation()}>
            {selectedArticle.image_url && (
              <div className="h-48 sm:h-64 overflow-hidden">
                <img src={selectedArticle.image_url} alt={selectedArticle.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                {selectedArticle.category && (
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary-500/10 text-primary-600 border border-primary-500/20">
                    {selectedArticle.category}
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs text-app-text-secondary">
                  <Clock className="w-3 h-3" />
                  {new Date(selectedArticle.createdAt).toLocaleDateString(i18n.language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <h2 className="text-2xl font-black text-app-text-primary tracking-tight leading-tight">
                {selectedArticle.title}
              </h2>
              {selectedArticle.excerpt && (
                <p className="mt-3 text-sm text-app-text-secondary leading-relaxed">{selectedArticle.excerpt}</p>
              )}
              {selectedArticle.tags && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {selectedArticle.tags.split(',').map(tag => (
                    <span key={tag} className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-app-bg text-app-text-secondary border border-app-border">
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              )}
              {selectedArticle.content && (
                <div
                  className="mt-6 ProseMirror prose prose-sm max-w-none text-app-text-secondary leading-relaxed prose-headings:text-app-text-primary prose-headings:font-bold prose-a:text-primary-600 prose-strong:text-app-text-primary"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedArticle.content) }}
                />
              )}
              <div className="flex items-center gap-3 mt-8 pt-6 border-t border-app-border">
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="px-5 py-2.5 rounded-xl bg-app-bg text-app-text-secondary font-bold text-xs border border-app-border hover:brightness-95 transition-all"
                >
                  {t('dashboard.close')}
                </button>
                <Link
                  to="/ensiklopedia"
                  className="px-5 py-2.5 rounded-xl green-gradient text-white font-bold text-xs shadow-lg shadow-emerald-500/20 hover:brightness-110 transition-all flex items-center gap-2"
                >
                  {t('dashboard.seeAllArticles')} <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
