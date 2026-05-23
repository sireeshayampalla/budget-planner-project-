import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { renderAvatar } from '../components/layout/Navbar';
import {
  User as UserIcon,
  Shield,
  Palette,
  Eye,
  EyeOff
} from 'lucide-react';
import api from '../api/axios';

const AVATAR_PRESETS = [
  { key: 'piggy', label: 'Piggy Bank' },
  { key: 'wallet', label: 'Wallet' },
  { key: 'bank', label: 'Bank' },
  { key: 'coin', label: 'Coins' },
  { key: 'crown', label: 'Crown' },
  { key: 'gem', label: 'Gem' },
  { key: 'shield', label: 'Shield' },
  { key: 'chart', label: 'Growth Chart' }
];

const CURRENCIES = [
  { value: 'INR', label: 'INR (₹)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'JPY', label: 'JPY (¥)' },
  { value: 'CAD', label: 'CAD (C$)' }
];

export const Profile: React.FC = () => {
  const { user, updatePreferences } = useAuthStore();
  
  // Profile settings state
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || '');
  const [selectedCurrency, setSelectedCurrency] = useState(user?.currency || 'INR');
  const [selectedTheme, setSelectedTheme] = useState(user?.theme || 'dark');
  const [profileLoading, setProfileLoading] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const success = await updatePreferences({
        username,
        email,
        avatar: selectedAvatar,
        currency: selectedCurrency,
        theme: selectedTheme
      });
      if (success) {
        toast.success('Preferences updated successfully!');
      } else {
        toast.error('Failed to update profile settings.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error occurred while saving profile settings.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error('Please fill all password fields.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }
    setPassLoading(true);
    try {
      await api.put('/users/change-password', {
        currentPassword,
        newPassword
      });
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Incorrect current password or update failed.');
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6 max-w-4xl mx-auto"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
          Profile & Preferences
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Customize currency symbols, light/dark themes, premium avatars, and security settings
        </p>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        {/* Left Side: Avatar Picker Card */}
        <div className="md:col-span-1 space-y-6">
          <Card className="flex flex-col items-center text-center p-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
              Visual Avatar
            </h3>
            
            <div className="relative mb-4 ring-4 ring-brand-500/20 rounded-full p-1.5 bg-gray-50 dark:bg-darkbg">
              {renderAvatar(selectedAvatar)}
            </div>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {user?.username}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">{user?.email}</p>

            <div className="mt-6 w-full border-t border-gray-100 dark:border-darkborder/50 pt-5">
              <span className="text-xs font-semibold text-gray-500 block mb-3 text-left">
                Select Visual Identity
              </span>
              <div className="grid grid-cols-4 gap-2">
                {AVATAR_PRESETS.map((av) => (
                  <button
                    key={av.key}
                    type="button"
                    onClick={() => setSelectedAvatar(av.key)}
                    className={`p-1.5 rounded-lg border transition-all duration-200 flex items-center justify-center
                      ${selectedAvatar === av.key
                        ? 'border-brand-500 bg-brand-50/20 ring-2 ring-brand-500/20'
                        : 'border-gray-200 dark:border-darkborder hover:bg-gray-100 dark:hover:bg-darkbg'
                      }
                    `}
                    title={av.label}
                  >
                    {renderAvatar(av.key)}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            <div className="flex items-center gap-2 text-gray-950 dark:text-white font-bold text-sm">
              <Palette className="h-4.5 w-4.5 text-brand-500" />
              Theme Customization
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedTheme('light')}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm font-semibold transition-colors
                  ${selectedTheme === 'light'
                    ? 'border-brand-500 bg-brand-50/20 text-brand-700 dark:text-brand-400'
                    : 'border-gray-200 dark:border-darkborder text-gray-500 hover:bg-gray-50 dark:hover:bg-darkbg'
                  }
                `}
              >
                Light
              </button>
              <button
                type="button"
                onClick={() => setSelectedTheme('dark')}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm font-semibold transition-colors
                  ${selectedTheme === 'dark'
                    ? 'border-brand-500 bg-brand-50/20 text-brand-700 dark:text-brand-400'
                    : 'border-gray-200 dark:border-darkborder text-gray-500 hover:bg-gray-50 dark:hover:bg-darkbg'
                  }
                `}
              >
                Dark Mode
              </button>
            </div>
          </Card>
        </div>

        {/* Right Side: Forms Card */}
        <div className="md:col-span-2 space-y-6">
          {/* Settings details form */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3 dark:border-darkborder/50">
              <UserIcon className="h-5 w-5 text-brand-500" />
              <h3 className="text-lg font-bold text-gray-950 dark:text-white">Account Preferences</h3>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <Input
                  label="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  required
                />
                <Input
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                />
              </div>

              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <Select
                  label="Preferred Currency Symbol"
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  options={CURRENCIES}
                />
              </div>

              <div className="flex justify-end pt-3">
                <Button type="submit" isLoading={profileLoading}>
                  Save Preferences
                </Button>
              </div>
            </form>
          </Card>

          {/* Security details form */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3 dark:border-darkborder/50">
              <Shield className="h-5 w-5 text-brand-500" />
              <h3 className="text-lg font-bold text-gray-950 dark:text-white">Security & Password</h3>
            </div>

            <form onSubmit={handleSavePassword} className="space-y-4">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div className="relative w-full">
                  <Input
                    label="Current Password"
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3.5 top-[38px] text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showCurrent ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>

                <div className="relative w-full">
                  <Input
                    label="New Password"
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3.5 top-[38px] text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showNew ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <Button type="submit" variant="secondary" isLoading={passLoading}>
                  Change Password
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};
