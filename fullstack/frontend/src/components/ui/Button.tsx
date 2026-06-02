import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-black uppercase tracking-widest rounded-xl transition-all duration-300 focus:outline-none active:scale-95 disabled:opacity-50 disabled:pointer-events-none';

  const sizes = {
    sm: 'px-3 py-1.5 text-[10px]',
    md: 'px-6 py-2.5 text-xs',
    lg: 'px-8 py-3 text-sm',
  };
  
  const variants = {
    primary: 'bg-primary-500 text-white shadow-lg shadow-primary-500/20 hover:bg-primary-600 hover:-translate-y-0.5',
    secondary: 'bg-app-bg text-app-text-primary border border-app-border hover:bg-app-surface hover:-translate-y-0.5',
    danger: 'bg-red-500 text-white shadow-lg shadow-red-500/20 hover:bg-red-600 hover:-translate-y-0.5',
    outline: 'border-2 border-primary-500 text-primary-500 bg-transparent hover:bg-primary-500/5',
    ghost: 'bg-transparent text-app-text-secondary hover:bg-app-bg hover:text-app-text-primary',
  };

  const widthStyles = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${widthStyles} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Mohon Tunggu</span>
        </div>
      ) : children}
    </button>
  );
};

export default Button;
