import { Eye } from 'lucide-react';

interface ViewButtonProps {
  onClick: () => void;
  itemName?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export default function ViewButton({
  onClick,
  itemName = 'item',
  className = '',
  size = 'sm',
  disabled = false,
}: ViewButtonProps) {
  const sizeClasses = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const iconSize = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${sizeClasses[size]} rounded bg-slate-600 text-white font-semibold transition hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${className}`}
      title={`View ${itemName}`}
    >
      <Eye className={iconSize[size]} />
      <span>View</span>
    </button>
  );
}
