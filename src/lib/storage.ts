import { User, Trip, Dukan, Company, Product, Order, OrderItemRecord } from '@/types';
import {
  INITIAL_USERS,
  INITIAL_TRIPS,
  INITIAL_DUKANS,
  INITIAL_COMPANIES,
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
} from '@/data/mockData';

const USERS_KEY = 'rushabh_app_users_v4';
const TRIPS_KEY = 'rushabh_app_trips_v4';
const DUKANS_KEY = 'rushabh_app_dukans_v4';
const PRODUCTS_KEY = 'rushabh_app_products_v4';
const ORDERS_KEY = 'rushabh_app_orders_v4';
const CURRENT_USER_KEY = 'rushabh_app_current_user_v4';

const isBrowser = typeof window !== 'undefined';

// USERS & AUTH
export const getStoredUsers = (): User[] => {
  if (!isBrowser) return INITIAL_USERS;
  const data = localStorage.getItem(USERS_KEY);
  if (!data) {
    localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
    return INITIAL_USERS;
  }
  return JSON.parse(data);
};

export const getCurrentUser = (): User | null => {
  if (!isBrowser) return null;
  const data = localStorage.getItem(CURRENT_USER_KEY);
  if (!data) return null;
  return JSON.parse(data);
};

export const setCurrentUser = (user: User | null): void => {
  if (isBrowser) {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  }
};

export const authenticateUser = (
  identifier: string,
  secretPin?: string
): { success: boolean; user?: User; error?: string } => {
  const users = getStoredUsers();
  const cleanId = identifier.trim().toLowerCase();

  const found = users.find(
    (u) =>
      u.phone.trim() === cleanId ||
      (u.username && u.username.toLowerCase() === cleanId)
  );

  if (!found) {
    return {
      success: false,
      error: 'Account not found. Please enter valid Mobile Number or Username.',
    };
  }

  // Verify PIN / Password
  if (secretPin !== undefined && secretPin.trim() !== '') {
    const expectedPin = found.pin || found.password || '1234';
    if (secretPin.trim() !== expectedPin) {
      return {
        success: false,
        error: 'Incorrect Password / PIN. Please try again.',
      };
    }
  }

  setCurrentUser(found);
  return { success: true, user: found };
};

export const logoutUser = (): void => {
  setCurrentUser(null);
};

// TRIPS & BEATS
export const getStoredTrips = (): Trip[] => {
  if (!isBrowser) return INITIAL_TRIPS;
  const data = localStorage.getItem(TRIPS_KEY);
  let trips: Trip[] = INITIAL_TRIPS;
  if (data) {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge with INITIAL_TRIPS to ensure no new beats are missing
        const tripMap = new Map<string, Trip>();
        INITIAL_TRIPS.forEach((t) => tripMap.set(t.id, t));
        parsed.forEach((t) => {
          const base = tripMap.get(t.id);
          tripMap.set(t.id, { ...base, ...t });
        });
        trips = Array.from(tripMap.values());
      }
    } catch (e) {
      trips = INITIAL_TRIPS;
    }
  }

  // Dynamically calculate dukan count from stored dukans
  const allDukans = getStoredDukans();
  return trips.map((t) => {
    const actualCount = allDukans.filter((d) => d.tripId === t.id).length;
    return {
      ...t,
      dukanCount: actualCount,
    };
  });
};

export const saveTrips = (trips: Trip[]): void => {
  if (isBrowser) {
    localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
  }
};

// Helper: Deduplicate dukans strictly by normalized (tripId + shopName) AND unique ID
export const deduplicateDukans = (dukans: Dukan[]): Dukan[] => {
  const map = new Map<string, Dukan>();

  for (const d of dukans) {
    if (!d || !d.shopName) continue;
    // Strictly filter out any obsolete dummy placeholder shops in Dashrath-Ranoli
    if (d.tripId === 'trip-dashrath-ranoli' && d.id && d.id.startsWith('duk-dsr-')) continue;

    const cleanName = d.shopName.trim().toLowerCase().replace(/\s+/g, ' ');
    const normKey = `${d.tripId || ''}::${cleanName}`;

    // Find if already exists by normKey or by ID
    let existingKey: string | undefined;
    if (map.has(normKey)) {
      existingKey = normKey;
    } else if (d.id) {
      for (const [k, v] of Array.from(map.entries())) {
        if (v.id === d.id) {
          existingKey = k;
          break;
        }
      }
    }

    const existing = existingKey ? map.get(existingKey) : undefined;

    if (existing && existingKey) {
      // If shopName changed, delete the old key so it does not leave duplicate
      if (existingKey !== normKey) {
        map.delete(existingKey);
      }
      const preferredId = d.id?.startsWith('duk-custom-') ? d.id : (d.id || existing.id);
      const merged: Dukan = {
        ...existing,
        ...d,
        id: preferredId,
        phone: d.phone && d.phone !== '0000000000' ? d.phone : existing.phone,
        ownerName: d.ownerName && d.ownerName !== 'N/A' && d.ownerName !== '.' ? d.ownerName : existing.ownerName,
        gstNumber: d.gstNumber || existing.gstNumber,
      };
      map.set(normKey, merged);
    } else {
      map.set(normKey, d);
    }
  }

  return Array.from(map.values());
};

