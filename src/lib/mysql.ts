import mysql from 'mysql2/promise';
import { Order, OrderItemRecord, Dukan } from '@/types';

let pool: mysql.Pool | null = null;

export const getDbPool = (): mysql.Pool | null => {
  if (pool) return pool;

  const dbUrl = process.env.DATABASE_URL;
  const host = process.env.MYSQL_HOST || 'localhost';
  const port = parseInt(process.env.MYSQL_PORT || '3306', 10);
  const user = process.env.MYSQL_USER || 'root';
  const password = process.env.MYSQL_PASSWORD || '';
  const database = process.env.MYSQL_DATABASE || 'rushabh_agency_db';

  try {
    if (dbUrl) {
      pool = mysql.createPool({
        uri: dbUrl,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });
    } else {
      pool = mysql.createPool({
        host,
        port,
        user,
        password,
        database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });
    }
    return pool;
  } catch (err) {
    console.warn('[MySQL] Pool creation warning:', err);
    return null;
  }
};

// Check MySQL connection status
export const checkDbConnection = async (): Promise<{ connected: boolean; message: string }> => {
  const p = getDbPool();
  if (!p) {
    return { connected: false, message: 'MySQL pool not initialized' };
  }

  try {
    const connection = await p.getConnection();
    await connection.ping();
    connection.release();
    return { connected: true, message: 'MySQL Connected Successfully' };
  } catch (error: any) {
    return { connected: false, message: error?.message || 'Failed to connect to MySQL' };
  }
};

// Fetch all orders with item lines from MySQL
export const getOrdersFromDb = async (): Promise<Order[] | null> => {
  const p = getDbPool();
  if (!p) return null;

  try {
    const [orderRows]: any = await p.query(
      'SELECT * FROM orders ORDER BY created_at DESC'
    );

    if (!orderRows || orderRows.length === 0) return [];

    const orders: Order[] = [];

    for (const row of orderRows) {
      const [itemRows]: any = await p.query(
        'SELECT * FROM order_items WHERE order_id = ?',
        [row.id]
      );

      const items: OrderItemRecord[] = (itemRows || []).map((i: any) => ({
        productId: i.product_id,
        wdmsCode: i.wdms_code,
        companyName: i.company_name,
        productName: i.product_name,
        packSize: i.pack_size,
        unitsPerBox: i.units_per_box,
        boxQty: i.box_qty,
        looseQty: i.loose_qty,
        totalUnits: i.total_units,
        mrp: parseFloat(i.mrp),
        lineMrpTotal: parseFloat(i.line_mrp_total),
      }));

      orders.push({
        id: row.id,
        orderNumber: row.order_number,
        tripId: row.trip_id,
        tripName: row.trip_name,
        dukanId: row.dukan_id,
        dukanName: row.dukan_name,
        ownerName: row.owner_name,
        phone: row.phone,
        salesmanId: row.salesman_id,
        salesmanName: row.salesman_name,
        totalBoxes: row.total_boxes,
        totalLoose: row.total_loose,
        totalUnits: row.total_units,
        totalMrpValue: parseFloat(row.total_mrp_value),
        status: row.status,
        notes: row.notes || undefined,
        createdAt: new Date(row.created_at).toISOString(),
        items,
      });
    }

    return orders;
  } catch (err) {
    console.warn('[MySQL] Error fetching orders:', err);
    return null;
  }
};

