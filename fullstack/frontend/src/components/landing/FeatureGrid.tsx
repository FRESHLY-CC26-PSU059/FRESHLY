import { ScanLine, FileBarChart, BookOpen } from 'lucide-react';
import type { FeatureItem } from './types';

interface FeatureGridProps {
  items: FeatureItem[];
}

const iconMap = {
  scan: ScanLine,
  report: FileBarChart,
  book: BookOpen,
};

const FeatureGrid = ({ items }: FeatureGridProps) => {
  return (
    <div className="relative bg-app-bg">
      {/* Background mesh */}
      <div className="absolute inset-0 mesh-gradient opacity-50 pointer-events-none" />
      <div className="mx-auto w-full max-w-6xl px-5 md:px-8 relative">
        <div className="grid gap-5 sm:gap-6 md:grid-cols-3">
          {items.map((item, i) => {
            const Icon = iconMap[item.icon];
            return (
              <article
                key={item.title}
                className="group relative rounded-2xl glass-card-light p-6 sm:p-8 transition-all duration-500 hover:translate-y-[-4px] hover:shadow-xl hover:shadow-emerald-500/5"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {/* Gradient border on hover */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 gradient-border pointer-events-none" />

                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/20">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="mt-6 text-xl sm:text-2xl font-bold tracking-tight text-app-text-primary leading-snug">{item.title}</h3>
                <p className="mt-4 text-sm leading-7 text-app-text-secondary">{item.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FeatureGrid;
