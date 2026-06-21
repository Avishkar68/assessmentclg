import React from 'react';

export const Textarea = ({
  label,
  error,
  className = '',
  rows = 4,
  ...props
}) => {
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 block">
          {label}
        </label>
      )}
      <textarea
        rows={rows}
        className={`w-full px-4 py-3 bg-white border ${
          error ? 'border-red-500 focus:border-red-500' : 'border-neutral-200 focus:border-neutral-900'
        } rounded-[10px] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 ${
          error ? 'focus:ring-red-500/30' : 'focus:ring-neutral-900/10'
        } transition-all text-sm resize-none shadow-2xs ${className}`}
        {...props}
      />
      {error && (
        <span className="text-xs text-red-500 block mt-1 leading-none">{error}</span>
      )}
    </div>
  );
};

export default Textarea;
