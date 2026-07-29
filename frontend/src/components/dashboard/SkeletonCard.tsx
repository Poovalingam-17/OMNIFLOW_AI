import React from 'react';

export const StatsSkeleton: React.FC = () => (
  <div className="p-6 bg-white border border-slate-200/85 rounded-2xl flex items-center justify-between shadow-sm animate-pulse">
    <div className="space-y-2.5 text-left flex-1">
      <div className="h-3 bg-slate-200 rounded w-1/3"></div>
      <div className="h-7 bg-slate-200/80 rounded w-1/2 mt-1"></div>
    </div>
    <div className="w-12 h-12 rounded-xl bg-slate-100/70 flex-shrink-0"></div>
  </div>
);

export const AgentSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl p-6 border border-slate-200/80 flex flex-col justify-between h-56 shadow-sm animate-pulse">
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100"></div>
          <div className="space-y-2 text-left">
            <div className="h-4 bg-slate-200 rounded w-24"></div>
            <div className="h-3 bg-slate-100 rounded w-16"></div>
          </div>
        </div>
        <div className="w-4 h-4 bg-slate-200/60 rounded-full"></div>
      </div>
      <div className="space-y-2 text-left">
        <div className="h-3.5 bg-slate-200/80 rounded w-full"></div>
        <div className="h-3.5 bg-slate-200/80 rounded w-5/6"></div>
      </div>
    </div>
    <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-auto">
      <div className="h-4 bg-slate-100 rounded w-12"></div>
      <div className="h-3.5 bg-slate-100 rounded w-16"></div>
    </div>
  </div>
);

export const RowSkeleton: React.FC = () => (
  <div className="flex items-center justify-between p-4 bg-slate-50/40 border border-slate-200/60 rounded-xl animate-pulse">
    <div className="flex items-center space-x-4 flex-1">
      <div className="w-10 h-10 rounded-lg bg-slate-200/70 flex-shrink-0"></div>
      <div className="space-y-2.5 text-left flex-1">
        <div className="h-4 bg-slate-200 rounded w-1/3"></div>
        <div className="h-3.5 bg-slate-100 rounded w-1/4"></div>
      </div>
    </div>
    <div className="w-16 h-8 bg-slate-100/70 rounded-xl"></div>
  </div>
);
