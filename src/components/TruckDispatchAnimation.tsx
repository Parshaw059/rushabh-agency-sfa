'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, PackageCheck, Truck, ShieldCheck, Sparkles, Volume2 } from 'lucide-react';

interface TruckDispatchAnimationProps {
  isOpen: boolean;
  dukanName: string;
  totalBoxes: number;
  totalLoose: number;
  totalUnits: number;
  onComplete: () => void;
}

export const TruckDispatchAnimation: React.FC<TruckDispatchAnimationProps> = ({
  isOpen,
  dukanName,
  totalBoxes,
  totalLoose,
  totalUnits,
  onComplete,
}) => {
  // Stages: 'entering' | 'loading' | 'closing' | 'confirmed' | 'departing'
  const [stage, setStage] = useState<'entering' | 'loading' | 'closing' | 'confirmed' | 'departing'>('entering');
  const [loadedCount, setLoadedCount] = useState<number>(0);

  useEffect(() => {
    if (!isOpen) {
      setStage('entering');
      setLoadedCount(0);
      return;
    }

    // Attempt haptic vibration on mobile
    try {
      if (typeof window !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([40, 60, 40]);
      }
    } catch (e) {}

    // Stage 1: Truck Enters (0 - 1000ms)
    const t1 = setTimeout(() => {
      setStage('loading');
      setLoadedCount(1);
    }, 1000);

    // Stage 2: Parcels loading (1000ms - 2400ms)
    const tLoad2 = setTimeout(() => setLoadedCount(2), 1400);
    const tLoad3 = setTimeout(() => setLoadedCount(3), 1800);

    // Stage 3: Close trailer door (2400ms - 3200ms)
    const t2 = setTimeout(() => {
      setStage('closing');
      try {
        if (typeof window !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([80]);
        }
      } catch (e) {}
    }, 2400);

    // Stage 4: Order Confirmed Announcement (3200ms - 4400ms)
    const t3 = setTimeout(() => {
      setStage('confirmed');

      // Confetti burst
      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#059669', '#10B981', '#34D399', '#FBBF24', '#FFFFFF'],
        });
      } catch (e) {}

      // Audio / Speech synthesis: "Order Confirmed!"
      try {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance('Order Confirmed!');
          utterance.rate = 1.0;
          utterance.pitch = 1.1;
          window.speechSynthesis.speak(utterance);
        }
      } catch (e) {}
    }, 3200);

    // Stage 5: Truck drives off (4400ms - 5400ms)
    const t4 = setTimeout(() => {
      setStage('departing');
    }, 4400);

    // Finish & transition to receipt (5300ms)
    const t5 = setTimeout(() => {
      onComplete();
    }, 5300);

    return () => {
      clearTimeout(t1);
      clearTimeout(tLoad2);
      clearTimeout(tLoad3);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in select-none">
      {/* Skip Button */}
      <button
        onClick={onComplete}
        className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 text-xs font-bold transition-all z-20"
      >
        Skip ✕
      </button>

      {/* Top Banner Status */}
      <div className="text-center mb-6 space-y-1.5 z-10">
        <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider">
          <Truck className="w-3.5 h-3.5 animate-pulse" />
          <span>Rushabh Agency Field Dispatch</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          {stage === 'entering' && 'Tempo Arriving at Dukan...'}
          {stage === 'loading' && 'Loading Cartons into Trailer...'}
          {stage === 'closing' && 'Closing & Sealing Trailer Door...'}
          {stage === 'confirmed' && '🎉 ORDER CONFIRMED!'}
          {stage === 'departing' && 'Dispatched for Delivery!'}
        </h2>

        <p className="text-xs text-slate-300 max-w-xs mx-auto">
          Dukan: <strong className="text-emerald-300">{dukanName}</strong> • {totalUnits} Pcs ({totalBoxes} Peti + {totalLoose} Loose)
        </p>
      </div>

      {/* Animation Stage Canvas */}
      <div className="relative w-full max-w-md h-56 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 rounded-3xl border border-slate-700/80 shadow-2xl overflow-hidden flex items-center justify-center">
        {/* Ambient warehouse glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(5,150,105,0.15),transparent_70%)]" />

        {/* Road Surface */}
        <div className="absolute bottom-0 left-0 right-0 h-14 bg-slate-950 border-t-2 border-slate-700">
          {/* Animated Road Dashed Strip */}
          <div className="absolute top-6 left-0 right-0 h-1 flex justify-around">
            <div className="w-12 h-1 bg-amber-400/80 rounded" />
            <div className="w-12 h-1 bg-amber-400/80 rounded" />
            <div className="w-12 h-1 bg-amber-400/80 rounded" />
            <div className="w-12 h-1 bg-amber-400/80 rounded" />
          </div>
        </div>

        {/* TRUCK CONTAINER WRAPPER */}
        <div
          className={`relative z-10 transition-all duration-1000 ease-out flex items-end ${
            stage === 'entering'
              ? '-translate-x-full opacity-40'
              : stage === 'departing'
              ? 'translate-x-[140%] opacity-0 duration-700 ease-in'
              : 'translate-x-0 opacity-100'
          }`}
          style={{ bottom: '26px' }}
        >
          {/* SVG DELIVERY TRUCK */}
          <div className="relative flex items-end">
            {/* 1. TRAILER CONTAINER */}
            <div className="relative w-44 h-28 bg-gradient-to-b from-emerald-600 to-emerald-800 rounded-l-2xl border-2 border-emerald-400/80 shadow-lg flex flex-col justify-between p-2 overflow-hidden">
              {/* Agency Branding on Trailer */}
              <div className="flex items-center justify-between border-b border-white/20 pb-1">
                <span className="text-[9px] font-black uppercase text-emerald-100 tracking-wider">RUSHABH</span>
                <span className="text-[8px] font-mono text-emerald-200">WDMS-SFA</span>
              </div>

              {/* Inside Cargo Hold (Visible when open) */}
              <div className="relative flex-1 my-1 bg-slate-950/80 rounded-lg border border-emerald-500/40 p-1 flex items-end justify-center gap-1.5 overflow-hidden">
                {/* Parcels Inside Trailer */}
                <div
                  className={`w-6 h-6 rounded bg-amber-600 border border-amber-300 shadow-xs flex items-center justify-center text-[7px] font-black text-amber-100 transition-all duration-500 ${
                    loadedCount >= 1 ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-50'
                  }`}
                >
                  BOX
                </div>

                <div
                  className={`w-7 h-7 rounded bg-amber-700 border border-amber-400 shadow-xs flex items-center justify-center text-[7px] font-black text-amber-100 transition-all duration-500 ${
                    loadedCount >= 2 ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-50'
                  }`}
                >
                  FMCG
                </div>

                <div
                  className={`w-6 h-6 rounded bg-amber-500 border border-amber-200 shadow-xs flex items-center justify-center text-[7px] font-black text-amber-900 transition-all duration-500 ${
                    loadedCount >= 3 ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-50'
                  }`}
                >
                  PETI
                </div>

                {/* ANIMATED CARGO DOOR */}
                <div
                  className={`absolute inset-0 bg-gradient-to-r from-emerald-700 via-emerald-800 to-emerald-900 border-2 border-emerald-400 rounded-lg flex items-center justify-center transition-all duration-700 shadow-xl ${
                    stage === 'entering' || stage === 'loading'
                      ? '-translate-x-full opacity-0 pointer-events-none'
                      : 'translate-x-0 opacity-100'
                  }`}
                >
                  {/* Closed Door Pattern */}
                  <div className="w-full h-full flex flex-col justify-between p-1">
                    <div className="flex justify-between items-center text-[8px] font-black text-emerald-200 uppercase">
                      <span>DOOR</span>
                      <span className="text-amber-400 font-mono">SEALED</span>
                    </div>

                    <div className="w-8 h-4 mx-auto rounded bg-slate-900 border border-amber-400/80 flex items-center justify-center shadow-md">
                      <div className="w-3 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    </div>

                    <div className="text-[7px] text-center font-mono text-emerald-300">
                      LOCKED ✓
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Trailer Strip */}
              <div className="flex justify-between items-center text-[8px] font-bold text-emerald-200">
                <span>VADODARA</span>
                <span className="font-mono">GJ-06</span>
              </div>
            </div>

            {/* 2. TRUCK CABIN */}
            <div className="relative w-18 h-22 bg-gradient-to-b from-slate-100 via-slate-200 to-slate-300 rounded-r-2xl border-2 border-slate-300 shadow-md flex flex-col justify-between p-1.5 -ml-1">
              {/* Windshield */}
              <div className="w-12 h-9 bg-sky-300/80 rounded-tr-xl border border-sky-400/90 shadow-inner flex items-center justify-center">
                {/* Driver silhouette */}
                <div className="w-4 h-5 rounded-full bg-slate-800/80 mt-1" />
              </div>

              {/* Headlight & Bumper */}
              <div className="flex items-center justify-between mt-2">
                <div className="w-3.5 h-3.5 rounded-full bg-amber-300 border border-amber-400 shadow-[0_0_8px_#fde047] animate-pulse" />
                <div className="w-7 h-2 bg-slate-700 rounded text-[6px] font-mono text-white text-center">
                  RUSH
                </div>
              </div>
            </div>

            {/* 3. WHEELS */}
            {/* Back Wheel 1 */}
            <div
              className={`absolute -bottom-3 left-4 w-7 h-7 rounded-full bg-slate-900 border-2 border-slate-600 flex items-center justify-center shadow-md ${
                stage === 'entering' || stage === 'departing' ? 'animate-spin' : ''
              }`}
            >
              <div className="w-3 h-3 rounded-full bg-slate-400 border border-slate-500" />
            </div>

            {/* Back Wheel 2 */}
            <div
              className={`absolute -bottom-3 left-13 w-7 h-7 rounded-full bg-slate-900 border-2 border-slate-600 flex items-center justify-center shadow-md ${
                stage === 'entering' || stage === 'departing' ? 'animate-spin' : ''
              }`}
            >
              <div className="w-3 h-3 rounded-full bg-slate-400 border border-slate-500" />
            </div>

            {/* Front Wheel */}
            <div
              className={`absolute -bottom-3 right-4 w-7 h-7 rounded-full bg-slate-900 border-2 border-slate-600 flex items-center justify-center shadow-md ${
                stage === 'entering' || stage === 'departing' ? 'animate-spin' : ''
              }`}
            >
              <div className="w-3 h-3 rounded-full bg-slate-400 border border-slate-500" />
            </div>
          </div>
        </div>

        {/* FLYING PARCEL ANIMATION (Stage: Loading) */}
        {stage === 'loading' && (
          <div className="absolute top-10 right-8 z-20 animate-bounce">
            <div className="w-8 h-8 rounded-lg bg-amber-500 border-2 border-amber-200 shadow-xl flex flex-col items-center justify-center text-[7px] font-black text-amber-950 rotate-6">
              <span>📦</span>
              <span>CARTON</span>
            </div>
          </div>
        )}

        {/* ORDER CONFIRMED POPUP BADGE */}
        {(stage === 'confirmed' || stage === 'departing') && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-2xs animate-in zoom-in-90 duration-300">
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-4 rounded-3xl border-2 border-emerald-300 shadow-2xl text-center space-y-1.5 max-w-[260px]">
              <div className="w-10 h-10 rounded-2xl bg-white text-emerald-700 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-white leading-tight uppercase tracking-wider">
                Order Confirmed!
              </h3>
              <p className="text-[11px] text-emerald-100 font-bold">
                Parcels Loaded in Trailer & Dispatched!
              </p>
              <span className="inline-block bg-white/20 text-white text-[9px] font-mono px-2 py-0.5 rounded-full border border-white/20">
                DOOR CLOSED & LOCKED
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Progress Indicator */}
      <div className="mt-5 w-full max-w-xs space-y-2">
        <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
          <span className={stage === 'entering' ? 'text-emerald-400' : ''}>1. Arrive</span>
          <span className={stage === 'loading' ? 'text-emerald-400' : ''}>2. Load Box</span>
          <span className={stage === 'closing' ? 'text-emerald-400' : ''}>3. Close Door</span>
          <span className={stage === 'confirmed' || stage === 'departing' ? 'text-emerald-400 font-extrabold' : ''}>4. Confirmed!</span>
        </div>

        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700 rounded-full"
            style={{
              width:
                stage === 'entering'
                  ? '25%'
                  : stage === 'loading'
                  ? '50%'
                  : stage === 'closing'
                  ? '75%'
                  : '100%',
            }}
          />
        </div>
      </div>
    </div>
  );
};
