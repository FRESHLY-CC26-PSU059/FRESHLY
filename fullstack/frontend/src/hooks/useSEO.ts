import { useEffect } from 'react';
import { BRAND } from '../constants/brand';

interface SEOOptions {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  ogUrl?: string;
  ogType?: 'website' | 'article' | 'profile';
  robots?: string;
  rawTitle?: string;
}

const setMeta = (key: 'name' | 'property', value: string, content: string) => {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${key}="${value}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(key, value);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

const setCanonical = (href: string) => {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
};

export const useSEO = (opts: SEOOptions = {}) => {
  const {
    title,
    description = BRAND.description,
    keywords,
    ogImage,
    ogUrl,
    ogType = 'website',
    robots = 'index, follow',
    rawTitle,
  } = opts;

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const finalTitle =
      rawTitle ??
      (title ? `${title} - ${BRAND.name}` : `${BRAND.name} - ${BRAND.tagline}`);
    document.title = finalTitle;

    setMeta('name', 'description', description);
    setMeta('name', 'robots', robots);

    const finalKeywords = keywords && keywords.length
      ? [...new Set([...keywords, ...BRAND.keywords])].join(', ')
      : BRAND.keywords.join(', ');
    setMeta('name', 'keywords', finalKeywords);

    const url =
      ogUrl ??
      (typeof window !== 'undefined' ? window.location.origin + window.location.pathname : BRAND.siteUrl);
    setCanonical(url);

    setMeta('property', 'og:title', finalTitle);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:type', ogType);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:image', ogImage ?? `${BRAND.siteUrl}/og-image.svg`);
    setMeta('property', 'og:site_name', BRAND.name);
    setMeta('property', 'og:locale', BRAND.locale);

    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', finalTitle);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', ogImage ?? `${BRAND.siteUrl}/og-image.svg`);
    setMeta('name', 'twitter:site', BRAND.twitterHandle);
  }, [title, rawTitle, description, keywords, ogImage, ogUrl, ogType, robots]);
};

export default useSEO;
