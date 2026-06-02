import { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, BookOpen, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import FeatureGrid from '../components/landing/FeatureGrid';
import HeroSection from '../components/landing/HeroSection';
import HowItWorks from '../components/landing/HowItWorks';
import LandingFooter from '../components/landing/LandingFooter';
import LandingNavbar from '../components/landing/LandingNavbar';
import SectionHeader from '../components/landing/SectionHeader';
import StatsStrip from '../components/landing/StatsStrip';
import TestimonialGrid from '../components/landing/TestimonialGrid';
import type { FeatureItem, NavItem, StatItem, StepItem } from '../components/landing/types';
import { useAuth } from '../hooks/useAuth';
import useSEO from '../hooks/useSEO';
import { statsApi } from '../services/stats';
import testimonialApi from '../services/testimonials';
import api from '../api/axios';

interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  image_url: string;
  createdAt: string;
  author?: {
    first_name: string;
    last_name: string;
  };
}

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

const Landing = () => {
  const { isAuthenticated, logout } = useAuth();
  const { t, i18n } = useTranslation();

  const navItems = useMemo<NavItem[]>(() => [
    { label: t('landing.nav.features'), href: '#fitur' },
    { label: t('landing.nav.howItWorks'), href: '#cara-kerja' },
    { label: t('landing.nav.encyclopedia'), href: '#ensiklopedia' },
    { label: t('landing.nav.testimonials'), href: '#testimoni' },
  ], [t]);

  const defaultStats = useMemo<StatItem[]>(() => [
    { value: '0+', label: t('landing.stats.analyzed') },
    { value: '94%', label: t('landing.stats.accuracy') },
    { value: '6', label: t('landing.stats.varieties') },
    { value: '<2 dtk', label: t('landing.stats.speed') },
  ], [t]);

  const features = useMemo<FeatureItem[]>(() => [
    {
      title: t('landing.features.scanTitle'),
      description: t('landing.features.scanDesc'),
      icon: 'scan',
    },
    {
      title: t('landing.features.classifyTitle'),
      description: t('landing.features.classifyDesc'),
      icon: 'report',
    },
    {
      title: t('landing.features.encyclopediaTitle'),
      description: t('landing.features.encyclopediaDesc'),
      icon: 'book',
    },
  ], [t]);

  const steps = useMemo<StepItem[]>(() => [
    { title: t('landing.steps.photoTitle'), description: t('landing.steps.photoDesc'), icon: 'upload' },
    { title: t('landing.steps.aiTitle'), description: t('landing.steps.aiDesc'), icon: 'chip' },
    { title: t('landing.steps.resultTitle'), description: t('landing.steps.resultDesc'), icon: 'report' },
    { title: t('landing.steps.saveTitle'), description: t('landing.steps.saveDesc'), icon: 'save' },
  ], [t]);

  const [statsData, setStatsData] = useState<{
    totalScans: number;
    accuracy: number;
    uniqueVarieties: number;
    processingTime: string;
  } | null>(null);

  const stats = useMemo<StatItem[]>(() => {
    if (!statsData) return defaultStats;
    const { totalScans, accuracy, uniqueVarieties, processingTime } = statsData;
    return [
      {
        value: totalScans >= 1000 ? `${(totalScans / 1000).toFixed(1)}k+` : `${totalScans}+`,
        label: t('landing.stats.analyzed'),
      },
      { value: `${accuracy}%`, label: t('landing.stats.accuracy') },
      { value: `${uniqueVarieties}`, label: t('landing.stats.varieties') },
      { value: `<${processingTime} dtk`, label: t('landing.stats.speed') },
    ];
  }, [statsData, defaultStats, t]);

  const [statsLoading, setStatsLoading] = useState(true);
  const [uniqueVarieties, setUniqueVarieties] = useState<number | undefined>(undefined);
  const [testimonialsData, setTestimonialsData] = useState<any[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(false);

  useSEO({
    rawTitle: `Freshly - ${t('common.tagline')}`,
    description: t('common.slogan'),
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        const response = await statsApi.getPlatformStats();
        const data = response.data.data;
        if (data) {
          const totalScans = Number(data.totalScans) || 0;
          const uniqueVarieties = Number(data.uniqueVarieties) || 0;
          const accuracy = Number(data.accuracy) || 0;
          const processingTime = data.avgProcessingTime;

          setUniqueVarieties(uniqueVarieties);

          if (totalScans > 0) {
            setStatsData({
              totalScans,
              accuracy,
              uniqueVarieties,
              processingTime,
            });
          }
        }
      } catch {
        // Keep default stats on error
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const fetchArticles = useCallback(async () => {
    try {
      setArticlesLoading(true);
      const res = await api.get('/articles', { params: { published: true, limit: 3 } });
      setArticles(res.data.data || []);
    } catch {
      // silent
    } finally {
      setArticlesLoading(false);
    }
  }, []);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const response = await testimonialApi.getPublic(1, 50);
        const apiTestimonials = response.data.data.testimonials.map((item: any) => {
          const firstName = item.user?.first_name || '';
          const lastName = item.user?.last_name || '';
          const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
          return {
            id: item.id,
            name: `${firstName} ${lastName}`,
            role: t('landing.testimonials.freshlyUser'),
            quote: item.message,
            rating: item.rating,
            initials,
          };
        });
        setTestimonialsData(apiTestimonials);
      } catch {
        // Fallback to empty on error
        setTestimonialsData([]);
      }
    };

    fetchTestimonials();
  }, [t]);

  const filteredNavItems = useMemo(() => {
    if (testimonialsData.length === 0) {
      return navItems.filter((item) => item.href !== '#testimoni');
    }
    return navItems;
  }, [testimonialsData, navItems]);

  return (
    <div className="min-h-screen bg-app-bg text-app-text-primary transition-colors duration-300 overflow-hidden">
      {/* Animated background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-96 h-96 bg-gradient-radial from-app-accent/20 to-transparent rounded-full blur-3xl opacity-40 animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-radial from-app-accent/15 to-transparent rounded-full blur-3xl opacity-30 animate-pulse" style={{ animationDuration: '8s', animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-gradient-radial from-app-accent/10 to-transparent rounded-full blur-3xl opacity-25 animate-pulse" style={{ animationDuration: '7s', animationDelay: '2s' }} />
      </div>
      
      <div className="relative z-10">
        <LandingNavbar navItems={filteredNavItems} isAuthenticated={isAuthenticated} onLogout={logout} />
        <HeroSection uniqueVarieties={uniqueVarieties} isAuthenticated={isAuthenticated} />
        <StatsStrip items={stats} loading={statsLoading} />

        <section id="fitur" className="scroll-mt-nav bg-app-bg py-14 md:py-20">
          <div className="mx-auto w-full max-w-6xl px-5 md:px-8 mb-10">
            <SectionHeader title={t('landing.sections.featuresTitle')} pillText={t('landing.sections.featuresPill')} />
          </div>
          <FeatureGrid items={features} />
        </section>

        <section id="cara-kerja" className="scroll-mt-nav bg-app-bg py-14 md:py-20">
          <div className="mx-auto w-full max-w-6xl px-5 md:px-8 mb-10">
            <SectionHeader title={t('landing.sections.howItWorksTitle')} pillText={t('landing.sections.howItWorksPill')} />
          </div>
          <HowItWorks steps={steps} />
        </section>

        <section id="ensiklopedia" className="scroll-mt-nav bg-app-bg py-14 md:py-20">
          <div className="mx-auto w-full max-w-6xl px-5 md:px-8 mb-10">
            <SectionHeader title={t('landing.sections.encyclopediaTitle')} pillText={t('landing.sections.encyclopediaPill')} />
          </div>        
        <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
          {articlesLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-2xl border border-app-border bg-app-surface overflow-hidden animate-pulse shadow-lg">
                  <div className="h-48 bg-gradient-to-br from-app-bg to-app-surface" />
                  <div className="p-6 space-y-4">
                    <div className="h-5 bg-app-bg rounded-lg w-4/5" />
                    <div className="h-4 bg-app-bg rounded-lg w-full" />
                    <div className="h-4 bg-app-bg rounded-lg w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : articles.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article, idx) => (
                <Link
                  key={article.id}
                  to={`/ensiklopedia/${article.slug}`}
                  className="text-left rounded-2xl border border-app-border/60 bg-app-surface overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group shadow-lg hover:border-app-accent/40"
                  style={{
                    animation: `fadeInUp 0.6s ease-out ${idx * 100}ms both`,
                  }}
                >
                  <style>{`
                    @keyframes fadeInUp {
                      from {
                        opacity: 0;
                        transform: translateY(20px);
                      }
                      to {
                        opacity: 1;
                        transform: translateY(0);
                      }
                    }
                  `}</style>
                  
                  {article.image_url ? (
                    <div className="aspect-video w-full overflow-hidden bg-gradient-to-br from-app-accent/20 to-app-bg relative">
                      <img 
                        src={resolveImageSrc(article.image_url) || ''} 
                        alt={article.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-app-bg/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  ) : (
                    <div className="aspect-video w-full overflow-hidden relative">
                       <SvgPlaceholder title={article.title} />
                     </div>
                  )}
                  
                  <div className="p-6 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      {article.category && (
                        <span className="px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-widest bg-gradient-to-r from-app-accent/20 to-app-accent/10 text-app-accent border border-app-accent/30">
                          {article.category}
                        </span>
                      )}
                      <span className="text-[11px] text-app-text-secondary/60 font-medium">
                        {new Date(article.createdAt).toLocaleDateString(i18n.language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-extrabold text-app-text-primary group-hover:text-app-accent transition-colors duration-300 line-clamp-2 leading-tight">
                      {article.title}
                    </h3>
                    
                    {article.author && (
                      <p className="text-[11px] text-app-text-secondary/70 font-medium">
                        ✍️ {article.author.first_name} {article.author.last_name}
                      </p>
                    )}
                    
                    {article.excerpt && (
                      <p className="text-sm text-app-text-secondary line-clamp-2 leading-relaxed">{article.excerpt}</p>
                    )}
                    
                    <div className="pt-3 flex items-center gap-2 text-sm font-bold text-app-accent group-hover:gap-3 transition-all duration-300">
                      {t('landing.encyclopedia.readMore')} 
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gradient-to-br from-app-surface to-app-bg/50 rounded-2xl border border-app-border/50 shadow-lg">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-app-accent/10 mb-4">
                <BookOpen className="w-8 h-8 text-app-accent/60" />
              </div>
              <p className="text-app-text-secondary font-medium">{t('landing.encyclopedia.noArticles')}</p>
              <p className="text-xs text-app-text-secondary/60 mt-1">{t('landing.encyclopedia.comingSoon')}</p>
            </div>
          )}

          <div className="mt-12 flex justify-center">
            <Link 
              to="/ensiklopedia" 
              className="group inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-app-accent to-app-accent/80 text-white font-extrabold text-base hover:shadow-2xl hover:shadow-app-accent/30 transition-all duration-500 active:scale-95 border border-app-accent/40 hover:border-app-accent"
            >
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
              {t('landing.encyclopedia.viewAll')}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>
        </div>
      </section>

        {testimonialsData.length > 0 && (
          <section id="testimoni" className="scroll-mt-nav bg-app-bg py-14 md:py-20 pb-20 md:pb-28">
            <div className="mx-auto w-full max-w-6xl px-5 md:px-8 mb-10">
              <SectionHeader title={t('landing.sections.testimonialsTitle', { count: testimonialsData.length })} pillText={t('landing.sections.testimonialsPill')} />
            </div>
            <TestimonialGrid items={testimonialsData} />
          </section>
        )}

      <LandingFooter />
      </div>
    </div>
  );
};

export default Landing;
