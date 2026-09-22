const fs = require('fs');
const path = require('path');

// Target directory on the USB Pen Drive
const HOME = process.env.HOME || '/data/data/com.termux/files/home';
let VAULT_DIR = path.join(HOME, 'storage/external-1/RUSHABH_AGENCY_VAULT');

// Fallback to external-0 if external-1 is not present
if (!fs.existsSync(path.join(HOME, 'storage/external-1')) && fs.existsSync(path.join(HOME, 'storage/external-0'))) {
  VAULT_DIR = path.join(HOME, 'storage/external-0/RUSHABH_AGENCY_VAULT');
}

const BASE_URL = 'https://rushabh-agency-app.vercel.app';

async function syncVault() {
  try {
    // Ensure the USB directory exists
    if (!fs.existsSync(VAULT_DIR)) {
      try {
        fs.mkdirSync(VAULT_DIR, { recursive: true });
      } catch (e) {
        console.log('⚠️ USB Pen Drive not detected! Please ensure your USB is plugged in via OTG.');
        return;
      }
    }

    const [pRes, dRes, oRes] = await Promise.all([
      fetch(`${BASE_URL}/api/products?t=${Date.now()}`),
      fetch(`${BASE_URL}/api/dukans?t=${Date.now()}`),
      fetch(`${BASE_URL}/api/orders?t=${Date.now()}`)
    ]);

    const products = await pRes.json();
    const dukans = await dRes.json();
    const orders = await oRes.json();

    if (products.success && dukans.success && orders.success) {
      fs.writeFileSync(path.join(VAULT_DIR, 'products.json'), JSON.stringify(products.products, null, 2));
      fs.writeFileSync(path.join(VAULT_DIR, 'dukans.json'), JSON.stringify(dukans.dukans, null, 2));
      fs.writeFileSync(path.join(VAULT_DIR, 'orders.json'), JSON.stringify(orders.orders, null, 2));

      // Generate Excel-compatible CSV for all agency orders
      let csv = 'Order_No,Date,Beat,Shop_Name,Proprietor,Contact,Salesman,Item,Pack_Size,Boxes,Loose,Total_Pcs,MRP,Line_Total\n';
      (orders.orders || []).forEach(o => {
        (o.items || []).forEach(i => {
          csv += `"${o.orderNumber}","${(o.createdAt || '').slice(0, 10)}","${o.tripName || ''}","${o.dukanName || ''}","${o.ownerName || ''}","${o.phone || ''}","${o.salesmanName || ''}","${i.productName || ''}","${i.packSize || ''}",${i.boxQty || 0},${i.looseQty || 0},${i.totalUnits || 0},${i.mrp || 0},${i.lineMrpTotal || 0}\n`;
        });
      });
      fs.writeFileSync(path.join(VAULT_DIR, 'orders_excel_export.csv'), csv);

      const timestamp = new Date().toLocaleTimeString();
      const statusText = `Rushabh Agency USB Data Vault\nLast Synced: ${new Date().toLocaleString()}\nProducts: ${products.products.length}\nDukans: ${dukans.dukans.length}\nOrders: ${orders.orders.length}\nStorage: 100% on USB Pen Drive`;
      fs.writeFileSync(path.join(VAULT_DIR, 'vault_status.txt'), statusText);

      console.log(`[${timestamp}] ✅ SYNCED TO USB! ${products.products.length} SKUs, ${dukans.dukans.length} Retailers, ${orders.orders.length} Orders`);
    }
  } catch (e) {
    console.log(`[${new Date().toLocaleTimeString()}] ⚠️ Sync status: ${e.message}`);
  }
}

console.log('====================================================');
console.log('🚀 RUSHABH AGENCY USB DATA VAULT ENGINE');
console.log(`📁 Physical Storage: ${VAULT_DIR}`);
console.log('⚡ Real-Time Auto-Sync: Every 30 seconds');
console.log('====================================================\n');

syncVault();
setInterval(syncVault, 30000);
