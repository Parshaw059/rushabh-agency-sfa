'use client';

import React, { useState, useEffect } from 'react';
import { User } from '@/types';
import { updateUserCredentials } from '@/lib/storage';
import {
  ShieldCheck,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  CheckCircle2,
  X,
  AlertCircle,
  KeyRound,
  Sparkles,
} from 'lucide-react';

interface ChangeCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onCredentialsUpdated?: (updatedUser: User) => void;
}

export const ChangeCredentialsModal: React.FC<ChangeCredentialsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onCredentialsUpdated,
}) => {
  const [currentPin, setCurrentPin] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Initialize username with current username when modal opens
  useEffect(() => {
    if (isOpen && currentUser) {
      setNewUsername(currentUser.username || '');
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setError(null);
      setSuccessMessage(null);
    }
  }, [isOpen, currentUser]);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const cleanCurrentPin = currentPin.trim();
    const cleanNewUsername = newUsername.trim();
    const cleanNewPin = newPin.trim();
    const cleanConfirmPin = confirmPin.trim();

    if (!cleanCurrentPin) {
      setError('Please enter your current Security PIN to authorize changes.');
      return;
    }

    if (!cleanNewUsername && !cleanNewPin) {
      setError('Please enter a new Username or new Security PIN to update.');
      return;
    }

    if (cleanNewPin) {
      if (cleanNewPin.length < 4) {
        setError('New Security PIN must be at least 4 digits or characters.');
        return;
      }
      if (cleanNewPin !== cleanConfirmPin) {
        setError('New Security PIN and Confirmation PIN do not match.');
        return;
      }
    }

    setIsLoading(true);
    try {
      const result = await updateUserCredentials({
        currentPin: cleanCurrentPin,
        newUsername: cleanNewUsername !== (currentUser.username || '') ? cleanNewUsername : undefined,
        newPin: cleanNewPin || undefined,
      });

      if (!result.success || !result.user) {
        setError(result.error || 'Failed to update credentials. Please check your current PIN.');
        setIsLoading(false);
        return;
      }

      setSuccessMessage('Credentials updated successfully! You can now use your new username & PIN.');
      if (onCredentialsUpdated) {
        onCredentialsUpdated(result.user);
      }

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err?.message || 'Network error updating credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const isOwner = currentUser.role === 'OWNER';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="max-w-md w-full bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center ${
                isOwner ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <span
                className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full inline-block ${
                  isOwner
                    ? 'text-purple-700 bg-purple-50 border border-purple-200/80'
                    : 'text-emerald-700 bg-emerald-50 border border-emerald-200/80'
                }`}
              >
                {isOwner ? 'Owner / Admin Security' : 'Salesman Account Security'}
              </span>
              <h3 className="text-sm font-black text-slate-900 mt-0.5">
                Change Username & Password
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 flex items-center justify-between text-xs">
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
              Logged in Account
            </span>
            <span className="font-black text-slate-900 truncate block">
              {currentUser.name}
            </span>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
              Current Username
            </span>
            <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80">
              @{currentUser.username || (isOwner ? 'owner' : 'hiren')}
            </span>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-2xl flex items-center gap-2 font-medium animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success notification */}
        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-2xl flex items-center gap-2 font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Current Security PIN (Required) */}
          <div className="space-y-1">
            <label className="block text-[11px] font-black text-slate-700">
              Current Security PIN / Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type={showCurrentPin ? 'text' : 'password'}
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
                placeholder="Enter your current 4-digit PIN"
                required
                className="w-full pl-9 pr-10 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-xs"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPin(!showCurrentPin)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showCurrentPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <span className="text-[10px] text-slate-400 block px-1">
              Required to authorize changing your login credentials.
            </span>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-3">
            {/* New Username */}
            <div className="space-y-1">
              <label className="block text-[11px] font-black text-slate-700">
                New Username (Optional)
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Enter new username (e.g. rushabh_admin)"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-xs"
                />
              </div>
              <span className="text-[10px] text-slate-400 block px-1">
                You can use this username or your mobile number to sign in.
              </span>
            </div>

            {/* New Security PIN */}
            <div className="space-y-1">
              <label className="block text-[11px] font-black text-slate-700">
                New Security PIN / Password (Optional)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type={showNewPin ? 'text' : 'password'}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="Enter new 4-digit PIN"
                  className="w-full pl-9 pr-10 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPin(!showNewPin)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Security PIN */}
            {newPin.trim().length > 0 && (
              <div className="space-y-1 animate-in fade-in">
                <label className="block text-[11px] font-black text-slate-700">
                  Confirm New Security PIN <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showConfirmPin ? 'text' : 'password'}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    placeholder="Re-enter new 4-digit PIN"
                    required
                    className="w-full pl-9 pr-10 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPin(!showConfirmPin)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-3 flex items-center gap-2">
            <button
              type="submit"
              disabled={isLoading}
              className={`flex-1 py-2.5 rounded-xl text-white font-black text-xs shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                isLoading
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 shadow-emerald-700/20'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-white" />
              <span>{isLoading ? 'Updating...' : 'Save & Update Credentials'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
