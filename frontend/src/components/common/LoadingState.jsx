import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingState = ({
  message = 'Loading details...',
  className = '',
  ...props
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center min-h-[30vh] w-full gap-3 ${className}`} {...props}>
      <Loader2 className="w-8 h-8 text-neutral-900 animate-spin" />
      <p className="text-xs text-neutral-500 font-medium">{message}</p>
    </div>
  );
};

export default LoadingState;
