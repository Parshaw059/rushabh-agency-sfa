-- ==========================================================
-- RUSHABH AGENCY - FMCG SALES FORCE AUTOMATION (SFA) DATABASE
-- Database Schema for MySQL (Local XAMPP/MAMP or Cloud Railway/Aiven)
-- ==========================================================

CREATE DATABASE IF NOT EXISTS rushabh_agency_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE rushabh_agency_db;

-- 1. USERS & CREDENTIALS
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  role ENUM('SALESMAN', 'OWNER') NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  username VARCHAR(64) NOT NULL UNIQUE,
  pin VARCHAR(16) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Default Accounts
INSERT INTO users (id, name, role, phone, username, pin)
VALUES 
  ('user-salesman-hiren', 'Hiren Shah (Sales Officer)', 'SALESMAN', '9825012345', 'hiren', '1234'),
  ('user-owner-1', 'Rushabh Agency (Owner Desk)', 'OWNER', '8128232377', 'owner', '9999')
ON DUPLICATE KEY UPDATE name=VALUES(name), phone=VALUES(phone), pin=VALUES(pin);

-- 2. TRIP BEATS (9 Assigned Routes)
CREATE TABLE IF NOT EXISTS trips (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  beat_code VARCHAR(32) NOT NULL UNIQUE,
  area VARCHAR(255) NOT NULL,
  dukan_count INT DEFAULT 0,
  salesman_id VARCHAR(64),
  salesman_name VARCHAR(128),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (salesman_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Seed the 9 Trip Routes
INSERT INTO trips (id, name, beat_code, area, dukan_count, salesman_id, salesman_name)
VALUES
  ('trip-nandesari', 'Nandesari Beat', 'BEAT-NAN-01', 'Nandesari GIDC & Main Village', 4, 'user-salesman-hiren', 'Hiren Shah'),
  ('trip-undera', 'Undera Beat', 'BEAT-UND-02', 'Undera Village & Refinery Road', 3, 'user-salesman-hiren', 'Hiren Shah'),
  ('trip-bajwa', 'Bajwa Beat', 'BEAT-BAJ-03', 'Bajwa Main Bazar & Station Road', 4, 'user-salesman-hiren', 'Hiren Shah'),
  ('trip-bajwa-koyli', 'Bajwa-Koyli Beat', 'BEAT-BKY-04', 'Bajwa-Koyli Link Road & IOCL Gate', 3, 'user-salesman-hiren', 'Hiren Shah'),
  ('trip-waghodiya', 'Waghodiya Beat', 'BEAT-WAG-05', 'Waghodiya Town & GIDC Industrial', 4, 'user-salesman-hiren', 'Hiren Shah'),
  ('trip-jarod', 'Jarod Beat', 'BEAT-JAR-06', 'Jarod Cross Road & Market Yard', 3, 'user-salesman-hiren', 'Hiren Shah'),
  ('trip-chhani', 'Chhani Beat', 'BEAT-CHN-07', 'Chhani Jakat Naka & Canal Road', 4, 'user-salesman-hiren', 'Hiren Shah'),
  ('trip-sakarda-padamla', 'Sakarda-Padamla Beat', 'BEAT-SKP-08', 'Sakarda-Padamla Highway Corridor', 3, 'user-salesman-hiren', 'Hiren Shah'),
  ('trip-dashrath-ranoli', 'Dashrath-Ranoli Beat', 'BEAT-DSR-09', 'Dashrath Village & Ranoli Station Area', 4, 'user-salesman-hiren', 'Hiren Shah')
ON DUPLICATE KEY UPDATE name=VALUES(name), area=VALUES(area);

-- 3. DUKANS / RETAILERS
CREATE TABLE IF NOT EXISTS dukans (
  id VARCHAR(64) PRIMARY KEY,
  shop_name VARCHAR(255) NOT NULL,
  owner_name VARCHAR(128) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  trip_id VARCHAR(64) NOT NULL,
  address VARCHAR(255) NOT NULL,
  gst_number VARCHAR(32),
  visit_status ENUM('PENDING', 'ORDER_BOOKED', 'NO_ORDER') DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
);

-- 4. ORDERS HEADER (Main Booked Orders)
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(64) PRIMARY KEY,
  order_number VARCHAR(32) NOT NULL UNIQUE,
  trip_id VARCHAR(64) NOT NULL,
  trip_name VARCHAR(128) NOT NULL,
  dukan_id VARCHAR(64) NOT NULL,
  dukan_name VARCHAR(255) NOT NULL,
  owner_name VARCHAR(128) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  salesman_id VARCHAR(64) NOT NULL,
  salesman_name VARCHAR(128) NOT NULL,
  total_boxes INT DEFAULT 0,
  total_loose INT DEFAULT 0,
  total_units INT DEFAULT 0,
  total_mrp_value DECIMAL(12, 2) DEFAULT 0.00,
  status VARCHAR(64) DEFAULT 'BOOKED_BY_SALESMAN',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_trip (trip_id),
  INDEX idx_dukan (dukan_id),
  INDEX idx_created (created_at DESC)
);

-- 5. ORDER ITEMS (SKU Lines with Box and Loose Quantities)
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL,
  product_id VARCHAR(64) NOT NULL,
  wdms_code VARCHAR(32) NOT NULL,
  company_name VARCHAR(128) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  pack_size VARCHAR(64) NOT NULL,
  units_per_box INT NOT NULL,
  box_qty INT NOT NULL DEFAULT 0,
  loose_qty INT NOT NULL DEFAULT 0,
  total_units INT NOT NULL DEFAULT 0,
  mrp DECIMAL(10, 2) NOT NULL,
  line_mrp_total DECIMAL(12, 2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_order_id (order_id)
);

-- 6. COMPANIES / BRANDS
CREATE TABLE IF NOT EXISTS companies (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  code VARCHAR(32) NOT NULL,
  description VARCHAR(255),
  tagline VARCHAR(255),
  badge_color VARCHAR(64) DEFAULT 'bg-slate-700',
  gradient VARCHAR(128) DEFAULT 'from-slate-700 to-slate-900',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed Initial FMCG Brands
INSERT INTO companies (id, name, code, description, tagline, badge_color, gradient)
VALUES
  ('reckitt', 'Reckitt (Dettol / Harpic)', 'RB', 'Dettol Soap, Antiseptic, Harpic, Lizol', '100% Germ Protection & Hygiene', 'bg-emerald-600', 'from-emerald-600 to-teal-800'),
  ('dabur', 'Dabur India Ltd.', 'DAB', 'Lal Dant Manjan, Red Paste, Honey, Lal Tail', 'Ayurvedic Healthcare & Oral Care', 'bg-red-600', 'from-red-600 to-amber-700'),
  ('loreal', 'L\'Oréal & Garnier', 'LOR', 'Total Repair 5 Shampoo, Extraordinary Oil, Garnier Black Crème', 'Advanced Hair Care & Styling', 'bg-rose-700', 'from-rose-700 to-red-900'),
  ('everest', 'Everest Spices', 'EVR', 'Garam Masala, Pav Bhaji Masala, Kitchen King', 'India\'s No. 1 Spice & Blended Masala', 'bg-amber-600', 'from-amber-600 to-orange-700'),
  ('maxo', 'Jyothy Labs (Maxo Mosquito)', 'JYO', 'Maxo Liquid Vaporizer, Maxo Mosquito Coil, Ujala, Pril Bar', 'Home Pest Control & Fabric Care', 'bg-blue-700', 'from-blue-700 to-indigo-900'),
  ('itc', 'ITC Foods & Personal Care', 'ITC', 'Sunfeast Dark Fantasy, Aashirvaad Atta, YiPPee Magic Masala', 'Premium Foods & Daily Biscuits', 'bg-yellow-700', 'from-yellow-700 to-amber-800'),
  ('parachute', 'Marico (Parachute)', 'MAR-PAR', 'Parachute Pure 100% Coconut Oil, Advansed Aloe Vera Hair Oil', 'Pure Nourishment Coconut Oil', 'bg-sky-600', 'from-sky-600 to-blue-800'),
  ('sensodyne', 'Sensodyne (Haleon / GSK)', 'SNS', 'Sensodyne Fresh Mint, Rapid Relief, Repair & Protect', '#1 Dentist Recommended for Sensitivity', 'bg-blue-600', 'from-blue-600 to-cyan-800'),
  ('patanjali', 'Patanjali Ayurved', 'PAT', 'Dant Kanti, Kesh Kanti, Pure Cow Desi Ghee', 'Prakriti Ka Aashirwad', 'bg-orange-500', 'from-orange-500 to-amber-600'),
  ('saffola', 'Marico (Saffola Oats & Oils)', 'MAR-SAF', 'Saffola Classic Masala Oats 500g, Saffola Gold Cooking Oil', 'Healthy Heart Lifestyle & Oats', 'bg-amber-500', 'from-amber-500 to-orange-700'),
  ('perfetti', 'Perfetti (Center Fresh / Fruit)', 'PVM', 'Center Fresh Chewing Gum Jar, Center Fruit, Mentos', 'Confectionery Jars & Counter Candies', 'bg-teal-600', 'from-teal-600 to-emerald-800'),
  ('godrej', 'Godrej Consumer Products', 'GCPL', 'GoodKnight Gold Flash Liquid, Cinthol Soap, Godrej No. 1, Hit', 'Mosquito Protection & Soaps', 'bg-blue-800', 'from-blue-800 to-slate-900'),
  ('streax', 'Streax (Hygienic Research)', 'STR', 'Streax Professional Walnut Hair Serum, Cream Hair Colour', 'Professional Hair Styling & Serums', 'bg-pink-600', 'from-pink-600 to-rose-700'),
  ('emami', 'Emami Group', 'EMM', 'Navratna Cool Oil, BoroPlus Antiseptic Cream, Zandu Balm', 'Ayurvedic Cool Oil & Health', 'bg-red-700', 'from-red-700 to-rose-800'),
  ('bajaj', 'Bajaj Consumer Care', 'BAJ-ALM', 'Bajaj Almond Drops Hair Oil, Nomarks Ayurvedic Cream', 'Non-Sticky Almond Nourishment', 'bg-amber-700', 'from-amber-700 to-yellow-800'),
  ('ferrero', 'Ferrero (Kinder Joy / Bomber)', 'FER', 'Kinder Joy Blue/Pink, Tic Tac Mint, Nutella Hazelnut Spread', 'Confectionery & Joy for Kids', 'bg-orange-600', 'from-orange-600 to-amber-700')
ON DUPLICATE KEY UPDATE name=VALUES(name), code=VALUES(code), description=VALUES(description), tagline=VALUES(tagline);