// DUKANS / RETAILERS
export const getStoredDukans = (): Dukan[] => {
  if (!isBrowser) return INITIAL_DUKANS;
  const data = localStorage.getItem(DUKANS_KEY);
  if (!data) {
    const cleanInitial = deduplicateDukans(INITIAL_DUKANS);
    localStorage.setItem(DUKANS_KEY, JSON.stringify(cleanInitial));
    return cleanInitial;
  }
  try {
    const stored: Dukan[] = JSON.parse(data);
    if (!Array.isArray(stored)) {
      const cleanInitial = deduplicateDukans(INITIAL_DUKANS);
      localStorage.setItem(DUKANS_KEY, JSON.stringify(cleanInitial));
      return cleanInitial;
    }

    // Merge INITIAL_DUKANS with locally stored custom dukans with ZERO duplicates
    const combined = [...INITIAL_DUKANS, ...stored].filter(
      (d) => !(d.tripId === 'trip-dashrath-ranoli' && d.id && d.id.startsWith('duk-dsr-'))
    );
    return deduplicateDukans(combined);
  } catch (e) {
    return INITIAL_DUKANS;
  }
};

export const saveDukans = (dukans: Dukan[]): void => {
  if (isBrowser) {
    localStorage.setItem(DUKANS_KEY, JSON.stringify(dukans));
  }
};

export const getDukansByTrip = (tripId: string): Dukan[] => {
  const all = getStoredDukans();
  return all.filter((d) => d.tripId === tripId);
};

export const getDukanById = (dukanId: string): Dukan | undefined => {
  const all = getStoredDukans();
  return all.find((d) => d.id === dukanId);
};

export const isDateToday = (dateStr?: string): boolean => {
  if (!dateStr) return false;
  try {
    const d = new Date(dateStr);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  } catch (e) {
    return false;
  }
};

export const updateDukanVisitStatus = (dukanId: string, status: Dukan['visitStatus']): void => {
  const all = getStoredDukans();
  const updated = all.map((d) => (d.id === dukanId ? { ...d, visitStatus: status } : d));
  saveDukans(updated);
};

export const updateDukanOrderRecord = (
  dukanId: string,
  details: Partial<Dukan>
): void => {
  const all = getStoredDukans();
  const updated = all.map((d) => (d.id === dukanId ? { ...d, ...details } : d));
  saveDukans(updated);
};

export interface DukanDailyStatus extends Dukan {
  isBookedToday: boolean;
  todayOrder?: Order;
}

export const getDukansWithDailyStatus = (tripId?: string): DukanDailyStatus[] => {
  const allDukans = getStoredDukans();
  const allOrders = getStoredOrders();

  const filtered = tripId ? allDukans.filter((d) => d.tripId === tripId) : allDukans;

  return filtered.map((dukan) => {
    // Find the latest order placed TODAY for this dukan
    const todayOrder = allOrders.find(
      (o) => o.dukanId === dukan.id && isDateToday(o.createdAt)
    );

    const isBookedToday = Boolean(todayOrder) || (dukan.visitStatus === 'ORDER_BOOKED' && isDateToday(dukan.lastOrderDate));

    return {
      ...dukan,
      visitStatus: isBookedToday ? ('ORDER_BOOKED' as const) : ('PENDING' as const),
      isBookedToday,
      todayOrder: todayOrder || undefined,
      lastOrderAmount: todayOrder ? todayOrder.totalMrpValue : dukan.lastOrderAmount,
      lastOrderNumber: todayOrder ? todayOrder.orderNumber : dukan.lastOrderNumber,
      lastOrderId: todayOrder ? todayOrder.id : dukan.lastOrderId,
      lastOrderDate: todayOrder ? todayOrder.createdAt : dukan.lastOrderDate,
    };
  });
};

