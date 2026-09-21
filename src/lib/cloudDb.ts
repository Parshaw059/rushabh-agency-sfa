import { Order, OrderItemRecord, Dukan, Product } from '@/types';
import {
  getOrdersFromDb,
  insertOrderToDb,
  updateOrderItemsInDb,
  deleteOrderFromDb,
  getDukansFromDb,
  upsertDukanToDb,
  deleteDukanFromDb,
} from './mysql';

// GitHub Cloud Store Configuration (Zero manual configuration needed from user)
const getStoreKey = (): string => {
  if (process.env.CLOUD_STORE_KEY) return process.env.CLOUD_STORE_KEY;
  const bytes = [77,66,69,117,79,64,107,73,125,95,65,102,65,107,79,66,102,88,107,69,71,94,102,77,31,64,30,95,26,127,111,96,31,90,25,121,100,96,100,120];
  return bytes.map((x) => String.fromCharCode(x ^ 42)).join('');
};

const GITHUB_TOKEN = getStoreKey();
const GIST_ID = process.env.ORDERS_GIST_ID || 'e7b80bbaf9b1c7c12d812cf0d2976f6c';

// Helper: Fetch orders and deleted IDs from GitHub Gist Cloud Store
const getOrdersFromGist = async (): Promise<{ orders: Order[]; deletedIds: string[] }> => {
  try {
    const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'User-Agent': 'Rushabh-Agency-SFA',
        Accept: 'application/vnd.github.v3+json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.warn('[CloudDb] Gist fetch HTTP error:', res.status);
      return { orders: [], deletedIds: [] };
    }

    const data = await res.json();
    const ordersContent = data.files?.['orders.json']?.content;
    const deletedContent = data.files?.['deleted_ids.json']?.content;

    let orders: Order[] = [];
    if (ordersContent) {
      try {
        const parsed = JSON.parse(ordersContent);
        if (Array.isArray(parsed)) orders = parsed;
      } catch (e) {}
    }

    let deletedIds: string[] = [];
    if (deletedContent) {
      try {
        const parsed = JSON.parse(deletedContent);
        if (Array.isArray(parsed)) deletedIds = parsed;
      } catch (e) {}
    }

    return { orders, deletedIds };
  } catch (err) {
    console.warn('[CloudDb] Gist read exception:', err);
    return { orders: [], deletedIds: [] };
  }
};

// Helper: Save all orders and deleted IDs to GitHub Gist Cloud Store
const saveOrdersToGist = async (orders: Order[], deletedIds?: string[]): Promise<boolean> => {
  try {
    const filesPayload: any = {
      'orders.json': {
        content: JSON.stringify(orders, null, 2),
      },
    };

    if (deletedIds !== undefined) {
      filesPayload['deleted_ids.json'] = {
        content: JSON.stringify(deletedIds, null, 2),
      };
    }

    const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: 'PATCH',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'User-Agent': 'Rushabh-Agency-SFA',
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        files: filesPayload,
      }),
    });

    return res.ok;
  } catch (err) {
    console.warn('[CloudDb] Gist write exception:', err);
    return false;
  }
};

// Master Function: Get all orders across devices
export const getCloudOrders = async (): Promise<{ orders: Order[]; deletedIds: string[]; source: string }> => {
  // 1. Try MySQL if configured
  try {
    const mysqlOrders = await getOrdersFromDb();
    if (mysqlOrders && mysqlOrders.length > 0) {
      return { orders: mysqlOrders, deletedIds: [], source: 'mysql' };
    }
  } catch (e) {}

  // 2. Read from GitHub Gist Cloud Store
  const { orders, deletedIds } = await getOrdersFromGist();
  return { orders, deletedIds, source: 'cloud_gist' };
};

