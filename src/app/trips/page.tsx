'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trip, User, Dukan } from '@/types';
import { getCurrentUser, getStoredTrips, getStoredDukans } from '@/lib/storage';
import { MobileHeader } from '@/components/MobileHeader';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import {
  MapPin,
  Store,
  ChevronRight,
  CheckCircle2,
  Clock,
  Navigation,
  Sparkles,
} from 'lucide-react';

export default function TripsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [dukans, setDukans] = useState<Dukan[]>([]);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setCurrentUser(user);
    setTrips(getStoredTrips());
    setDukans(getStoredDukans());
  }, [router]);

  if (!currentUser) return null;

  return (
    <div className="flex-1 flex flex-col pb-20 bg-[#F8FAFC]">
      <MobileHeader
        title="Select Today's Trip"
        subtitle={`Salesman: ${currentUser.name}`}
        currentUser={currentUser}
      />

      <main className="p-4 space-y-4">
        {/* Salesman Trip Banner */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 rounded-3xl p-4 text-white shadow-lg shadow-emerald-900/15 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-black uppercase bg-white/20 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-emerald-100 border border-white/20">
                Field Order Taking
              </span>
              <span className="text-[10px] text-emerald-200 font-mono tracking-wider">
                DAILY BEAT
              </span>
            </div>
            <h2 className="text-lg font-black leading-tight text-white">
              Select Your Assigned Trip / Route
            </h2>
            <p className="text-xs text-emerald-100/90 mt-1 font-medium">
              Choose the beat to view retail dukans and start booking orders.
            </p>
          </div>
        </div>

        {/* Trips List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black text-slate-600 uppercase tracking-wider">
              Available Routes ({trips.length})
            </span>
            <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
              Tap trip to view dukans
            </span>
          </div>

          {trips.map((trip) => {
            const tripDukans = dukans.filter((d) => d.tripId === trip.id);
            const bookedDukans = tripDukans.filter((d) => d.visitStatus === 'ORDER_BOOKED').length;
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

                {/* Progress bar inside trip */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium flex items-center gap-1">
                    <Store className="w-3.5 h-3.5 text-slate-400" />
                    Total Dukans: <strong>{tripDukans.length}</strong>
                  </span>

                  <span
                    className={`font-black text-xs px-2 py-0.5 rounded-lg flex items-center gap-1 ${
                      bookedDukans > 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {bookedDukans} / {tripDukans.length} Booked
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </main>

      <MobileBottomNav currentUser={currentUser} />
    </div>
  );
}
