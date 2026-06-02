import type { StatItem } from './types';

interface StatsStripProps {
  items: StatItem[];
  loading?: boolean;
}

const StatsStrip = ({ items, loading = false }: StatsStripProps) => {
  return (
    <section className="relative bg-app-bg py-10 md:py-14">
      <div className="absolute inset-0 mesh-gradient opacity-30 pointer-events-none" />
      <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-4 px-5 md:grid-cols-4 md:px-8">
        {items.map((item) => (
          <div
            key={item.label}
            className="glass-card-light rounded-2xl p-5 sm:p-6 text-center transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg hover:shadow-emerald-500/5"
          >
            {loading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-16 animate-pulse rounded-lg bg-app-border" />
                <div className="h-3 w-20 animate-pulse rounded bg-app-border" />
              </div>
            ) : (
              <>
                <p className="text-2xl sm:text-3xl md:text-4xl font-extrabold bg-gradient-to-br from-emerald-500 to-green-600 bg-clip-text text-transparent leading-none">
                  {item.value}
                </p>
                <p className="mt-2 text-xs sm:text-sm font-medium text-app-text-secondary">{item.label}</p>
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default StatsStrip;
