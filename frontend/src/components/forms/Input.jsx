import React from 'react';

export const Input = ({
  label,
  error,
  icon: Icon,
  suffix,
  className = '',
  ...props
}) => {
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 block">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
            <Icon className="w-4 h-4" />
          </span>
        )}
        <input
          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} ${suffix ? 'pr-11' : 'pr-4'} py-3 bg-white border ${
            error ? 'border-red-500 focus:border-red-500' : 'border-neutral-200 focus:border-neutral-900'
          } rounded-[10px] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 ${
            error ? 'focus:ring-red-500/30' : 'focus:ring-neutral-900/10'
          } transition-all text-sm shadow-2xs ${className}`}
          {...props}
        />
        {suffix && (
          <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400">
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <span className="text-xs text-red-500 block mt-1 leading-none">{error}</span>
      )}
    </div>
  );
};

export default Input;
