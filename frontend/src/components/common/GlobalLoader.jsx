import React from 'react';

export const GlobalLoader = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-dark-950/75 backdrop-blur-md">
      <div className="relative flex items-center justify-center">
        {/* Pulsing Accent Glow */}
        <div className="absolute w-24 h-24 rounded-full bg-primary-500/20 blur-xl animate-pulse"></div>
        
        {/* Outer Rotating Segmented Border */}
        <div className="w-16 h-16 rounded-full border-4 border-primary-500/10 border-t-primary-500 animate-spin"></div>
        
        {/* Inner Spinning Ring (Opposite Direction) */}
        <div className="absolute w-10 h-10 rounded-full border-4 border-transparent border-t-primary-300 animate-[spin_1s_linear_infinite_reverse]"></div>
      </div>
      
      {/* Loading Label text */}
      <h3 className="mt-6 text-sm font-medium tracking-widest uppercase text-slate-400 animate-pulse">
        Securing Session...
      </h3>
    </div>
  );
};

export default GlobalLoader;
