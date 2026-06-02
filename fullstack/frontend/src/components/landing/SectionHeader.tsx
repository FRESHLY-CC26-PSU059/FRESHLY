interface SectionHeaderProps {
  pillText?: string;
  title: string;
  centered?: boolean;
}

const SectionHeader = ({ pillText, title, centered = true }: SectionHeaderProps) => {
  return (
    <div className={centered ? 'text-center' : ''}>
      {pillText ? (
        <div className="inline-flex items-center rounded-full bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          {pillText}
        </div>
      ) : null}
      <h2 className="mt-5 text-2xl font-extrabold tracking-tight text-app-text-primary sm:text-3xl md:text-[clamp(2rem,4vw,3.2rem)] text-balance leading-tight">{title}</h2>
    </div>
  );
};

export default SectionHeader;
