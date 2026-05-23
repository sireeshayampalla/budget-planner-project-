import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { motion } from 'framer-motion';
import {
  Sparkles,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  Info
} from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
];

export const Insights: React.FC = () => {

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  
  const [insightData, setInsightData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/insights?month=${selectedMonth}&year=${selectedYear}`);
      setInsightData(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch insights');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [selectedMonth, selectedYear]);

  // Generate score details: colors, titles, status
  const getScoreStatus = (score: number) => {
    if (score >= 80) {
      return {
        color: 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5',
        strokeClass: 'stroke-emerald-500',
        bg: 'bg-emerald-50 dark:bg-emerald-500/10',
        label: 'Excellent Health',
        desc: 'Outstanding saving rate and excellent discipline keeping within bounds!'
      };
    } else if (score >= 50) {
      return {
        color: 'text-amber-500 border-amber-500/20 bg-amber-500/5',
        strokeClass: 'stroke-amber-500',
        bg: 'bg-amber-50 dark:bg-amber-500/10',
        label: 'Stable/Average',
        desc: 'Your spending is average, but there are areas where leakage occurs.'
      };
    } else {
      return {
        color: 'text-red-500 border-red-500/20 bg-red-500/5',
        strokeClass: 'stroke-red-500',
        bg: 'bg-red-50 dark:bg-red-500/10',
        label: 'Needs Attention',
        desc: 'High overspending or budget boundaries breached. Review allocations.'
      };
    }
  };

  const yearsRange = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          <p className="text-sm font-semibold text-gray-500 animate-pulse">Assembling spending patterns...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400 max-w-lg mx-auto mt-10">
        <Info className="mx-auto h-8 w-8 mb-2" />
        <p className="font-semibold">{error}</p>
        <Button onClick={fetchInsights} className="mt-4">
          Retry Request
        </Button>
      </div>
    );
  }

  const {
    spendingScore = 100,
    totalIncome = 0,
    totalExpenses = 0,
    highestSpendingCategory = 'None',
    insightsList = [],
    savingsSuggestions = []
  } = insightData || {};

  const scoreDetails = getScoreStatus(spendingScore);
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round(((totalIncome - totalExpenses) / totalIncome) * 100)) : 0;

  // Gauge details for SVG
  const radius = 55;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (spendingScore / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      {/* Header with Date selectors */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-brand-500 shrink-0" />
            Spending Insights
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Analyze structural cash flows and optimize spending velocity
          </p>
        </div>

        {/* Date Selector Dropdowns */}
        <div className="flex gap-2 bg-white dark:bg-darkcard border border-gray-150 dark:border-darkborder p-1.5 rounded-lg shrink-0">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="bg-transparent text-xs font-semibold border-none focus:outline-none dark:text-white py-1 px-2 cursor-pointer"
          >
            {MONTHS.map((m) => (
              <option className="dark:bg-darkcard text-xs" key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="bg-transparent text-xs font-semibold border-none focus:outline-none dark:text-white py-1 px-2 cursor-pointer"
          >
            {yearsRange.map((y) => (
              <option className="dark:bg-darkcard text-xs" key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Score Gauge and Quick Stats */}
      <div className="grid gap-5 grid-cols-1 md:grid-cols-12">
        {/* Score Gauge Circle */}
        <Card className="md:col-span-5 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-br from-white to-gray-50/50 dark:from-darkcard dark:to-darkbg/30">
          <div className="flex items-center gap-1.5 mb-5 text-gray-700 dark:text-gray-300 self-start">
            <Sparkles className="h-4.5 w-4.5 text-brand-500" />
            <span className="font-bold text-xs tracking-wider uppercase">Behavior Score</span>
          </div>

          {/* SVG Gauge */}
          <div className="relative flex items-center justify-center h-40 w-40">
            <svg className="transform -rotate-90 w-full h-full">
              {/* Background circle */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke="#e5e7eb"
                className="dark:stroke-darkborder"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              {/* Score circle */}
              <motion.circle
                cx="80"
                cy="80"
                r={radius}
                className={scoreDetails.strokeClass}
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{spendingScore}</span>
              <span className="text-[9px] uppercase font-bold tracking-widest text-gray-400 mt-0.5">Rating Score</span>
            </div>
          </div>

          <div className="mt-5">
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold tracking-wider uppercase border ${scoreDetails.color}`}>
              {scoreDetails.label}
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2.5 px-4 leading-relaxed">
              {scoreDetails.desc}
            </p>
          </div>
        </Card>

        {/* Quick Month Metrics */}
        <Card className="md:col-span-7 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 mb-4 border-b border-gray-100 pb-3 dark:border-darkborder/50">
            <Info className="h-4.5 w-4.5 text-brand-500" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Summary for this Period</h3>
          </div>

          <div className="grid gap-4 grid-cols-2 flex-1">
            <div className="p-3.5 rounded-lg bg-gray-50 dark:bg-darkbg/50 border border-gray-100 dark:border-darkborder/50 flex flex-col justify-center">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Income loaded</span>
              <p className="text-xl font-bold text-emerald-500 mt-1">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="p-3.5 rounded-lg bg-gray-50 dark:bg-darkbg/50 border border-gray-100 dark:border-darkborder/50 flex flex-col justify-center">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Expenses logged</span>
              <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(totalExpenses)}</p>
            </div>
            <div className="p-3.5 rounded-lg bg-gray-50 dark:bg-darkbg/50 border border-gray-100 dark:border-darkborder/50 flex flex-col justify-center">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Savings Velocity</span>
              <p className="text-xl font-bold text-brand-500 mt-1">{savingsRate}%</p>
            </div>
            <div className="p-3.5 rounded-lg bg-gray-50 dark:bg-darkbg/50 border border-gray-100 dark:border-darkborder/50 flex flex-col justify-center">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Highest outgo category</span>
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mt-1 truncate" title={highestSpendingCategory}>
                {highestSpendingCategory}
              </p>
            </div>
          </div>

          <div className="mt-4 p-3.5 rounded-lg bg-brand-50/40 dark:bg-brand-500/5 text-xs text-brand-700 dark:text-brand-400 border border-brand-100/50 dark:border-brand-500/10">
            <strong>Target Savings Rate:</strong> standard financial advice recommends saving at least 20% of your total net monthly income.
          </div>
        </Card>
      </div>

      {/* Smart Insights & Alert Feed */}
      <Card>
        <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2.5 dark:border-darkborder/50">
          <Sparkles className="h-5 w-5 text-brand-500" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Smart Behavioral Feed</h3>
        </div>

        <div className="space-y-3">
          {insightsList.length > 0 ? (
            insightsList.map((ins: string, idx: number) => {
              const isAlert = ins.toLowerCase().includes('alert');
              const isCaution = ins.toLowerCase().includes('caution');
              const isSuccess = ins.toLowerCase().includes('great') || ins.toLowerCase().includes('excellent') || ins.toLowerCase().includes('good');

              let classes = 'bg-gray-50 border-gray-200 dark:bg-darkbg/40 dark:border-darkborder text-gray-750 dark:text-gray-300';
              let Icon = Info;

              if (isAlert) {
                classes = 'bg-red-50/50 border-red-150 text-red-800 dark:bg-red-950/10 dark:border-red-900/35 dark:text-red-400';
                Icon = AlertCircle;
              } else if (isCaution) {
                classes = 'bg-amber-50/50 border-amber-150 text-amber-800 dark:bg-amber-950/10 dark:border-amber-900/35 dark:text-amber-400';
                Icon = AlertCircle;
              } else if (isSuccess) {
                classes = 'bg-emerald-50/50 border-emerald-150 text-emerald-800 dark:bg-emerald-950/10 dark:border-emerald-900/35 dark:text-emerald-450';
                Icon = CheckCircle2;
              }

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.05 }}
                  className={`flex items-start gap-3 rounded-xl border p-4 text-xs font-semibold leading-relaxed ${classes}`}
                >
                  <Icon className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                  <span>{ins}</span>
                </motion.div>
              );
            })
          ) : (
            <div className="py-4 text-center text-xs text-gray-400">
              No behavior insights could be compiled. Please add some financial records.
            </div>
          )}
        </div>
      </Card>

      {/* Savings Recommendations */}
      <Card>
        <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2.5 dark:border-darkborder/50">
          <Lightbulb className="h-5 w-5 text-brand-500" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Savings Suggestions & Actionables</h3>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          {savingsSuggestions.length > 0 ? (
            savingsSuggestions.map((sug: string, idx: number) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, delay: idx * 0.06 }}
                className="flex items-start gap-3.5 p-4 rounded-xl border border-gray-150 bg-white dark:border-darkborder dark:bg-darkcard hover:shadow-md hover:translate-y-[-1px] transition-all"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-500">
                  <ArrowRight className="h-4 w-4" />
                </div>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 leading-relaxed">
                  {sug}
                </p>
              </motion.div>
            ))
          ) : (
            <div className="col-span-2 py-4 text-center text-xs text-gray-400">
              No custom suggestions compiled yet.
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};
