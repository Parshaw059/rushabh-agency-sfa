'use client';

import { useState, useEffect } from 'react';
import { getAgencyLogo, saveAgencyLogoLocally, fetchAgencyLogoFromCloud } from '@/lib/storage';
import { subscribeToSync } from '@/lib/syncBus';

function updateFavicon(url: string) {
  if (typeof document === 'undefined' || !url) return;
  try {
    let iconLink = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
    if (!iconLink) {
      iconLink = document.createElement('link');
      iconLink.rel = 'icon';
      document.getElementsByTagName('head')[0]?.appendChild(iconLink);
    }
    iconLink.href = url;

    let appleLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement | null;
    if (appleLink) {
      appleLink.href = url;
    }
  } catch (e) {}
}

export function useAgencyLogo() {
  const [logo, setLogo] = useState<string>(() => {
    return getAgencyLogo();
  });

  useEffect(() => {
    // 1. Initial local read
    const initial = getAgencyLogo();
    setLogo(initial);
    updateFavicon(initial);

    // 2. Immediate cloud fetch to load updated logo from /api/settings on every device & tab
    fetchAgencyLogoFromCloud().then((cloudLogo) => {
      if (cloudLogo && cloudLogo !== initial) {
        setLogo(cloudLogo);
        updateFavicon(cloudLogo);
      }
    });

    // 3. Listen to local custom event
    const handleLocalUpdate = (e: any) => {
      const newLogo = (e.detail && typeof e.detail === 'string') ? e.detail : getAgencyLogo();
      setLogo(newLogo);
      updateFavicon(newLogo);
    };

    // 4. Listen to cross-tab broadcast bus
    const unsubscribe = subscribeToSync((event) => {
      if (event.type === 'LOGO_UPDATED' && event.logoUrl) {
        setLogo(event.logoUrl);
        updateFavicon(event.logoUrl);
      }
    });

    // 5. Listen to storage event for other windows/tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'rushabh_app_settings_v5') {
        const updated = getAgencyLogo();
        setLogo(updated);
        updateFavicon(updated);
      }
    };

    // 6. Periodic background cloud poll (every 15s) so any open screen across devices syncs automatically
    const interval = setInterval(() => {
      fetchAgencyLogoFromCloud().then((cloudLogo) => {
        if (cloudLogo) {
          setLogo((prev) => {
            if (prev !== cloudLogo) {
              updateFavicon(cloudLogo);
              return cloudLogo;
            }
            return prev;
          });
        }
      });
    }, 15000);

    window.addEventListener('rushabh-logo-updated', handleLocalUpdate);
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(interval);
      unsubscribe();
      window.removeEventListener('rushabh-logo-updated', handleLocalUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return logo;
}
