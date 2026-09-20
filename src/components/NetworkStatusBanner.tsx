'use client';

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, CheckCircle2 } from 'lucide-react';

export const NetworkStatusBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showReconnected, setShowReconnected] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) return null;

  return (
    <div
      className={`px-4 py-2 text-xs font-bold flex items-center justify-between transition-all z-50 sticky top-0 ${
        isOnline
          ? 'bg-emerald-600 text-white'
          : 'bg-amber-600 text-white shadow-md'
      }`}
    >
      <div className="flex items-center gap-2">
        {isOnline ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>🟢 Reconnected • Rushabh Agency Cloud Active</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4 text-amber-200 animate-pulse" />
            <span>⚡ Offline Field Mode • Orders & Dukans saved safely on phone</span>
          </>
        )}
      </div>

      <span className="text-[10px] font-mono opacity-80 uppercase">
        {isOnline ? 'ONLINE' : 'OFFLINE OK'}
      </span>
    </div>
  );
};
