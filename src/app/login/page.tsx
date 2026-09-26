'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authenticateUser, getCurrentUser } from '@/lib/storage';
import {
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Smartphone,
} from 'lucide-react';
import { InstallAppModal } from '@/components/InstallAppModal';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  // Auto-redirect if already signed in (0ms instant access!)
  React.useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      if (user.role === 'OWNER') {
        router.replace('/owner/orders');
      } else {
        router.replace('/trips');
      }
    }
  }, [router]);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (loading) return;
    setError(null);

    const checkId = identifier.trim();
    const checkPin = pin.trim();

    if (!checkId) {
      setError('Please enter your Mobile Number or Username.');
      return;
    }

    if (!checkPin) {
      setError('Please enter your 4-digit Security PIN.');
      return;
    }

    setLoading(true);
    try {
      const result = await authenticateUser(checkId, checkPin);

      if (!result.success || !result.user) {
        setError(result.error || 'Invalid credentials. Access denied.');
        setLoading(false);
        return;
      }

      if (result.user.role === 'OWNER') {
        router.push('/owner/orders');
      } else {
        router.push('/trips');
      }
    } catch (err: any) {
      setError('Authentication failed. Please check network connection.');
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-5 bg-gradient-to-b from-emerald-50/70 via-stone-50 to-white text-slate-900 min-h-screen">
      {/* Top Branding with Rushabh Agency Logo */}
      <div className="pt-6 text-center">
        <div className="w-20 h-20 rounded-3xl overflow-hidden shadow-xl shadow-emerald-700/10 mx-auto mb-3 border-2 border-emerald-500/40 p-1.5 bg-white ring-4 ring-emerald-500/10 flex items-center justify-center">
          <img
            src="/logo.jpg"
            alt="Rushabh Agency"
            className="w-full h-full object-cover rounded-2xl"
          />
        </div>

        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          RUSHABH <span className="text-emerald-700">AGENCY</span>
        </h1>
        <div className="mt-1">
          <span className="text-[11px] text-emerald-800 font-extrabold bg-emerald-100/80 px-3 py-0.5 rounded-full inline-block border border-emerald-300/80">
            Field Salesman Order Booking App
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1.5 max-w-xs mx-auto font-medium">
          Authorized distributor login portal for beat booking & agency administration.
        </p>
      </div>

      {/* Main Login Box */}
      <div className="my-6 space-y-4">
        {/* Secure Form Only (No Quick Logins) */}
        <form
          onSubmit={handleLogin}
          className="space-y-4 bg-white/95 rounded-3xl p-5 border border-slate-200/90 shadow-xl shadow-slate-200/60"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-xs font-black text-slate-900 block">
                Account Sign In
              </span>
              <span className="text-[10px] text-slate-400">
                Enter your credentials to continue
              </span>
            </div>
            <span className="text-[9px] font-black uppercase text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
              Protected
            </span>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-300 text-red-800 text-xs rounded-xl flex items-center gap-2.5 font-medium animate-in fade-in">
              <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Username / Phone input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-slate-600 block px-1 uppercase tracking-wider">
              Registered Mobile Number / Username
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter 10-digit mobile or username"
                required
                autoComplete="username"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono"
              />
            </div>
          </div>

          {/* Password / PIN input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-slate-600 block px-1 uppercase tracking-wider">
              Security PIN / Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter 4-digit security PIN"
                required
                autoComplete="current-password"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono tracking-widest"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 mt-1 rounded-xl text-white font-black text-xs shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
              loading
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 shadow-emerald-700/20'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-white" />
            <span>{loading ? 'Verifying Credentials...' : 'Verify & Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-[10px] text-center text-slate-400 font-medium pt-1">
            Access restricted to verified salesman & distributor desk.
          </p>
        </form>

        {/* Install on Mobile App Promo Button */}
        <button
          type="button"
          onClick={() => setShowInstallModal(true)}
          className="w-full py-2.5 px-4 rounded-2xl bg-white border border-emerald-200/90 hover:bg-emerald-50 text-emerald-800 text-xs font-black shadow-xs flex items-center justify-center gap-2 transition-all"
        >
          <Smartphone className="w-4 h-4 text-emerald-600" />
          <span>📲 Install App on Phone (Free & Zero Latency)</span>
        </button>
      </div>

      {/* Footer Info */}
      <div className="py-2.5 border-t border-slate-200 text-[10px] text-slate-500 flex items-center justify-between px-1">
        <span className="flex items-center gap-1 font-bold text-slate-700">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Hiren Shah Beat SFA
        </span>
        <span className="font-extrabold text-emerald-700">Rushabh Agency</span>
      </div>

      <InstallAppModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />
    </div>
  );
}
