'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, LogOut, PackageCheck, Shield, RefreshCw, KeyRound } from 'lucide-react';
import { User as UserType } from '@/types';
import { logoutUser, syncAllWithBackend, forcePushAllLocalDukansToCloud, forcePushAllLocalProductsToCloud } from '@/lib/storage';
import { ChangeCredentialsModal } from './ChangeCredentialsModal';

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backHref?: string;
  currentUser?: UserType | null;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  backHref,
  currentUser,
}) => {
  const router = useRouter();
  const [isChangeCredentialsOpen, setIsChangeCredentialsOpen] = useState(false);
  const [userState, setUserState] = useState<UserType | null>(currentUser || null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  useEffect(() => {
    setUserState(currentUser || null);
  }, [currentUser]);

  useEffect(() => {
    const handleUserUpdated = (e: any) => {
      if (e.detail) {
        setUserState(e.detail);
      }
    };
    window.addEventListener('rushabh-user-updated', handleUserUpdated);
    return () => window.removeEventListener('rushabh-user-updated', handleUserUpdated);
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncToast({ message: '🔄 Syncing Retailers, SKUs & Orders with Cloud...', type: 'info' });
    try {
      const res = await syncAllWithBackend();
      const allDukans = res.dukans || [];
      const dsrCount = allDukans.filter((d) => d.tripId === 'trip-dashrath-ranoli').length;
      const dukansCount = allDukans.length;
      const productsCount = res.products?.length || 0;
      const ordersCount = res.orders?.length || 0;
      setSyncToast({
        message: `✅ Cloud Synced! ${dsrCount} Dashrath-Ranoli Retailers (${dukansCount} Total across Beats), ${productsCount} SKUs & ${ordersCount} Orders`,
        type: 'success',
      });
    } catch (e: any) {
      setSyncToast({
        message: `⚠️ Sync notice: Local data saved. ${e?.message || ''}`,
        type: 'error',
      });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncToast(null), 4000);
    }
  };

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  const handleLogout = () => {
    logoutUser();
    router.push('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md text-slate-800 border-b border-slate-200/90 shadow-xs">


        <div className="px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {showBack ? (
              <button
                onClick={handleBack}
                className="p-1.5 -ml-1 rounded-xl bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 border border-slate-200 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <img
                src="/logo.jpg"
                alt="Rushabh Agency"
                className="w-8 h-8 rounded-xl object-cover border border-emerald-500/40 shadow-xs flex-shrink-0 ring-2 ring-emerald-500/15"
              />
            )}

            <div className="min-w-0">
              <h1 className="text-sm font-black text-slate-900 leading-tight truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-[11px] text-emerald-700 font-bold leading-tight truncate mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* User Info / Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Cloud Sync Button */}
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-emerald-700 border border-slate-200/90 transition-all flex items-center gap-1 text-[10px] font-bold active:scale-95"
              title="Sync Orders with Cloud (Phone ⇄ Laptop)"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync'}</span>
            </button>

            {userState && (
              <>
                {/* Change Username & Password Key Button */}
                <button
                  onClick={() => setIsChangeCredentialsOpen(true)}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200/90 transition-all flex items-center gap-1 text-[10px] font-bold active:scale-95"
                  title="Change Username & Security PIN / Password"
                >
                  <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden md:inline">Credentials</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsChangeCredentialsOpen(true)}
                  className="text-right hidden xs:block cursor-pointer hover:opacity-80 transition-opacity"
                  title="Click to view account security or change credentials"
                >
                  <span className="text-[11px] font-bold text-slate-800 block leading-tight truncate max-w-[105px]">
                    {userState.name.split(' ')[0]}
                  </span>
                  <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.2 rounded inline-block mt-0.5">
                    {userState.role}
                  </span>
                </button>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200/80 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Sync Feedback Toast Banner */}
      {syncToast && (
        <div
          className={`sticky top-[78px] z-30 px-4 py-2 text-xs font-bold shadow-md flex items-center justify-between transition-all animate-in fade-in slide-in-from-top-2 ${
            syncToast.type === 'success'
              ? 'bg-emerald-600 text-white'
              : syncToast.type === 'error'
              ? 'bg-amber-600 text-white'
              : 'bg-slate-800 text-white'
          }`}
        >
          <span className="truncate">{syncToast.message}</span>
          <button
            onClick={() => setSyncToast(null)}
            className="ml-2 text-white/80 hover:text-white text-xs px-1"
          >
            ✕
          </button>
        </div>
      )}

      <ChangeCredentialsModal
        isOpen={isChangeCredentialsOpen}
        onClose={() => setIsChangeCredentialsOpen(false)}
        currentUser={userState}
        onCredentialsUpdated={(updated) => setUserState(updated)}
      />
    </>
  );
};
