import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { User, Mail, Lock, AlertCircle, Eye, EyeOff, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const Register: React.FC = () => {
  const { register: registerUser, error, isLoading, clearError } = useAuthStore();
  const navigate = useNavigate();

  // State controls
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      username: '',
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    clearError();
  }, [clearError]);

  const onSubmit = async (data: any) => {
    const success = await registerUser(data.username, data.email, data.password);
    if (success) {
      toast.success('Account created successfully!');
      navigate('/');
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
              Create a free account to manage transactions and set targets
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
              label="Username"
              type="text"
              placeholder="john_doe"
              icon={<User className="h-4.5 w-4.5" />}
              error={errors.username?.message}
              {...register('username', {
                required: 'Username is required',
                minLength: {
                  value: 3,
                  message: 'Username must be at least 3 characters long',
                },
              })}
            />

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
                className="absolute right-3.5 top-[38px] text-gray-400 hover:text-gray-605 focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              isLoading={isLoading}
            >
              Sign Up
            </Button>
          </form>
        </Card>

        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-bold text-brand-500 hover:text-brand-600 dark:text-brand-500 dark:hover:text-brand-450 transition-colors"
          >
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
};