// Salesman Feature: Add New Dukan / Make Call
export const addDukan = (dukanData: {
  shopName: string;
  ownerName: string;
  phone: string;
  tripId: string;
  address: string;
  gstNumber?: string;
}): Dukan => {
  const dukans = getStoredDukans();
  const newDukan: Dukan = {
    id: `duk-custom-${Date.now()}`,
    shopName: dukanData.shopName.trim(),
    ownerName: dukanData.ownerName.trim(),
    phone: dukanData.phone.trim(),
    tripId: dukanData.tripId,
    address: dukanData.address.trim(),
    gstNumber: dukanData.gstNumber?.trim() || undefined,
    visitStatus: 'PENDING',
  };
  dukans.push(newDukan);
  saveDukans(dukans);

  // Synchronize trip retailer count
  const trips = getStoredTrips();
  const updatedTrips = trips.map((t) =>
    t.id === dukanData.tripId ? { ...t, dukanCount: t.dukanCount + 1 } : t
  );
  saveTrips(updatedTrips);

  // Sync to Cloud Store immediately
  if (isBrowser && navigator.onLine) {
    fetch('/api/dukans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dukan: newDukan }),
    }).catch((e) => console.warn('[Storage] Failed to sync new dukan to cloud:', e));
  }

  return newDukan;
};

// Salesman Feature: Delete Retailer / Dukan from Trip
export const deleteDukan = (dukanId: string): void => {
  const dukans = getStoredDukans();
  const dukanToDelete = dukans.find((d) => d.id === dukanId);
  const updated = dukans.filter((d) => d.id !== dukanId);
  saveDukans(updated);

  if (dukanToDelete) {
    const trips = getStoredTrips();
    const updatedTrips = trips.map((t) =>
      t.id === dukanToDelete.tripId ? { ...t, dukanCount: Math.max(0, t.dukanCount - 1) } : t
    );
    saveTrips(updatedTrips);
  }

  // Delete from Cloud Store
  if (isBrowser && navigator.onLine) {
    fetch(`/api/dukans/${dukanId}`, {
      method: 'DELETE',
    }).catch((e) => console.warn('[Storage] Failed to delete dukan from cloud:', e));
  }
};

// Feature: Edit / Update Existing Retailer Details
export const updateDukan = (
  dukanId: string,
  updatedFields: {
    shopName: string;
    ownerName: string;
    phone: string;
    address: string;
    gstNumber?: string;
  }
): Dukan | null => {
  const dukans = getStoredDukans();
  const index = dukans.findIndex((d) => d.id === dukanId);
  if (index === -1) return null;

  const current = dukans[index];
  const updatedDukan: Dukan = {
    ...current,
    shopName: updatedFields.shopName.trim(),
    ownerName: updatedFields.ownerName.trim(),
    phone: updatedFields.phone.trim(),
    address: updatedFields.address.trim(),
    gstNumber: updatedFields.gstNumber?.trim() || undefined,
  };

  dukans[index] = updatedDukan;
  saveDukans(dukans);

  // Sync updated dukan to Cloud Store immediately
  if (isBrowser && navigator.onLine) {
    fetch('/api/dukans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dukan: updatedDukan }),
    }).catch((e) => console.warn('[Storage] Failed to sync updated dukan to cloud:', e));
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('rushabh-dukans-synced', { detail: dukans }));
  }

  return updatedDukan;
};

