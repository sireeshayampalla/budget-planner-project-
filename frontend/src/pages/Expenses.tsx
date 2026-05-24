import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { CardSkeleton } from '../components/ui/Skeleton';
import { useAuthStore } from '../store/authStore';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Edit3,
  X,
  Filter,
  AlertCircle,
  ShoppingBag,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../utils/formatCurrency';
import { safeFormatDate } from '../utils/formatDate';

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

export const Expenses: React.FC = () => {
  const { user } = useAuthStore();
  const currencySymbol = user?.currency ? CURRENCY_SYMBOLS[user.currency] || '₹' : '₹';

  // Filters & State
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('');
  
  // Search & Dates
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 8; // Limit to 8 expenses per page for beautiful dashboard layout

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues: {
      amount: '',
      category: 'Food',
      description: '',
      date: new Date().toISOString().split('T')[0]
    }
  });

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query string
      const params = new URLSearchParams();
      if (filterCategory) params.append('category', filterCategory);
      if (search) params.append('search', search);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());

      const res = await api.get(`/expenses?${params.toString()}`);
      setExpenses(res.data.data.expenses);
      setTotalPages(res.data.data.pagination.pages || 1);
      setTotalItems(res.data.data.pagination.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [filterCategory, search, startDate, endDate, currentPage]);

  const handleOpenAddModal = () => {
    setEditingExpense(null);
    reset({
      amount: '',
      category: 'Food',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (expense: any) => {
    setEditingExpense(expense);
    setValue('amount', expense.amount.toString());
    setValue('category', expense.category);
    setValue('description', expense.description || '');
    let formattedDate = '';
    try {
      const d = new Date(expense.date);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toISOString().split('T')[0];
      } else {
        const cleanDate = String(expense.date).replace(/-/g, '/').replace('T', ' ').split('.')[0];
        const d2 = new Date(cleanDate);
        formattedDate = !isNaN(d2.getTime()) ? d2.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      }
    } catch (e) {
      formattedDate = new Date().toISOString().split('T')[0];
    }
    setValue('date', formattedDate);
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingExpense(null);
  };

  const onSubmit = async (data: any) => {
    setSubmitLoading(true);
    setSubmitError(null);
    try {
      const payload = {
        amount: parseFloat(data.amount),
        category: data.category,
        description: data.description,
        date: data.date
      };

      if (editingExpense) {
        await api.put(`/expenses/${editingExpense._id}`, payload);
        toast.success('Expense updated successfully!');
      } else {
        await api.post('/expenses', payload);
        toast.success('Expense added successfully!');
      }

      handleCloseModal();
      fetchExpenses();
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Failed to submit expense');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      toast.success('Expense deleted successfully!');
      fetchExpenses();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete expense');
    }
  };

  const handleClearFilters = () => {
    setFilterCategory('');
    setSearch('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl flex items-center gap-2">
            <TrendingDown className="h-7 w-7 text-red-500 shrink-0" />
            Expenses
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Manage your outgoing expenditures and define thresholds
          </p>
        </div>
        <Button onClick={handleOpenAddModal} className="w-full sm:w-auto">
          <Plus className="mr-1.5 h-4 w-4" /> Add Expense
        </Button>
      </div>

      {/* Filters and Inputs Card */}
      <Card className="p-4 space-y-4">
        {/* Row 1: Search & Date Range */}
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-3 lg:grid-cols-4">
          <div className="relative col-span-1 sm:col-span-1 lg:col-span-2">
            <Input
              placeholder="Search by description..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              icon={<Search className="h-4.5 w-4.5" />}
            />
          </div>
          <Input
            type="date"
            placeholder="Start date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setCurrentPage(1);
            }}
            icon={<Calendar className="h-4.5 w-4.5" />}
            className="text-xs"
          />
          <Input
            type="date"
            placeholder="End date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setCurrentPage(1);
            }}
            icon={<Calendar className="h-4.5 w-4.5" />}
            className="text-xs"
          />
        </div>

        {/* Row 2: Category Filter Pills */}
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center justify-between pt-1 border-t border-gray-50 dark:border-darkborder/30">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <Filter className="h-4 w-4 text-brand-500" />
            Category:
          </div>
          
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => {
                setFilterCategory('');
                setCurrentPage(1);
              }}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all
                ${filterCategory === ''
                  ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/10'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-darkborder dark:text-gray-300 dark:hover:bg-darkbg'
                }
              `}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setFilterCategory(cat);
                  setCurrentPage(1);
                }}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-all
                  ${filterCategory === cat
                    ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/10'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-darkborder dark:text-gray-300 dark:hover:bg-darkbg'
                  }
                `}
              >
                {cat}
              </button>
            ))}
            {(filterCategory || search || startDate || endDate) && (
              <button
                onClick={handleClearFilters}
                className="text-xs font-bold text-red-500 hover:text-red-600 ml-1.5 focus:outline-none"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Main content grid */}
      {loading ? (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(itemsPerPage)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400">
          <p className="font-semibold">{error}</p>
        </div>
      ) : expenses.length === 0 ? (
        <Card className="py-16 text-center text-gray-400">
          <ShoppingBag className="mx-auto h-12 w-12 text-gray-350 dark:text-gray-500 mb-3" />
          <h3 className="font-bold text-gray-900 dark:text-white">No expenses found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
            Adjust your filter constraints or create a new expense entry
          </p>
          <Button onClick={handleOpenAddModal} variant="secondary" className="mt-4 text-xs">
            Log New Expense
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          <motion.div
            layout
            className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
          >
            <AnimatePresence>
              {expenses.map((expense) => (
                <motion.div
                  key={expense._id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card hoverEffect className="flex flex-col justify-between h-full relative">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-brand-500/10 dark:text-brand-400 uppercase tracking-wider">
                          {expense.category}
                        </span>
                        <span className="text-[10px] text-gray-405 font-semibold">
                          {safeFormatDate(expense.date)}
                        </span>
                      </div>

                      <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mt-3.5">
                        {formatCurrency(expense.amount)}
                      </h3>
                      
                      <p className="text-xs text-gray-500 dark:text-gray-405 mt-1.5 leading-relaxed line-clamp-3">
                        {expense.description || 'No description provided'}
                      </p>
                    </div>

                    <div className="flex justify-end gap-2 border-t border-gray-50 pt-2.5 mt-4 dark:border-darkborder/50">
                      <button
                        onClick={() => handleOpenEditModal(expense)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-darkborder dark:hover:text-white transition-colors"
                        title="Modify Expense"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(expense._id)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-655 dark:hover:bg-red-950/20 dark:hover:text-red-400 transition-colors"
                        title="Delete Expense"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-darkborder/50">
              <span className="text-xs text-gray-500 font-medium">
                Showing <span className="text-gray-700 dark:text-gray-200">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                <span className="text-gray-700 dark:text-gray-200">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of{' '}
                <span className="text-gray-700 dark:text-gray-200">{totalItems}</span> entries
              </span>

              <div className="flex gap-1.5">
                <Button
                  variant="secondary"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="py-1 px-2 text-xs"
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </Button>
                
                {[...Array(totalPages)].map((_, idx) => {
                  const pNum = idx + 1;
                  return (
                    <Button
                      key={pNum}
                      variant={currentPage === pNum ? 'primary' : 'secondary'}
                      onClick={() => setCurrentPage(pNum)}
                      className="py-1 px-3 text-xs"
                    >
                      {pNum}
                    </Button>
                  );
                })}

                <Button
                  variant="secondary"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="py-1 px-2 text-xs"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Dialog for Add/Edit Expense */}
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
              {editingExpense ? 'Modify Expense' : 'Add Expense'}
            </h2>

            {submitError && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-650 border border-red-150 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label={`Amount (${currencySymbol})`}
                type="number"
                step="0.01"
                placeholder="0.00"
                error={errors.amount?.message}
                {...register('amount', {
                  required: 'Amount is required',
                  validate: (v) => parseFloat(v) > 0 || 'Amount must be greater than zero'
                })}
              />

              <Select
                label="Category"
                options={CATEGORIES.map((cat) => ({ value: cat, label: cat }))}
                error={errors.category?.message}
                {...register('category', { required: 'Category is required' })}
              />

              <Input
                label="Description"
                type="text"
                placeholder="e.g. Grocery shopping, electricity bill"
                error={errors.description?.message}
                {...register('description', {
                  maxLength: { value: 200, message: 'Description must be within 200 characters' }
                })}
              />

              <Input
                label="Date"
                type="date"
                error={errors.date?.message}
                {...register('date', { required: 'Date is required' })}
              />

              <div className="flex justify-end gap-2.5 pt-2">
                <Button type="button" variant="secondary" onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={submitLoading}>
                  {editingExpense ? 'Save Changes' : 'Add Expense'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
