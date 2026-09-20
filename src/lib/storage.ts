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
  if (!data) {
    localStorage.setItem(TRIPS_KEY, JSON.stringify(INITIAL_TRIPS));
    return INITIAL_TRIPS;
  }
  return JSON.parse(data);
};

export const saveTrips = (trips: Trip[]): void => {
  if (isBrowser) {
    localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
  }
};

// DUKANS / RETAILERS
export const getStoredDukans = (): Dukan[] => {
  if (!isBrowser) return INITIAL_DUKANS;
  const data = localStorage.getItem(DUKANS_KEY);
  if (!data) {
    localStorage.setItem(DUKANS_KEY, JSON.stringify(INITIAL_DUKANS));
    return INITIAL_DUKANS;
  }
  return JSON.parse(data);
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
};

// PRODUCTS (CRUD FOR OWNER)
export const getStoredProducts = (): Product[] => {
  if (!isBrowser) return INITIAL_PRODUCTS;
  const data = localStorage.getItem(PRODUCTS_KEY);
  if (!data) {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(INITIAL_PRODUCTS));
    return INITIAL_PRODUCTS;
  }
  return JSON.parse(data);
};

export const saveProducts = (products: Product[]): void => {
  if (isBrowser) {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  }
};

// Owner Feature: Add Product
export const addProduct = (newProduct: Omit<Product, 'id'>): Product => {
  const products = getStoredProducts();
  const created: Product = {
    ...newProduct,
    id: `prod-custom-${Date.now()}`,
    isCustom: true,
  };
  products.unshift(created);
  saveProducts(products);
  return created;
};

// Owner Feature: Change MRP, Box Packaging Quantity, or details
export const updateProduct = (
  productId: string,
  updates: Partial<Pick<Product, 'mrp' | 'unitsPerBox' | 'name' | 'packSize' | 'category'>>
): Product[] => {
  const products = getStoredProducts();
  const updated = products.map((p) => {
    if (p.id === productId) {
      return {
        ...p,
        ...updates,
      };
    }
    return p;
  });
  saveProducts(updated);
  return updated;
};

// Owner Feature: Delete Product
export const deleteProduct = (productId: string): Product[] => {
  const products = getStoredProducts();
  const updated = products.filter((p) => p.id !== productId);
  saveProducts(updated);
  return updated;
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

// Fetch latest orders from Cloud and merge with local storage
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
      // Merge unique orders: cloud orders take precedence or merge
      const local = getStoredOrders();
      const map = new Map<string, Order>();
      // First put local
      local.forEach((o: Order) => map.set(o.id, o));
      // Then overlay cloud orders
      data.orders.forEach((o: Order) => map.set(o.id, o));
      
      const merged = Array.from(map.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      saveOrders(merged);

      // Also update dukan visit statuses for today's orders
      merged.forEach((ord) => {
        if (isDateToday(ord.createdAt)) {
          updateDukanOrderRecord(ord.dukanId, {
            visitStatus: 'ORDER_BOOKED',
            lastOrderAmount: ord.totalMrpValue,
            lastOrderNumber: ord.orderNumber,
            lastOrderId: ord.id,
            lastOrderDate: ord.createdAt,
            lastOrderTime: new Date(ord.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          });
        }
      });

      return merged;
    }
  } catch (err) {
    console.warn('[CloudSync] Error syncing orders:', err);
  }

  return getStoredOrders();
};

// Listen for network restore to auto-flush queue
if (isBrowser) {
  window.addEventListener('online', () => {
    flushOfflineOrderQueue();
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