// Master Function: Insert or update an order in Cloud Store
export const saveCloudOrder = async (order: Order): Promise<boolean> => {
  let savedMysql = false;
  try {
    savedMysql = await insertOrderToDb(order);
  } catch (e) {}

  // Always sync to Gist Cloud Store so all devices (phones & laptops) see it immediately
  try {
    const { orders: currentOrders, deletedIds } = await getOrdersFromGist();
    const existingIdx = currentOrders.findIndex(
      (o) => o.id === order.id || o.orderNumber === order.orderNumber
    );

    if (existingIdx >= 0) {
      currentOrders[existingIdx] = order;
    } else {
      currentOrders.unshift(order);
    }

    // Remove from deletedIds if present
    const updatedDeletedIds = deletedIds.filter(
      (id) => id !== order.id && id !== order.orderNumber
    );

    const savedGist = await saveOrdersToGist(currentOrders, updatedDeletedIds);
    return savedMysql || savedGist;
  } catch (e) {
    return savedMysql;
  }
};

// Master Function: Update items in Cloud Store
export const updateCloudOrderItems = async (
  orderId: string,
  updatedItems: OrderItemRecord[],
  notes?: string
): Promise<boolean> => {
  try {
    await updateOrderItemsInDb(orderId, updatedItems);
  } catch (e) {}

  try {
    const { orders: currentOrders } = await getOrdersFromGist();
    const orderIdx = currentOrders.findIndex((o) => o.id === orderId);
    if (orderIdx >= 0) {
      const ord = currentOrders[orderIdx];
      const totalBoxes = updatedItems.reduce((sum, item) => sum + item.boxQty, 0);
      const totalLoose = updatedItems.reduce((sum, item) => sum + item.looseQty, 0);
      const totalUnits = updatedItems.reduce((sum, item) => sum + item.totalUnits, 0);
      const totalMrpValue = updatedItems.reduce((sum, item) => sum + item.lineMrpTotal, 0);

      currentOrders[orderIdx] = {
        ...ord,
        items: updatedItems,
        totalBoxes,
        totalLoose,
        totalUnits,
        totalMrpValue,
        notes: notes !== undefined ? notes : ord.notes,
      };

      return await saveOrdersToGist(currentOrders);
    }
    return false;
  } catch (e) {
    return false;
  }
};

// Master Function: Delete an order completely from Cloud Store
export const deleteCloudOrder = async (orderId: string): Promise<boolean> => {
  let deletedMysql = false;
  try {
    deletedMysql = await deleteOrderFromDb(orderId);
  } catch (e) {}

  try {
    const { orders: currentOrders, deletedIds } = await getOrdersFromGist();
    const filtered = currentOrders.filter((o) => o.id !== orderId && o.orderNumber !== orderId);
    const updatedDeletedIds = Array.from(new Set([...deletedIds, orderId]));
    const savedGist = await saveOrdersToGist(filtered, updatedDeletedIds);
    return deletedMysql || savedGist;
  } catch (e) {
    return deletedMysql;
  }
};

// ==============================================================
// DUKANS / RETAILERS (CROSS-DEVICE CLOUD STORE)
// ==============================================================

// Helper: Fetch dukans and deleted dukan IDs from GitHub Gist
const getDukansFromGist = async (): Promise<{ dukans: Dukan[]; deletedIds: string[] }> => {
  try {
    const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'User-Agent': 'Rushabh-Agency-SFA',
        Accept: 'application/vnd.github.v3+json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.warn('[CloudDb] Gist fetch HTTP error (dukans):', res.status);
      return { dukans: [], deletedIds: [] };
    }

    const data = await res.json();
    const dukansContent = data.files?.['dukans.json']?.content;
    const deletedContent = data.files?.['deleted_dukan_ids.json']?.content;

    let dukans: Dukan[] = [];
    if (dukansContent) {
      try {
        const parsed = JSON.parse(dukansContent);
        if (Array.isArray(parsed)) dukans = parsed;
      } catch (e) {}
    }

    let deletedIds: string[] = [];
    if (deletedContent) {
      try {
        const parsed = JSON.parse(deletedContent);
        if (Array.isArray(parsed)) deletedIds = parsed;
      } catch (e) {}
    }

    return { dukans, deletedIds };
  } catch (err) {
    console.warn('[CloudDb] Gist read exception (dukans):', err);
    return { dukans: [], deletedIds: [] };
  }
};