// Helper: Deduplicate products strictly by WDMS code or companyId + name + packSize
export const deduplicateProducts = (products: Product[]): Product[] => {
  const map = new Map<string, Product>();

  for (const p of products) {
    if (!p || !p.name) continue;
    const cleanWdms = (p.wdmsCode || '').trim().toLowerCase();
    const cleanName = p.name.trim().toLowerCase().replace(/\s+/g, ' ');
    const cleanCompany = (p.companyId || '').trim().toLowerCase();
    const cleanPack = (p.packSize || '').trim().toLowerCase();

    const normKey = cleanWdms ? `wdms::${cleanWdms}` : `comp::${cleanCompany}::${cleanName}::${cleanPack}`;

    // Find if already exists by normKey or by ID
    let existingKey: string | undefined;
    if (map.has(normKey)) {
      existingKey = normKey;
    } else if (p.id) {
      for (const [k, v] of Array.from(map.entries())) {
        if (v.id === p.id) {
          existingKey = k;
          break;
        }
      }
    }

    const existing = existingKey ? map.get(existingKey) : undefined;

    if (existing && existingKey) {
      // If name or packSize changed, delete the old key so it does not leave duplicate
      if (existingKey !== normKey) {
        map.delete(existingKey);
      }
      const preferredId = p.id?.startsWith('prod-custom-') ? p.id : (p.id || existing.id);
      map.set(normKey, {
        ...existing,
        ...p,
        id: preferredId,
        mrp: typeof p.mrp === 'number' && !isNaN(p.mrp) ? p.mrp : existing.mrp,
        unitsPerBox: typeof p.unitsPerBox === 'number' && !isNaN(p.unitsPerBox) ? p.unitsPerBox : existing.unitsPerBox,
      });
    } else {
      map.set(normKey, p);
    }
  }

  return Array.from(map.values());
};

// PRODUCTS (CRUD FOR OWNER & SALESMAN)
export const getStoredProducts = (): Product[] => {
  if (!isBrowser) return INITIAL_PRODUCTS;
  const data = localStorage.getItem(PRODUCTS_KEY);
  if (!data) {
    const cleanInitial = deduplicateProducts(INITIAL_PRODUCTS);
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(cleanInitial));
    return cleanInitial;
  }
  try {
    const stored: Product[] = JSON.parse(data);
    if (!Array.isArray(stored)) {
      const cleanInitial = deduplicateProducts(INITIAL_PRODUCTS);
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(cleanInitial));
      return cleanInitial;
    }
    // Merge INITIAL_PRODUCTS and stored with ZERO duplicates, preserving edits
    const combined = [...INITIAL_PRODUCTS, ...stored];
    return deduplicateProducts(combined);
  } catch (e) {
    return INITIAL_PRODUCTS;
  }
};

export const saveProducts = (products: Product[]): void => {
  if (isBrowser) {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(deduplicateProducts(products)));
  }
};

// Add Product (Owner or Salesman)
export const addProduct = (newProduct: Omit<Product, 'id'>): Product => {
  const products = getStoredProducts();
  const created: Product = {
    ...newProduct,
    id: `prod-custom-${Date.now()}`,
    isCustom: true,
  };
  products.unshift(created);
  const deduplicated = deduplicateProducts(products);
  saveProducts(deduplicated);

  // Sync to Cloud Store immediately
  if (isBrowser && navigator.onLine) {
    fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product: created }),
    }).catch((e) => console.warn('[Storage] Failed to sync new product to cloud:', e));
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('rushabh-products-synced', { detail: deduplicated }));
  }

  return created;
};

// Update Product (Change MRP, Box Packaging, or Details)
export const updateProduct = (
  productId: string,
  updates: Partial<Pick<Product, 'mrp' | 'unitsPerBox' | 'name' | 'packSize' | 'category'>>
): Product[] => {
  const products = getStoredProducts();
  let updatedProduct: Product | null = null;
  const updated = products.map((p) => {
    if (p.id === productId) {
      const merged = { ...p, ...updates };
      updatedProduct = merged;
      return merged;
    }
    return p;
  });

  const deduplicated = deduplicateProducts(updated);
  saveProducts(deduplicated);

  // Sync to Cloud Store immediately
  if (isBrowser && navigator.onLine && updatedProduct) {
    fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product: updatedProduct }),
    }).catch((e) => console.warn('[Storage] Failed to sync updated product to cloud:', e));
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('rushabh-products-synced', { detail: deduplicated }));
  }

  return deduplicated;
};

// Delete Product
export const deleteProduct = (productId: string): Product[] => {
  const products = getStoredProducts();
  const updated = products.filter((p) => p.id !== productId);
  const deduplicated = deduplicateProducts(updated);
  saveProducts(deduplicated);

  // Delete from Cloud Store immediately
  if (isBrowser && navigator.onLine) {
    fetch(`/api/products/${productId}`, {
      method: 'DELETE',
    }).catch((e) => console.warn('[Storage] Failed to delete product from cloud:', e));
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('rushabh-products-synced', { detail: deduplicated }));
  }

  return deduplicated;
};

