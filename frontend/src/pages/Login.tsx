import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Mail, Lock, AlertCircle, Eye, EyeOff, Sparkles, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../api/axios';
import { safeStorage } from '../utils/safeStorage';

export const Login: React.FC = () => {
  const { login, error, isLoading, clearError } = useAuthStore();
  const navigate = useNavigate();

  // State controls
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // Forgot Password modal state
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  // Read remember me on mount
  useEffect(() => {
    const savedEmail = safeStorage.getItem('budget_planner_remember_email');
    if (savedEmail) {
      setValue('email', savedEmail);
      setRememberMe(true);
    }
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    clearError();
  }, [clearError]);

  const onSubmit = async (data: any) => {
    if (rememberMe) {
      safeStorage.setItem('budget_planner_remember_email', data.email);
    } else {
      safeStorage.removeItem('budget_planner_remember_email');
    }

    const success = await login(data.email, data.password);
    if (success) {
      toast.success('Successfully signed in!');
      navigate('/dashboard');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotUsername || !forgotEmail || !forgotNewPassword) {
      setForgotError('Please fill in all fields');
      return;
    }
    if (forgotNewPassword.length < 6) {
      setForgotError('Password must be at least 6 characters');
      return;
    }

    setForgotLoading(true);
    setForgotError(null);

    try {
      await api.post('/auth/forgot-password', {
        username: forgotUsername,
        email: forgotEmail,
        newPassword: forgotNewPassword
      });
      toast.success('Password reset successfully! You can now log in.');
      setIsForgotOpen(false);
      // Clear forgot states
      setForgotUsername('');
      setForgotEmail('');
      setForgotNewPassword('');
    } catch (err: any) {
      setForgotError(err.response?.data?.message || 'Failed to reset password. Please check your credentials.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-tr from-brand-500/10 via-gray-50 to-purple-500/10 px-4 dark:from-darkbg dark:via-darkbg dark:to-darkcard py-12 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="w-full max-w-md">
        <Card glass className="p-8 shadow-2xl rounded-2xl border border-gray-150/40 dark:border-darkborder/50">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-lg shadow-brand-500/20 mb-4 animate-bounce">
              <span className="font-extrabold text-2xl">B</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-1.5 flex items-center gap-1.5 justify-center">
              Budget Planner <Sparkles className="h-5 w-5 text-brand-500 shrink-0" />
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Simplify cash flows and unlock spending insights
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-center gap-2 rounded-xl bg-red-50 p-3.5 text-xs text-red-650 border border-red-100 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400 animate-fade-in">
              <AlertCircle className="h-4.5 w-4.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              icon={<Mail className="h-4.5 w-4.5" />}
              error={errors.email?.message}
              {...register('email', {
                required: 'Email address is required',
                pattern: {
                  value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                  message: 'Please enter a valid email address',
                },
              })}
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                icon={<Lock className="h-4.5 w-4.5" />}
                error={errors.password?.message}
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters long',
                  },
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-[38px] text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>

            {/* Remember Me and Forgot Password links */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-gray-605 dark:text-gray-450 font-medium">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300 text-brand-500 focus:ring-brand-500 h-4 w-4 dark:border-darkborder bg-white dark:bg-darkcard"
                />
                Remember me
              </label>

              <button
                type="button"
                onClick={() => {
                  setForgotError(null);
                  setIsForgotOpen(true);
                }}
                className="font-semibold text-brand-500 hover:text-brand-600 focus:outline-none"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </form>
        </Card>

        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-bold text-brand-500 hover:text-brand-600 dark:text-brand-500 dark:hover:text-brand-450 transition-colors"
          >
            Create one for free
          </Link>
        </p>
      </div>

      {/* Forgot Password Modal */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm dark:bg-black/60 animate-fade-in">
          <Card className="w-full max-w-sm shadow-2xl relative bg-white dark:bg-darkcard border-gray-200 dark:border-darkborder p-6">
            <button
              onClick={() => setIsForgotOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 hover:bg-gray-150 dark:hover:bg-darkborder"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Reset Your Password
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Enter matching registration credentials to update your password credentials.
            </p>

            {forgotError && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-2.5 text-xs text-red-650 border border-red-150 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <Input
                label="Username"
                type="text"
                placeholder="john_doe"
                value={forgotUsername}
                onChange={(e) => setForgotUsername(e.target.value)}
                required
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="john@example.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
              />

              <Input
                label="New Password"
                type="password"
                placeholder="At least 6 characters"
                value={forgotNewPassword}
                onChange={(e) => setForgotNewPassword(e.target.value)}
                required
              />

              <div className="flex justify-end gap-2.5 pt-2">
                <Button type="button" variant="secondary" onClick={() => setIsForgotOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={forgotLoading}>
                  Update Password
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