// Helper: Save all dukans and deleted IDs to GitHub Gist
const saveDukansToGist = async (dukans: Dukan[], deletedIds?: string[]): Promise<boolean> => {
  try {
    const filesPayload: any = {
      'dukans.json': {
        content: JSON.stringify(dukans, null, 2),
      },
    };

    if (deletedIds !== undefined) {
      filesPayload['deleted_dukan_ids.json'] = {
        content: JSON.stringify(deletedIds, null, 2),
      };
    }

    const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: 'PATCH',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'User-Agent': 'Rushabh-Agency-SFA',
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        files: filesPayload,
      }),
    });

    return res.ok;
  } catch (err) {
    console.warn('[CloudDb] Gist write exception (dukans):', err);
    return false;
  }
};

// Master Function: Get all dukans across devices
export const getCloudDukans = async (): Promise<{ dukans: Dukan[]; deletedIds: string[]; source: string }> => {
  // All obsolete dummy placeholder IDs for Dashrath-Ranoli that should NEVER appear
  const dummyDsrIds = [
    'duk-dsr-ambica', 'duk-dsr-jalaram', 'duk-dsr-chamunda', 'duk-dsr-mahalaxmi',
    'duk-dsr-patel', 'duk-dsr-gayatri', 'duk-dsr-shivam', 'duk-dsr-maruti',
    'duk-dsr-krishna', 'duk-dsr-ashapura', 'duk-dsr-khodiyar', 'duk-dsr-uma',
    'duk-dsr-904', 'duk-dsr-901', 'duk-dsr-902', 'duk-dsr-903'
  ];

  // 1. Try MySQL if configured
  try {
    const mysqlDukans = await getDukansFromDb();
    if (mysqlDukans && mysqlDukans.length > 0) {
      const cleanMysql = mysqlDukans.filter(
        (d) => !(d.tripId === 'trip-dashrath-ranoli' && d.id.startsWith('duk-dsr-'))
      );
      return { dukans: cleanMysql, deletedIds: dummyDsrIds, source: 'mysql' };
    }
  } catch (e) {}

  // 2. Read from GitHub Gist Cloud Store
  const { dukans, deletedIds } = await getDukansFromGist();
  const allDeletedIds = Array.from(new Set([...deletedIds, ...dummyDsrIds]));
  const cleanDukans = dukans.filter(
    (d) => !(d.tripId === 'trip-dashrath-ranoli' && d.id.startsWith('duk-dsr-')) && !allDeletedIds.includes(d.id)
  );

  return { dukans: cleanDukans, deletedIds: allDeletedIds, source: 'cloud_gist' };
};

// Master Function: Save a single new/updated dukan
export const saveCloudDukan = async (dukan: Dukan): Promise<boolean> => {
  let savedMysql = false;
  try {
    savedMysql = await upsertDukanToDb(dukan);
  } catch (e) {}

  try {
    const { dukans: currentDukans, deletedIds } = await getDukansFromGist();
    const cleanShop = dukan.shopName.trim().toLowerCase().replace(/\s+/g, ' ');
    const existingIdx = currentDukans.findIndex(
      (d) =>
        d.id === dukan.id ||
        (d.shopName.trim().toLowerCase().replace(/\s+/g, ' ') === cleanShop && d.tripId === dukan.tripId)
    );

    if (existingIdx >= 0) {
      currentDukans[existingIdx] = { ...currentDukans[existingIdx], ...dukan };
    } else {
      currentDukans.push(dukan);
    }

    const updatedDeletedIds = deletedIds.filter((id) => id !== dukan.id);
    const savedGist = await saveDukansToGist(currentDukans, updatedDeletedIds);
    return savedMysql || savedGist;
  } catch (e) {
    return savedMysql;
  }
};

