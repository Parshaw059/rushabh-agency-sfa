'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Order, User, OrderItemRecord, Trip } from '@/types';
import {
  getCurrentUser,
  getStoredOrders,
  getStoredTrips,
  getDukansWithDailyStatus,
  DukanDailyStatus,
  syncAllWithBackend,
  updateOrderItems,
  deleteOrder,
  generateWdmsSalesmanCsv,
} from '@/lib/storage';
import { generateOrderPdf, viewOrderPdf, generateWhatsAppShareLink, shareOrderPdfViaWhatsApp } from '@/utils/generatePdfReceipt';
import { MobileHeader } from '@/components/MobileHeader';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { OrderSlipModal } from '@/components/OrderSlipModal';
import {
  FileSpreadsheet,
  Download,
  Share2,
  Edit,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  Filter,
  Layers,
  X,
  Plus,
  Minus,
  Check,
  Building2,
  PhoneCall,
  Store,
  MapPin,
} from 'lucide-react';

export default function OwnerOrdersPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [dukans, setDukans] = useState<DukanDailyStatus[]>([]);
  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [viewTab, setViewTab] = useState<'ORDERS' | 'PENDING'>('ORDERS');
  const [selectedTripFilter, setSelectedTripFilter] = useState<string>('all');
  const [activeOrderForDetail, setActiveOrderForDetail] = useState<Order | null>(null);
  const [slipModalOrder, setSlipModalOrder] = useState<Order | null>(null);

  // Edit Order Quantities State (Owner adjust box/loose if stock is short)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editableItems, setEditableItems] = useState<OrderItemRecord[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  // Delete Order State
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setCurrentUser(user);
    setOrders(getStoredOrders());
    setDukans(getDukansWithDailyStatus());
    setAllTrips(getStoredTrips());

    // Sync latest orders + dukans from Cloud
    const loadFresh = () => {
      syncAllWithBackend().then((result) => {
        if (result && Array.isArray(result.orders)) {
          setOrders(result.orders);
        }
        setDukans(getDukansWithDailyStatus());
      });
    };

    loadFresh();

    const handleOrdersSynced = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setOrders(e.detail);
      }
      setDukans(getDukansWithDailyStatus());
    };

    const interval = setInterval(loadFresh, 5000);
    window.addEventListener('focus', loadFresh);
    window.addEventListener('visibilitychange', loadFresh);
    window.addEventListener('rushabh-orders-synced', handleOrdersSynced);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', loadFresh);
      window.removeEventListener('visibilitychange', loadFresh);
      window.removeEventListener('rushabh-orders-synced', handleOrdersSynced);
    };
  }, [router]);

  // Open Edit Order Quantities Modal
  const handleOpenEditOrder = (order: Order) => {
    setEditingOrder(order);
    setEditableItems(JSON.parse(JSON.stringify(order.items)));
  };

  // Adjust Box/Loose inside the order
  const handleAdjustItemQty = (
    index: number,
    field: 'boxQty' | 'looseQty',
    delta: number
  ) => {
    setEditableItems((prev) => {
      const copy = [...prev];
      const target = copy[index];
      const nextVal = Math.max(0, target[field] + delta);
      target[field] = nextVal;
      target.totalUnits = target.boxQty * target.unitsPerBox + target.looseQty;
      target.lineMrpTotal = target.totalUnits * target.mrp;
      return copy;
    });
  };

  // Save Adjusted Order Quantities
  const handleSaveOrderAdjustment = () => {
    if (!editingOrder) return;
    const updatedOrders = updateOrderItems(editingOrder.id, editableItems);
    setOrders(updatedOrders);
    setEditingOrder(null);
    setNotification(`Successfully updated quantities for Order #${editingOrder.orderNumber}!`);
    setTimeout(() => setNotification(null), 3500);
  };

  // Delete Order and revert shop status back to Pending Today
  const handleConfirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    setIsDeleting(true);
    try {
      const updatedOrders = await deleteOrder(orderToDelete.id);
      setOrders(updatedOrders);
      setDukans(getDukansWithDailyStatus());
      setNotification(`Order #${orderToDelete.orderNumber} deleted. ${orderToDelete.dukanName} is now Pending.`);
      setTimeout(() => setNotification(null), 3500);
    } catch (err) {
      console.error('Error deleting order:', err);
    } finally {
      setIsDeleting(false);
      setOrderToDelete(null);
    }
  };

  // 1-Click Export to WDMS CSV
  const handleExportWdms = () => {
    const csv = generateWdmsSalesmanCsv(filteredOrders);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WDMS_Salesman_Bookings_${new Date().toISOString().substring(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setNotification('WDMS CSV Exported! Contains Box count, Loose pieces, and MRP.');
    setTimeout(() => setNotification(null), 3000);
  };

  const trips = Array.from(
    new Set([
      ...allTrips.map((t) => t.name),
      ...orders.map((o) => o.tripName),
    ])
  );

  const filteredOrders = orders.filter((o) => {
    if (selectedTripFilter !== 'all' && o.tripName !== selectedTripFilter) return false;
    return true;
  });

  const pendingDukans = dukans.filter((d) => !d.isBookedToday);
  const filteredPendingDukans = pendingDukans.filter((d) => {
    if (selectedTripFilter === 'all') return true;
    const targetTrip = allTrips.find((t) => t.name === selectedTripFilter);
    return targetTrip ? d.tripId === targetTrip.id : true;
  });

  const totalBoxes = filteredOrders.reduce((sum, o) => sum + o.totalBoxes, 0);
  const totalUnits = filteredOrders.reduce((sum, o) => sum + o.totalUnits, 0);
  const totalMrpValue = filteredOrders.reduce((sum, o) => sum + o.totalMrpValue, 0);

  return (
    <div className="flex-1 flex flex-col pb-20 bg-[#F8FAFC]">
      <MobileHeader
        title="Field Booked Orders"
        subtitle="All Salesmen & Trips"
        showBack={false}
        currentUser={currentUser}
      />

      <main className="p-4 space-y-4">
        {/* Export & Summary Bar */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-50 border border-purple-200/80 px-2 py-0.5 rounded-full block tracking-wider w-fit">
                WDMS BILLING DESK
              </span>
              <h2 className="text-sm font-black text-slate-900 mt-1">
                Live Salesman Bookings
              </h2>
            </div>

            <button
              onClick={handleExportWdms}
              className="py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-700/20 active:scale-[0.98]"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>WDMS Export</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
              <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Orders</span>
              <span className="text-sm font-black text-slate-900">{filteredOrders.length}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
              <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Peti (Boxes)</span>
              <span className="text-sm font-black text-indigo-700">{totalBoxes} Box</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
              <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Total MRP</span>
              <span className="text-xs font-black text-emerald-700 truncate">₹{totalMrpValue.toFixed(0)}</span>
            </div>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Filter Trip */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            Trip Filter:
          </span>
          <select
            value={selectedTripFilter}
            onChange={(e) => setSelectedTripFilter(e.target.value)}
            className="px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 font-bold text-slate-800"
          >
            <option value="all">All Trips ({orders.length} orders)</option>
            {trips.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Toggle Mode: Orders Booked vs Pending Shops */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100/90 rounded-2xl">
          <button
            onClick={() => setViewTab('ORDERS')}
            className={`py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              viewTab === 'ORDERS'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Orders Booked ({filteredOrders.length})</span>
          </button>

          <button
            onClick={() => setViewTab('PENDING')}
            className={`py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              viewTab === 'PENDING'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-amber-800 hover:bg-amber-100/50'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Shops ({filteredPendingDukans.length})</span>
          </button>
        </div>

        {/* View Mode: PENDING SHOPS TODAY */}
        {viewTab === 'PENDING' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Pending Shops Today ({filteredPendingDukans.length})</span>
              </span>
              <span className="text-[11px] text-slate-500">
                Awaiting order booking
              </span>
            </div>

            {filteredPendingDukans.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-2 shadow-xs">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
                <h3 className="font-black text-slate-900 text-sm">All Shops Completed!</h3>
                <p className="text-xs text-slate-500">
                  Every retailer on this beat has booked an order today.
                </p>
              </div>
            ) : (
              filteredPendingDukans.map((dukan, idx) => {
                const tripObj = allTrips.find((t) => t.id === dukan.tripId);
                const tripName = tripObj ? tripObj.name : dukan.tripId;

                return (
                  <div
                    key={dukan.id}
                    className="bg-white rounded-3xl p-4 border border-amber-200 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">
                          #{idx + 1}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                              {tripName}
                            </span>
                            <span className="text-[10px] font-black bg-amber-100 text-amber-800 px-2 py-0.2 rounded-full animate-pulse">
                              PENDING TODAY
                            </span>
                          </div>

                          <h3 className="font-black text-slate-900 text-sm mt-1 leading-snug">
                            {dukan.shopName}
                          </h3>
                          <p className="text-xs text-slate-600 mt-0.5">
                            Proprietor: <strong>{dukan.ownerName}</strong>
                          </p>
                        </div>
                      </div>

                      <a
                        href={`tel:${dukan.phone}`}
                        className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-colors flex-shrink-0"
                        title="Call shopkeeper"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Call: {dukan.phone}</span>
                      </a>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 pl-10">
                      <span>{dukan.address}</span>
                      {dukan.gstNumber && (
                        <span className="font-mono text-[10px] text-slate-400">GST: {dukan.gstNumber}</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* Orders List */
          <div className="space-y-3">
            {filteredOrders.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
                <p className="text-slate-500 text-xs font-bold">
                  No orders booked for this filter yet.
                </p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-black text-slate-900 text-xs sm:text-sm">
                          {order.orderNumber}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                          {order.tripName}
                        </span>
                      </div>
                      <h3 className="font-black text-slate-800 text-sm">
                        {order.dukanName}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Salesman: <strong>{order.salesmanName}</strong> • {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <span className="text-xs font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      BOOKED
                    </span>
                  </div>

                  {/* Summary of Items */}
                  <div className="bg-slate-50 rounded-2xl p-3 space-y-1 text-xs">
                    <div className="flex justify-between font-bold text-slate-600">
                      <span>Total Peti (Boxes):</span>
                      <span className="text-slate-900 font-black">{order.totalBoxes} Box</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-600">
                      <span>Total Loose Items:</span>
                      <span className="text-slate-900 font-black">{order.totalLoose} pcs</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-600">
                      <span>Total Units:</span>
                      <span className="text-slate-900 font-black">{order.totalUnits} pcs</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200/60 pt-1 text-xs">
                      <span>Total MRP Value:</span>
                      <span className="text-emerald-700 font-black">₹{order.totalMrpValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                    <div className="grid grid-cols-2 gap-2 flex-1">
                      <button
                        onClick={() => setSlipModalOrder(order)}
                        className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition-colors"
                        title="View Order Slip in Modal (No Download)"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        <span>View Slip</span>
                      </button>

                      <button
                        onClick={() => generateOrderPdf(order)}
                        className="py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition-colors"
                        title="Download PDF file"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => shareOrderPdfViaWhatsApp(order)}
                        className="flex-1 py-1.5 px-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-xs"
                        title="Share official Order PDF directly via WhatsApp"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>WhatsApp PDF</span>
                      </button>

                      {/* Owner Edit Quantities Button */}
                      <button
                        onClick={() => handleOpenEditOrder(order)}
                        className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1 border border-slate-200 transition-colors"
                        title="Change ordered box or loose quantity"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit Qty</span>
                      </button>

                      {/* Owner Delete Order Button */}
                      <button
                        onClick={() => setOrderToDelete(order)}
                        className="py-1.5 px-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1 border border-rose-200 transition-colors"
                        title="Delete order and return shop to pending"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Owner Edit Order Quantities Modal (User requirement: owner can change quantity of product box too) */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="max-w-md w-full bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                  ADJUST ORDER QUANTITIES
                </span>
                <h3 className="text-sm font-black text-slate-900 mt-1">
                  Order #{editingOrder.orderNumber} • {editingOrder.dukanName}
                </h3>
              </div>
              <button
                onClick={() => setEditingOrder(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Adjust boxes (peti) or loose pieces if physical godown stock is short before generating WDMS bill:
            </p>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {editableItems.map((item, idx) => (
                <div key={item.productId} className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-black text-slate-900 block leading-tight">
                        {item.productName}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {item.companyName} • 1 Box = {item.unitsPerBox} pcs
                      </span>
                    </div>
                    <span className="font-black text-slate-900">
                      ₹{item.lineMrpTotal.toFixed(2)}
                    </span>
                  </div>

                  {/* Quantity adjustment controls */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60">
                    <div className="flex items-center justify-between bg-white p-1.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500">Box:</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleAdjustItemQty(idx, 'boxQty', -1)}
                          className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center font-bold"
                        >
                          -
                        </button>
                        <span className="font-black text-xs w-5 text-center">{item.boxQty}</span>
                        <button
                          type="button"
                          onClick={() => handleAdjustItemQty(idx, 'boxQty', 1)}
                          className="w-6 h-6 rounded bg-emerald-600 text-white flex items-center justify-center font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-white p-1.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500">Loose:</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleAdjustItemQty(idx, 'looseQty', -1)}
                          className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center font-bold"
                        >
                          -
                        </button>
                        <span className="font-black text-xs w-5 text-center">{item.looseQty}</span>
                        <button
                          type="button"
                          onClick={() => handleAdjustItemQty(idx, 'looseQty', 1)}
                          className="w-6 h-6 rounded bg-emerald-600 text-white flex items-center justify-center font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-1.5 text-right text-[10px] font-bold text-emerald-800">
                    Total: {item.totalUnits} Units
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <button
                onClick={handleSaveOrderAdjustment}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-sm flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save Adjusted Quantities</span>
              </button>
              <button
                onClick={() => setEditingOrder(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Order Slip Preview Modal (No Download Needed) */}
      <OrderSlipModal
        order={slipModalOrder}
        isOpen={Boolean(slipModalOrder)}
        onClose={() => setSlipModalOrder(null)}
      />

      {/* Delete Order Confirmation Modal */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="max-w-sm w-full bg-white rounded-3xl p-5 shadow-2xl border border-rose-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-black text-slate-900">
                Delete Order #{orderToDelete.orderNumber}?
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                Are you sure you want to delete the order for <strong className="text-slate-900">{orderToDelete.dukanName}</strong>?
              </p>
              <div className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-left space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <span>⚠️ Permanent Action:</span>
                </p>
                <p>• Order #{orderToDelete.orderNumber} will be deleted from the database.</p>
                <p>• {orderToDelete.dukanName} will be marked back as <strong>Pending Today</strong> so a new bill can be created.</p>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setOrderToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDeleteOrder}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md shadow-rose-600/20 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Deleting...' : 'Yes, Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <MobileBottomNav currentUser={currentUser} />
    </div>
  );
}
