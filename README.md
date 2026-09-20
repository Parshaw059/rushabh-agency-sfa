# Rushabh Agency - Salesman Mobile Order Booking App (SFA & Beat Indent System)

A phone-first mobile application designed specifically for field salesman **Hiren Shah** visiting retail dukans on daily trips for **Rushabh Agency**, combined with an **Owner Dashboard** to manage products, change box packaging quantities, update MRPs, and adjust booked order quantities.

---

## 🔑 Login Credentials
1. **Salesman (Hiren Shah)**:
   - **Mobile**: `9825012345` (or Username: `hiren`)
   - **PIN**: `1234`
2. **Owner (Rushabh Agency)**:
   - **Mobile**: `9876543210` (or Username: `owner`)
   - **PIN**: `9999`

---

## 📱 Salesman Workflow (Phone Interface)
1. **Salesman Login**: Sign in with Hiren Shah's credentials or 1-tap quick profile.
2. **Select Daily Trip / Route**: Choose the assigned beat (e.g. *Trip 1: Station Road & Market Yard*).
3. **Select Retailer / Dukan**: View all dukans on the trip with visit status (*Pending* vs *Order Booked*).
4. **Take Order (MRP Display Only)**:
   - Browse across **16 FMCG Brand Catalogs**:
     - Reckitt, Dabur, L'Oréal, Everest, Maxo (Jyothy Labs), ITC, Parachute, Sensodyne, Patanjali, Saffola, Perfetti (Center Fresh), Godrej, Streax, Emami, Bajaj, Ferrero (Kinder Joy).
   - Salesmen see **only MRP** for products (e.g. `MRP: ₹55.00`).
   - Order in **Full Boxes (Peti)** (e.g. `2 boxes = 48 pcs`) and/or **Loose Pieces** (e.g. `+ 6 pcs`).
   - Quick preset chips (`+1`, `+3`, `+6`, `+12`).
5. **Review & Submit**:
   - Items grouped by company.
   - 1-Click PDF Indent Slip download.
   - 1-Click WhatsApp forward to billing desk.

---

## ⚙️ Owner / Admin Control Panel
1. **Change Total Quantity per Box**: In Product Master, edit `unitsPerBox` (e.g. change 24 pcs/box to 36 pcs or 12 pcs).
2. **Change MRP Price**: Update product prices across all salesman phones in real time.
3. **Add & Delete Products**: Add new SKUs with custom WDMS codes, or remove discontinued items.
4. **Adjust Booked Order Quantities**: If physical stock in the godown is short, the owner can adjust ordered boxes or loose pieces on any booked order before generating the WDMS bill.
5. **WDMS Excel / CSV Export**: 1-Click download formatted for WDMS distributor billing.

---

## 🚀 How to Run
```bash
cd /Users/parshawshah/.gemini/antigravity/scratch/fmcg-salesman-app
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser (on desktop, renders inside an authentic smartphone viewport container; on mobile, fills the screen natively).