// ORDERS (FOR SALESMEN & OWNER)
export const getStoredOrders = (): Order[] => {
  if (!isBrowser) return INITIAL_ORDERS;
  const data = localStorage.getItem(ORDERS_KEY);
  if (!data) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(INITIAL_ORDERS));
    return INITIAL_ORDERS;
  }
  return JSON.parse(data);
};

export const saveOrders = (orders: Order[]): void => {
  if (isBrowser) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }
};

// Salesman places order
export const createSalesmanOrder = (params: {
  tripId: string;
  tripName: string;
  dukan: Dukan;
  salesman: User;
  items: OrderItemRecord[];
  notes?: string;
}): Order => {
  const orders = getStoredOrders();
  const nextNum = 8000 + orders.length + 1;
  const orderNumber = `ORD-${nextNum}`;

  const totalBoxes = params.items.reduce((sum, item) => sum + item.boxQty, 0);
  const totalLoose = params.items.reduce((sum, item) => sum + item.looseQty, 0);
  const totalUnits = params.items.reduce((sum, item) => sum + item.totalUnits, 0);
  const totalMrpValue = params.items.reduce((sum, item) => sum + item.lineMrpTotal, 0);

  const newOrder: Order = {
    id: `ORD-${Date.now()}`,
    orderNumber,
    tripId: params.tripId,
    tripName: params.tripName,
    dukanId: params.dukan.id,
    dukanName: params.dukan.shopName,
    ownerName: params.dukan.ownerName,
    phone: params.dukan.phone,
    salesmanId: params.salesman.id,
    salesmanName: params.salesman.name,
    items: params.items,
    totalBoxes,
    totalLoose,
    totalUnits,
    totalMrpValue,
    status: 'BOOKED_BY_SALESMAN',
    notes: params.notes,
    createdAt: new Date().toISOString(),
  };

  orders.unshift(newOrder);
  saveOrders(orders);

  // Mark Dukan as ORDER_BOOKED with today's order details
  updateDukanOrderRecord(params.dukan.id, {
    visitStatus: 'ORDER_BOOKED',
    lastOrderAmount: totalMrpValue,
    lastOrderNumber: orderNumber,
    lastOrderId: newOrder.id,
    lastOrderDate: newOrder.createdAt,
    lastOrderTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
  });

  // Asynchronously sync to MySQL database / queue
  syncOrderToBackend(newOrder);

  return newOrder;
};

// Find today's existing order for a dukan (if any)
export const getTodayOrderByDukan = (dukanId: string): Order | undefined => {
  const orders = getStoredOrders();
  return orders.find((o) => o.dukanId === dukanId && isDateToday(o.createdAt));
};

// Salesman Feature: Update existing bill (Add/modify items on previous bill of today without duplicate bill)
export const updateSalesmanOrder = (
  orderId: string,
  params: {
    items: OrderItemRecord[];
    notes?: string;
  }
): Order => {
  const orders = getStoredOrders();
  const orderIdx = orders.findIndex((o) => o.id === orderId);
  if (orderIdx === -1) {
    throw new Error('Order not found');
  }

  const totalBoxes = params.items.reduce((sum, item) => sum + item.boxQty, 0);
  const totalLoose = params.items.reduce((sum, item) => sum + item.looseQty, 0);
  const totalUnits = params.items.reduce((sum, item) => sum + item.totalUnits, 0);
  const totalMrpValue = params.items.reduce((sum, item) => sum + item.lineMrpTotal, 0);

  const existing = orders[orderIdx];
  const updatedOrder: Order = {
    ...existing,
    items: params.items,
    totalBoxes,
    totalLoose,
    totalUnits,
    totalMrpValue,
    notes: params.notes !== undefined ? params.notes : existing.notes,
  };

  orders[orderIdx] = updatedOrder;
  saveOrders(orders);

  // Update dukan record with updated bill details
  updateDukanOrderRecord(updatedOrder.dukanId, {
    visitStatus: 'ORDER_BOOKED',
    lastOrderAmount: totalMrpValue,
    lastOrderNumber: updatedOrder.orderNumber,
    lastOrderId: updatedOrder.id,
    lastOrderDate: updatedOrder.createdAt,
    lastOrderTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
  });

  // Sync update to backend
  if (isBrowser && navigator.onLine) {
    fetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: params.items, notes: params.notes }),
    }).catch(() => {});
  }

  return updatedOrder;
};

