/**
 * Automatic Sync Engine: Cloud App (Vercel) -> Local MySQL (rushabh_agency_db)
 * 
 * Fetches latest booked orders, retailers, and products from the live cloud app
 * and automatically populates your local PC MySQL database.
 *
 * Usage:
 *   node sync_mysql.js          (One-time sync)
 *   node sync_mysql.js --watch  (Continuous real-time background sync every 5s)
 */

const https = require('https');
const mysql = require('mysql2/promise');

const CLOUD_APP_URL = 'https://rushabh-agency-app.vercel.app';

const DB_CONFIG = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'rushabh_agency_db',
};

function fetchCloudJson(endpoint) {
  return new Promise((resolve, reject) => {
    https.get(`${CLOUD_APP_URL}${endpoint}`, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function syncOnce() {
  let connection;
  try {
    connection = await mysql.createConnection(DB_CONFIG);

    // 1. Fetch live orders from cloud
    const ordersRes = await fetchCloudJson('/api/orders');
    if (ordersRes.success && Array.isArray(ordersRes.orders)) {
      const orders = ordersRes.orders;
      const deletedIds = ordersRes.deletedIds || [];

      // Remove deleted orders from local MySQL
      for (const delId of deletedIds) {
        await connection.query('DELETE FROM order_items WHERE order_id = ?', [delId]);
        await connection.query('DELETE FROM orders WHERE id = ? OR order_number = ?', [delId, delId]);
      }

      // Upsert cloud orders into local MySQL
      let insertedCount = 0;
      for (const ord of orders) {
        await connection.query(
          `INSERT INTO orders 
          (id, order_number, trip_id, trip_name, dukan_id, dukan_name, owner_name, phone, salesman_id, salesman_name, total_boxes, total_loose, total_units, total_mrp_value, status, notes, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
            dukan_name = VALUES(dukan_name),
            total_boxes = VALUES(total_boxes),
            total_loose = VALUES(total_loose),
            total_units = VALUES(total_units),
            total_mrp_value = VALUES(total_mrp_value),
            status = VALUES(status),
            notes = VALUES(notes)`,
          [
            ord.id,
            ord.orderNumber,
            ord.tripId,
            ord.tripName,
            ord.dukanId,
            ord.dukanName,
            ord.ownerName,
            ord.phone,
            ord.salesmanId,
            ord.salesmanName,
            ord.totalBoxes,
            ord.totalLoose,
            ord.totalUnits,
            ord.totalMrpValue,
            ord.status,
            ord.notes || null,
            new Date(ord.createdAt),
          ]
        );

        // Sync order items
        if (Array.isArray(ord.items)) {
          await connection.query('DELETE FROM order_items WHERE order_id = ?', [ord.id]);
          for (const it of ord.items) {
            await connection.query(
              `INSERT INTO order_items
              (order_id, product_id, wdms_code, company_name, product_name, pack_size, units_per_box, box_qty, loose_qty, total_units, mrp, line_mrp_total)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                ord.id,
                it.productId,
                it.wdmsCode,
                it.companyName,
                it.productName,
                it.packSize,
                it.unitsPerBox,
                it.boxQty,
                it.looseQty,
                it.totalUnits,
                it.mrp,
                it.lineMrpTotal,
              ]
            );
          }
        }
        insertedCount++;
      }
      console.log(`[${new Date().toLocaleTimeString()}] ✅ Synced ${insertedCount} orders from cloud to local MySQL.`);
    }
  } catch (err) {
    console.error(`[${new Date().toLocaleTimeString()}] ❌ Sync error:`, err.message);
  } finally {
    if (connection) await connection.end();
  }
}

async function main() {
  const isWatch = process.argv.includes('--watch');
  console.log('🚀 Rushabh Agency MySQL Auto-Sync Engine initialized.');
  console.log(`📡 Target DB: ${DB_CONFIG.database} on ${DB_CONFIG.host}:${DB_CONFIG.port}`);
  
  await syncOnce();

  if (isWatch) {
    console.log('⏳ Watching for live phone orders every 5 seconds... (Press Ctrl+C to stop)');
    setInterval(syncOnce, 5000);
  }
}

main();
