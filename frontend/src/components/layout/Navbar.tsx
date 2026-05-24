import React, { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import {
  Sun,
  Moon,
  LogOut,
  Menu,
  User as UserIcon,
  PiggyBank,
  Wallet,
  Landmark,
  Coins,
  Crown,
  Gem,
  Shield,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { safeStorage } from '../../utils/safeStorage';
import { addLog } from '../../utils/debugLogger';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export const renderAvatar = (avatarKey?: string) => {
  const base = "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white ";
  switch (avatarKey) {
    case 'piggy': return <div className={base + "bg-pink-500"}><PiggyBank className="h-4 w-4" /></div>;
    case 'wallet': return <div className={base + "bg-blue-500"}><Wallet className="h-4 w-4" /></div>;
    case 'bank': return <div className={base + "bg-indigo-500"}><Landmark className="h-4 w-4" /></div>;
    case 'coin': return <div className={base + "bg-amber-500"}><Coins className="h-4 w-4" /></div>;
    case 'crown': return <div className={base + "bg-yellow-500"}><Crown className="h-4 w-4" /></div>;
    case 'gem': return <div className={base + "bg-purple-500"}><Gem className="h-4 w-4" /></div>;
    case 'shield': return <div className={base + "bg-emerald-500"}><Shield className="h-4 w-4" /></div>;
    case 'chart': return <div className={base + "bg-teal-500"}><TrendingUp className="h-4 w-4" /></div>;
    default: return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-700/20 dark:text-brand-500">
        <UserIcon className="h-4 w-4" />
      </div>
    );
  }
};

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout, updatePreferences } = useAuthStore();
  const currentTheme = user?.theme || safeStorage.getItem('budget_planner_theme') || 'dark';
  const isDark = currentTheme === 'dark';

  const toggleTheme = async () => {
    const nextTheme = isDark ? 'light' : 'dark';
    if (user) {
      await updatePreferences({ theme: nextTheme });
    } else {
      safeStorage.setItem('budget_planner_theme', nextTheme);
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  useEffect(() => {
    if (currentTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [currentTheme]);

  return (
    <header className="sticky top-0 z-35 w-full border-b border-gray-150 bg-white/80 backdrop-blur-md dark:border-darkborder dark:bg-darkbg/80 transition-colors duration-200">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left Section: Menu Toggle (Mobile) & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.preventDefault();
              addLog('info', 'Navbar: Hamburger menu button clicked');
              onToggleSidebar();
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              addLog('info', 'Navbar: Hamburger menu button touched (onTouchStart)');
              onToggleSidebar();
            }}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:outline-none md:hidden dark:text-gray-400 dark:hover:bg-darkborder dark:hover:text-white"
          >
            <Menu className="h-5.5 w-5.5" />
          </button>
          
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white shadow-sm shadow-brand-500/20">
              <span className="font-bold text-lg">B</span>
            </div>
            <span className="hidden sm:inline-block font-semibold text-lg text-gray-900 dark:text-white tracking-tight">
              Budget <span className="text-brand-500">Planner</span>
            </span>
          </Link>
        </div>

        {/* Right Section: Actions & Profile */}
        <div className="flex items-center gap-4">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-darkborder dark:hover:text-white transition-colors"
            title="Toggle theme"
          >
            {isDark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </button>

          {/* User Display */}
          {user && (
            <Link to="/profile" className="flex items-center gap-2 hover:opacity-85 transition-opacity">
              {renderAvatar(user.avatar)}
              <span className="hidden md:inline-block text-sm font-medium text-gray-700 dark:text-gray-300">
                {user.username}
              </span>
            </Link>
          )}

          {/* Logout Button */}
          <button
            onClick={logout}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-950/20 dark:hover:text-red-500 transition-colors"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline-block">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