// Owner Feature: Edit Quantities of a Booked Order (if godown stock is short)
export const updateOrderItems = (
  orderId: string,
  updatedItems: OrderItemRecord[]
): Order[] => {
  const orders = getStoredOrders();
  const updated = orders.map((ord) => {
    if (ord.id === orderId) {
      const totalBoxes = updatedItems.reduce((sum, item) => sum + item.boxQty, 0);
      const totalLoose = updatedItems.reduce((sum, item) => sum + item.looseQty, 0);
      const totalUnits = updatedItems.reduce((sum, item) => sum + item.totalUnits, 0);
      const totalMrpValue = updatedItems.reduce((sum, item) => sum + item.lineMrpTotal, 0);

      return {
        ...ord,
        items: updatedItems,
        totalBoxes,
        totalLoose,
        totalUnits,
        totalMrpValue,
      };
    }
    return ord;
  });

  saveOrders(updated);

  // Sync update to MySQL backend
  if (isBrowser && navigator.onLine) {
    fetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: updatedItems }),
    }).catch(() => {});
  }

  return updated;
};

// Delete an order completely (Used by both Salesman in field and Owner on desk)
export const deleteOrder = (orderId: string): Order[] => {
  const orders = getStoredOrders();
  const orderToDelete = orders.find((o) => o.id === orderId || o.orderNumber === orderId);
  const remaining = orders.filter((o) => o.id !== orderId && o.orderNumber !== orderId);
  saveOrders(remaining);

  // If the deleted order belonged to a dukan, revert that dukan back to PENDING
  if (orderToDelete) {
    updateDukanOrderRecord(orderToDelete.dukanId, {
      visitStatus: 'PENDING',
      lastOrderAmount: undefined,
      lastOrderNumber: undefined,
      lastOrderId: undefined,
      lastOrderDate: undefined,
      lastOrderTime: undefined,
    });
  }

  // Sync deletion to Cloud backend
  if (isBrowser && navigator.onLine) {
    fetch(`/api/orders/${orderToDelete?.id || orderId}`, {
      method: 'DELETE',
    }).catch(() => {});
  }

  return remaining;
};

// OFFLINE QUEUE & MYSQL CLOUD SYNC
const QUEUE_KEY = 'rushabh_offline_order_queue_v4';

// Queue order or post to MySQL backend
export const syncOrderToBackend = async (order: Order): Promise<void> => {
  if (!isBrowser) return;

  if (navigator.onLine) {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });
      if (res.ok) return;
    } catch (err) {
      // Fall through to queue
    }
  }

  // If offline or network error, save to offline queue
  try {
    const queueData = localStorage.getItem(QUEUE_KEY);
    const queue: Order[] = queueData ? JSON.parse(queueData) : [];
    queue.push(order);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {}
};

// Flush offline queue to MySQL when connection is restored
export const flushOfflineOrderQueue = async (): Promise<void> => {
  if (!isBrowser || !navigator.onLine) return;
  const queueData = localStorage.getItem(QUEUE_KEY);
  if (!queueData) return;

  try {
    const queue: Order[] = JSON.parse(queueData);
    if (queue.length === 0) return;

    const remaining: Order[] = [];
    for (const order of queue) {
      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order),
        });
        if (!res.ok) remaining.push(order);
      } catch (e) {
        remaining.push(order);
      }
    }
    localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  } catch (err) {
    console.warn('[Queue] Flush error:', err);
  }
};

