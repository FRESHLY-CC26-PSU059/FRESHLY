import { Loader2 } from 'lucide-react';

interface PageLoaderProps {
  /** Full page centered spinner (default) */
  variant?: 'page' | 'section' | 'inline';
  /** Optional loading text */
  text?: string;
}

/**
 * Reusable loading component with multiple variants:
 * - `page`: Full page centered spinner with text
 * - `section`: Section-level loader (smaller, no full height)
 * - `inline`: Inline small spinner
 */
const PageLoader = ({ variant = 'page', text = 'Memuat data...' }: PageLoaderProps) => {
  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-2 text-app-text-secondary">
        <Loader2 className="w-4 h-4 animate-spin" />
        {text && <span className="text-xs font-medium">{text}</span>}
      </div>
    );
  }

  if (variant === 'section') {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-app-accent mb-3" />
        {text && <p className="text-sm font-medium text-app-text-secondary">{text}</p>}
      </div>
    );
  }

  // variant === 'page'
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-[3px] border-app-border" />
          <div className="absolute inset-0 w-12 h-12 rounded-full border-[3px] border-transparent border-t-app-accent animate-spin" />
        </div>
        {text && <p className="text-sm font-medium text-app-text-secondary animate-pulse">{text}</p>}
      </div>
    </div>
  );
};

export default PageLoader;

/**
 * Skeleton building blocks for custom loading states
 */
export const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded-lg bg-app-border/60 ${className}`} />
);

export const SkeletonCard = () => (
  <div className="rounded-2xl border border-app-border bg-app-surface p-5 space-y-3">
    <Skeleton className="h-10 w-10 rounded-xl" />
    <Skeleton className="h-3 w-20" />
    <Skeleton className="h-7 w-16" />
  </div>
);

export const SkeletonList = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-3">
        <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-3 w-12" />
      </div>
    ))}
  </div>
);
