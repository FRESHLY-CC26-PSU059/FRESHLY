import { Upload, Cpu, FileCheck, History } from 'lucide-react';
import type { StepItem } from './types';

interface HowItWorksProps {
  steps: StepItem[];
}

const iconMap = {
  upload: Upload,
  chip: Cpu,
  report: FileCheck,
  save: History,
};

const HowItWorks = ({ steps }: HowItWorksProps) => {
  return (
    <div className="relative bg-app-bg">
      <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
        {/* Connector line (desktop only) */}
        <div className="hidden md:block absolute top-[2.2rem] left-[calc(12.5%+1.5rem)] right-[calc(12.5%+1.5rem)] h-px bg-gradient-to-r from-transparent via-app-accent/30 to-transparent" />

        <div className="grid grid-cols-2 gap-6 sm:gap-8 md:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = iconMap[step.icon];
            return (
              <article key={step.title} className="relative text-center group">
                <div className="relative mx-auto w-fit">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/20 transition-transform duration-300 group-hover:scale-110">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <span className="absolute -top-2 -right-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-app-bg border-2 border-app-accent text-[10px] font-bold text-app-accent">
                    {index + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-sm sm:text-base md:text-lg font-bold text-app-text-primary leading-snug">{step.title}</h3>
                <p className="mt-2 text-xs sm:text-sm leading-6 text-app-text-secondary">{step.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
