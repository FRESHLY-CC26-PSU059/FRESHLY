import { useEffect, useRef, useState } from 'react';
import type { TestimonialItem } from './types';
import { Star } from 'lucide-react';

interface TestimonialGridProps {
  items: TestimonialItem[];
}

const TestimonialGrid = ({ items }: TestimonialGridProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const scrollPosRef = useRef(0);
  const animationIdRef = useRef<number | undefined>(undefined);

  // Only duplicate items if we have enough to make the infinite scroll look good
  const shouldDuplicate = items.length > 3;
  const allItems = shouldDuplicate ? [...items, ...items] : items;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !shouldDuplicate) return;

    const speed = 0.5; // px per frame

    const step = () => {
      if (!isPaused && el) {
        scrollPosRef.current += speed;
        // Reset when we've scrolled past the first set
        if (scrollPosRef.current >= el.scrollWidth / 2) {
          scrollPosRef.current = 0;
        }
        el.scrollLeft = scrollPosRef.current;
      }
      animationIdRef.current = requestAnimationFrame(step);
    };

    animationIdRef.current = requestAnimationFrame(step);
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [isPaused, shouldDuplicate]);

  const handleMouseEnter = () => {
    if (!shouldDuplicate) return;
    setIsPaused(true);
    // Save current scroll position
    if (scrollRef.current) {
      scrollPosRef.current = scrollRef.current.scrollLeft;
    }
  };

  const handleMouseLeave = () => {
    if (!shouldDuplicate) return;
    setIsPaused(false);
  };

  return (
    <div className="bg-app-bg">
      <div
        ref={scrollRef}
        className={`flex gap-5 overflow-x-auto hide-scrollbar px-5 md:px-8 py-2 ${shouldDuplicate ? 'overflow-x-hidden' : 'justify-center flex-wrap'}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleMouseEnter}
        onTouchEnd={handleMouseLeave}
      >
        {allItems.map((item, i) => (
          <article
            key={`${item.name}-${i}`}
            className="flex-shrink-0 w-[85vw] max-w-[320px] sm:w-[300px] sm:max-w-none rounded-2xl glass-card-light p-5 sm:p-6 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg hover:shadow-emerald-500/5"
          >
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={`w-3.5 h-3.5 ${s <= (item.rating || 5) ? 'fill-emerald-500 text-emerald-500' : 'fill-app-border text-app-border'}`} />
              ))}
            </div>
            <blockquote className="mt-4 text-sm leading-7 text-app-text-secondary">"{item.quote}"</blockquote>
            <div className="mt-5 flex items-center gap-3">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-green-600 text-[10px] font-bold text-white shadow-sm">
                {item.initials}
              </div>
              <div>
                <p className="text-sm font-semibold text-app-text-primary">{item.name}</p>
                <p className="text-[11px] text-app-text-secondary">{item.role}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default TestimonialGrid;
