'use client';

import { useState } from 'react';
import LuxuryCard from './LuxuryCard';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Save,
  Settings,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface UserSettingsProps {
  userType: 'admin' | 'influencer';
  currentEmail: string;
  onClose?: () => void;
}

export default function UserSettings({ userType, currentEmail, onClose }: UserSettingsProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newEmail, setNewEmail] = useState(currentEmail);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate current password
    if (userType === 'admin' && currentPassword !== 'Pass@123') {
      setError('Current password is incorrect');
      setLoading(false);
      return;
    }

    if (userType === 'influencer' && currentPassword !== '797@pass') {
      setError('Current password is incorrect');
      setLoading(false);
      return;
    }

    // Validate new password if changing
    if (newPassword && newPassword !== confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      setLoading(false);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setError('Invalid email format');
      setLoading(false);
      return;
    }

    // Simulate saving changes
    setTimeout(() => {
      setSuccess('Settings updated successfully! Please log in again with your new credentials.');
      setLoading(false);

      // Clear session and redirect after showing success message
      setTimeout(() => {
        if (userType === 'admin') {
          localStorage.removeItem('session');
          window.location.href = '/';
        } else {
          localStorage.removeItem('influencerSession');
          localStorage.removeItem('influencer_auth');
          window.location.href = '/';
        }
      }, 2000);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <LuxuryCard variant="elevated" className="w-full max-w-md p-8 shadow-luxury-xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10 flex items-center justify-center">
            <Settings size={32} className="text-white" />
          </div>
          <h3 className="heading-font text-3xl font-light text-luxury-gradient mb-3">
            Account Settings
          </h3>
          <p className="body-font text-white/60">Update your login credentials</p>
        </div>

        <form onSubmit={handleSaveChanges} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400">
              <AlertCircle size={20} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center gap-3 text-green-400">
              <CheckCircle size={20} />
              <span className="text-sm">{success}</span>
            </div>
          )}

          {/* Current Password */}
          <div className="space-y-3">
            <label className="block text-white/90 text-sm font-medium">Current Password</label>
            <div className="relative">
              <Lock size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40" />
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-4 glass-card border-glass rounded-2xl text-white placeholder-white/40 focus:outline-none focus:border-white/30 transition-all duration-500 focus:shadow-luxury"
                placeholder="Enter current password"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
              >
                {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* New Email */}
          <div className="space-y-3">
            <label className="block text-white/90 text-sm font-medium">Email Address</label>
            <div className="relative">
              <User size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40" />
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 glass-card border-glass rounded-2xl text-white placeholder-white/40 focus:outline-none focus:border-white/30 transition-all duration-500 focus:shadow-luxury"
                placeholder="Enter new email"
                required
              />
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-3">
            <label className="block text-white/90 text-sm font-medium">New Password (Optional)</label>
            <div className="relative">
              <Lock size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-4 glass-card border-glass rounded-2xl text-white placeholder-white/40 focus:outline-none focus:border-white/30 transition-all duration-500 focus:shadow-luxury"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
              >
                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          {newPassword && (
            <div className="space-y-3">
              <label className="block text-white/90 text-sm font-medium">Confirm New Password</label>
              <div className="relative">
                <Lock size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 glass-card border-glass rounded-2xl text-white placeholder-white/40 focus:outline-none focus:border-white/30 transition-all duration-500 focus:shadow-luxury"
                  placeholder="Confirm new password"
                  required={!!newPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 glass-card border-glass hover:bg-white/20 text-white rounded-2xl transition-all duration-500 font-medium hover:border-white/30"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || success !== ''}
              className="flex-1 btn-luxury px-6 py-4 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <p className="text-blue-400 text-sm font-medium mb-1">Note:</p>
          <p className="text-blue-300 text-xs">
            Changing your credentials will require you to log in again. Leave password fields empty to keep current password.
          </p>
        </div>
      </LuxuryCard>
    </div>
  );
}