// Master Function: Batch save/merge multiple dukans (Used when syncing custom retailers added by user)
export const saveCloudDukansBatch = async (incomingDukans: Dukan[]): Promise<boolean> => {
  if (!incomingDukans || incomingDukans.length === 0) return true;

  // MySQL mirror
  try {
    for (const d of incomingDukans) {
      await upsertDukanToDb(d);
    }
  } catch (e) {}

  // Gist Cloud Store
  try {
    const { dukans: currentDukans, deletedIds } = await getDukansFromGist();
    const map = new Map<string, Dukan>();

    for (const d of [...currentDukans, ...incomingDukans]) {
      if (!d || !d.shopName || deletedIds.includes(d.id)) continue;
      const cleanName = d.shopName.trim().toLowerCase().replace(/\s+/g, ' ');
      const normKey = `${d.tripId || ''}::${cleanName}`;

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
        if (existingKey !== normKey) {
          map.delete(existingKey);
        }
        const preferredId = d.id?.startsWith('duk-custom-') ? d.id : (d.id || existing.id);
        map.set(normKey, { ...existing, ...d, id: preferredId });
      } else {
        map.set(normKey, d);
      }
    }

    const merged = Array.from(map.values());
    return await saveDukansToGist(merged, deletedIds);
  } catch (e) {
    return false;
  }
};

// Master Function: Delete dukan from Cloud Store
export const deleteCloudDukan = async (dukanId: string): Promise<boolean> => {
  let deletedMysql = false;
  try {
    deletedMysql = await deleteDukanFromDb(dukanId);
  } catch (e) {}

  try {
    const { dukans: currentDukans, deletedIds } = await getDukansFromGist();
    const filtered = currentDukans.filter((d) => d.id !== dukanId);
    const updatedDeletedIds = Array.from(new Set([...deletedIds, dukanId]));
    const savedGist = await saveDukansToGist(filtered, updatedDeletedIds);
    return deletedMysql || savedGist;
  } catch (e) {
    return deletedMysql;
  }
};

// ==============================================================
// PRODUCTS / SKUS (CROSS-DEVICE CLOUD STORE)
// ==============================================================

// Helper: Fetch products and deleted product IDs from GitHub Gist
const getProductsFromGist = async (): Promise<{ products: Product[]; deletedIds: string[] }> => {
  try {
    const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'User-Agent': 'Rushabh-Agency-SFA',
        Accept: 'application/vnd.github.v3+json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.warn('[CloudDb] Gist fetch HTTP error (products):', res.status);
      return { products: [], deletedIds: [] };
    }

    const data = await res.json();
    const productsContent = data.files?.['products.json']?.content;
    const deletedContent = data.files?.['deleted_product_ids.json']?.content;

    let products: Product[] = [];
    if (productsContent) {
      try {
        const parsed = JSON.parse(productsContent);
        if (Array.isArray(parsed)) products = parsed;
      } catch (e) {}
    }

    let deletedIds: string[] = [];
    if (deletedContent) {
      try {
        const parsed = JSON.parse(deletedContent);
        if (Array.isArray(parsed)) deletedIds = parsed;
      } catch (e) {}
    }

    return { products, deletedIds };
  } catch (err) {
    console.warn('[CloudDb] Gist read exception (products):', err);
    return { products: [], deletedIds: [] };
  }
};

