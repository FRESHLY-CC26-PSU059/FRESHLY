import { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { BookOpen, Leaf, Search, ArrowLeft, Clock, Tag, ChevronRight, Library, Apple, Citrus } from 'lucide-react';
import '../styles/tiptap.css';
import { LottiePlayer } from '../components/ui/LottiePlayer';
import LandingNavbar from '../components/landing/LandingNavbar';
import LandingFooter from '../components/landing/LandingFooter';
import ThemeToggle from '../components/theme/ThemeToggle';
import Logo from '../components/ui/Logo';
import { useAuth } from '../hooks/useAuth';
import useSEO from '../hooks/useSEO';
import api from '../api/axios';
import { sanitizeHtml } from '../utils/sanitize';

// Uploads live at /uploads on the backend origin, not under /api/v1.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
const API_ORIGIN = (() => {
  try {
    return new URL(API_URL).origin;
  } catch {
    return API_URL.replace(/\/api\/v\d+\/?$/, '');
  }
})();

const resolveImageSrc = (url?: string | null) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
};

interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  image_url: string;
  tags: string;
  createdAt: string;
  author?: {
    first_name: string;
    last_name: string;
  };
}

const CATEGORIES = [
  { key: '', icon: Library },
  { key: 'encyclopedia', icon: BookOpen },
  { key: 'fruit', icon: Apple },
  { key: 'nutrition', icon: Citrus },
  { key: 'tips', icon: Leaf },
  { key: 'storage', icon: Tag },
];

const SvgPlaceholder = ({ title }: { title: string }) => {
  const cleanTitle = title.length > 40 ? title.substring(0, 37) + '...' : title;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225" className="w-full h-full">
      <rect width="400" height="225" fill="#f0fdf4" />
      <defs>
        <linearGradient id="placeholderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      <rect width="400" height="225" fill="url(#placeholderGrad)" />
      <circle cx="200" cy="85" r="35" fill="#ffffff" />
      <path d="M190,85 C190,70 200,65 210,65 C210,77 202,90 190,92.5 Z" fill="#10b981" />
      <path d="M190,85 C190,92.5 197.5,100 207.5,95 C215,90 210,77 210,77" fill="#34d399" />
      <path d="M187.5,95 L192.5,90" stroke="#047857" strokeWidth="1.5" strokeLinecap="round" />
      <text x="200" y="150" fontFamily="system-ui, -apple-system, sans-serif" fontSize="14" fontWeight="800" fill="#065f46" textAnchor="middle">{cleanTitle}</text>
      <text x="200" y="175" fontFamily="system-ui, -apple-system, sans-serif" fontSize="10" fontWeight="600" fill="#047857" textAnchor="middle" opacity="0.7">Artikel Edukasi Freshly</text>
    </svg>
  );
};