// Insert a new booked order into MySQL
export const insertOrderToDb = async (order: Order): Promise<boolean> => {
  const p = getDbPool();
  if (!p) return false;

  let connection: mysql.PoolConnection | null = null;
  try {
    connection = await p.getConnection();
    await connection.beginTransaction();

    // Insert order header
    await connection.query(
      `INSERT INTO orders 
      (id, order_number, trip_id, trip_name, dukan_id, dukan_name, owner_name, phone, salesman_id, salesman_name, total_boxes, total_loose, total_units, total_mrp_value, status, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        total_boxes = VALUES(total_boxes),
        total_loose = VALUES(total_loose),
        total_units = VALUES(total_units),
        total_mrp_value = VALUES(total_mrp_value)`,
      [
        order.id,
        order.orderNumber,
        order.tripId,
        order.tripName,
        order.dukanId,
        order.dukanName,
        order.ownerName,
        order.phone,
        order.salesmanId,
        order.salesmanName,
        order.totalBoxes,
        order.totalLoose,
        order.totalUnits,
        order.totalMrpValue,
        order.status,
        order.notes || null,
        new Date(order.createdAt),
      ]
    );

    // Delete existing items if updating
    await connection.query('DELETE FROM order_items WHERE order_id = ?', [order.id]);

    // Insert line items
    for (const item of order.items) {
      await connection.query(
        `INSERT INTO order_items
        (order_id, product_id, wdms_code, company_name, product_name, pack_size, units_per_box, box_qty, loose_qty, total_units, mrp, line_mrp_total)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          order.id,
          item.productId,
          item.wdmsCode,
          item.companyName,
          item.productName,
          item.packSize,
          item.unitsPerBox,
          item.boxQty,
          item.looseQty,
          item.totalUnits,
          item.mrp,
          item.lineMrpTotal,
        ]
      );
    }

    await connection.commit();
    return true;
  } catch (err) {
    if (connection) await connection.rollback();
    console.warn('[MySQL] Error inserting order:', err);
    return false;
  } finally {
    if (connection) connection.release();
  }
};

// Owner Feature: Update items in existing order
export const updateOrderItemsInDb = async (
  orderId: string,
  updatedItems: OrderItemRecord[]
): Promise<boolean> => {
  const p = getDbPool();
  if (!p) return false;

  const totalBoxes = updatedItems.reduce((sum, item) => sum + item.boxQty, 0);
  const totalLoose = updatedItems.reduce((sum, item) => sum + item.looseQty, 0);
  const totalUnits = updatedItems.reduce((sum, item) => sum + item.totalUnits, 0);
  const totalMrpValue = updatedItems.reduce((sum, item) => sum + item.lineMrpTotal, 0);

  let connection: mysql.PoolConnection | null = null;
  try {
    connection = await p.getConnection();
    await connection.beginTransaction();

    await connection.query(
      `UPDATE orders SET total_boxes = ?, total_loose = ?, total_units = ?, total_mrp_value = ? WHERE id = ?`,
      [totalBoxes, totalLoose, totalUnits, totalMrpValue, orderId]
    );

    await connection.query('DELETE FROM order_items WHERE order_id = ?', [orderId]);

    for (const item of updatedItems) {
      await connection.query(
        `INSERT INTO order_items
        (order_id, product_id, wdms_code, company_name, product_name, pack_size, units_per_box, box_qty, loose_qty, total_units, mrp, line_mrp_total)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.productId,
          item.wdmsCode,
          item.companyName,
          item.productName,
          item.packSize,
          item.unitsPerBox,
          item.boxQty,
          item.looseQty,
          item.totalUnits,
          item.mrp,
          item.lineMrpTotal,
        ]
      );
    }

    await connection.commit();
    return true;
  } catch (err) {
    if (connection) await connection.rollback();
    console.warn('[MySQL] Error updating order items:', err);
    return false;
  } finally {
    if (connection) connection.release();
  }
};

// Delete order and its items from MySQL
export const deleteOrderFromDb = async (orderId: string): Promise<boolean> => {
  const p = getDbPool();
  if (!p) return false;

  let connection: mysql.PoolConnection | null = null;
  try {
    connection = await p.getConnection();
    await connection.beginTransaction();

    await connection.query('DELETE FROM order_items WHERE order_id = ?', [orderId]);
    await connection.query('DELETE FROM orders WHERE id = ?', [orderId]);

    await connection.commit();
    return true;
  } catch (err) {
    if (connection) await connection.rollback();
    console.warn('[MySQL] Error deleting order:', err);
    return false;
  } finally {
    if (connection) connection.release();
  }
};

// ==========================================
// DUKANS / RETAILERS (CRUD IN MYSQL)
// ==========================================
export const getDukansFromDb = async (): Promise<Dukan[]> => {
  const p = getDbPool();
  if (!p) return [];

  try {
    const [rows]: any = await p.query(
      `SELECT id, shop_name as shopName, owner_name as ownerName, phone, trip_id as tripId, address, gst_number as gstNumber, visit_status as visitStatus
       FROM dukans ORDER BY shop_name ASC`
    );
    return rows as Dukan[];
  } catch (err) {
    console.warn('[MySQL] Error fetching dukans:', err);
    return [];
  }
};

export const upsertDukanToDb = async (dukan: Dukan): Promise<boolean> => {
  const p = getDbPool();
  if (!p) return false;

  try {
    await p.query(
      `INSERT INTO dukans (id, shop_name, owner_name, phone, trip_id, address, gst_number, visit_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         shop_name=VALUES(shop_name),
         owner_name=VALUES(owner_name),
         phone=VALUES(phone),
         trip_id=VALUES(trip_id),
         address=VALUES(address),
         gst_number=VALUES(gst_number),
         visit_status=VALUES(visit_status)`,
      [
        dukan.id,
        dukan.shopName,
        dukan.ownerName,
        dukan.phone,
        dukan.tripId,
        dukan.address,
        dukan.gstNumber || null,
        dukan.visitStatus || 'PENDING',
      ]
    );
    return true;
  } catch (err) {
    console.warn('[MySQL] Error upserting dukan:', err);
    return false;
  }
};

export const deleteDukanFromDb = async (dukanId: string): Promise<boolean> => {
  const p = getDbPool();
  if (!p) return false;

  try {
    await p.query(`DELETE FROM dukans WHERE id = ?`, [dukanId]);
    return true;
  } catch (err) {
    console.warn('[MySQL] Error deleting dukan from db:', err);
    return false;
  }
};
