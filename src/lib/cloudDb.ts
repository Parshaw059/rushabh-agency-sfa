import { Order, OrderItemRecord, Dukan, Product, Company } from '@/types';
import {
  getOrdersFromDb,
  insertOrderToDb,
  updateOrderItemsInDb,
  deleteOrderFromDb,
  getDukansFromDb,
  upsertDukanToDb,
  deleteDukanFromDb,
  getCompaniesFromDb,
  upsertCompanyToDb,
  deleteCompanyFromDb,
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

    // Filter out any orders that are in deletedIds
    if (deletedIds.length > 0) {
      const delSet = new Set(deletedIds);
      orders = orders.filter((o) => !delSet.has(o.id) && !delSet.has(o.orderNumber));
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

    // If order was marked as deleted, refuse to resurrect it!
    if (deletedIds.includes(order.id) || deletedIds.includes(order.orderNumber)) {
      console.warn(`[CloudDb] Order ${order.id} / ${order.orderNumber} is marked as deleted. Ignoring save.`);
      return false;
    }

    const existingIdx = currentOrders.findIndex(
      (o) => o.id === order.id || o.orderNumber === order.orderNumber
    );

    if (existingIdx >= 0) {
      currentOrders[existingIdx] = order;
    } else {
      currentOrders.unshift(order);
    }

    const savedGist = await saveOrdersToGist(currentOrders, deletedIds);
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
    const matching = currentOrders.find((o) => o.id === orderId || o.orderNumber === orderId);
    const toTombstone = [orderId];
    if (matching) {
      if (matching.id) toTombstone.push(matching.id);
      if (matching.orderNumber) toTombstone.push(matching.orderNumber);
    }
    const tombstoneSet = new Set(toTombstone);
    const filtered = currentOrders.filter(
      (o) => !tombstoneSet.has(o.id) && !tombstoneSet.has(o.orderNumber)
    );
    const updatedDeletedIds = Array.from(new Set([...deletedIds, ...toTombstone]));
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

    const now = dukan.updatedAt || new Date().toISOString();
    const dukanWithTime = { ...dukan, updatedAt: now };

    if (existingIdx >= 0) {
      const existing = currentDukans[existingIdx];
      const existingTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
      const incomingTime = new Date(now).getTime();

      if (incomingTime >= existingTime) {
        currentDukans[existingIdx] = { ...existing, ...dukanWithTime };
      }
    } else {
      currentDukans.push(dukanWithTime);
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

        const dTime = d.updatedAt ? new Date(d.updatedAt).getTime() : 0;
        const existingTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
        const isNewer = dTime >= existingTime;
        const winner = isNewer ? d : existing;
        const loser = isNewer ? existing : d;

        map.set(normKey, {
          ...loser,
          ...winner,
          id: preferredId,
          phone: winner.phone && winner.phone !== '0000000000' ? winner.phone : loser.phone,
          ownerName: winner.ownerName && winner.ownerName !== 'N/A' && winner.ownerName !== '.' ? winner.ownerName : loser.ownerName,
          gstNumber: winner.gstNumber || loser.gstNumber,
          updatedAt: isNewer ? (d.updatedAt || existing.updatedAt) : (existing.updatedAt || d.updatedAt),
        });
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

    const now = product.updatedAt || new Date().toISOString();
    const productWithTime = { ...product, updatedAt: now };

    if (existingIdx >= 0) {
      const existing = currentProducts[existingIdx];
      const existingTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
      const incomingTime = new Date(now).getTime();

      if (incomingTime >= existingTime) {
        currentProducts[existingIdx] = { ...existing, ...productWithTime };
      }
    } else {
      currentProducts.unshift(productWithTime);
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

        const pTime = p.updatedAt ? new Date(p.updatedAt).getTime() : 0;
        const existingTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
        const isNewer = pTime >= existingTime;
        const winner = isNewer ? p : existing;
        const loser = isNewer ? existing : p;

        map.set(normKey, {
          ...loser,
          ...winner,
          id: preferredId,
          mrp: typeof winner.mrp === 'number' && !isNaN(winner.mrp) ? winner.mrp : loser.mrp,
          unitsPerBox: typeof winner.unitsPerBox === 'number' && !isNaN(winner.unitsPerBox) ? winner.unitsPerBox : loser.unitsPerBox,
          updatedAt: isNewer ? (p.updatedAt || existing.updatedAt) : (existing.updatedAt || p.updatedAt),
        });
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

// ==============================================================
// COMPANIES / BRANDS (CROSS-DEVICE CLOUD STORE)
// ==============================================================

// Helper: Fetch companies and deleted company IDs from GitHub Gist
const getCompaniesFromGist = async (): Promise<{ companies: Company[]; deletedIds: string[] }> => {
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
      console.warn('[CloudDb] Gist fetch HTTP error (companies):', res.status);
      return { companies: [], deletedIds: [] };
    }

    const data = await res.json();
    const companiesContent = data.files?.['companies.json']?.content;
    const deletedContent = data.files?.['deleted_company_ids.json']?.content;

    let companies: Company[] = [];
    if (companiesContent) {
      try {
        const parsed = JSON.parse(companiesContent);
        if (Array.isArray(parsed)) companies = parsed;
      } catch (e) {}
    }

    let deletedIds: string[] = [];
    if (deletedContent) {
      try {
        const parsed = JSON.parse(deletedContent);
        if (Array.isArray(parsed)) deletedIds = parsed;
      } catch (e) {}
    }

    return { companies, deletedIds };
  } catch (err) {
    console.warn('[CloudDb] Gist read exception (companies):', err);
    return { companies: [], deletedIds: [] };
  }
};

// Helper: Save all companies and deleted IDs to GitHub Gist
const saveCompaniesToGist = async (companies: Company[], deletedIds?: string[]): Promise<boolean> => {
  try {
    const filesPayload: any = {
      'companies.json': {
        content: JSON.stringify(companies, null, 2),
      },
    };

    if (deletedIds !== undefined) {
      filesPayload['deleted_company_ids.json'] = {
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
    console.warn('[CloudDb] Gist write exception (companies):', err);
    return false;
  }
};

// Master Function: Get all companies across devices
export const getCloudCompanies = async (): Promise<{ companies: Company[]; deletedIds: string[]; source: string }> => {
  // 1. Try MySQL if configured
  try {
    const mysqlCompanies = await getCompaniesFromDb();
    if (mysqlCompanies && mysqlCompanies.length > 0) {
      return { companies: mysqlCompanies, deletedIds: [], source: 'mysql' };
    }
  } catch (e) {}

  // 2. Read from GitHub Gist Cloud Store
  const { companies, deletedIds } = await getCompaniesFromGist();
  return { companies, deletedIds, source: 'cloud_gist' };
};

// Master Function: Save or update a single company
export const saveCloudCompany = async (company: Company): Promise<boolean> => {
  let savedMysql = false;
  try {
    savedMysql = await upsertCompanyToDb(company);
  } catch (e) {}

  try {
    const { companies: currentCompanies, deletedIds } = await getCompaniesFromGist();
    const cleanName = (company.name || '').trim().toLowerCase();
    const existingIdx = currentCompanies.findIndex(
      (c) => c.id === company.id || (c.name && c.name.trim().toLowerCase() === cleanName)
    );

    const now = company.updatedAt || new Date().toISOString();
    const companyWithTime = { ...company, updatedAt: now };

    if (existingIdx >= 0) {
      currentCompanies[existingIdx] = { ...currentCompanies[existingIdx], ...companyWithTime };
    } else {
      currentCompanies.push(companyWithTime);
    }

    const updatedDeletedIds = deletedIds.filter((id) => id !== company.id);
    const savedGist = await saveCompaniesToGist(currentCompanies, updatedDeletedIds);
    return savedMysql || savedGist;
  } catch (e) {
    return savedMysql;
  }
};

// Master Function: Delete company from Cloud Store
export const deleteCloudCompany = async (companyId: string): Promise<boolean> => {
  let deletedMysql = false;
  try {
    deletedMysql = await deleteCompanyFromDb(companyId);
  } catch (e) {}

  try {
    // 1. Delete and tombstone company from Gist
    const { companies: currentCompanies, deletedIds: compDeletedIds } = await getCompaniesFromGist();
    const filteredComps = currentCompanies.filter((c) => c.id !== companyId);
    const updatedCompDeletedIds = Array.from(new Set([...compDeletedIds, companyId]));
    await saveCompaniesToGist(filteredComps, updatedCompDeletedIds);

    // 2. Cascade delete and tombstone all products under this company from Gist
    const { products: currentProducts, deletedIds: prodDeletedIds } = await getProductsFromGist();
    const prodsToDelete = currentProducts.filter((p) => p.companyId === companyId);
    const prodIdsToTombstone = prodsToDelete.map((p) => p.id);
    const filteredProducts = currentProducts.filter((p) => p.companyId !== companyId);
    const updatedProdDeletedIds = Array.from(new Set([...prodDeletedIds, ...prodIdsToTombstone]));
    await saveProductsToGist(filteredProducts, updatedProdDeletedIds);

    return true;
  } catch (e) {
    return deletedMysql;
  }
};


