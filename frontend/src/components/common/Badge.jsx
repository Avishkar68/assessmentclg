import React from 'react';

export const Badge = ({
  children,
  variant = 'neutral', // 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  className = '',
  ...props
}) => {
  const styles = {
    success: 'bg-[#ecfdf5] text-[#065f46] border-[#a7f3d0]/30',
    warning: 'bg-[#fffbeb] text-[#92400e] border-[#fde68a]/30',
    danger: 'bg-[#fef2f2] text-[#991b1b] border-[#fecaca]/30',
    info: 'bg-[#eff6ff] text-[#1e40af] border-[#bfdbfe]/30',
    neutral: 'bg-neutral-50 text-neutral-600 border-neutral-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border leading-none ${styles[variant] || styles.neutral} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
