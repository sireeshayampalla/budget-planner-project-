import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useAuthStore } from '../store/authStore';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  TrendingDown,
  AlertTriangle,
  Plus,
  Edit3,
  Trash2,
  Calendar,
  PiggyBank,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import { safeStorage } from '../utils/safeStorage';

const CATEGORIES = [
  'Food',
  'Travel',
  'Shopping',
  'Bills',
  'Entertainment',
  'Health',
  'Other'
];

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'C$',
};

export const Budgets: React.FC = () => {
  const { user } = useAuthStore();
  const currencySymbol = user?.currency ? CURRENCY_SYMBOLS[user.currency] || '₹' : '₹';

  // Date selection
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  // Data states
  const [breakdown, setBreakdown] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Savings Target state (locally persisted in localStorage per user)
  const savingsTargetKey = `budget_planner_savings_target_${user?.id || 'guest'}`;
  const [savingsTarget, setSavingsTarget] = useState<number>(() => {
    return parseFloat(safeStorage.getItem(savingsTargetKey) || '500');
  });
  const [isEditingSavings, setIsEditingSavings] = useState(false);
  const [tempSavings, setTempSavings] = useState<string>(savingsTarget.toString());

  // Modal/Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('Food');
  const [limitAmount, setLimitAmount] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch breakdown and dashboard stats
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get breakdown for selected month/year
      const breakdownRes = await api.get(`/budgets/breakdown?month=${selectedMonth}&year=${selectedYear}`);
      setBreakdown(breakdownRes.data.data.breakdown);

      // Get dashboard stats for general monthly calculations (like income)
      const statsRes = await api.get('/insights/dashboard');
      setDashboardStats(statsRes.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load budget data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  // Savings Target persistence
  const handleSaveSavingsTarget = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(tempSavings);
    if (isNaN(val) || val < 0) {
      toast.error('Please enter a valid savings target');
      return;
    }
    setSavingsTarget(val);
    safeStorage.setItem(savingsTargetKey, val.toString());
    setIsEditingSavings(false);
    toast.success('Savings target updated!');
  };

  const handleOpenAddModal = () => {
    setEditingBudget(null);
    setSelectedCategory('Food');
    setLimitAmount('');
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (budget: any) => {
    setEditingBudget(budget);
    setSelectedCategory(budget.category);
    setLimitAmount(budget.budgetLimit.toString());
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBudget(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setSubmitError(null);

    const limitVal = parseFloat(limitAmount);
    if (isNaN(limitVal) || limitVal <= 0) {
      setSubmitError('Budget limit must be a positive number greater than 0');
      setSubmitLoading(false);
      return;
    }

    try {
      if (editingBudget) {
        // Update
        await api.put(`/budgets/${editingBudget.id}`, { limit: limitVal });
        toast.success(`Updated budget limit for ${editingBudget.category}`);
      } else {
        // Create/Upsert
        await api.post('/budgets', {
          category: selectedCategory,
          limit: limitVal,
          month: selectedMonth,
          year: selectedYear
        });
        toast.success(`Set budget limit for ${selectedCategory}`);
      }
      handleCloseModal();
      fetchData();
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Failed to save budget limit');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteBudget = async (id: string, category: string) => {
    if (!window.confirm(`Are you sure you want to remove the budget for ${category}?`)) return;
    try {
      await api.delete(`/budgets/${id}`);
      toast.success(`Budget for ${category} deleted successfully`);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete budget limit');
    }
  };

  // Calculations
  const totalIncome = dashboardStats?.monthly?.income || 0;
  const totalLimit = breakdown.reduce((sum, item) => sum + item.budgetLimit, 0);
  const totalSpent = breakdown.reduce((sum, item) => sum + item.actualSpent, 0);
  const remainingLimit = Math.max(0, totalLimit - totalSpent);
  const limitPercent = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;

  // Actual Savings calculation
  const actualSavings = Math.max(0, totalIncome - totalSpent);
  const savingsPercent = savingsTarget > 0 ? Math.min(100, (actualSavings / savingsTarget) * 100) : 0;

  // List categories with no budget
  const budgetedCategories = breakdown.map(b => b.category);
  const unbudgetedCategories = CATEGORIES.filter(c => !budgetedCategories.includes(c));

  // Style helper for progress bar colors
  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 95) return 'bg-red-500';
    if (percentage >= 75) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getProgressBarBg = (percentage: number) => {
    if (percentage >= 95) return 'bg-red-500/10 dark:bg-red-500/20';
    if (percentage >= 75) return 'bg-amber-500/10 dark:bg-amber-500/20';
    return 'bg-emerald-500/10 dark:bg-emerald-500/20';
  };

  const getTextColor = (percentage: number) => {
    if (percentage >= 95) return 'text-red-600 dark:text-red-400';
    if (percentage >= 75) return 'text-amber-600 dark:text-amber-400';
    return 'text-emerald-600 dark:text-emerald-400';
  };

  // Overrun warnings count
  const overrunWarnings = breakdown.filter(b => b.percentageSpent >= 95);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            Budgets & Goals
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Configure boundaries, monitor category bounds, and reach your savings target
          </p>
        </div>
        
        {/* Month/Year Picker */}
        <div className="flex gap-2 items-center">
          <Calendar className="h-4.5 w-4.5 text-brand-500 hidden sm:block" />
          <Select
            options={[
              { value: '1', label: 'January' },
              { value: '2', label: 'February' },
              { value: '3', label: 'March' },
              { value: '4', label: 'April' },
              { value: '5', label: 'May' },
              { value: '6', label: 'June' },
              { value: '7', label: 'July' },
              { value: '8', label: 'August' },
              { value: '9', label: 'September' },
              { value: '10', label: 'October' },
              { value: '11', label: 'November' },
              { value: '12', label: 'December' }
            ]}
            value={selectedMonth.toString()}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
            className="w-32 py-1.5 px-2 text-xs"
          />
          <Select
            options={[
              { value: '2025', label: '2025' },
              { value: '2026', label: '2026' },
              { value: '2027', label: '2027' }
            ]}
            value={selectedYear.toString()}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            className="w-24 py-1.5 px-2 text-xs"
          />
          <Button onClick={handleOpenAddModal} className="text-xs py-2 px-3">
            <Plus className="mr-1 h-3.5 w-3.5" /> Set Budget
          </Button>
        </div>
      </div>

      {/* Warning Banner */}
      {overrunWarnings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex gap-3 items-start p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400"
        >
          <AlertCircle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Critical Budget Limits Crossed!</h4>
            <p className="text-xs mt-0.5">
              You have {overrunWarnings.length} category limit{overrunWarnings.length > 1 ? 's' : ''} at or exceeding 95% threshold: {overrunWarnings.map(o => o.category).join(', ')}. We recommend adjusting your expenses.
            </p>
          </div>
        </motion.div>
      )}

      {/* KPI Top Cards */}
      <div className="grid gap-5 grid-cols-1 md:grid-cols-3">
        {/* Total Budget card */}
        <Card hoverEffect className="relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-16 w-16 -translate-y-4 translate-x-4 rounded-full bg-brand-500/5 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-500 dark:text-brand-400">
              <Target className="h-5.5 w-5.5" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Monthly Budget Limit
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
                {formatCurrency(totalLimit)}
              </h3>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1 text-gray-500">
              <span>Spend Progress: {limitPercent.toFixed(1)}%</span>
              <span>{formatCurrency(totalSpent)} spent</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-darkborder">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(limitPercent)}`}
                style={{ width: `${Math.min(100, limitPercent)}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Total Spent card */}
        <Card hoverEffect className="relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-16 w-16 -translate-y-4 translate-x-4 rounded-full bg-red-500/5 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400">
              <TrendingDown className="h-5.5 w-5.5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Spent on Budgeted
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
                {formatCurrency(totalSpent)}
              </h3>
            </div>
          </div>
          <div className="mt-4 border-t border-gray-100 pt-3 dark:border-darkborder/50 flex justify-between items-center text-xs text-gray-500">
            <span>Remaining budget allowance:</span>
            <span className={`font-bold ${remainingLimit === 0 ? 'text-red-500' : 'text-gray-700 dark:text-gray-200'}`}>
              {formatCurrency(remainingLimit)}
            </span>
          </div>
        </Card>

        {/* Savings Target Card */}
        <Card hoverEffect className="relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-16 w-16 -translate-y-4 translate-x-4 rounded-full bg-emerald-500/5 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-450">
              <PiggyBank className="h-5.5 w-5.5" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Savings Target Goal
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setTempSavings(savingsTarget.toString());
                    setIsEditingSavings(!isEditingSavings);
                  }}
                  className="text-xs font-semibold text-brand-500 hover:text-brand-600 focus:outline-none"
                >
                  {isEditingSavings ? 'Cancel' : 'Edit'}
                </button>
              </div>
              
              {isEditingSavings ? (
                <form onSubmit={handleSaveSavingsTarget} className="flex gap-1.5 mt-1">
                  <input
                    type="number"
                    value={tempSavings}
                    onChange={(e) => setTempSavings(e.target.value)}
                    className="w-24 px-2 py-1 text-sm border rounded bg-white dark:bg-darkbg text-gray-900 dark:text-white border-gray-200 dark:border-darkborder focus:outline-none focus:ring-1 focus:ring-brand-500"
                    placeholder="500"
                    autoFocus
                  />
                  <Button type="submit" className="py-1 px-2.5 text-xs">Save</Button>
                </form>
              ) : (
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
                  {formatCurrency(savingsTarget)}
                </h3>
              )}
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1 text-gray-500">
              <span>Goal Achieved: {savingsPercent.toFixed(1)}%</span>
              <span>{formatCurrency(actualSavings)} saved</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-darkborder">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${savingsPercent}%` }}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Section */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
        
        {/* Left Side: Active Budgets breakdown */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-gray-150 dark:border-darkborder/50">
            <h3 className="text-lg font-bold text-gray-950 dark:text-white">Active Budgets</h3>
            <span className="text-xs text-gray-500">{breakdown.length} active limits</span>
          </div>

          {loading ? (
            <div className="flex h-[40vh] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400">
              <p className="font-semibold">{error}</p>
            </div>
          ) : breakdown.length === 0 ? (
            <Card className="py-12 text-center text-gray-400">
              <Target className="mx-auto h-12 w-12 text-gray-350 dark:text-gray-500 mb-3" />
              <h4 className="font-bold text-gray-900 dark:text-white">No budget thresholds configured</h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                Establish spending bounds to help monitor expenses and notify you when reaching thresholds
              </p>
              <Button onClick={handleOpenAddModal} className="mt-4 text-xs">
                Set First Limit Category
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <AnimatePresence>
                {breakdown.map((item) => {
                  const spendPercent = item.budgetLimit > 0 ? (item.actualSpent / item.budgetLimit) * 100 : 0;
                  return (
                    <motion.div
                      key={item.id || item.category}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.25 }}
                    >
                      <Card className="flex flex-col justify-between h-full hover:shadow-md transition-shadow relative overflow-hidden">
                        {spendPercent >= 95 && (
                          <div className="absolute right-0 top-0 h-10 w-10 flex items-center justify-center bg-red-500 text-white rounded-bl-xl">
                            <AlertTriangle className="h-4.5 w-4.5" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-900 dark:text-white text-base">
                              {item.category}
                            </span>
                            <span className={`text-xs font-semibold uppercase tracking-wider rounded-full px-2 py-0.5 ${getProgressBarBg(spendPercent)} ${getTextColor(spendPercent)}`}>
                              {spendPercent.toFixed(0)}% Spent
                            </span>
                          </div>

                          <div className="mt-4 space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Limit:</span>
                              <span className="font-semibold text-gray-950 dark:text-white">
                                {formatCurrency(item.budgetLimit)}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Spent:</span>
                              <span className="font-semibold text-gray-950 dark:text-white">
                                {formatCurrency(item.actualSpent)}
                              </span>
                            </div>
                            {item.overrun > 0 ? (
                              <div className="flex justify-between text-sm text-red-500 font-bold">
                                <span>Overrun:</span>
                                <span>+{formatCurrency(item.overrun)}</span>
                              </div>
                            ) : (
                              <div className="flex justify-between text-sm text-emerald-500 font-medium">
                                <span>Remaining:</span>
                                <span>{formatCurrency(item.remaining)}</span>
                              </div>
                            )}
                          </div>

                          {/* Progress bar */}
                          <div className="mt-4 h-2 w-full rounded-full bg-gray-100 dark:bg-darkborder">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(spendPercent)}`}
                              style={{ width: `${Math.min(100, spendPercent)}%` }}
                            />
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-2 border-t border-gray-50 pt-2.5 mt-4 dark:border-darkborder/50">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-darkborder dark:hover:text-white transition-colors"
                            title="Edit Limit"
                          >
                            <Edit3 className="h-4.5 w-4.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteBudget(item.id, item.category)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400 transition-colors"
                            title="Remove Budget"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Right Side: Setup Limits / Suggestions */}
        <div className="lg:col-span-4 space-y-5">
          <Card className="p-5">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
              Unconfigured Categories
            </h3>
            
            {unbudgetedCategories.length === 0 ? (
              <div className="text-center py-4 text-xs text-gray-500 flex flex-col items-center gap-1.5">
                <CheckCircle className="h-7 w-7 text-emerald-500" />
                <span>All categories have limits configured!</span>
              </div>
            ) : (
              <div className="space-y-2">
                {unbudgetedCategories.map((c) => (
                  <div
                    key={c}
                    className="flex justify-between items-center p-2.5 rounded-lg border border-dashed border-gray-200 dark:border-darkborder/60 hover:bg-gray-50 dark:hover:bg-darkbg transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{c}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory(c);
                        setEditingBudget(null);
                        setLimitAmount('');
                        setSubmitError(null);
                        setIsModalOpen(true);
                      }}
                      className="text-xs font-semibold text-brand-500 hover:text-brand-600 flex items-center gap-1 focus:outline-none"
                    >
                      <Plus className="h-3.5 w-3.5" /> Configure
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5 bg-gradient-to-br from-brand-500/5 to-purple-500/5 dark:from-brand-500/10 dark:to-purple-500/10 border-brand-500/20">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-1.5">
              <PiggyBank className="h-4.5 w-4.5 text-brand-500" />
              SaaS Savings Insights
            </h3>
            <p className="text-xs text-gray-550 dark:text-gray-400 leading-relaxed">
              Based on your monthly income of <span className="font-semibold">{formatCurrency(totalIncome)}</span>, setting a savings target of <span className="font-semibold">{formatCurrency(savingsTarget)}</span> implies an allowed total limit of <span className="font-semibold">{formatCurrency(totalIncome - savingsTarget)}</span> across categories.
            </p>
            <div className="mt-3.5 border-t border-gray-150 dark:border-darkborder/50 pt-3 text-xs text-gray-500">
              <span className="block font-semibold text-gray-700 dark:text-gray-300">Tips:</span>
              <ul className="list-disc list-inside mt-1 space-y-1 text-gray-400">
                <li>Check your daily updates to stay below thresholds</li>
                <li>Set budget alerts in Insights page</li>
                <li>Optimize shopping & bills for saving more</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>

      {/* Modal Form Backdrop & Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm dark:bg-black/60 animate-fade-in">
          <Card className="w-full max-w-md shadow-2xl relative bg-white dark:bg-darkcard border-gray-200 dark:border-darkborder p-6">
            <button
              onClick={handleCloseModal}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 hover:bg-gray-150 dark:hover:bg-darkborder"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {editingBudget ? 'Update Budget Limit' : 'Configure Category Budget'}
            </h2>

            {submitError && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-150 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {!editingBudget ? (
                <Select
                  label="Expense Category"
                  options={unbudgetedCategories.map((c) => ({ value: c, label: c }))}
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                />
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Expense Category
                  </label>
                  <div className="px-3.5 py-2.5 rounded-lg border text-sm bg-gray-50 dark:bg-darkbg text-gray-550 border-gray-200 dark:border-darkborder font-semibold">
                    {selectedCategory}
                  </div>
                </div>
              )}

              <Input
                label={`Monthly Limit (${currencySymbol})`}
                type="number"
                step="0.01"
                placeholder="0.00"
                value={limitAmount}
                onChange={(e) => setLimitAmount(e.target.value)}
                required
              />

              <div className="text-xs text-gray-450 dark:text-gray-400 bg-gray-50 dark:bg-darkbg/50 p-2.5 rounded-lg border border-gray-150 dark:border-darkborder/50">
                This limit applies to the selected period: <span className="font-semibold text-gray-700 dark:text-gray-200">{`${[
                  'January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'
                ][selectedMonth - 1]} ${selectedYear}`}</span>.
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <Button type="button" variant="secondary" onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={submitLoading}>
                  {editingBudget ? 'Save Changes' : 'Set Limit'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </motion.div>
  );
};
