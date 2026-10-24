import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Input = React.forwardRef(function Input(
  { label, error, helperText, mono = false, className = '', containerClassName = '', ...props },
  ref
) {
  return (
    <div className={twMerge('flex flex-col gap-1', containerClassName)}>
      {label && <label className="text-xs font-medium text-slate-300">{label}</label>}
      <input
        ref={ref}
        className={twMerge(
          clsx(
            'bg-forge-input border border-forge-border text-slate-100 placeholder-slate-500 rounded px-3 py-1.5 text-sm transition-colors',
            'focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500',
            mono && 'font-mono text-xs',
            error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500',
            className
          )
        )}
        {...props}
      />
      {error && <span className="text-xs text-rose-400">{error}</span>}
      {helperText && !error && <span className="text-xs text-slate-400">{helperText}</span>}
    </div>
  );
});

export default Input;
