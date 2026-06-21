import React from 'react';
import { Database } from 'lucide-react';
import Button from './Button';

export const EmptyState = ({
  title = 'No items found',
  description = 'There are no records matching your current filters.',
  icon: Icon = Database,
  actionText,
  onActionClick,
  className = '',
  ...props
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center bg-white border border-neutral-200 rounded-[16px] max-w-md mx-auto shadow-2xs ${className}`} {...props}>
      <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-150 mb-4 text-neutral-400">
        <Icon className="w-8 h-8 stroke-[1.5]" />
      </div>
      <h3 className="text-sm font-semibold text-neutral-850 mb-1">{title}</h3>
      <p className="text-xs text-neutral-500 max-w-sm mb-5 leading-relaxed">{description}</p>
      {actionText && onActionClick && (
        <Button variant="primary" size="sm" onClick={onActionClick}>
          {actionText}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
