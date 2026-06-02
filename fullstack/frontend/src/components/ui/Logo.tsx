import { memo } from 'react';
import { BRAND } from '../../constants/brand';
import LogoImage from '../../assets/Logo1.jpeg';

export type LogoVariant = 'mark' | 'wordmark' | 'full';
export type LogoTone = 'auto' | 'light' | 'dark' | 'mono';

interface LogoProps {
  variant?: LogoVariant;
  size?: number;
  tone?: LogoTone;
  className?: string;
  noDot?: boolean;
}

export const LogoMark = ({ size = 32, className = '' }: { size?: number; className?: string }) => {
  return (
    <img
      src={LogoImage}
      width={size}
      height={size}
      alt={`${BRAND.name} logo mark`}
      className={`object-cover rounded-lg flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    />
  );
};

const Logo = ({
  variant = 'full',
  size = 32,
  tone = 'auto',
  className = '',
  noDot = false,
}: LogoProps) => {
  const showMark = variant === 'mark' || variant === 'full';
  const showWord = variant === 'wordmark' || variant === 'full';

  const wordColorClass =
    tone === 'light'
      ? 'text-white'
      : tone === 'dark'
      ? 'text-neutral-900'
      : tone === 'mono'
      ? 'text-current'
      : 'text-app-text-primary';

  const wordSize = Math.round(size * 0.7);

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`} aria-label={BRAND.name}>
      {showMark && <LogoMark size={size} />}
      {showWord && (
        <span
          className={`font-extrabold tracking-tight leading-none ${wordColorClass}`}
          style={{ fontSize: `${wordSize}px` }}
        >
          {BRAND.nameUpper}
          {!noDot && <span className="text-primary-500">.</span>}
        </span>
      )}
    </span>
  );
};

export default memo(Logo);
