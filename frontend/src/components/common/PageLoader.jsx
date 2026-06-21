import React from 'react';

export const PageLoader = ({ message = 'Loading details...' }) => {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 select-none animate-[fadeIn_0.2s_ease-out]">
      <div className="relative flex items-center justify-center">
        {/* Glowing Pulsing Backdrop */}
        <div className="absolute w-16 h-16 rounded-full bg-primary-500/10 blur-lg animate-pulse"></div>
        {/* Spinning Outer Ring */}
        <div className="w-10 h-10 rounded-full border-2 border-primary-500/10 border-t-primary-500 animate-spin"></div>
      </div>
      <p className="text-xs font-semibold text-slate-455 tracking-wider uppercase animate-pulse">{message}</p>
    </div>
  );
};

export default PageLoader;