// ── Article Detail View ──
const ArticleDetail = ({ 
  article, 
  suggestions, 
  onBack 
}: { 
  article: Article; 
  suggestions: Article[]; 
  onBack: () => void 
}) => {
  const { t, i18n } = useTranslation();
  return (
    <div className="min-h-screen bg-app-bg text-app-text-primary">
      {/* Simple top bar */}
      <header className="sticky top-0 z-50 border-b border-app-border bg-app-surface/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 md:px-8">
          <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-app-text-secondary hover:text-app-accent transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {t('encyclopedia.backToList')}
          </button>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/" aria-label="Freshly home"><Logo size={24} noDot /></Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 md:px-8 py-10 md:py-16 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Content */}
        <article className="lg:col-span-8">
          {/* Category + Date + Author */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {article.category && (
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-app-accent/10 text-app-accent border border-app-accent/20">
                {article.category}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-app-text-secondary">
              <Clock className="w-3 h-3" />
              {new Date(article.createdAt).toLocaleDateString(i18n.language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            {article.author && (
              <span className="text-xs text-app-text-secondary font-medium">
                {t('encyclopedia.byAuthor', { author: `${article.author.first_name} ${article.author.last_name}` })}
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-app-text-primary tracking-tight leading-tight">
            {article.title}
          </h1>

          {article.excerpt && (
            <p className="mt-4 text-lg text-app-text-secondary leading-relaxed">{article.excerpt}</p>
          )}

          {article.image_url ? (
            <img src={resolveImageSrc(article.image_url) || ''} alt={article.title} className="w-full h-64 md:h-80 object-cover rounded-2xl mt-8" />
          ) : (
            <div className="w-full h-64 md:h-80 rounded-2xl mt-8 overflow-hidden">
              <SvgPlaceholder title={article.title} />
            </div>
          )}

          {article.tags && (
            <div className="flex flex-wrap gap-2 mt-6">
              {article.tags.split(',').map(tag => (
                <span key={tag} className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-app-bg text-app-text-secondary border border-app-border">
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}

          <div
            className="ProseMirror mt-10 text-app-text-secondary leading-relaxed max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }}
          />
        </article>

        {/* Sidebar Suggestions */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="sticky top-[130px] space-y-6">
            <h3 className="text-base font-black uppercase tracking-widest text-app-text-primary border-b border-app-border pb-3">
              {t('encyclopedia.suggestions')}
            </h3>
            {suggestions.length > 0 ? (
              <div className="space-y-5">
                {suggestions.map(item => (
                  <Link
                    key={item.id}
                    to={`/ensiklopedia/${item.slug}`}
                    className="flex gap-4 group text-left items-start"
                  >
                    {item.image_url ? (
                      <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl border border-app-border">
                        <img src={resolveImageSrc(item.image_url) || ''} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                    ) : (
                      <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl border border-app-border">
                        <SvgPlaceholder title={item.title} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="inline-block text-[9px] font-black uppercase text-app-accent tracking-wider mb-1">
                        {item.category}
                      </span>
                      <h4 className="text-sm font-bold text-app-text-primary group-hover:text-app-accent transition-colors line-clamp-2 leading-snug">
                        {item.title}
                      </h4>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-app-text-secondary">{t('encyclopedia.noSuggestions')}</p>
            )}
          </div>
        </aside>
      </div>

      <LandingFooter />
    </div>
  );
};

// ── Main Ensiklopedia Page ──
const EnsiklopediaPage = () => {
  const { isAuthenticated, logout } = useAuth();
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const selectArticleBySlug = useCallback(async (slugToFetch: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/articles/${slugToFetch}`);
      setSelectedArticle(res.data.data.article);
    } catch {
      toast.error(t('encyclopedia.loadDetailFailed'));
      navigate('/ensiklopedia', { replace: true });
    } finally {
      setLoading(false);
    }
  }, [navigate, t]);

  useEffect(() => {
    if (slug) {
      selectArticleBySlug(slug);
    } else {
      setSelectedArticle(null);
    }
  }, [slug, selectArticleBySlug]);

  useSEO({
    title: t('encyclopedia.seoTitle'),
    description: t('encyclopedia.seoDescription'),
    keywords: ['ensiklopedia buah', 'ensiklopedia sayur', 'tips penyimpanan', 'nutrisi buah'],
  });

  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { published: true };
      if (activeCategory) params.category = activeCategory;
      const res = await api.get('/articles', { params });
      setArticles(res.data.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);

  const filtered = articles.filter(a =>
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.tags || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.excerpt || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const navItems = useMemo(() => [
    { label: t('encyclopedia.navHome'), href: '/' },
    { label: t('encyclopedia.title'), href: '/ensiklopedia' },
  ], [t]);

  if (selectedArticle) {
    return (
      <ArticleDetail 
        article={selectedArticle} 
        suggestions={articles.filter(a => a.slug !== selectedArticle.slug).slice(0, 4)} 
        onBack={() => navigate('/ensiklopedia')} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-app-bg text-app-text-primary">
      <LandingNavbar navItems={navItems} isAuthenticated={isAuthenticated} onLogout={logout} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-app-bg border-b border-app-border">
        <div className="absolute -left-20 top-10 h-56 w-56 rounded-full bg-app-accent/5 blur-3xl" />
        <div className="absolute right-10 bottom-0 h-40 w-40 rounded-full bg-app-accent/5 blur-3xl" />
        <div className="mx-auto max-w-6xl px-5 md:px-8 py-16 md:py-20 text-center relative">
          <div className="inline-flex items-center rounded-full border border-app-border bg-app-surface px-4 py-1.5 text-[11px] font-semibold tracking-[0.2em] text-app-text-secondary mb-6">
            {t('encyclopedia.title').toUpperCase()}
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-app-text-primary tracking-tight leading-tight">
            {t('encyclopedia.heroTitle')}<br />
            <span className="text-app-accent">{t('encyclopedia.heroTitleAccent')}</span>
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-app-text-secondary leading-relaxed">
            {t('encyclopedia.heroSubtitle')}
          </p>

          {/* Search */}
          <div className="mt-8 max-w-lg mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-app-text-secondary/50" />
            <input
              type="text"
              placeholder={t('encyclopedia.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl bg-app-surface border border-app-border py-4 pl-12 pr-5 text-sm text-app-text-primary placeholder:text-app-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-app-accent/30 focus:border-app-accent transition-all"
            />
          </div>
        </div>
      </section>

      {/* Category Tabs */}
      <section className="border-b border-app-border bg-app-surface/90 backdrop-blur sticky top-[65px] z-40">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="flex gap-1 overflow-x-auto hide-scrollbar py-3">
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all shrink-0 ${
                  activeCategory === cat.key
                    ? 'bg-app-accent text-app-accent-contrast shadow-sm'
                    : 'text-app-text-secondary hover:bg-app-bg hover:text-app-text-primary'
                }`}
              >
                <cat.icon className="w-4 h-4" />
                {cat.key ? t('encyclopedia.categories.' + cat.key) : t('encyclopedia.categories.all')}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="mx-auto max-w-6xl px-5 md:px-8 py-10 md:py-16">
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="rounded-2xl border border-app-border bg-app-surface overflow-hidden animate-pulse">
                <div className="h-44 bg-app-bg" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-app-bg rounded w-3/4" />
                  <div className="h-3 bg-app-bg rounded w-full" />
                  <div className="h-3 bg-app-bg rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <LottiePlayer animation="empty" className="w-32 h-32 mx-auto" />
            <h3 className="text-lg font-bold text-app-text-primary">
              {searchTerm ? t('encyclopedia.noResults') : t('landing.encyclopedia.noArticles')}
            </h3>
            <p className="text-sm text-app-text-secondary mt-2 max-w-sm mx-auto">
              {searchTerm
                ? t('encyclopedia.noResultsDesc', { searchTerm })
                : t('encyclopedia.noArticlesDesc')}
            </p>
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="mt-4 px-4 py-2 rounded-xl text-sm font-bold text-app-accent hover:bg-app-accent/10 transition-all">
                {t('encyclopedia.resetSearch')}
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-app-text-secondary">
                {t('encyclopedia.showingArticlesPrefix')} <span className="font-bold text-app-text-primary">{filtered.length}</span> {t('encyclopedia.showingArticlesSuffix')}
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map(article => (
                <button
                  key={article.id}
                  type="button"
                  onClick={() => navigate(`/ensiklopedia/${article.slug}`)}
                  className="text-left rounded-2xl border border-app-border bg-app-surface overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                >
                  {article.image_url ? (
                    <div className="h-44 overflow-hidden">
                      <img src={resolveImageSrc(article.image_url) || ''} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                   ) : (
                     <div className="h-44 overflow-hidden">
                       <SvgPlaceholder title={article.title} />
                     </div>
                   )}
                  <div className="p-5">
                     <div className="flex items-center gap-2 mb-3">
                       {article.category && (
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-app-accent/10 text-app-accent">
                            {article.category}
                          </span>
                       )}
                       <span className="text-[10px] text-app-text-secondary/50">
                         {new Date(article.createdAt).toLocaleDateString(i18n.language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short' })}
                       </span>
                     </div>
                     <h3 className="text-base font-bold text-app-text-primary group-hover:text-app-accent transition-colors line-clamp-2 leading-snug">
                       {article.title}
                     </h3>
                    {article.author && (
                      <p className="text-[10px] text-app-text-secondary mt-1 font-medium italic">
                        {t('encyclopedia.byAuthor', { author: `${article.author.first_name} ${article.author.last_name}` })}
                      </p>
                    )}
                    {article.excerpt && (
                      <p className="text-xs text-app-text-secondary mt-2 line-clamp-2 leading-relaxed">{article.excerpt}</p>
                    )}
                     <div className="flex items-center gap-1 mt-4 text-xs font-bold text-app-accent group-hover:gap-2 transition-all">
                       {t('encyclopedia.readMore')} <ChevronRight className="w-3 h-3" />
                     </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </section>

      <LandingFooter />
    </div>
  );
};

export default EnsiklopediaPage;
