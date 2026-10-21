'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trip, User, Order } from '@/types';
import {
  getCurrentUser,
  getStoredTrips,
  getDukansWithDailyStatus,
  DukanDailyStatus,
  getStoredOrders,
  isDateToday,
  syncAllWithBackend,
} from '@/lib/storage';
import { MobileHeader } from '@/components/MobileHeader';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { ChangeCredentialsModal } from '@/components/ChangeCredentialsModal';
import {
  MapPin,
  Store,
  ChevronRight,
  CheckCircle2,
  Clock,
  Navigation,
  Sparkles,
  TrendingUp,
  KeyRound,
} from 'lucide-react';

export default function TripsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isChangeCredentialsOpen, setIsChangeCredentialsOpen] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [dukans, setDukans] = useState<DukanDailyStatus[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setCurrentUser(user);
    setTrips(getStoredTrips());
    setDukans(getDukansWithDailyStatus());
    setOrders(getStoredOrders());

    const refreshData = () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }
      syncAllWithBackend().then((result) => {
        setTrips(getStoredTrips());
        setDukans(getDukansWithDailyStatus());
        if (result && Array.isArray(result.orders)) {
          setOrders(result.orders);
        } else {
          setOrders(getStoredOrders());
        }
      });
    };

    // Sync cloud orders & dukans immediately
    refreshData();

    // Auto poll every 30s (paused when tab is hidden to protect rate limits)
    const interval = setInterval(refreshData, 30000);

    const handleSyncEvent = () => {
      setTrips(getStoredTrips());
      setDukans(getDukansWithDailyStatus());
      setOrders(getStoredOrders());
    };

    window.addEventListener('visibilitychange', refreshData);
    window.addEventListener('rushabh-orders-synced', handleSyncEvent);
    window.addEventListener('rushabh-dukans-synced', handleSyncEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', refreshData);
      window.removeEventListener('rushabh-orders-synced', handleSyncEvent);
      window.removeEventListener('rushabh-dukans-synced', handleSyncEvent);
    };
  }, [router]);

  const totalDukanCount = dukans.length;
  const totalBookedToday = dukans.filter((d) => d.isBookedToday).length;
  const totalPendingToday = totalDukanCount - totalBookedToday;

  // Today's Live KPI Metrics
  const todayOrders = orders.filter((o) => isDateToday(o.createdAt));
  const todayBookingValue = todayOrders.reduce((sum, o) => sum + o.totalMrpValue, 0);
  const todayBoxesCount = todayOrders.reduce((sum, o) => sum + o.totalBoxes, 0);

  // Yesterday comparison for micro-trend badge
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().substring(0, 10);
  const yesterdayOrders = orders.filter((o) => o.createdAt.startsWith(yesterdayStr));
  const yesterdayBookingValue = yesterdayOrders.reduce((sum, o) => sum + o.totalMrpValue, 0);

  let trendPercent = 0;
  let isPositiveTrend = true;
  if (yesterdayBookingValue > 0) {
    trendPercent = Math.round(((todayBookingValue - yesterdayBookingValue) / yesterdayBookingValue) * 100);
    isPositiveTrend = trendPercent >= 0;
  } else if (todayBookingValue > 0) {
    trendPercent = 100;
    isPositiveTrend = true;
  }

  if (!currentUser) return null;

  return (
    <div className="flex-1 flex flex-col pb-20 bg-[#F8FAFC]">
      <MobileHeader
        title="Select Today's Trip"
        subtitle={`Salesman: ${currentUser.name}`}
        currentUser={currentUser}
      />

      <main className="p-4 space-y-4">
        {/* Live KPI Metric Card: Today's Booking Value with Micro-Trend Badge */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-5 text-white shadow-xl border border-emerald-500/20 relative overflow-hidden">
          {/* Ambient Decorative Glow */}
          <div className="absolute -right-10 -top-10 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-teal-500/15 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-3.5">
            {/* Top row: Label + Live Pulsing Dot + Micro-Trend Badge */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-lg shadow-inner">
                  💰
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                      TODAY'S BOOKING VALUE
                    </span>
                    <span className="relative flex h-2 w-2" title="Live Cloud Sync Active">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[9px] font-black text-emerald-400/90 bg-emerald-950/70 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                      LIVE
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-medium">
                    Salesman Beat Orders Summary
                  </p>
                </div>
              </div>

              {/* Micro-Trend Badge */}
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border backdrop-blur-md shadow-xs ${
                  todayOrders.length > 0
                    ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {todayOrders.length > 0
                    ? `${isPositiveTrend ? '+' : ''}${trendPercent}% vs yesterday • ${todayOrders.length} ${todayOrders.length === 1 ? 'Bill' : 'Bills'}`
                    : 'Awaiting Today\'s Bills'}
                </span>
              </div>
            </div>

            {/* Main Value Display */}
            <div className="pt-1">
              <div className="flex items-baseline gap-2.5 flex-wrap">
                <span className="text-3xl sm:text-4xl font-black tracking-tight text-white font-mono">
                  ₹{todayBookingValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
                <span className="text-[11px] font-bold text-emerald-300/80 uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded-md border border-white/10">
                  MRP Gross
                </span>
              </div>
            </div>

            {/* Micro Stats Grid inside the card */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10">
              <div className="bg-white/5 backdrop-blur-xs rounded-2xl p-2.5 border border-white/10 text-center">
                <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">
                  Booked Today
                </span>
                <span className="text-sm font-black text-white mt-0.5 block">
                  {totalBookedToday} Shops
                </span>
              </div>
              <div className="bg-white/5 backdrop-blur-xs rounded-2xl p-2.5 border border-white/10 text-center">
                <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">
                  Total Peti (Boxes)
                </span>
                <span className="text-sm font-black text-emerald-300 mt-0.5 block">
                  {todayBoxesCount} Box
                </span>
              </div>
              <div className="bg-white/5 backdrop-blur-xs rounded-2xl p-2.5 border border-white/10 text-center">
                <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">
                  Pending Beat
                </span>
                <span className="text-sm font-black text-amber-300 mt-0.5 block">
                  {totalPendingToday} Shops
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Salesman Trip Banner with Daily Pending/Booked Counters */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 rounded-3xl p-4 text-white shadow-lg shadow-emerald-900/15 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-black uppercase bg-white/20 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-emerald-100 border border-white/20">
                Daily Beat Tracking
              </span>
              <span className="text-[10px] text-emerald-200 font-mono tracking-wider">
                TODAY
              </span>
            </div>
            <h2 className="text-lg font-black leading-tight text-white">
              Select Your Assigned Route
            </h2>
            <p className="text-xs text-emerald-100/90 mt-1 font-medium">
              Orders stay saved for the whole day so you can track which shops are pending.
            </p>

            {/* Daily Overall Pending & Booked KPIs */}
            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/20">
              <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-2.5 text-center">
                <span className="text-[10px] uppercase font-bold text-amber-300 block">
                  ⏳ Today's Pending
                </span>
                <span className="text-lg font-black text-amber-300">
                  {totalPendingToday} Shops
                </span>
              </div>
              <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-2.5 text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-200 block">
                  ✅ Orders Booked
                </span>
                <span className="text-lg font-black text-white">
                  {totalBookedToday} Shops
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Trips List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black text-slate-600 uppercase tracking-wider">
              Available Routes ({trips.length})
            </span>
            <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
              Tap trip to view pending shops
            </span>
          </div>

          {trips.map((trip) => {
            const tripDukans = dukans.filter((d) => d.tripId === trip.id);
            const bookedDukans = tripDukans.filter((d) => d.isBookedToday).length;
            const pendingDukans = tripDukans.length - bookedDukans;
            const tripPercent = tripDukans.length > 0 ? Math.round((bookedDukans / tripDukans.length) * 100) : 0;
            const isAssigned = currentUser.assignedTripId === trip.id;

            return (
              <Link
                key={trip.id}
                href={`/trips/${trip.id}`}
                className={`block bg-white rounded-3xl p-4 border transition-all shadow-xs hover:shadow-md active:scale-[0.99] ${
                  isAssigned
                    ? 'border-emerald-400 bg-gradient-to-br from-white via-emerald-50/20 to-white ring-2 ring-emerald-500/20 shadow-md shadow-emerald-700/5'
                    : 'border-slate-200/90 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black flex-shrink-0 shadow-sm ${
                        isAssigned
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-700/20'
                          : 'bg-slate-100 text-slate-700 border border-slate-200/80'
                      }`}
                    >
                      <MapPin className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                          {trip.beatCode}
                        </span>
                        {isAssigned && (
                          <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full">
                            TODAY&apos;S BEAT
                          </span>
                        )}
                      </div>

                      <h3 className="font-black text-slate-900 text-sm mt-1 leading-snug">
                        {trip.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Area: {trip.area}
                      </p>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0 mt-3" />
                </div>

                {/* Progress bar & Pending / Booked tags */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-2">
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all"
                      style={{ width: `${tripPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium flex items-center gap-1">
                      <Store className="w-3.5 h-3.5 text-slate-400" />
                      <span>{tripDukans.length} Shops</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[10px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                        ⏳ {pendingDukans} Pending
                      </span>
                      <span className="font-bold text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                        ✅ {bookedDukans} Booked
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Salesman Account Credentials & Security Card */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0 border border-emerald-200/60">
              <KeyRound className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-black text-emerald-800 tracking-wider block">
                Account Security
              </span>
              <p className="text-xs font-bold text-slate-800 truncate">
                @{currentUser.username || 'hiren'} • {currentUser.name}
              </p>
              <p className="text-[10px] text-slate-400">
                Update your login username and security PIN anytime
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsChangeCredentialsOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 font-bold text-xs border border-slate-200/90 transition-colors flex items-center gap-1.5 flex-shrink-0 active:scale-95"
          >
            <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
            <span>Change</span>
          </button>
        </div>
      </main>

      <MobileBottomNav currentUser={currentUser} />

      <ChangeCredentialsModal
        isOpen={isChangeCredentialsOpen}
        onClose={() => setIsChangeCredentialsOpen(false)}
        currentUser={currentUser}
        onCredentialsUpdated={(updated) => setCurrentUser(updated)}
      />
    </div>
  );
}
