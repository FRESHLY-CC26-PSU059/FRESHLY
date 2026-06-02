import { Search } from 'lucide-react';
import type { InputHTMLAttributes } from 'react';

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
}

export default function SearchInput({ 
  containerClassName = '', 
  className = '', 
  ...props 
}: SearchInputProps) {
  return (
    <div className={`relative flex-1 min-w-0 w-full ${containerClassName}`}>
      <Search 
        className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text-secondary opacity-60" 
        size={16} 
      />
      <input 
        type="text"
        className={`w-full pl-11 pr-4 py-3 bg-app-surface border border-app-border rounded-xl text-sm font-bold text-app-text-primary placeholder:text-app-text-secondary/50 focus:ring-2 focus:ring-emerald-500/10 transition-all outline-none ${className}`}
        {...props}
      />
    </div>
  );
}
