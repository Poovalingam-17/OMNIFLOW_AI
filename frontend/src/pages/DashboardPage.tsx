import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Users, Bot, TrendingUp, Plus, ArrowRight } from 'lucide-react';
import { RootState, AppDispatch } from '../store';
import { fetchAgents } from '../store/agentSlice';
import { fetchConversations } from '../store/chatSlice';
import AgentCard from '../components/agents/AgentCard';
import StatsCard from '../components/dashboard/StatsCard';
import { StatsSkeleton, AgentSkeleton, RowSkeleton } from '../components/dashboard/SkeletonCard';
import Navbar from '../components/common/Navbar';

const DashboardPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const { agents, isLoading: isAgentsLoading } = useSelector((state: RootState) => state.agents);
  const { conversations, isLoading: isChatLoading } = useSelector((state: RootState) => state.chat);

  useEffect(() => {
    dispatch(fetchAgents());
    dispatch(fetchConversations());
  }, [dispatch]);

  const activeAgents = agents.filter(a => a.isActive);
  const activeSessions = conversations.filter(c => c.status === 'ACTIVE').length;

  const stats = [
    { title: 'Total Agents', value: agents.length, icon: Bot, color: 'text-cyan-400' },
    { title: 'Active Sessions', value: activeSessions, icon: Users, color: 'text-emerald-400' },
    { title: 'Conversations', value: conversations.length, icon: MessageSquare, color: 'text-purple-400' },
    { title: 'Success Rate', value: '98.4%', icon: TrendingUp, color: 'text-amber-400' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col relative overflow-hidden font-sans">
      {/* Premium accent glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-400/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 relative z-10 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="text-left">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Welcome back, {user?.fullName}!
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Here is what is happening with your orchestration agents today
            </p>
          </div>
          <button
            onClick={() => navigate('/chat')}
            className="inline-flex items-center space-x-2 bg-btn-gradient hover:opacity-95 text-white font-semibold px-5 py-2.5 rounded-xl transition duration-200 active:scale-[0.98] shadow-lg shadow-primary/20 text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Conversation</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isAgentsLoading || isChatLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <StatsSkeleton key={index} />
            ))
          ) : (
            stats.map((stat, index) => (
              <StatsCard key={index} {...stat} />
            ))
          )}
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800 tracking-wide">Available Orchestrators</h2>
            <span className="text-xs text-slate-400 font-medium">Click card to start dialogue</span>
          </div>

          {isAgentsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <AgentSkeleton key={index} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {activeAgents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onClick={() => navigate('/chat', { state: { agentId: agent.id } })}
                />
              ))}
              {!isAgentsLoading && activeAgents.length === 0 && (
                <div className="col-span-full py-12 bg-white border border-slate-200/80 rounded-2xl text-center text-slate-400 font-medium shadow-sm">
                  No active agents available. Seeding database...
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-8 bg-white border border-slate-200/85 rounded-2xl space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-800 tracking-wide">Recent Active Conversations</h2>
            <button 
              onClick={() => navigate('/chat')} 
              className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors"
            >
              View all chat history
            </button>
          </div>
          
          <div className="space-y-3">
            {isChatLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <RowSkeleton key={index} />
              ))
            ) : conversations.length === 0 ? (
              <div className="text-center py-8 text-slate-450 text-sm">
                No conversation history found. Select an orchestrator above to begin.
              </div>
            ) : (
              conversations.slice(0, 3).map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => navigate('/chat', { state: { agentId: conv.agent.id } })}
                  className="flex items-center justify-between p-4 bg-slate-50/40 border border-slate-200/60 hover:border-slate-300 hover:bg-slate-50 transition rounded-xl cursor-pointer"
                >
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-10 h-10 rounded-lg bg-slate-50 border flex items-center justify-center text-primary"
                      style={{ borderColor: conv.agent.colorHex, color: conv.agent.colorHex }}
                    >
                      <Bot className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-slate-800 text-sm truncate max-w-xs sm:max-w-md">
                        {conv.title || 'Untitled Session'}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 font-medium">
                        With <span className="text-slate-600 font-semibold">{conv.agent.name}</span> • {conv.agent.domain}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6 text-right">
                    <div className="hidden sm:block text-xs">
                      <p className="text-slate-500 font-semibold">{conv.messageCount} messages</p>
                      <p className="text-[10px] text-slate-405 uppercase mt-0.5 font-bold">
                        {new Date(conv.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-primary" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
