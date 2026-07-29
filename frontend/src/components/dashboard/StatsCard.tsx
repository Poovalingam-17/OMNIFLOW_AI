import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, color }) => {
  return (
    <div className="p-6 bg-white border border-slate-200/85 rounded-2xl flex items-center justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-slate-300/80 group shadow-sm animate-fade-in">
      <div className="space-y-1.5 text-left">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider group-hover:text-slate-500 transition-colors duration-200">
          {title}
        </span>
        <p className="text-3xl font-extrabold text-slate-900">{value}</p>
      </div>
      <div className={`w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center ${color} group-hover:scale-110 transition-transform duration-200 shadow-sm`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
};

export default StatsCard;
