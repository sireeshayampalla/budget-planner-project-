import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  Info,
  IndianRupee,
  Briefcase,
  Activity,
  Award,
  Sparkles,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as ChartTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { formatCurrency } from '../utils/formatCurrency';
import { safeFormatDate } from '../utils/formatDate';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab for Recharts view
  const [activeChartTab, setActiveChartTab] = useState<'flow' | 'distribution' | 'curve'>('flow');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch dashboard stats and insights in parallel
        const [statsRes, insightsRes] = await Promise.all([
          api.get('/insights/dashboard'),
          api.get('/insights')
        ]);

        setStats(statsRes.data.data);
        setInsights(insightsRes.data.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          <p className="text-sm font-semibold text-gray-500 animate-pulse">Analyzing financial profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400 max-w-lg mx-auto mt-10">
        <Info className="mx-auto h-8 w-8 mb-2" />
        <p className="font-semibold">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4" variant="secondary">
          Retry
        </Button>
      </div>
    );
  }

  const rawMonthly = stats?.monthly;
  const rawAllTime = stats?.allTime;
  
  const monthly = {
    income: rawMonthly?.income ?? 0,
    expenses: rawMonthly?.expenses ?? 0,
    balance: rawMonthly?.balance ?? 0,
    budget: rawMonthly?.budget ?? 0,
    remainingBudget: rawMonthly?.remainingBudget ?? 0
  };
  
  const allTime = {
    income: rawAllTime?.income ?? 0,
    expenses: rawAllTime?.expenses ?? 0,
    balance: rawAllTime?.balance ?? 0
  };

  const categoryDistribution = Array.isArray(stats?.categoryDistribution) ? stats.categoryDistribution : [];
  const monthlyTrends = Array.isArray(stats?.monthlyTrends) ? stats.monthlyTrends : [];
  const recentTransactions = Array.isArray(stats?.recentTransactions) ? stats.recentTransactions : [];

  const spendingScore = insights?.spendingScore ?? 100;
  const insightsList = insights?.insightsList || [];

  // Colors
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6b7280'];

  const formattedCategoryData = categoryDistribution.map((item: any) => ({
    name: item.category,
    value: item.value
  }));

  const currentMonthName = (() => {
    const MONTH_NAMES = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const now = new Date();
    return `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
  })();

  // Gauge details
  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (spendingScore / 100) * circumference;

  const getScoreColorClass = (score: number) => {
    if (score >= 80) return 'text-emerald-500 stroke-emerald-500';
    if (score >= 50) return 'text-amber-500 stroke-amber-500';
    return 'text-red-500 stroke-red-500';
  };

  const getScoreBgClass = (score: number) => {
    if (score >= 80) return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    if (score >= 50) return 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400';
    return 'bg-red-50 dark:bg-red-500/10 text-red-650 dark:text-red-400';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Average';
    return 'Poor';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            Overview Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-0.5">
            <Calendar className="h-4 w-4 text-brand-500" />
            Financial health review for <span className="font-semibold text-gray-700 dark:text-gray-200">{currentMonthName}</span>
          </p>
        </div>
        <div className="flex gap-2.5">
          <Button onClick={() => navigate('/income')} variant="secondary" className="flex-1 sm:flex-none">
            <TrendingUp className="mr-1.5 h-4 w-4 text-emerald-500" /> + Income
          </Button>
          <Button onClick={() => navigate('/expenses')} className="flex-1 sm:flex-none">
            <TrendingDown className="mr-1.5 h-4 w-4 text-white" /> + Expense
          </Button>
        </div>
      </div>

      {/* Main KPI Cards Grid */}
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-3">
        {/* Income Card */}
        <Card hoverEffect className="relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-16 w-16 -translate-y-4 translate-x-4 rounded-full bg-emerald-500/5 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-5.5 w-5.5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Monthly Income
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
                {formatCurrency(monthly.income)}
              </h3>
            </div>
          </div>
          <div className="mt-4 border-t border-gray-100 pt-3 dark:border-darkborder/50">
            <p className="text-xs text-gray-500">
              All-time earnings: <span className="font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(allTime.income)}</span>
            </p>
          </div>
        </Card>

        {/* Expenses Card */}
        <Card hoverEffect className="relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-16 w-16 -translate-y-4 translate-x-4 rounded-full bg-red-500/5 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400">
              <TrendingDown className="h-5.5 w-5.5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Monthly Expenses
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
                {formatCurrency(monthly.expenses)}
              </h3>
            </div>
          </div>
          <div className="mt-4 border-t border-gray-100 pt-3 dark:border-darkborder/50">
            <p className="text-xs text-gray-500">
              All-time outgoing: <span className="font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(allTime.expenses)}</span>
            </p>
          </div>
        </Card>

        {/* Net Savings Card */}
        <Card hoverEffect className="relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-16 w-16 -translate-y-4 translate-x-4 rounded-full bg-brand-500/5 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-500 dark:text-brand-450">
              <Wallet className="h-5.5 w-5.5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Monthly Net Savings
              </p>
              <h3 className={`text-2xl font-bold mt-0.5 ${monthly.balance >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-500'}`}>
                {formatCurrency(monthly.balance)}
              </h3>
            </div>
          </div>
          <div className="mt-4 border-t border-gray-100 pt-3 dark:border-darkborder/50">
            <p className="text-xs text-gray-500">
              All-time savings: <span className={`font-semibold ${allTime.balance >= 0 ? 'text-emerald-650 dark:text-emerald-400' : 'text-red-500'}`}>{formatCurrency(allTime.balance)}</span>
            </p>
          </div>
        </Card>
      </div>

      {/* Middle Grid: Financial Health Score Gauge & AI Insights */}
      <div className="grid gap-5 grid-cols-1 md:grid-cols-12">
        {/* Visual Circle Gauge Card */}
        <Card className="md:col-span-4 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-br from-white to-gray-50/50 dark:from-darkcard dark:to-darkbg/30">
          <div className="flex items-center gap-2 mb-4 self-start">
            <Award className="h-5 w-5 text-brand-500" />
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Financial Health Score</h3>
          </div>
          
          <div className="relative flex items-center justify-center h-36 w-36 mb-3">
            {/* SVG circle gauge */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r={radius}
                className="stroke-gray-100 dark:stroke-darkborder"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              <motion.circle
                cx="72"
                cy="72"
                r={radius}
                className={`${getScoreColorClass(spendingScore)}`}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-gray-900 dark:text-white">{spendingScore}</span>
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mt-0.5">Points</span>
            </div>
          </div>
          
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${getScoreBgClass(spendingScore)}`}>
            {getScoreLabel(spendingScore)} rating
          </div>
          <p className="text-xs text-gray-500 mt-3.5 leading-relaxed max-w-[200px]">
            Determined by savings velocity, overrun categories, and budget bounds limit.
          </p>
        </Card>

        {/* AI Spending Insights Quick Feed */}
        <Card className="md:col-span-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2 dark:border-darkborder/50">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-5 w-5 text-brand-500" />
                <h3 className="text-base font-bold text-gray-900 dark:text-white">AI Spending Insights</h3>
              </div>
              <Button variant="ghost" onClick={() => navigate('/insights')} className="text-xs py-1 px-2.5">
                View Recommendations <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {insightsList.length > 0 ? (
                insightsList.map((ins: string, idx: number) => {
                  const isAlert = ins.includes('Alert') || ins.includes('Caution');
                  return (
                    <div
                      key={idx}
                      className={`flex gap-3 items-start p-3 rounded-lg border text-xs
                        ${isAlert
                          ? 'bg-red-50/40 border-red-150 text-red-800 dark:bg-red-950/10 dark:border-red-900/20 dark:text-red-400'
                          : 'bg-gray-50/50 border-gray-150 text-gray-700 dark:bg-darkbg/50 dark:border-darkborder/50 dark:text-gray-300'
                        }
                      `}
                    >
                      {isAlert ? (
                        <AlertTriangle className="h-4.5 w-4.5 text-red-500 shrink-0 mt-0.5" />
                      ) : (
                        <Info className="h-4.5 w-4.5 text-brand-500 shrink-0 mt-0.5" />
                      )}
                      <p className="leading-relaxed">{ins}</p>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-gray-400">
                  No insights generated yet. Log more transactions to reveal patterns.
                </div>
              )}
            </div>
          </div>

          <div className="text-[11px] text-gray-400 mt-3 pt-2 border-t border-gray-50 dark:border-darkborder/30">
            *Insights evaluate your current month activity and refresh on data modification.
          </div>
        </Card>
      </div>

      {/* Tabbed Interactive Recharts Section */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5 border-b border-gray-100 dark:border-darkborder/50 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-brand-500" />
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Financial Analytics Visualizer</h3>
          </div>
          
          {/* Tab selector */}
          <div className="flex bg-gray-100 dark:bg-darkbg rounded-lg p-0.5 border dark:border-darkborder">
            <button
              onClick={() => setActiveChartTab('flow')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all
                ${activeChartTab === 'flow'
                  ? 'bg-white dark:bg-darkcard text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
                }
              `}
            >
              Cash Flow Trends
            </button>
            <button
              onClick={() => setActiveChartTab('distribution')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all
                ${activeChartTab === 'distribution'
                  ? 'bg-white dark:bg-darkcard text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
                }
              `}
            >
              Category Distributions
            </button>
            <button
              onClick={() => setActiveChartTab('curve')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all
                ${activeChartTab === 'curve'
                  ? 'bg-white dark:bg-darkcard text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
                }
              `}
            >
              Income vs Expense Curves
            </button>
          </div>
        </div>

        <div className="h-80 w-full">
          <AnimatePresence mode="wait">
            {activeChartTab === 'flow' && (
              <motion.div
                key="flow-chart"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full w-full"
              >
                {monthlyTrends.length > 0 ? (
                  <ResponsiveContainer width="99%" height={300}>
                    <BarChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-darkborder" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9ca3af" tickLine={false} />
                      <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" tickLine={false} axisLine={false} />
                      <ChartTooltip
                        formatter={(val) => [formatCurrency(Number(val)), '']}
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          color: '#fff',
                          borderRadius: '8px',
                          border: 'none',
                          fontSize: '12px'
                        }}
                        cursor={{ fill: 'rgba(156, 163, 175, 0.1)' }}
                      />
                      <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Income" />
                      <Bar dataKey="expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Expenses" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-gray-400">
                    No financial history available
                  </div>
                )}
              </motion.div>
            )}

            {activeChartTab === 'distribution' && (
              <motion.div
                key="distribution-chart"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full w-full flex flex-col md:flex-row items-center justify-center gap-6"
              >
                {formattedCategoryData.length > 0 ? (
                  <>
                    <div className="h-60 w-full md:w-1/2">
                      <ResponsiveContainer width="99%" height={240}>
                        <PieChart>
                          <Pie
                            data={formattedCategoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {formattedCategoryData.map((_entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <ChartTooltip
                            formatter={(val) => [formatCurrency(Number(val)), 'Spent']}
                            contentStyle={{
                              backgroundColor: '#1f2937',
                              color: '#fff',
                              borderRadius: '8px',
                              border: 'none',
                              fontSize: '12px'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* List */}
                    <div className="grid grid-cols-2 gap-3 w-full md:w-1/2 text-xs">
                      {formattedCategoryData.map((item: any, index: number) => (
                        <div key={item.name} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50/50 dark:bg-darkbg/50 border dark:border-darkborder/50 truncate">
                          <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="text-gray-600 dark:text-gray-400 font-medium truncate">{item.name}</span>
                          <span className="font-bold text-gray-900 dark:text-white ml-auto">{formatCurrency(item.value)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-gray-400">
                    No expense distributions logged this month
                  </div>
                )}
              </motion.div>
            )}

            {activeChartTab === 'curve' && (
              <motion.div
                key="curve-chart"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full w-full"
              >
                {monthlyTrends.length > 0 ? (
                  <ResponsiveContainer width="99%" height={300}>
                    <LineChart data={monthlyTrends} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-darkborder" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9ca3af" tickLine={false} />
                      <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" tickLine={false} axisLine={false} />
                      <ChartTooltip
                        formatter={(val) => [formatCurrency(Number(val)), '']}
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          color: '#fff',
                          borderRadius: '8px',
                          border: 'none',
                          fontSize: '12px'
                        }}
                      />
                      <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Income" />
                      <Line type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Expenses" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-gray-400">
                    No financial curves available
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>

      {/* Recent Movements table */}
      <Card>
        <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2.5 dark:border-darkborder/50">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-brand-500" />
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Recent Transactions</h3>
          </div>
          <Button variant="ghost" onClick={() => navigate('/expenses')} className="text-xs py-1 px-2.5">
            Manage Data →
          </Button>
        </div>

        <div className="overflow-x-auto">
          {recentTransactions.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-darkborder text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="pb-3 pl-2">Movement</th>
                  <th className="pb-3">Source/Category</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3 text-right pr-2">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-darkborder/50 text-sm">
                {recentTransactions.map((tx: any) => (
                  <tr key={tx._id} className="hover:bg-gray-50/50 dark:hover:bg-darkborder/20 transition-colors">
                    {/* Type icon & description */}
                    <td className="py-3.5 pl-2 flex items-center gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg
                        ${tx.type === 'income'
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                          : 'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400'
                        }
                      `}>
                        {tx.type === 'income' ? <Briefcase className="h-4 w-4" /> : <IndianRupee className="h-4 w-4" />}
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white truncate max-w-[150px] sm:max-w-xs">
                        {tx.description || (tx.type === 'income' ? 'Income Source' : 'Expense Outgo')}
                      </span>
                    </td>
                    {/* Category */}
                    <td className="py-3.5">
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-650 dark:bg-darkborder dark:text-gray-300">
                        {tx.categoryOrSource}
                      </span>
                    </td>
                    {/* Date */}
                    <td className="py-3.5 text-gray-500 dark:text-gray-400">
                      {safeFormatDate(tx.date)}
                    </td>
                    {/* Amount */}
                    <td className={`py-3.5 text-right pr-2 font-bold
                      ${tx.type === 'income' ? 'text-emerald-500' : 'text-gray-900 dark:text-white'}
                    `}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-8 text-center text-sm text-gray-400">
              No recent transactions recorded. Add an income or expense to get started.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
