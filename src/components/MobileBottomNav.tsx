'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MapPin, ShoppingBag, ShieldCheck, Package, ListOrdered } from 'lucide-react';
import { User } from '@/types';

interface MobileBottomNavProps {
  currentUser?: User | null;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ currentUser }) => {
  const pathname = usePathname();

  const isOwner = currentUser?.role === 'OWNER';

  return (
    <nav className="fixed bottom-0 max-w-md w-full bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] z-30 flex items-center justify-around py-2 px-2">
      {/* 1. Trips / Beats */}
      <Link
        href="/trips"
        className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-2xl transition-all ${
          pathname.startsWith('/trips')
            ? 'text-emerald-800 font-black bg-emerald-50/90 border border-emerald-200/80 shadow-xs scale-102'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <MapPin className={`w-4.5 h-4.5 ${pathname.startsWith('/trips') ? 'text-emerald-600' : 'text-slate-400'}`} />
        <span className="text-[10px] tracking-tight">Today&apos;s Trips</span>
      </Link>

      {/* 2. Orders Booked */}
      <Link
        href="/owner/orders"
        className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-2xl transition-all ${
          pathname === '/owner/orders'
            ? 'text-emerald-800 font-black bg-emerald-50/90 border border-emerald-200/80 shadow-xs scale-102'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <ListOrdered className={`w-4.5 h-4.5 ${pathname === '/owner/orders' ? 'text-emerald-600' : 'text-slate-400'}`} />
        <span className="text-[10px] tracking-tight">All Orders</span>
      </Link>

      {/* 3. Owner Control (Product CRUD & MRP / Box Packing Edit) */}
      <Link
        href="/owner/products"
        className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-2xl transition-all ${
          pathname === '/owner/products'
            ? 'text-emerald-800 font-black bg-emerald-50/90 border border-emerald-200/80 shadow-xs scale-102'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <Package className={`w-4.5 h-4.5 ${pathname === '/owner/products' ? 'text-emerald-600' : 'text-slate-400'}`} />
        <span className="text-[10px] tracking-tight">Owner Master</span>
      </Link>
    </nav>
  );
};
