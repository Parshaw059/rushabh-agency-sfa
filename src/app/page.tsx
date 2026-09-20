'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/storage';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push('/login');
    } else if (user.role === 'OWNER') {
      router.push('/owner/orders');
    } else {
      router.push('/trips');
    }
  }, [router]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#F8FAFC] text-slate-700 text-xs font-bold gap-3">
      <img
        src="/logo.jpg"
        alt="Rushabh Agency"
        className="w-14 h-14 rounded-2xl shadow-md border border-emerald-500/30 object-cover animate-pulse ring-4 ring-emerald-500/10"
      />
      <span className="text-slate-800 font-extrabold text-sm">Rushabh Agency</span>
      <span className="text-slate-400 text-[11px] font-medium">Opening field booking app...</span>
    </div>
  );
}
