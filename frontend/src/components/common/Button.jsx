import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  type = 'button',
  variant = 'primary', // 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost'
  size = 'md', // 'sm' | 'md' | 'lg'
  isLoading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  ...props
}) => {
  // Variant styling matching modern SaaS design
  const variantStyles = {
    primary: 'bg-[#111111] hover:bg-neutral-800 text-white border border-transparent shadow-xs focus:ring-neutral-900/50',
    secondary: 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-transparent focus:ring-neutral-200/50',
    danger: 'bg-red-500 hover:bg-red-600 text-white border border-transparent shadow-xs focus:ring-red-500/50',
    outline: 'border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 hover:text-neutral-950 focus:ring-neutral-200/50',
    ghost: 'text-neutral-500 hover:text-neutral-850 hover:bg-neutral-100 bg-transparent focus:ring-neutral-100',
  };

  // Size styling - with 10px corner radius and standard heights
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs font-semibold rounded-[10px] gap-1.5',
    md: 'px-4 py-2 text-sm font-semibold rounded-[10px] gap-2',
    lg: 'px-5 py-2.5 text-base font-semibold rounded-[10px] gap-2',
  };

  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center font-sans transition-all duration-150 focus:outline-none focus:ring-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${variantStyles[variant] || variantStyles.primary} ${sizeStyles[size] || sizeStyles.md} ${className}`}
      {...props}
    >
      {isLoading && (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      )}
      
      {!isLoading && Icon && iconPosition === 'left' && (
        <Icon className="w-4 h-4 shrink-0" />
      )}
      
      <span>{children}</span>
      
      {!isLoading && Icon && iconPosition === 'right' && (
        <Icon className="w-4 h-4 shrink-0" />
      )}
    </button>
  );
};

export default Button;
