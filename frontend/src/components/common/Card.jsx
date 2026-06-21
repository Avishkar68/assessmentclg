import React from 'react';

export const Card = ({
  children,
  className = '',
  hoverable = true,
  onClick,
  ...props
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-neutral-200 rounded-[16px] overflow-hidden transition-all duration-200 ${
        hoverable ? 'hover:-translate-y-[2px] hover:shadow-xs hover:border-neutral-300' : 'shadow-xs'
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`px-6 py-4 border-b border-neutral-100 flex items-center justify-between gap-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardTitle = ({ children, className = '', icon: Icon, ...props }) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`} {...props}>
      {Icon && <Icon className="w-5 h-5 text-neutral-800 shrink-0" />}
      <h3 className="text-base font-semibold text-neutral-900 tracking-tight">
        {children}
      </h3>
    </div>
  );
};

export const CardBody = ({ children, className = '', ...props }) => {
  return (
    <div className={`p-6 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardFooter = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`px-6 py-4 bg-neutral-50/50 border-t border-neutral-100 flex items-center justify-end gap-3 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
