import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950">
      <div className="relative w-16 h-16">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-cyan-500/10 rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-t-cyan-400 border-r-cyan-400 rounded-full animate-spin"></div>
      </div>
      <p className="mt-4 text-sm font-medium text-slate-400 tracking-wide animate-pulse">
        Loading OmniFlow AI...
      </p>
    </div>
  );
};

export default Loader;
