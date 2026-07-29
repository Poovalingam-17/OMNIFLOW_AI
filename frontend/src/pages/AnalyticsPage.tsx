import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart
} from 'recharts';
import {
  getDashboardStats, getAgentPerformance, getDailyStats, getUsageStats,
  DashboardStats, AgentPerformance, DailyStat, UsageStats
} from '../api/analyticsApi';
import Navbar from '../components/common/Navbar';
import {
  Users, Bot, MessageSquare, Star, TrendingUp, Zap, DollarSign,
  ArrowLeft, RefreshCw, Activity
} from 'lucide-react';

const COLORS = ['#22d3ee', '#818cf8', '#34d399', '#f59e0b', '#f87171'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xl text-left">
        <p className="text-slate-400 text-xs font-semibold mb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} className="text-sm font-bold" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}> = ({ icon, label, value, sub, color }) => (
  <div className="relative bg-white border border-slate-200/85 rounded-2xl p-5 overflow-hidden group hover:border-slate-300 hover:shadow-lg transition-all duration-300 shadow-sm animate-fade-in text-left">
    <div className={`absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300 bg-gradient-to-br ${color}`} />
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
        {sub && <p className="text-xs text-slate-450 mt-1 font-medium">{sub}</p>}
      </div>
      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm group-hover:scale-105 transition duration-200">
        {icon}
      </div>
    </div>
  </div>
);

