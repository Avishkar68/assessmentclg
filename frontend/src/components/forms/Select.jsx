import React from 'react';
import { ChevronDown } from 'lucide-react';

export const Select = ({
  label,
  error,
  icon: Icon,
  options = [], // Array of { value, label } or strings
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
        <select
          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-10 py-3 bg-white border ${
            error ? 'border-red-500 focus:border-red-500' : 'border-neutral-200 focus:border-neutral-900'
          } rounded-[10px] text-neutral-900 focus:outline-none focus:ring-1 ${
            error ? 'focus:ring-red-500/30' : 'focus:ring-neutral-900/10'
          } transition-all text-sm appearance-none cursor-pointer shadow-2xs ${className}`}
          {...props}
        >
          {options.map((opt) => {
            const isObj = typeof opt === 'object' && opt !== null;
            const val = isObj ? opt.value : opt;
            const lbl = isObj ? opt.label : opt;
            return (
              <option key={val} value={val} className="bg-white text-neutral-800">
                {lbl}
              </option>
            );
          })}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-neutral-400">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
      {error && (
        <span className="text-xs text-red-500 block mt-1 leading-none">{error}</span>
      )}
    </div>
  );
};

export default Select;
