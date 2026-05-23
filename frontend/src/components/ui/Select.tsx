import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white dark:bg-darkcard text-gray-900 dark:text-gray-100 transition-all duration-200 focus:outline-none focus:ring-2
            ${error
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-250 dark:border-darkborder focus:ring-brand-500 focus:border-brand-500'
            }
            ${className}
          `}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1.5 text-xs text-red-500 font-medium animate-fade-in">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