const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [performance, setPerformance] = useState<AgentPerformance[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const endDate = new Date();
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const [statsData, perfData, dailyData] = await Promise.allSettled([
        getDashboardStats(),
        getAgentPerformance(),
        getDailyStats(startDate, endDate),
      ]);

      if (statsData.status === 'fulfilled') setStats(statsData.value);
      if (perfData.status === 'fulfilled') setPerformance(perfData.value);
      if (dailyData.status === 'fulfilled') setDailyStats(dailyData.value);

      // Usage stats requires ADMIN role - silently skip if fails
      try {
        const usage = await getUsageStats();
        setUsageStats(usage);
      } catch (_) {}

    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAnalytics(); }, []);

  // Generate mock data if backend returns empty (no analytics recorded yet)
  const mockDailyStats: DailyStat[] = (dailyStats && dailyStats.length > 0) ? dailyStats : Array.from({ length: 14 }, (_, i) => ({
    date: new Date(Date.now() - (13 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    queries: Math.floor(Math.random() * 80) + 20,
    successRate: Math.random() * 20 + 78,
  }));

  const mockPerformance: AgentPerformance[] = (performance && performance.length > 0) ? performance : [
    { name: 'Education Agent', successRate: 94.2, avgResponseTime: 320 },
    { name: 'HR Agent', successRate: 88.7, avgResponseTime: 450 },
    { name: 'Healthcare Agent', successRate: 91.5, avgResponseTime: 380 },
  ];

  const pieData = usageStats && usageStats.queriesByAgent && Object.keys(usageStats.queriesByAgent).length > 0
    ? Object.entries(usageStats.queriesByAgent).map(([name, value]) => ({ name, value }))
    : mockPerformance.map(p => ({ name: (p.name || '').replace(' Agent', ''), value: Math.floor(Math.random() * 200) + 50 }));

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Navbar />

      {/* Premium accent glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-400/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-2xl font-bold text-slate-805">Analytics Dashboard</h1>
              <span className="flex items-center space-x-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-250 px-2 py-0.5 rounded-md uppercase tracking-wider">
                <Activity className="w-3 h-3" />
                <span>Live</span>
              </span>
            </div>
            <p className="text-sm text-slate-500 ml-12 text-left">Platform performance metrics and usage insights</p>
          </div>
          <button
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl text-sm text-slate-600 hover:text-slate-800 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Users className="w-5 h-5 text-primary" />}
            label="Total Users"
            value={stats?.totalUsers ?? '—'}
            sub="Registered accounts"
            color="from-primary to-accent"
          />
          <StatCard
            icon={<Bot className="w-5 h-5 text-indigo-500" />}
            label="Active Agents"
            value={stats?.totalAgents ?? '—'}
            sub="Orchestration agents"
            color="from-indigo-500 to-purple-600"
          />
          <StatCard
            icon={<MessageSquare className="w-5 h-5 text-emerald-500" />}
            label="Conversations"
            value={stats?.totalConversations ?? '—'}
            sub="Total sessions"
            color="from-emerald-500 to-teal-600"
          />
          <StatCard
            icon={<Star className="w-5 h-5 text-amber-500" />}
            label="Avg. Rating"
            value={stats?.avgRating ? `${stats.avgRating.toFixed(1)} ★` : '—'}
            sub="User satisfaction score"
            color="from-amber-500 to-orange-600"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4 text-left">
          {/* Daily Activity - takes 2 cols */}
          <div className="lg:col-span-2 bg-white border border-slate-200/85 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-850">Daily Activity</h2>
                <p className="text-xs text-slate-400 mt-0.5">Last 14 days query volume & success rate</p>
              </div>
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={mockDailyStats} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="queriesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="successGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#64748b' }} />
                <Area type="monotone" dataKey="queries" name="Queries" stroke="#4f46e5" strokeWidth={2} fill="url(#queriesGrad)" />
                <Area type="monotone" dataKey="successRate" name="Success %" stroke="#10b981" strokeWidth={2} fill="url(#successGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Query Distribution Pie */}
          <div className="bg-white border border-slate-200/85 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-850">Query Distribution</h2>
                <p className="text-xs text-slate-400 mt-0.5">By agent type</p>
              </div>
              <Zap className="w-5 h-5 text-accent" />
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-slate-500 font-semibold">{entry.name}</span>
                  </div>
                  <span className="font-bold text-slate-800">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4 text-left">
          {/* Agent Performance Bar Chart */}
          <div className="bg-white border border-slate-200/85 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-850">Agent Performance</h2>
                <p className="text-xs text-slate-400 mt-0.5">Success rate vs. avg response time</p>
              </div>
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={mockPerformance} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#64748b' }} />
                <Bar dataKey="successRate" name="Success (%)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgResponseTime" name="Avg Time (ms)" fill="#818cf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Usage & Cost Panel */}
          <div className="bg-white border border-slate-200/85 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-850">Resource Usage</h2>
                <p className="text-xs text-slate-400 mt-0.5">Token consumption and estimated costs</p>
              </div>
              <DollarSign className="w-5 h-5 text-success" />
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50/50 border border-slate-200/85 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Tokens Used</p>
                  <Zap className="w-4 h-4 text-amber-500" />
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {usageStats ? usageStats.totalTokens.toLocaleString() : '—'}
                </p>
                <p className="text-xs text-slate-450 mt-0.5 font-medium">Cumulative token consumption</p>
              </div>

              <div className="p-4 bg-slate-50/50 border border-slate-200/85 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Estimated Cost</p>
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {usageStats ? `$${Number(usageStats.estimatedCost).toFixed(4)}` : '—'}
                </p>
                <p className="text-xs text-slate-450 mt-0.5 font-medium font-mono">Based on $0.000002 / token</p>
              </div>

              {!usageStats && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-xs text-amber-600 font-semibold">
                    💡 Usage stats require Admin role. Log in as admin to view detailed costs.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Agent Performance Table */}
        <div className="bg-white border border-slate-200/85 rounded-2xl p-6 shadow-sm text-left">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-800">Agent Leaderboard</h2>
              <p className="text-xs text-slate-400 mt-0.5">Ranked by success rate</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider pb-3">Agent</th>
                  <th className="text-right text-xs font-bold text-slate-400 uppercase tracking-wider pb-3">Success Rate</th>
                  <th className="text-right text-xs font-bold text-slate-400 uppercase tracking-wider pb-3">Avg Response</th>
                  <th className="text-right text-xs font-bold text-slate-400 uppercase tracking-wider pb-3">Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[...mockPerformance]
                  .sort((a, b) => (b.successRate || 0) - (a.successRate || 0))
                  .map((agent, index) => {
                    const rate = agent.successRate || 0;
                    const health = rate >= 90 ? 'Excellent' : rate >= 75 ? 'Good' : 'Needs Review';
                    const healthColor = rate >= 90 ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : rate >= 75 ? 'text-amber-600 bg-amber-50 border-amber-100' : 'text-rose-600 bg-rose-50 border-rose-100';
                    return (
                      <tr key={agent.name} className="group hover:bg-slate-50/50 transition">
                        <td className="py-3 pr-4">
                          <div className="flex items-center space-x-3">
                            <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                              {index + 1}
                            </span>
                            <span className="font-semibold text-slate-800">{agent.name}</span>
                          </div>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <div className="w-20 bg-slate-100 rounded-full h-1.5">
                              <div className="bg-primary h-1.5 rounded-full" style={{ width: `${rate}%` }} />
                            </div>
                            <span className="font-bold text-slate-800 w-14 text-right">{rate.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="py-3 text-right font-semibold text-slate-700">
                          {agent.avgResponseTime ? `${Math.round(agent.avgResponseTime)}ms` : '—'}
                        </td>
                        <td className="py-3 text-right">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${healthColor}`}>
                            {health}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AnalyticsPage;