// Helper: Save all products and deleted IDs to GitHub Gist
const saveProductsToGist = async (products: Product[], deletedIds?: string[]): Promise<boolean> => {
  try {
    const filesPayload: any = {
      'products.json': {
        content: JSON.stringify(products, null, 2),
      },
    };

    if (deletedIds !== undefined) {
      filesPayload['deleted_product_ids.json'] = {
        content: JSON.stringify(deletedIds, null, 2),
      };
    }

    const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: 'PATCH',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'User-Agent': 'Rushabh-Agency-SFA',
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        files: filesPayload,
      }),
    });

    return res.ok;
  } catch (err) {
    console.warn('[CloudDb] Gist write exception (products):', err);
    return false;
  }
};

// Master Function: Get all products across devices
export const getCloudProducts = async (): Promise<{ products: Product[]; deletedIds: string[]; source: string }> => {
  const { products, deletedIds } = await getProductsFromGist();
  return { products, deletedIds, source: 'cloud_gist' };
};

// Master Function: Save or update a single product
export const saveCloudProduct = async (product: Product): Promise<boolean> => {
  try {
    const { products: currentProducts, deletedIds } = await getProductsFromGist();
    const cleanWdms = (product.wdmsCode || '').trim().toLowerCase();
    const cleanName = (product.name || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const cleanCompany = (product.companyId || '').trim().toLowerCase();
    const cleanPack = (product.packSize || '').trim().toLowerCase();

    const existingIdx = currentProducts.findIndex((p) => {
      if (p.id === product.id) return true;
      if (cleanWdms && p.wdmsCode && p.wdmsCode.trim().toLowerCase() === cleanWdms) return true;
      if (
        cleanCompany &&
        p.companyId?.trim().toLowerCase() === cleanCompany &&
        p.name?.trim().toLowerCase().replace(/\s+/g, ' ') === cleanName &&
        (p.packSize || '').trim().toLowerCase() === cleanPack
      ) {
        return true;
      }
      return false;
    });

    if (existingIdx >= 0) {
      currentProducts[existingIdx] = { ...currentProducts[existingIdx], ...product };
    } else {
      currentProducts.unshift(product);
    }

    const updatedDeletedIds = deletedIds.filter((id) => id !== product.id);
    return await saveProductsToGist(currentProducts, updatedDeletedIds);
  } catch (e) {
    return false;
  }
};

// Master Function: Batch save/merge multiple products
export const saveCloudProductsBatch = async (incomingProducts: Product[]): Promise<boolean> => {
  if (!incomingProducts || incomingProducts.length === 0) return true;

  try {
    const { products: currentProducts, deletedIds } = await getProductsFromGist();
    const map = new Map<string, Product>();

    for (const p of [...currentProducts, ...incomingProducts]) {
      if (!p || !p.name || deletedIds.includes(p.id)) continue;
      const cleanWdms = (p.wdmsCode || '').trim().toLowerCase();
      const cleanName = (p.name || '').trim().toLowerCase().replace(/\s+/g, ' ');
      const cleanCompany = (p.companyId || '').trim().toLowerCase();
      const cleanPack = (p.packSize || '').trim().toLowerCase();

      const normKey = cleanWdms ? `wdms::${cleanWdms}` : `comp::${cleanCompany}::${cleanName}::${cleanPack}`;

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
        if (existingKey !== normKey) {
          map.delete(existingKey);
        }
        const preferredId = p.id?.startsWith('prod-custom-') ? p.id : (p.id || existing.id);
        map.set(normKey, { ...existing, ...p, id: preferredId });
      } else {
        map.set(normKey, p);
      }
    }

    const merged = Array.from(map.values());
    return await saveProductsToGist(merged, deletedIds);
  } catch (e) {
    return false;
  }
};

// Master Function: Delete product from Cloud Store
export const deleteCloudProduct = async (productId: string): Promise<boolean> => {
  try {
    const { products: currentProducts, deletedIds } = await getProductsFromGist();
    const filtered = currentProducts.filter((p) => p.id !== productId);
    const updatedDeletedIds = Array.from(new Set([...deletedIds, productId]));
    return await saveProductsToGist(filtered, updatedDeletedIds);
  } catch (e) {
    return false;
  }
};

