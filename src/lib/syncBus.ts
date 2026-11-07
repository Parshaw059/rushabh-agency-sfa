// Cross-tab and cross-component broadcast bus for 0ms instantaneous updates across tabs
import { Order, Dukan, Product, User } from '@/types';

export type SyncBusEvent =
  | { type: 'ORDERS_UPDATED'; orders: Order[] }
  | { type: 'DUKANS_UPDATED'; dukans: Dukan[] }
  | { type: 'PRODUCTS_UPDATED'; products: Product[] }
  | { type: 'LOGO_UPDATED'; logoUrl: string }
  | { type: 'USER_UPDATED'; user: User }
  | { type: 'TRIGGER_SYNC' };

let channel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    channel = new BroadcastChannel('rushabh_agency_bus');
  } catch (e) {
    channel = null;
  }
}

export const broadcastSync = (event: SyncBusEvent): void => {
  if (typeof window === 'undefined') return;
  try {
    channel?.postMessage(event);
  } catch (e) {}
};

export const subscribeToSync = (callback: (event: SyncBusEvent) => void): (() => void) => {
  if (typeof window === 'undefined' || !channel) return () => {};

  const listener = (msgEvent: MessageEvent<SyncBusEvent>) => {
    try {
      callback(msgEvent.data);
    } catch (e) {}
  };

  channel.addEventListener('message', listener);
  return () => {
    channel?.removeEventListener('message', listener);
  };
};