// Fetch latest orders from Cloud and perform bi-directional two-way sync
export const syncOrdersWithBackend = async (): Promise<Order[]> => {
  if (!isBrowser) return getStoredOrders();

  // Attempt to flush offline queue first
  await flushOfflineOrderQueue();

  if (!navigator.onLine) return getStoredOrders();

  try {
    const res = await fetch('/api/orders', { cache: 'no-store' });
    if (!res.ok) return getStoredOrders();
    const data = await res.json();
    if (data.success && Array.isArray(data.orders)) {
      const cloudOrders: Order[] = data.orders;
      const deletedIds = new Set<string>(Array.isArray(data.deletedIds) ? data.deletedIds : []);
      const localOrders = getStoredOrders();

      // 1. Remove any local orders that were deleted in the cloud
      let cleanLocal = localOrders.filter(
        (o) => !deletedIds.has(o.id) && !deletedIds.has(o.orderNumber)
      );

      // 2. Merge unique orders
      const map = new Map<string, Order>();
      cleanLocal.forEach((o: Order) => map.set(o.id, o));
      cloudOrders.forEach((o: Order) => map.set(o.id, o));

      const merged = Array.from(map.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      saveOrders(merged);

      // 4. Update all dukan visit statuses deterministically
      const allDukans = getStoredDukans();
      const updatedDukans = allDukans.map((dukan) => {
        const todayOrder = merged.find(
          (o) => o.dukanId === dukan.id && isDateToday(o.createdAt)
        );
        if (todayOrder) {
          return {
            ...dukan,
            visitStatus: 'ORDER_BOOKED' as const,
            lastOrderAmount: todayOrder.totalMrpValue,
            lastOrderNumber: todayOrder.orderNumber,
            lastOrderId: todayOrder.id,
            lastOrderDate: todayOrder.createdAt,
            lastOrderTime: new Date(todayOrder.createdAt).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            }),
          };
        } else {
          return {
            ...dukan,
            visitStatus: 'PENDING' as const,
            lastOrderAmount: undefined,
            lastOrderNumber: undefined,
            lastOrderId: undefined,
            lastOrderDate: undefined,
            lastOrderTime: undefined,
          };
        }
      });
      saveDukans(updatedDukans);

      // 5. Notify all active listeners across tabs/components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('rushabh-orders-synced', { detail: merged }));
      }

      return merged;
    }
  } catch (err) {
    console.warn('[CloudSync] Error syncing orders:', err);
  }

  return getStoredOrders();
};

// Fetch latest dukans from Cloud, upload any local custom dukans, and merge
export const syncDukansWithBackend = async (): Promise<Dukan[]> => {
  if (!isBrowser) return getStoredDukans();
  if (!navigator.onLine) return getStoredDukans();

  try {
    const res = await fetch('/api/dukans', { cache: 'no-store' });
    if (!res.ok) return getStoredDukans();
    const data = await res.json();
    if (data.success && Array.isArray(data.dukans)) {
      const cloudDukans: Dukan[] = data.dukans;
      const deletedIds = new Set<string>(Array.isArray(data.deletedIds) ? data.deletedIds : []);
      const localDukans = getStoredDukans();

      // 1. Filter out deleted
      const cleanLocal = localDukans.filter((d) => !deletedIds.has(d.id));

      // 2. Merge: INITIAL_DUKANS + cleanLocal + cloudDukans with ZERO DUPLICATES!
      // cloudDukans is placed LAST so any updates from cloud override stale local cache
      const combined = [...INITIAL_DUKANS, ...cleanLocal, ...cloudDukans].filter(
        (d) => !deletedIds.has(d.id) && !(d.tripId === 'trip-dashrath-ranoli' && d.id.startsWith('duk-dsr-'))
      );
      const merged = deduplicateDukans(combined);
      saveDukans(merged);

      // Auto-upload any local custom dukans not yet in cloud
      const cloudIds = new Set(cloudDukans.map((d) => d.id));
      const unSyncedCustom = cleanLocal.filter((d) => d.id?.startsWith('duk-custom-') && !cloudIds.has(d.id));
      if (unSyncedCustom.length > 0) {
        fetch('/api/dukans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dukans: unSyncedCustom }),
        }).catch(() => {});
      }

      // 3. Update trip retailer counts across all beats
      const trips = getStoredTrips();
      const updatedTrips = trips.map((t) => {
        const count = merged.filter((d) => d.tripId === t.id).length;
        return { ...t, dukanCount: count };
      });
      saveTrips(updatedTrips);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('rushabh-dukans-synced', { detail: merged }));
      }

      return merged;
    }
  } catch (err) {
    console.warn('[CloudDukans] Error syncing dukans:', err);
  }

  return getStoredDukans();
};

// Force push all local dukans to cloud storage
export const forcePushAllLocalDukansToCloud = async (): Promise<{ success: boolean; count: number; error?: string }> => {
  if (!isBrowser) return { success: false, count: 0, error: 'Not running in browser' };
  if (!navigator.onLine) return { success: false, count: 0, error: 'Device is offline' };

  try {
    const all = getStoredDukans();
    if (all.length === 0) return { success: true, count: 0 };

    const res = await fetch('/api/dukans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dukans: all }),
    });

    if (res.ok) {
      return { success: true, count: all.length };
    }

    // Fallback: single upload
    let ok = 0;
    for (const d of all) {
      try {
        const r = await fetch('/api/dukans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dukan: d }),
        });
        if (r.ok) ok++;
      } catch (e) {}
    }
    return { success: ok > 0, count: ok };
  } catch (err: any) {
    return { success: false, count: 0, error: err?.message || 'Network error' };
  }
};

