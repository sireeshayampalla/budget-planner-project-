import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CreditCard, TrendingUp, Sparkles, X, Target, User } from 'lucide-react';
import { addLog } from '../../utils/debugLogger';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    addLog('info', `Sidebar: isOpen state changed to ${isOpen}`);
  }, [isOpen]);

  const navItems = [
    { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { name: 'Expenses', to: '/expenses', icon: CreditCard },
    { name: 'Income', to: '/income', icon: TrendingUp },
    { name: 'Budgets & Goals', to: '/budgets', icon: Target },
    { name: 'Spending Insights', to: '/insights', icon: Sparkles },
    { name: 'Profile Settings', to: '/profile', icon: User },
  ];

  return (
    <>
      {/* Mobile Sidebar Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-sm transition-opacity md:hidden dark:bg-black/60"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-45 flex w-64 flex-col border-r border-gray-150 bg-white dark:border-darkborder dark:bg-darkcard transition-transform duration-300 md:sticky md:top-16 md:z-30 md:h-[calc(100vh-4rem)]
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Mobile Header (Close Button) */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-gray-100 md:hidden dark:border-darkborder">
          <span className="font-semibold text-gray-900 dark:text-white">Navigation</span>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-darkborder"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1.5 px-4 py-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }: { isActive: boolean }) => `
                  flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all duration-200
                  ${isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-500 font-semibold'
                    : 'text-gray-650 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-darkbg dark:hover:text-white'
                  }
                `}
              >
                <Icon className="h-4.5 w-4.5" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-gray-150 p-4 dark:border-darkborder">
          <div className="rounded-lg bg-gray-50 p-3.5 text-xs text-gray-500 dark:bg-darkbg dark:text-gray-400">
            <p className="font-medium text-gray-700 dark:text-gray-300">Budget Planner Premium</p>
            <p className="mt-0.5">Control your capital, inspect behaviors, master savings.</p>
          </div>
        </div>
      </aside>
    </>
  );
};
