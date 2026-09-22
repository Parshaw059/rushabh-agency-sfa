export type UserRole = 'SALESMAN' | 'OWNER';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  phone: string;
  username?: string;
  pin?: string;
  password?: string;
  assignedTripId?: string;
  assignedTripName?: string;
}

export interface Trip {
  id: string;
  name: string;
  beatCode: string;
  area: string;
  dukanCount: number;
  salesmanId?: string;
  salesmanName?: string;
}

export type VisitStatus = 'PENDING' | 'VISITED' | 'ORDER_BOOKED';

export interface Dukan {
  id: string;
  shopName: string;
  ownerName: string;
  phone: string;
  tripId: string;
  address: string;
  gstNumber?: string;
  visitStatus: VisitStatus;
  lastOrderAmount?: number;
  lastOrderId?: string;
  lastOrderNumber?: string;
  lastOrderTime?: string;
  lastOrderDate?: string;
  updatedAt?: string;
  isCustom?: boolean;
}

export interface Company {
  id: string;
  name: string;
  code: string;
  description: string;
  tagline: string;
  badgeColor: string;
  gradient: string;
  createdAt?: string;
  updatedAt?: string;
  isCustom?: boolean;
}

export interface Product {
  id: string;
  companyId: string;
  companyName: string;
  category: string;
  name: string;
  packSize: string;
  wdmsCode: string;
  unitsPerBox: number; // Peti / Box count (e.g. 24 pcs - Editable by Owner)
  mrp: number;         // MRP (Salesman only sees this! Editable by Owner)
  isCustom?: boolean;
  updatedAt?: string;
}

export interface CartItem {
  product: Product;
  boxQty: number;      // Full boxes/peti
  looseQty: number;    // Single pieces (1, 3, 6, etc.)
  totalUnits: number;  // (boxQty * unitsPerBox) + looseQty
  lineMrpTotal: number; // totalUnits * mrp
}

export type OrderStatus = 'BOOKED_BY_SALESMAN' | 'BILLED_IN_WDMS' | 'DISPATCHED';

export interface OrderItemRecord {
  productId: string;
  wdmsCode: string;
  companyName: string;
  productName: string;
  packSize: string;
  unitsPerBox: number;
  boxQty: number;
  looseQty: number;
  totalUnits: number;
  mrp: number;
  lineMrpTotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  tripId: string;
  tripName: string;
  dukanId: string;
  dukanName: string;
  ownerName: string;
  phone: string;
  salesmanId: string;
  salesmanName: string;
  items: OrderItemRecord[];
  totalBoxes: number;
  totalLoose: number;
  totalUnits: number;
  totalMrpValue: number;
  status: OrderStatus;
  notes?: string;
  createdAt: string;
}
