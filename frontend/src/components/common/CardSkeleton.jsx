import React from 'react';

export const CardSkeleton = ({
  variant = 'grid', // 'metric' | 'grid' | 'list'
  className = '',
}) => {
  if (variant === 'metric') {
    return (
      <div className={`glass-card rounded-xl p-6 border border-slate-850/80 overflow-hidden animate-pulse flex items-center justify-between ${className}`}>
        <div className="space-y-3 flex-1">
          <div className="h-3 bg-slate-800/80 rounded w-1/2"></div>
          <div className="h-8 bg-slate-800/80 rounded w-1/3"></div>
        </div>
        <div className="w-12 h-12 rounded-xl bg-slate-800/80 shrink-0"></div>
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={`glass-card rounded-xl p-5 border border-slate-850/80 overflow-hidden animate-pulse flex flex-col sm:flex-row justify-between items-start gap-4 ${className}`}>
        <div className="space-y-3 flex-1 w-full">
          <div className="flex flex-wrap items-center gap-2">
            <div className="h-4 bg-slate-800/80 rounded w-12"></div>
            <div className="h-4 bg-slate-800/80 rounded w-24"></div>
            <div className="h-4 bg-slate-800/80 rounded w-16"></div>
          </div>
          <div className="h-5 bg-slate-800/80 rounded w-3/4"></div>
          <div className="h-4 bg-slate-800/80 rounded w-1/4"></div>
        </div>
        <div className="flex sm:flex-col gap-2 shrink-0 w-full sm:w-auto">
          <div className="h-8 bg-slate-800/80 rounded w-full sm:w-16"></div>
          <div className="h-8 bg-slate-800/80 rounded w-full sm:w-16"></div>
        </div>
      </div>
    );
  }

  // Default: 'grid' card skeleton
  return (
    <div className={`glass-card rounded-xl border border-slate-850/80 overflow-hidden animate-pulse flex flex-col justify-between h-full ${className}`}>
      <div className="p-5 pb-3 border-b border-slate-900/40 space-y-3">
        <div className="flex justify-between items-center">
          <div className="h-4 bg-slate-800/80 rounded w-16"></div>
          <div className="h-4 bg-slate-800/80 rounded w-12"></div>
        </div>
        <div className="h-5 bg-slate-800/80 rounded w-5/6"></div>
        <div className="h-4 bg-slate-800/80 rounded w-full"></div>
      </div>
      <div className="p-5 py-4 space-y-3 flex-1">
        <div className="h-4 bg-slate-800/80 rounded w-2/3"></div>
        <div className="h-4 bg-slate-800/80 rounded w-1/2"></div>
        <div className="border-t border-slate-900/40 pt-3 space-y-2">
          <div className="h-3 bg-slate-800/80 rounded w-3/4"></div>
          <div className="h-3 bg-slate-800/80 rounded w-2/3"></div>
        </div>
      </div>
      <div className="p-4 border-t border-slate-900 bg-slate-950/20 flex gap-2">
        <div className="h-8 bg-slate-800/80 rounded flex-1"></div>
        <div className="h-8 bg-slate-800/80 rounded flex-1"></div>
        <div className="h-8 bg-slate-800/80 rounded w-10"></div>
      </div>
    </div>
  );
};

export default CardSkeleton;
