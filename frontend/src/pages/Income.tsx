import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { CardSkeleton } from '../components/ui/Skeleton';
import { useAuthStore } from '../store/authStore';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Edit3,
  X,
  AlertCircle,
  Coins,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../utils/formatCurrency';

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'C$',
};

export const Income: React.FC = () => {
  const { user } = useAuthStore();
  const currencySymbol = user?.currency ? CURRENCY_SYMBOLS[user.currency] || '₹' : '₹';

  // Filters & State
  const [incomes, setIncomes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search & Dates
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 8; // Limit to 8 incomes per page for visual balance

  // Modal controls
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<any | null>(null);
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
      source: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    }
  });

  const fetchIncomes = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query string
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());

      const res = await api.get(`/incomes?${params.toString()}`);
      setIncomes(res.data.data.incomes);
      setTotalPages(res.data.data.pagination.pages || 1);
      setTotalItems(res.data.data.pagination.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load incomes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomes();
  }, [search, startDate, endDate, currentPage]);

  const handleOpenAddModal = () => {
    setEditingIncome(null);
    reset({
      amount: '',
      source: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (income: any) => {
    setEditingIncome(income);
    setValue('amount', income.amount.toString());
    setValue('source', income.source);
    setValue('description', income.description || '');
    setValue('date', new Date(income.date).toISOString().split('T')[0]);
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingIncome(null);
  };

  const onSubmit = async (data: any) => {
    setSubmitLoading(true);
    setSubmitError(null);
    try {
      const payload = {
        amount: parseFloat(data.amount),
        source: data.source,
        description: data.description,
        date: data.date
      };

      if (editingIncome) {
        await api.put(`/incomes/${editingIncome._id}`, payload);
        toast.success('Income updated successfully!');
      } else {
        await api.post('/incomes', payload);
        toast.success('Income logged successfully!');
      }

      handleCloseModal();
      fetchIncomes();
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Failed to submit income');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this income?')) return;
    try {
      await api.delete(`/incomes/${id}`);
      toast.success('Income deleted successfully!');
      fetchIncomes();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete income');
    }
  };

  const handleClearFilters = () => {
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
            <TrendingUp className="h-7 w-7 text-emerald-500 shrink-0" />
            Income Entries
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Log salaries, dividends, and other recurring cash flow sources
          </p>
        </div>
        <Button onClick={handleOpenAddModal} className="w-full sm:w-auto">
          <Plus className="mr-1.5 h-4 w-4" /> Add Income
        </Button>
      </div>

      {/* Advanced Filters Card */}
      <Card className="p-4 space-y-4">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-3 lg:grid-cols-4">
          <div className="relative col-span-1 sm:col-span-1 lg:col-span-2">
            <Input
              placeholder="Search source or description..."
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

        {(search || startDate || endDate) && (
          <div className="flex justify-end pt-1 border-t border-gray-50 dark:border-darkborder/30">
            <button
              onClick={handleClearFilters}
              className="text-xs font-bold text-red-500 hover:text-red-655 focus:outline-none"
            >
              Clear Active Filters
            </button>
          </div>
        )}
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
      ) : incomes.length === 0 ? (
        <Card className="py-16 text-center text-gray-400">
          <Coins className="mx-auto h-12 w-12 text-gray-350 dark:text-gray-500 mb-3" />
          <h3 className="font-bold text-gray-900 dark:text-white">No income records found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
            Change your date filter limits or log a new cash flow stream
          </p>
          <Button onClick={handleOpenAddModal} variant="secondary" className="mt-4 text-xs">
            Log First Income
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          <motion.div
            layout
            className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
          >
            <AnimatePresence>
              {incomes.map((income) => (
                <motion.div
                  key={income._id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card hoverEffect className="flex flex-col justify-between h-full relative">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 uppercase tracking-wider">
                          {income.source}
                        </span>
                        <span className="text-[10px] text-gray-400 font-semibold">
                          {new Date(income.date).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>

                      <h3 className="text-xl font-extrabold text-gray-905 dark:text-white mt-3.5">
                        {formatCurrency(income.amount)}
                      </h3>
                      
                      <p className="text-xs text-gray-500 dark:text-gray-405 mt-1.5 leading-relaxed line-clamp-3">
                        {income.description || 'No description provided'}
                      </p>
                    </div>

                    <div className="flex justify-end gap-2 border-t border-gray-50 pt-2.5 mt-4 dark:border-darkborder/50">
                      <button
                        onClick={() => handleOpenEditModal(income)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-805 dark:hover:bg-darkborder dark:hover:text-white transition-colors"
                        title="Modify Income"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(income._id)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-655 dark:hover:bg-red-950/20 dark:hover:text-red-400 transition-colors"
                        title="Delete Income"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Pagination */}
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

      {/* Modal Dialog for Add/Edit Income */}
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
              {editingIncome ? 'Modify Income' : 'Log Income'}
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

              <Input
                label="Source"
                type="text"
                placeholder="e.g. Salary, Freelancing, Stock Dividend"
                error={errors.source?.message}
                {...register('source', {
                  required: 'Source is required',
                  maxLength: { value: 100, message: 'Source cannot exceed 100 characters' }
                })}
              />

              <Input
                label="Description"
                type="text"
                placeholder="e.g. Monthly freelance client project payout"
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
                  {editingIncome ? 'Save Changes' : 'Log Income'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
