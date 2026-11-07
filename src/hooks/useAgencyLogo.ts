'use client';

import { useState, useEffect } from 'react';
import { getAgencyLogo } from '@/lib/storage';
import { subscribeToSync } from '@/lib/syncBus';

export function useAgencyLogo() {
  const [logo, setLogo] = useState<string>('/logo.jpg');

  useEffect(() => {
    // Initial read
    setLogo(getAgencyLogo());

    // Listen to local custom event
    const handleLocalUpdate = (e: any) => {
      if (e.detail && typeof e.detail === 'string') {
        setLogo(e.detail);
      } else {
        setLogo(getAgencyLogo());
      }
    };

    // Listen to cross-tab broadcast bus
    const unsubscribe = subscribeToSync((event) => {
      if (event.type === 'LOGO_UPDATED') {
        setLogo(event.logoUrl);
      }
    });

    // Listen to storage event for other windows
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'rushabh_app_settings_v5') {
        setLogo(getAgencyLogo());
      }
    };

    window.addEventListener('rushabh-logo-updated', handleLocalUpdate);
    window.addEventListener('storage', handleStorage);

    return () => {
      unsubscribe();
      window.removeEventListener('rushabh-logo-updated', handleLocalUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return logo;
}