// Fetch latest products from Cloud, upload any local custom products, and merge
export const syncProductsWithBackend = async (): Promise<Product[]> => {
  if (!isBrowser) return getStoredProducts();
  if (!navigator.onLine) return getStoredProducts();

  try {
    const res = await fetch('/api/products', { cache: 'no-store' });
    if (!res.ok) return getStoredProducts();
    const data = await res.json();
    if (data.success && Array.isArray(data.products)) {
      const cloudProducts: Product[] = data.products;
      const deletedIds = new Set<string>(Array.isArray(data.deletedIds) ? data.deletedIds : []);
      const localProducts = getStoredProducts();

      // 1. Filter out deleted
      const cleanLocal = localProducts.filter((p) => !deletedIds.has(p.id));

      // 2. Merge: INITIAL_PRODUCTS + cleanLocal + cloudProducts with ZERO DUPLICATES!
      // cloudProducts is placed LAST so any updates from cloud (MRP, packaging, details) override stale local cache
      const combined = [...INITIAL_PRODUCTS, ...cleanLocal, ...cloudProducts].filter(
        (p) => !deletedIds.has(p.id)
      );
      const merged = deduplicateProducts(combined);
      saveProducts(merged);

      // Auto-upload any local custom products not yet in cloud
      const cloudIds = new Set(cloudProducts.map((p) => p.id));
      const unSyncedCustom = cleanLocal.filter((p) => p.isCustom && !cloudIds.has(p.id));
      if (unSyncedCustom.length > 0) {
        fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ products: unSyncedCustom }),
        }).catch(() => {});
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('rushabh-products-synced', { detail: merged }));
      }

      return merged;
    }
  } catch (err) {
    console.warn('[CloudProducts] Error syncing products:', err);
  }

  return getStoredProducts();
};

// Force push all local products to cloud storage
export const forcePushAllLocalProductsToCloud = async (): Promise<{ success: boolean; count: number; error?: string }> => {
  if (!isBrowser) return { success: false, count: 0, error: 'Not running in browser' };
  if (!navigator.onLine) return { success: false, count: 0, error: 'Device is offline' };

  try {
    const all = getStoredProducts();
    if (all.length === 0) return { success: true, count: 0 };

    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products: all }),
    });

    if (res.ok) {
      return { success: true, count: all.length };
    }

    return { success: false, count: 0, error: 'Failed to push products to cloud' };
  } catch (err: any) {
    return { success: false, count: 0, error: err?.message || 'Network error' };
  }
};

// Master Function: Sync Orders, Dukans, and Products
export const syncAllWithBackend = async (): Promise<{ orders: Order[]; dukans: Dukan[]; products: Product[] }> => {
  const [orders, dukans, products] = await Promise.all([
    syncOrdersWithBackend(),
    syncDukansWithBackend(),
    syncProductsWithBackend(),
  ]);
  return { orders, dukans, products };
};

// Listen for network restore to auto-flush queue
if (isBrowser) {
  window.addEventListener('online', () => {
    flushOfflineOrderQueue();
    syncDukansWithBackend();
    syncProductsWithBackend();
  });
}

// Export to WDMS CSV
export const generateWdmsSalesmanCsv = (orders: Order[]): string => {
  let csv = `Order_No,Order_Date,Trip_Beat,Shop_Name,Proprietor,Contact,Salesman,WDMS_Code,Company,Product_Name,Pack_Size,Box_Pack_Qty,Boxes_Ordered,Loose_Pcs_Ordered,Total_Billing_Pcs,MRP,Est_MRP_Amount\n`;

  orders.forEach((o) => {
    o.items.forEach((item) => {
      csv += `"${o.orderNumber}","${o.createdAt.substring(0, 10)}","${o.tripName}","${o.dukanName}","${o.ownerName}","${o.phone}","${o.salesmanName}","${item.wdmsCode}","${item.companyName}","${item.productName}","${item.packSize}",${item.unitsPerBox},${item.boxQty},${item.looseQty},${item.totalUnits},${item.mrp},${item.lineMrpTotal}\n`;
    });
  });

  return csv;
};
