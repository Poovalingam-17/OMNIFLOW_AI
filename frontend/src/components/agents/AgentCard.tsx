import React from 'react';
import { Bot, ArrowRight } from 'lucide-react';

interface AgentCardProps {
  agent: {
    id: number;
    name: string;
    domain: string;
    description: string;
    iconUrl?: string;
    colorHex?: string;
    isActive: boolean;
  };
  onClick: () => void;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent, onClick }) => {
  const colors: Record<string, string> = {
    Education: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
    'Human Resources': 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    Healthcare: 'bg-rose-50 text-rose-600 border border-rose-100',
    Recruitment: 'bg-purple-50 text-purple-600 border border-purple-100',
    Finance: 'bg-amber-50 text-amber-600 border border-amber-100',
    'Customer Support': 'bg-cyan-50 text-cyan-600 border border-cyan-100',
    'Smart Campus': 'bg-violet-50 text-violet-600 border border-violet-100'
  };

  const iconBorderColor = agent.colorHex ? { borderColor: agent.colorHex } : {};

  return (
    <div 
      className="bg-white rounded-2xl p-6 border border-slate-200/80 hover:border-slate-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between h-56 relative overflow-hidden group shadow-sm animate-fade-in"
      onClick={onClick}
    >
      <div 
        className="absolute -right-16 -top-16 w-32 h-32 rounded-full blur-2xl opacity-10 transition-opacity duration-300 group-hover:opacity-15"
        style={{ backgroundColor: agent.colorHex || '#4f46e5' }}
      ></div>

      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div 
              className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
              style={{ ...iconBorderColor, color: agent.colorHex || '#4f46e5' }}
            >
              <Bot className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-slate-800 tracking-wide group-hover:text-slate-900 transition-colors duration-200">
                {agent.name}
              </h3>
              <span className={`inline-block text-[10px] font-semibold mt-1 px-2.5 py-0.5 rounded-full ${colors[agent.domain] || 'bg-slate-50 text-slate-500 border border-slate-200'}`}>
                {agent.domain}
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all duration-200" />
        </div>
        
        <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed text-left">
          {agent.description}
        </p>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-auto">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${agent.isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
          {agent.isActive ? 'Active' : 'Inactive'}
        </span>
        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider group-hover:text-primary transition-colors duration-150">
          Orchestrate
        </span>
      </div>
    </div>
  );
};

export default AgentCard;
