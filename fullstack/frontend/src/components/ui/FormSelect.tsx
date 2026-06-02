import { forwardRef, type SelectHTMLAttributes } from 'react';

interface Option {
  value: string | number;
  label: string;
}

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Option[];
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  placeholder?: string;
}

const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ label, options, error, helperText, fullWidth = true, className = '', placeholder, ...props }, ref) => {
    const widthStyles = fullWidth ? 'w-full' : '';
    const errorStyles = error
      ? 'border-red-500 focus:ring-red-500/10 focus:border-red-500'
      : 'border-app-border focus:ring-primary-500/10 focus:border-primary-500';

    return (
      <div className={`${widthStyles} mb-3.5`}>
        {label && (
          <label className="block text-[11px] font-black uppercase tracking-widest text-app-text-secondary opacity-60 mb-1.5 ml-1">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={`appearance-none block px-4 py-2.5 border rounded-xl shadow-sm bg-app-surface text-app-text-primary focus:outline-none focus:ring-4 sm:text-sm font-bold transition-all duration-200 ${widthStyles} ${errorStyles} ${className}`}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>{placeholder}</option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-app-text-secondary opacity-50">
            <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
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

FormSelect.displayName = 'FormSelect';

export default FormSelect;
