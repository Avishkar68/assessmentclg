import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';

export const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 px-6 py-12 relative overflow-hidden select-none">
      {/* Decorative background radial glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary-500/10 blur-3xl animate-pulse -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-primary-600/10 blur-3xl animate-pulse translate-x-1/2 translate-y-1/2"></div>

      <div className="glass-card max-w-lg w-full rounded-2xl p-10 text-center relative z-10">
        <div className="flex justify-center mb-6">
          <div className="relative p-4 bg-primary-500/10 border border-primary-500/20 rounded-full animate-bounce">
            <Compass className="w-12 h-12 text-primary-400" />
          </div>
        </div>

        <h1 className="text-8xl font-extrabold tracking-tight bg-gradient-to-r from-primary-400 via-primary-300 to-indigo-400 bg-clip-text text-transparent">
          404
        </h1>
        
        <h2 className="text-2xl font-bold text-slate-100 mt-2">
          Page Not Found
        </h2>
        
        <p className="text-slate-400 mt-4 text-base leading-relaxed">
          The requested resource was not located, or you do not have permissions to access this pathway.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 text-sm font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-lg cursor-pointer transition-all duration-200"
          >
            Go Back
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 rounded-lg cursor-pointer shadow-lg shadow-primary-600/20 hover:shadow-primary-500/30 transition-all duration-200"
          >
            Dashboard Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
