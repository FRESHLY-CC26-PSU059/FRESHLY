import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, fullWidth = true, className = '', type, autoComplete: autoCompleteProp, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const resolvedType = isPassword && showPassword ? 'text' : type;

    const widthStyles = fullWidth ? 'w-full' : '';
    const errorStyles = error
      ? 'border-red-500 focus:ring-red-500/10 focus:border-red-500'
      : 'border-app-border focus:ring-primary-500/10 focus:border-primary-500';

    return (
      <div className={`${widthStyles} mb-3.5`}>
        {label && (
          <label className="block text-[11px] font-black uppercase tracking-widest text-app-text-secondary opacity-60 mb-1.5 ml-1">
            {label.includes('*') ? (
              <>
                {label.split('*')[0]}
                <span className="text-red-500">*</span>
              </>
            ) : (
              label
            )}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type={resolvedType}
            autoComplete={
              autoCompleteProp
                ? autoCompleteProp
                : isPassword
                  ? (props.name === 'password' && props.placeholder?.includes('8') ? 'current-password' : 'new-password')
                  : type === 'email' ? 'email'
                  : props.name === 'email' ? 'email'
                  : undefined
            }
            className={`${
              type === 'date' ? '' : 'appearance-none'
            } block px-4 py-2.5 ${isPassword ? 'pr-11' : ''} border rounded-xl shadow-sm bg-app-surface text-app-text-primary placeholder:text-app-text-secondary/30 placeholder:font-bold placeholder:text-xs focus:outline-none focus:ring-4 sm:text-sm font-bold transition-all duration-200 ${widthStyles} ${errorStyles} ${className}`}
            onClick={(e) => {
              if (type === 'date') {
                try { (e.currentTarget as any).showPicker(); } catch {}
              }
              props.onClick?.(e);
            }}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-app-text-secondary/50 hover:text-app-text-secondary transition-colors"
              aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-[10px] font-bold text-red-500 uppercase tracking-tight ml-1">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-[10px] font-medium text-app-text-secondary/60 ml-1">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
