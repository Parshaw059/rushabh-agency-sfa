# Rushabh Agency - FMCG Field Salesman Mobile App (PWA & SFA)

A modern, phone-first Progressive Web App designed specifically for field salesman **Hiren Shah** visiting retail dukans on daily trips for **Rushabh Agency (Vadodara)**, combined with an **Owner Dashboard** to manage orders, products, packaging sizes, and retailer follow-ups.

---

## 🔑 Login Credentials

| Role | Name | Phone Number | Username | PIN |
| :--- | :--- | :--- | :--- | :--- |
| 👑 **Distributor Owner** | **Rushabh Agency** | **`8128232377`** | `owner` | `9999` |
| 🚴 **Field Salesman** | **Hiren Shah** | `9825012345` | `hiren` | `1234` |

* **WhatsApp Orders**: Dispatched directly to Owner at **`918128232377`**.

---

## 🌟 Key Features & Capabilities

### 1. 🔄 Single Consolidated Daily Bill (No Duplicate Bills)
- **1 Shop = 1 Consolidated Bill per Day**: If a bill was already generated for a shopkeeper earlier in the day (e.g. `ORD-8001`), the app **does not generate a duplicate bill**.
- **Automatic Cart Pre-loading**: When the salesman opens the shop again, all previously ordered items are pre-loaded into the cart with a notification banner.
- **In-Place Updates**: New items or quantity changes recalculate boxes, loose pieces, and total MRP on the **existing bill number**, updating storage and generating a consolidated PDF slip.

### 2. 🚚 Animated Delivery Truck Dispatch on Order Submit
- Cinematic 5-stage animation:
  1. Branded Rushabh Agency tempo (`GJ-06 Vadodara`) rolls in with animated wheels and headlights.
  2. Cartons and petis fly dynamically into the trailer cargo hold.
  3. Container door slides shut with **"SEALED / LOCKED ✓"** badge and mobile haptic vibration.
  4. Audio voice announces *"Order Confirmed!"* with a 90-particle celebration confetti burst.
  5. Truck departs to the next dukan, revealing receipt options.

### 3. 📄 Native WhatsApp PDF Document Sharing (No Plain Text)
- Uses the **Web Share API (`navigator.share({ files: [pdfFile] })`)** on mobile devices.
- Tapping **"WhatsApp PDF"** attaches the official, formatted **`.pdf` document file** directly into the WhatsApp chat to Owner (**`8128232377`**), not plain text.

### 4. ⏳ Daily Order Persistence & Live Pending Shop Tracking
- **Beat Progress Bar**: Shows `⏳ Pending Today` vs `✅ Booked Today` counts and percentage.
- **Instant 3-Way Filters**: Salesman can filter with 1 tap to show **only pending shops** left on the route.
- **Owner Dashboard Tracker**: Real-time list of all shops across beats that haven't ordered today with 1-click **"Call Retailer"** button.
- **Daily Auto-Reset**: Beats reset to pending every morning for the new day's round while past order history is permanently preserved.

### 5. ⚡ 100% Offline Field Mode (Zero Signal / No Wi-Fi Needed)
- Operates offline in basement shops or remote villages.
- Stores orders locally and syncs automatically when network reconnects.

---

## 📱 Salesman Workflow (Phone Interface)
1. **Salesman Login**: Sign in with Hiren Shah's PIN (`1234`).
2. **Select Daily Beat**: Choose from 9 assigned routes (Nandesari, Undera, Bajwa, etc.).
3. **Select Retailer**: Filter by Pending / Booked.
4. **Take Order (MRP Display Only)**:
   - Browse **16 FMCG Brand Catalogs**: Reckitt, Dabur, L'Oréal, Everest, Maxo, ITC, Parachute, Sensodyne, Patanjali, Saffola, Perfetti, Godrej, Streax, Emami, Bajaj, Ferrero.
   - Order by **Boxes (Peti)** and **Loose Pieces**.
5. **Confirm Order**: Watch truck dispatch animation $\rightarrow$ Share PDF to WhatsApp.

---

## ⚙️ Owner Control Panel (`/owner/orders`)
1. **Adjust Order Quantities**: Edit ordered boxes or loose pieces if physical godown stock is short.
2. **Pending Retailers List**: View unvisited shops and follow up directly by phone.
3. **Product Master**: Edit packaging quantities (`unitsPerBox`), update MRPs, or add new SKUs.
4. **1-Click WDMS Export**: Download formatted CSV for distributor billing software.

---

## 🚀 Deployment & Local Run

### Local Development:
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)**.

### Production Build:
```bash
npm run build
npm start
```
