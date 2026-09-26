'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Dukan, Product, CartItem, User, Order, Company } from '@/types';
import { INITIAL_COMPANIES } from '@/data/mockData';
import {
  getCurrentUser,
  getDukanById,
  getStoredProducts,
  createSalesmanOrder,
  getTodayOrderByDukan,
  updateSalesmanOrder,
  syncOrdersWithBackend,
  syncProductsWithBackend,
  addProduct,
  updateProduct,
  getStoredCompanies,
  addCompany,
  syncCompaniesWithBackend,
  COMPANY_COLOR_PRESETS,
} from '@/lib/storage';
import { generateOrderPdf, viewOrderPdf, generateWhatsAppShareLink, shareOrderPdfViaWhatsApp } from '@/utils/generatePdfReceipt';
import { MobileHeader } from '@/components/MobileHeader';
import { OrderSlipModal } from '@/components/OrderSlipModal';
import { TruckDispatchAnimation } from '@/components/TruckDispatchAnimation';
import {
  Search,
  Plus,
  Minus,
  Check,
  ShoppingBag,
  Layers,
  ArrowRight,
  X,
  Trash2,
  FileText,
  Download,
  Share2,
  CheckCircle2,
  Building2,
  Tag,
  Eye,
  Edit2,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function SalesmanOrderTakingPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dukanId = params.dukanId as string;
  const tripIdFromUrl = searchParams.get('tripId') || 'trip-1';

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [dukan, setDukan] = useState<Dukan | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('dabur');
  const [searchQuery, setSearchQuery] = useState('');

  // Existing order today (to update previous bill instead of creating duplicate)
  const [existingTodayOrder, setExistingTodayOrder] = useState<Order | null>(null);

  // Cart / Order Indent state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Completed order for receipt popup & truck animation
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [showTruckAnimation, setShowTruckAnimation] = useState(false);

  // Edit SKU modal state (Salesman can change MRP or Box Packaging)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editMrp, setEditMrp] = useState('');
  const [editUnitsPerBox, setEditUnitsPerBox] = useState('');
  const [editName, setEditName] = useState('');
  const [editPackSize, setEditPackSize] = useState('');

  const [companies, setCompanies] = useState<Company[]>([]);

  // Add Company modal state
  const [isAddCompanyModalOpen, setIsAddCompanyModalOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyCode, setNewCompanyCode] = useState('');
  const [newCompanyTagline, setNewCompanyTagline] = useState('');
  const [newCompanyColorIdx, setNewCompanyColorIdx] = useState(0);

  // Add SKU modal state (Salesman can add missing SKU from the field)
  const [isAddSkuModalOpen, setIsAddSkuModalOpen] = useState(false);
  const [newCompanyId, setNewCompanyId] = useState('dabur');
  const [newName, setNewName] = useState('');
  const [newPackSize, setNewPackSize] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [newWdmsCode, setNewWdmsCode] = useState('');
  const [newUnitsPerBox, setNewUnitsPerBox] = useState('24');
  const [newMrp, setNewMrp] = useState('50');
  const [skuNotification, setSkuNotification] = useState<string | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setCurrentUser(user);

    const loadedDukan = getDukanById(dukanId);
    if (!loadedDukan) {
      router.push('/trips');
      return;
    }
    setDukan(loadedDukan);
    const loadedProducts = getStoredProducts();
    setProducts(loadedProducts);
    setCompanies(getStoredCompanies());

    const applyFreshProducts = (fresh: Product[]) => {
      if (!fresh || fresh.length === 0) return;
      setProducts(fresh);
      setCartItems((prevCart) =>
        prevCart.map((item) => {
          const updatedProd = fresh.find((p) => p.id === item.product.id);
          if (
            updatedProd &&
            (updatedProd.mrp !== item.product.mrp ||
              updatedProd.unitsPerBox !== item.product.unitsPerBox ||
              updatedProd.name !== item.product.name ||
              updatedProd.packSize !== item.product.packSize)
          ) {
            const totalUnits = item.boxQty * updatedProd.unitsPerBox + item.looseQty;
            return {
              ...item,
              product: updatedProd,
              totalUnits,
              lineMrpTotal: totalUnits * updatedProd.mrp,
            };
          }
          return item;
        })
      );
    };

    // Fetch latest products & companies from Cloud
    const refreshData = () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }
      syncProductsWithBackend().then((fresh) => {
        if (fresh && fresh.length > 0) {
          applyFreshProducts(fresh);
        }
      });
      syncCompaniesWithBackend().then((freshComps) => {
        if (freshComps && freshComps.length > 0) {
          setCompanies(freshComps);
        }
      });
    };

    refreshData();
    const prodInterval = setInterval(refreshData, 45000);

    const handleProductsSynced = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        applyFreshProducts(e.detail);
      }
    };
    const handleCompaniesSynced = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setCompanies(e.detail);
      }
    };

    window.addEventListener('rushabh-products-synced', handleProductsSynced);
    window.addEventListener('rushabh-companies-synced', handleCompaniesSynced);
    window.addEventListener('focus', refreshData);

    // Check if a bill was ALREADY booked today for this retailer
    const checkOrder = () => {
      const priorOrder = getTodayOrderByDukan(dukanId);
      if (priorOrder) {
        setExistingTodayOrder(priorOrder);

        // Pre-load previous bill items into cart so additions happen on the same bill
        const currentProductsList = getStoredProducts();
        const preloadedCart: CartItem[] = priorOrder.items.map((item) => {
          const prod = currentProductsList.find((p) => p.id === item.productId) ||
            loadedProducts.find((p) => p.id === item.productId) || {
            id: item.productId,
            companyId: 'dabur',
            companyName: item.companyName,
            category: 'FMCG',
            name: item.productName,
            packSize: item.packSize,
            wdmsCode: item.wdmsCode,
            unitsPerBox: item.unitsPerBox,
            mrp: item.mrp,
          };
          const effectiveMrp = prod.mrp || item.mrp;
          const effectiveUnitsPerBox = prod.unitsPerBox || item.unitsPerBox;
          const totalUnits = item.boxQty * effectiveUnitsPerBox + item.looseQty;
          return {
            product: { ...prod, mrp: effectiveMrp, unitsPerBox: effectiveUnitsPerBox },
            boxQty: item.boxQty,
            looseQty: item.looseQty,
            totalUnits,
            lineMrpTotal: totalUnits * effectiveMrp,
          };
        });

        setCartItems(preloadedCart);
        if (priorOrder.notes) setNotes(priorOrder.notes);
      }
    };

    checkOrder();
    syncOrdersWithBackend().then(() => checkOrder());

    return () => {
      clearInterval(prodInterval);
      window.removeEventListener('rushabh-products-synced', handleProductsSynced);
      window.removeEventListener('rushabh-companies-synced', handleCompaniesSynced);
      window.removeEventListener('focus', refreshData);
    };
  }, [dukanId, router]);

  // Open Edit Product Modal
  const handleOpenEditProduct = (p: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProduct(p);
    setEditMrp(p.mrp.toString());
    setEditUnitsPerBox(p.unitsPerBox.toString());
    setEditName(p.name);
    setEditPackSize(p.packSize);
  };

  // Save Product Edit (syncs to Cloud & Owner profile immediately)
  const handleSaveProductEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const parsedMrp = !isNaN(parseFloat(editMrp)) ? parseFloat(editMrp) : editingProduct.mrp;
    const parsedUnitsPerBox = !isNaN(parseInt(editUnitsPerBox)) ? parseInt(editUnitsPerBox) : editingProduct.unitsPerBox;

    const updatedList = updateProduct(editingProduct.id, {
      name: editName.trim() || editingProduct.name,
      packSize: editPackSize.trim() || editingProduct.packSize,
      mrp: parsedMrp,
      unitsPerBox: parsedUnitsPerBox,
    });

    setProducts(updatedList);

    // Update cart item pricing if already added
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.product.id === editingProduct.id) {
          const updatedProd = {
            ...item.product,
            name: editName.trim() || item.product.name,
            packSize: editPackSize.trim() || item.product.packSize,
            mrp: parsedMrp,
            unitsPerBox: parsedUnitsPerBox,
          };
          const totalUnits = item.boxQty * parsedUnitsPerBox + item.looseQty;
          return {
            ...item,
            product: updatedProd,
            totalUnits,
            lineMrpTotal: totalUnits * parsedMrp,
          };
        }
        return item;
      })
    );

    setEditingProduct(null);
    setSkuNotification(`Updated "${editingProduct.name}": MRP ₹${parsedMrp}, 1 Box = ${parsedUnitsPerBox} pcs (Cloud Synced to Owner Profile)`);
    setTimeout(() => setSkuNotification(null), 4000);
  };

  // Add Company Submit
  const handleAddCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;

    const preset = COMPANY_COLOR_PRESETS[newCompanyColorIdx] || COMPANY_COLOR_PRESETS[0];
    const created = addCompany({
      name: newCompanyName.trim(),
      code: newCompanyCode.trim() || undefined,
      tagline: newCompanyTagline.trim() || undefined,
      badgeColor: preset.badgeColor,
      gradient: preset.gradient,
    });

    setCompanies(getStoredCompanies());
    setIsAddCompanyModalOpen(false);
    setSelectedCompanyId(created.id);
    setNewCompanyId(created.id);
    setNewCompanyName('');
    setNewCompanyCode('');
    setNewCompanyTagline('');
    setSkuNotification(`Added brand "${created.name}"! You can now book or add products for this brand.`);
    setTimeout(() => setSkuNotification(null), 4000);
  };

  // Add SKU Submit (syncs to Cloud & Owner profile immediately)
  const handleAddSkuSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const comp = companies.find((c) => c.id === newCompanyId) || companies[0] || INITIAL_COMPANIES[0];
    const created = addProduct({
      companyId: comp.id,
      companyName: comp.name,
      category: newCategory.trim() || 'General',
      name: newName.trim(),
      packSize: newPackSize.trim() || 'Standard',
      wdmsCode: newWdmsCode.trim() || `${comp.code}-${Date.now().toString().slice(-4)}`,
      unitsPerBox: parseInt(newUnitsPerBox) || 24,
      mrp: parseFloat(newMrp) || 50.0,
    });

    setProducts(getStoredProducts());
    setIsAddSkuModalOpen(false);
    setNewName('');
    setNewPackSize('');
    setNewWdmsCode('');
    setSkuNotification(`Added "${created.name}" (₹${created.mrp}) successfully! Synced across all devices & Owner profile.`);
    setTimeout(() => setSkuNotification(null), 4000);
  };

  // Handle Box & Loose quantity update
  const handleUpdateItem = (product: Product, boxQty: number, looseQty: number) => {
    const safeBox = Math.max(0, isNaN(boxQty) ? 0 : boxQty);
    const safeLoose = Math.max(0, isNaN(looseQty) ? 0 : looseQty);
    const totalUnits = safeBox * product.unitsPerBox + safeLoose;
    const lineMrpTotal = totalUnits * product.mrp;

    setCartItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.product.id === product.id);

      if (safeBox === 0 && safeLoose === 0) {
        return prev.filter((i) => i.product.id !== product.id);
      }

      const updated: CartItem = {
        product,
        boxQty: safeBox,
        looseQty: safeLoose,
        totalUnits,
        lineMrpTotal,
      };

      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = updated;
        return next;
      } else {
        return [...prev, updated];
      }
    });
  };

  // Handler when truck trailer dispatch animation completes
  const handleTruckAnimationComplete = useCallback(() => {
    setShowTruckAnimation(false);
    setIsReceiptOpen(true);
  }, []);

  // Submit order to database with truck dispatch animation
  const handleSubmitOrder = () => {
    if (!currentUser || !dukan || cartItems.length === 0) return;
    setIsSubmitting(true);

    const orderItemRecords = cartItems.map((c) => ({
      productId: c.product.id,
      wdmsCode: c.product.wdmsCode,
      companyName: c.product.companyName,
      productName: c.product.name,
      packSize: c.product.packSize,
      unitsPerBox: c.product.unitsPerBox,
      boxQty: c.boxQty,
      looseQty: c.looseQty,
      totalUnits: c.totalUnits,
      mrp: c.product.mrp,
      lineMrpTotal: c.lineMrpTotal,
    }));

    let savedOrder: Order;

    if (existingTodayOrder) {
      // Update previous bill of today with new and modified items (NO DUPLICATE BILL!)
      savedOrder = updateSalesmanOrder(existingTodayOrder.id, {
        items: orderItemRecords,
        notes,
      });
      setCompletedOrder(savedOrder);
      setCartItems([]);
      setIsReviewOpen(false);
      setIsSubmitting(false);
      // Already confirmed today — open updated bill receipt directly without re-running animation
      setIsReceiptOpen(true);
    } else {
      // Create new bill
      savedOrder = createSalesmanOrder({
        tripId: dukan.tripId || tripIdFromUrl,
        tripName: `Trip ${dukan.tripId ? dukan.tripId.replace('trip-', '') : '1'} Beat`,
        dukan,
        salesman: currentUser,
        items: orderItemRecords,
        notes,
      });
      setCompletedOrder(savedOrder);
      setCartItems([]);
      setIsReviewOpen(false);
      setIsSubmitting(false);
      // Brand new order: launch trailer animation only one time until order is confirmed
      setShowTruckAnimation(true);
    }
  };

  // Active Company
  const activeCompany = useMemo(() => {
    return companies.find((c) => c.id === selectedCompanyId) || companies[0] || INITIAL_COMPANIES[0];
  }, [companies, selectedCompanyId]);

  // Products filtered by selected company & search query
  const displayedProducts = useMemo(() => {
    return products.filter((p) => {
      if (p.companyId !== selectedCompanyId) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.wdmsCode.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, selectedCompanyId, searchQuery]);

  // Cart Metrics
  const totalCartBoxes = cartItems.reduce((sum, i) => sum + i.boxQty, 0);
  const totalCartLoose = cartItems.reduce((sum, i) => sum + i.looseQty, 0);
  const totalCartUnits = cartItems.reduce((sum, i) => sum + i.totalUnits, 0);
  const totalCartMrpValue = cartItems.reduce((sum, i) => sum + i.lineMrpTotal, 0);

  // Group items by company for Review
  const reviewByCompany: { [comp: string]: CartItem[] } = {};
  cartItems.forEach((item) => {
    const cName = item.product.companyName;
    if (!reviewByCompany[cName]) reviewByCompany[cName] = [];
    reviewByCompany[cName].push(item);
  });

  if (!currentUser || !dukan) return null;

  return (
    <div className="flex-1 flex flex-col pb-28 bg-[#F8FAFC]">
      {/* Mobile Header */}
      <MobileHeader
        title={dukan.shopName}
        subtitle={`Order Taking • ${dukan.ownerName}`}
        showBack={true}
        backHref={`/trips/${dukan.tripId || tripIdFromUrl}`}
        currentUser={currentUser}
      />

      {/* Main Order Content */}
      <main className="p-3 space-y-3">
        {/* Dukan & MRP Only Reminder Banner */}
        <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-emerald-700 block tracking-wider">
              FIELD ORDER ENTRY
            </span>
            <h2 className="text-xs font-black text-slate-900 truncate max-w-[210px]">
              {dukan.shopName}
            </h2>
          </div>
          <span className="text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-300/80 px-2.5 py-1 rounded-lg shadow-2xs">
            MRP DISPLAY ONLY
          </span>
        </div>

        {/* Existing Bill Notice Banner if updating today's bill */}
        {existingTodayOrder && (
          <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-emerald-700 text-white p-3.5 rounded-2xl shadow-md space-y-1.5 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full text-blue-100 border border-white/20">
                Updating Bill #{existingTodayOrder.orderNumber}
              </span>
              <span className="text-[10px] text-emerald-200 font-bold bg-white/10 px-2 py-0.5 rounded-full">
                ✓ No Duplicate Bill
              </span>
            </div>
            <p className="text-xs font-black leading-snug">
              This shop already has a bill today. Any new items added will update Bill #{existingTodayOrder.orderNumber} directly!
            </p>
            <p className="text-[11px] text-blue-100">
              Previous items are pre-loaded in your cart below. Increase quantities, add new products, or adjust items.
            </p>
          </div>
        )}

        {/* FMCG Company Selector Bar with + Add Comp at the last */}
        <div className="bg-white p-2.5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider">
              Select Company / Brand ({companies.length} Brands):
            </span>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200/80">
              {companies.length} Brands
            </span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none items-center">
            {companies.map((comp) => {
              const isSelected = selectedCompanyId === comp.id;
              const inCartCount = cartItems
                .filter((item) => item.product.companyId === comp.id)
                .reduce((sum, item) => sum + item.totalUnits, 0);

              return (
                <button
                  key={comp.id}
                  onClick={() => {
                    setSelectedCompanyId(comp.id);
                    setSearchQuery('');
                  }}
                  className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border shadow-2xs ${
                    isSelected
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-transparent shadow-md shadow-emerald-700/20 ring-2 ring-emerald-400/30'
                      : 'bg-slate-50 text-slate-700 border-slate-200/90 hover:bg-emerald-50/50'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${comp.badgeColor}`} />
                  <span>{comp.name.split(' ')[0]}</span>
                  {inCartCount > 0 && (
                    <span className="bg-white text-emerald-800 text-[9px] font-black px-1.5 py-0.2 rounded-full shadow-2xs">
                      {inCartCount}
                    </span>
                  )}
                </button>
              );
            })}

            {/* At the last of company selection: + Add Comp */}
            <button
              onClick={() => setIsAddCompanyModalOpen(true)}
              className="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border border-dashed border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100 shadow-2xs active:scale-95"
              title="Add New FMCG Brand Agency"
            >
              <Plus className="w-3.5 h-3.5 text-purple-600" />
              <span>+ Add Comp</span>
            </button>
          </div>
        </div>

        {/* SKU Action Notification Toast */}
        {skuNotification && (
          <div className="bg-emerald-600 text-white px-3.5 py-2.5 rounded-2xl text-xs font-black shadow-md flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-200 flex-shrink-0" />
            <span className="flex-1">{skuNotification}</span>
            <button onClick={() => setSkuNotification(null)} className="p-0.5 hover:bg-white/20 rounded">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Active Company & Search Bar */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${activeCompany.badgeColor}`} />
              <h3 className="font-black text-slate-900 text-sm">
                {activeCompany.name}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-bold">
                {displayedProducts.length} Items
              </span>
              <button
                type="button"
                onClick={() => {
                  setNewCompanyId(activeCompany.id);
                  setIsAddSkuModalOpen(true);
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] flex items-center gap-1 shadow-xs transition-colors"
                title="Add new SKU for this company"
              >
                <Plus className="w-3 h-3" />
                <span>Add SKU</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeCompany.name.split(' ')[0]} products...`}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Product Cards List */}
        <div className="space-y-3">
          {displayedProducts.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
              <p className="text-slate-500 text-xs font-bold">
                No products found in this company matching &quot;{searchQuery}&quot;.
              </p>
            </div>
          ) : (
            displayedProducts.map((product) => {
              const currentCartItem = cartItems.find((c) => c.product.id === product.id);
              const boxQty = currentCartItem ? currentCartItem.boxQty : 0;
              const looseQty = currentCartItem ? currentCartItem.looseQty : 0;
              const totalUnits = boxQty * product.unitsPerBox + looseQty;
              const lineMrpTotal = totalUnits * product.mrp;

              return (
                <div
                  key={product.id}
                  className={`bg-white rounded-2xl p-3.5 border transition-all shadow-xs ${
                    totalUnits > 0
                      ? 'border-emerald-500 ring-1 ring-emerald-500/30 bg-emerald-50/10'
                      : 'border-slate-200'
                  }`}
                >
                  {/* Item Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200">
                          {product.wdmsCode}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500">
                          {product.category}
                        </span>
                      </div>
                      <h4 className="font-black text-slate-900 text-xs sm:text-sm leading-snug">
                        {product.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.2 rounded-md">
                          Pack: {product.packSize}
                        </span>
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.2 rounded-md border border-emerald-100 flex items-center gap-1">
                          <Layers className="w-3 h-3 text-emerald-600" />
                          1 Box = <strong>{product.unitsPerBox} pcs</strong>
                        </span>
                      </div>
                    </div>

                    {/* Prominent MRP Only + Quick Edit */}
                    <div className="text-right flex-shrink-0 bg-slate-50 p-2 rounded-xl border border-slate-200/80 min-w-[82px]">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">
                          MRP
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleOpenEditProduct(product, e)}
                          className="p-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                          title="Edit MRP or Box Packing"
                        >
                          <Edit2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                      <span className="text-base font-black text-slate-900 block">
                        ₹{product.mrp.toFixed(2)}
                      </span>
                      <span className="text-[9px] text-slate-500 font-semibold block">
                        per piece
                      </span>
                    </div>
                  </div>

                  {/* Quantity Steppers: Box (Peti) + Loose Pieces */}
                  <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                    {/* 1. Full Box (Peti) Counter */}
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                      <div className="flex justify-between items-center text-[10px] font-black text-slate-700 mb-1">
                        <span>Full Box (Peti)</span>
                        <span className="text-slate-400 font-normal">
                          {boxQty > 0 ? `${boxQty * product.unitsPerBox} pcs` : `x${product.unitsPerBox}`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-white rounded-lg p-0.5 border border-slate-200 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => handleUpdateItem(product, Math.max(0, boxQty - 1), looseQty)}
                          disabled={boxQty <= 0}
                          className="w-7 h-7 rounded-md bg-slate-100 disabled:opacity-30 text-slate-700 flex items-center justify-center font-black text-sm"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={boxQty === 0 ? '' : boxQty}
                          placeholder="0"
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            const num = val === '' ? 0 : parseInt(val, 10);
                            handleUpdateItem(product, isNaN(num) ? 0 : num, looseQty);
                          }}
                          onFocus={(e) => e.target.select()}
                          className="w-12 text-center font-black text-xs text-slate-900 bg-transparent outline-none focus:bg-emerald-50 focus:ring-1 focus:ring-emerald-400 rounded py-1"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateItem(product, boxQty + 1, looseQty)}
                          className="w-7 h-7 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center font-black text-sm shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* 2. Loose Pieces Counter */}
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                      <div className="flex justify-between items-center text-[10px] font-black text-slate-700 mb-1">
                        <span>Loose Pcs</span>
                        <span className="text-slate-400 font-normal">Single items</span>
                      </div>
                      <div className="flex items-center justify-between bg-white rounded-lg p-0.5 border border-slate-200 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => handleUpdateItem(product, boxQty, Math.max(0, looseQty - 1))}
                          disabled={looseQty <= 0}
                          className="w-7 h-7 rounded-md bg-slate-100 disabled:opacity-30 text-slate-700 flex items-center justify-center font-black text-sm"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={looseQty === 0 ? '' : looseQty}
                          placeholder="0"
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            const num = val === '' ? 0 : parseInt(val, 10);
                            handleUpdateItem(product, boxQty, isNaN(num) ? 0 : num);
                          }}
                          onFocus={(e) => e.target.select()}
                          className="w-12 text-center font-black text-xs text-slate-900 bg-transparent outline-none focus:bg-emerald-50 focus:ring-1 focus:ring-emerald-400 rounded py-1"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateItem(product, boxQty, looseQty + 1)}
                          className="w-7 h-7 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center font-black text-sm shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quick Preset Loose Chips & Subtotal */}
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-slate-400 font-bold uppercase">Quick:</span>
                      {[1, 3, 6, 12, 24].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => handleUpdateItem(product, boxQty, looseQty + num)}
                          className="text-[10px] font-black px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 active:bg-emerald-50 active:text-emerald-800"
                        >
                          +{num}
                        </button>
                      ))}
                    </div>

                    {totalUnits > 0 && (
                      <div className="text-right">
                        <span className="text-[10px] text-emerald-800 font-black">
                          {totalUnits} Pcs = ₹{lineMrpTotal.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Floating Bottom Bar (Sticky Order Totals) */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 max-w-md w-full bg-white/95 backdrop-blur-md text-slate-900 p-3 border-t border-slate-200/90 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] z-30 flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-150">
          <div>
            <div className="flex items-center gap-2 text-xs font-black">
              <span className="bg-emerald-100 text-emerald-800 border border-emerald-300/80 px-2 py-0.5 rounded-md text-[10px]">
                {cartItems.length} SKUs
              </span>
              <span className="text-slate-700">{totalCartBoxes} Boxes</span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-700 font-extrabold">{totalCartUnits} Total Pcs</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Est. Total MRP: <strong className="text-slate-900 text-xs font-black">₹{totalCartMrpValue.toFixed(2)}</strong>
            </div>
          </div>

          <button
            onClick={() => setIsReviewOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs shadow-md shadow-emerald-700/25 flex items-center gap-1.5 transition-all active:scale-[0.98]"
          >
            <span>{existingTodayOrder ? `Review Bill (${existingTodayOrder.orderNumber})` : 'Review Order'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Review Drawer Modal */}
      {isReviewOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-center bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="max-w-md w-full bg-white flex flex-col h-full shadow-2xl">
            {/* Header */}
            <div className="bg-white text-slate-900 p-4 flex items-center justify-between border-b border-slate-200">
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-black text-sm leading-tight">
                    {existingTodayOrder ? `Update Bill #${existingTodayOrder.orderNumber}` : 'Review Field Order'}
                  </h3>
                  {existingTodayOrder && (
                    <span className="text-[9px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-full border border-emerald-300">
                      Consolidating Bill
                    </span>
                  )}
                </div>
                <p className="text-xs text-emerald-700 font-bold">{dukan.shopName}</p>
              </div>
              <button
                onClick={() => setIsReviewOpen(false)}
                className="p-1 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items List Grouped by Company */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F8FAFC]">
              {Object.keys(reviewByCompany).map((companyName) => {
                const cItems = reviewByCompany[companyName];
                const cBoxes = cItems.reduce((s, i) => s + i.boxQty, 0);
                const cUnits = cItems.reduce((s, i) => s + i.totalUnits, 0);
                const cTotal = cItems.reduce((s, i) => s + i.lineMrpTotal, 0);

                return (
                  <div key={companyName} className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                    <div className="bg-gradient-to-r from-slate-100 via-emerald-50/50 to-slate-100 text-slate-800 border-b border-slate-200/80 px-3 py-2 flex items-center justify-between text-xs font-black">
                      <span>{companyName}</span>
                      <span className="text-emerald-800 text-[11px] font-extrabold bg-white px-2 py-0.5 rounded-full border border-emerald-200/60 shadow-2xs">
                        {cBoxes} Box | {cUnits} Pcs • ₹{cTotal.toFixed(2)}
                      </span>
                    </div>

                    <div className="divide-y divide-slate-200/80 p-2">
                      {cItems.map((item) => (
                        <div key={item.product.id} className="py-2 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-black text-slate-900 block leading-tight">
                              {item.product.name}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {item.boxQty > 0 ? `${item.boxQty} Box ` : ''}
                              {item.looseQty > 0 ? `+ ${item.looseQty} Loose ` : ''}
                              = <strong>{item.totalUnits} Pcs</strong> @ ₹{item.product.mrp}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900 text-xs">
                              ₹{item.lineMrpTotal.toFixed(2)}
                            </span>
                            <button
                              onClick={() => handleUpdateItem(item.product, 0, 0)}
                              className="text-slate-400 hover:text-red-600 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Salesman Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Salesman Note (Optional):
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Urgent morning tempo delivery"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Summary Matrix */}
              <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-200 space-y-1 text-xs">
                <div className="flex justify-between text-emerald-900 font-semibold">
                  <span>Total Full Boxes (Peti):</span>
                  <span className="font-black">{totalCartBoxes} Boxes</span>
                </div>
                <div className="flex justify-between text-emerald-900 font-semibold">
                  <span>Total Loose Pieces:</span>
                  <span className="font-black">{totalCartLoose} Pcs</span>
                </div>
                <div className="flex justify-between text-emerald-900 font-semibold">
                  <span>Total Ordered Units:</span>
                  <span className="font-black text-emerald-800">{totalCartUnits} Pieces</span>
                </div>
                <div className="border-t border-emerald-200 pt-1.5 flex justify-between items-baseline">
                  <span className="font-black text-slate-900 text-sm">Estimated Total MRP:</span>
                  <span className="font-black text-emerald-800 text-lg">
                    ₹{totalCartMrpValue.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-2">
              <button
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Saving Order...</span>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    <span>
                      {existingTodayOrder
                        ? `Save & Update Bill #${existingTodayOrder.orderNumber}`
                        : 'Confirm & Book Order for Dukan'}
                    </span>
                  </>
                )}
              </button>

              <button
                onClick={() => setIsReviewOpen(false)}
                className="w-full py-2 text-xs text-slate-600 font-bold hover:underline text-center"
              >
                + Add More Products
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🚚 Truck Dispatch & Parcel Loading Animation */}
      <TruckDispatchAnimation
        isOpen={showTruckAnimation}
        dukanName={completedOrder?.dukanName || dukan?.shopName || ''}
        totalBoxes={completedOrder?.totalBoxes || 0}
        totalLoose={completedOrder?.totalLoose || 0}
        totalUnits={completedOrder?.totalUnits || 0}
        onComplete={handleTruckAnimationComplete}
      />

      {/* Post-Order Receipt Modal */}
      {isReceiptOpen && completedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="max-w-md w-full bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                {existingTodayOrder ? `BILL #${completedOrder.orderNumber} UPDATED (NO DUPLICATE)` : 'ORDER BOOKED SUCCESSFULLY'}
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-1">
                {completedOrder.orderNumber}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Dukan: <strong>{completedOrder.dukanName}</strong>
              </p>
              <p className="text-[11px] text-slate-500">
                {completedOrder.totalBoxes} Boxes • {completedOrder.totalLoose} Loose • {completedOrder.totalUnits} Total Pcs
              </p>
            </div>

            {/* 1-Click Action Buttons: View, Download, WhatsApp */}
            <div className="space-y-2 pt-2">
              {/* Primary: View Order Slip In-App (No Download Needed) */}
              <button
                onClick={() => setShowSlipModal(true)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20 active:scale-[0.98] transition-all"
              >
                <Eye className="w-4 h-4" />
                <span>👁️ View Order Slip (No Download)</span>
              </button>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => viewOrderPdf(completedOrder)}
                  className="py-2.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-black text-[11px] flex items-center justify-center gap-1 shadow-xs transition-colors"
                  title="Open raw PDF in new browser tab"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>PDF Tab</span>
                </button>

                <button
                  onClick={() => generateOrderPdf(completedOrder)}
                  className="py-2.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-black text-[11px] flex items-center justify-center gap-1 shadow-xs transition-colors"
                  title="Save PDF file to phone downloads"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Download</span>
                </button>

                <button
                  onClick={() => shareOrderPdfViaWhatsApp(completedOrder)}
                  className="py-2.5 px-2 rounded-xl bg-green-500 hover:bg-green-600 text-white font-black text-[11px] flex items-center justify-center gap-1 shadow-xs transition-colors"
                  title="Share official Order PDF directly via WhatsApp"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>WhatsApp PDF</span>
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => router.push(`/trips/${dukan.tripId || tripIdFromUrl}`)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-black text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <span>Back to Trip (Next Dukan)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit SKU Modal (Salesman field price & box change) */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
                  Cloud SKU Master
                </span>
                <h3 className="text-base font-black text-slate-900">Edit Product / MRP</h3>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProductEdit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Pack Size
                  </label>
                  <input
                    type="text"
                    value={editPackSize}
                    onChange={(e) => setEditPackSize(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. 100g, 500ml"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    MRP Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editMrp}
                    onChange={(e) => setEditMrp(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  1 Full Box Packaging (Pcs per Box / Peti)
                </label>
                <input
                  type="number"
                  value={editUnitsPerBox}
                  onChange={(e) => setEditUnitsPerBox(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 font-mono"
                  required
                />
              </div>

              <div className="p-2 rounded-xl bg-emerald-50 text-[11px] text-emerald-800 font-bold border border-emerald-200/80">
                ⚡ Any update made here automatically syncs to the Owner profile & all devices in real-time.
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-black text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-black text-xs hover:bg-emerald-700 shadow-md shadow-emerald-700/20"
                >
                  Save & Sync
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add SKU Modal (Salesman add missing SKU from field) */}
      {isAddSkuModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
                  New Product
                </span>
                <h3 className="text-base font-black text-slate-900">Add SKU to Catalog</h3>
              </div>
              <button
                onClick={() => setIsAddSkuModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSkuSubmit} className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-700">Company / Brand</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddSkuModalOpen(false);
                      setIsAddCompanyModalOpen(true);
                    }}
                    className="text-[10px] text-purple-700 font-bold hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ New Brand</span>
                  </button>
                </div>
                <select
                  value={newCompanyId}
                  onChange={(e) => setNewCompanyId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Product Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dabur Red Toothpaste"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Pack Size</label>
                  <input
                    type="text"
                    placeholder="e.g. 100g, 200ml"
                    value={newPackSize}
                    onChange={(e) => setNewPackSize(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Oral Care, Soaps"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">MRP Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="50"
                    value={newMrp}
                    onChange={(e) => setNewMrp(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Box Pack (Pcs)</label>
                  <input
                    type="number"
                    placeholder="24"
                    value={newUnitsPerBox}
                    onChange={(e) => setNewUnitsPerBox(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  WDMS Item Code (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Auto-generated if empty"
                  value={newWdmsCode}
                  onChange={(e) => setNewWdmsCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div className="p-2 rounded-xl bg-emerald-50 text-[11px] text-emerald-800 font-bold border border-emerald-200/80">
                ✓ Adding this SKU will make it available to take orders immediately and reflect on the Owner profile.
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddSkuModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-black text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-black text-xs hover:bg-emerald-700 shadow-md shadow-emerald-700/20"
                >
                  Add SKU
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Company / Brand Modal in Order Booking */}
      {isAddCompanyModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 block">
                  NEW COMPANY / BRAND
                </span>
                <h3 className="text-base font-black text-slate-900">Add Brand Agency</h3>
              </div>
              <button
                onClick={() => setIsAddCompanyModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCompanySubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Company / Brand Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Britannia, Balaji Wafers"
                  value={newCompanyName}
                  onChange={(e) => {
                    setNewCompanyName(e.target.value);
                    if (!newCompanyCode) {
                      setNewCompanyCode(e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase());
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Short Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BRIT"
                    value={newCompanyCode}
                    onChange={(e) => setNewCompanyCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Biscuits"
                    value={newCompanyTagline}
                    onChange={(e) => setNewCompanyTagline(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Color Theme
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {COMPANY_COLOR_PRESETS.map((preset, idx) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setNewCompanyColorIdx(idx)}
                      className={`p-1 rounded-lg border flex flex-col items-center gap-0.5 transition-all ${
                        newCompanyColorIdx === idx
                          ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-300'
                          : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full ${preset.badgeColor}`} />
                      <span className="text-[7px] font-bold text-slate-600 truncate max-w-full">
                        {preset.name.split(' ')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddCompanyModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-black text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs hover:from-purple-700 hover:to-indigo-700 shadow-md shadow-purple-700/20"
                >
                  Save Brand
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Order Slip Modal (Preview Without Download) */}
      <OrderSlipModal
        order={completedOrder}
        isOpen={showSlipModal}
        onClose={() => setShowSlipModal(false)}
      />
    </div>
  );
}
