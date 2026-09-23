'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Product, User, Company } from '@/types';
import { INITIAL_COMPANIES } from '@/data/mockData';
import {
  getCurrentUser,
  getStoredProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  syncProductsWithBackend,
  getStoredCompanies,
  addCompany,
  deleteCompany,
  syncCompaniesWithBackend,
  COMPANY_COLOR_PRESETS,
} from '@/lib/storage';
import { MobileHeader } from '@/components/MobileHeader';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  Layers,
  Tag,
  AlertCircle,
  Building2,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';

export default function OwnerProductsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Delete Company Confirmation State
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [isSelectCompanyToDeleteModalOpen, setIsSelectCompanyToDeleteModalOpen] = useState(false);

  // Add Company Modal State
  const [isAddCompanyModalOpen, setIsAddCompanyModalOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyCode, setNewCompanyCode] = useState('');
  const [newCompanyTagline, setNewCompanyTagline] = useState('');
  const [newCompanyColorIdx, setNewCompanyColorIdx] = useState(0);

  // Edit Product Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editMrp, setEditMrp] = useState<string>('');
  const [editUnitsPerBox, setEditUnitsPerBox] = useState<string>('');
  const [editName, setEditName] = useState<string>('');
  const [editPackSize, setEditPackSize] = useState<string>('');

  // Add Product Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCompanyId, setNewCompanyId] = useState('dabur');
  const [newName, setNewName] = useState('');
  const [newPackSize, setNewPackSize] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [newWdmsCode, setNewWdmsCode] = useState('');
  const [newUnitsPerBox, setNewUnitsPerBox] = useState('24');
  const [newMrp, setNewMrp] = useState('50');

  const [notification, setNotification] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setCurrentUser(user);
    setProducts(getStoredProducts());
    setCompanies(getStoredCompanies());

    // 1. Fetch fresh products and companies from Cloud
    const loadFreshData = () => {
      syncProductsWithBackend().then((fresh) => {
        if (fresh && fresh.length > 0) {
          setProducts(fresh);
        }
      });
      syncCompaniesWithBackend().then((freshComps) => {
        if (freshComps && freshComps.length > 0) {
          setCompanies(freshComps);
        }
      });
    };

    loadFreshData();

    // 2. Poll every 4 seconds for updates from Salesman or Cloud
    const interval = setInterval(loadFreshData, 4000);

    // 3. Listen for immediate sync events
    const handleProductsSync = (e: any) => {
      if (e.detail) {
        setProducts(e.detail);
      }
    };
    const handleCompaniesSync = (e: any) => {
      if (e.detail) {
        setCompanies(e.detail);
      }
    };

    window.addEventListener('rushabh-products-synced', handleProductsSync);
    window.addEventListener('rushabh-companies-synced', handleCompaniesSync);
    window.addEventListener('focus', loadFreshData);
    window.addEventListener('visibilitychange', loadFreshData);

    return () => {
      clearInterval(interval);
      window.removeEventListener('rushabh-products-synced', handleProductsSync);
      window.removeEventListener('rushabh-companies-synced', handleCompaniesSync);
      window.removeEventListener('focus', loadFreshData);
      window.removeEventListener('visibilitychange', loadFreshData);
    };
  }, [router]);

  // Open Edit Modal
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setEditMrp(p.mrp.toString());
    setEditUnitsPerBox(p.unitsPerBox.toString());
    setEditName(p.name);
    setEditPackSize(p.packSize);
  };

  // Save Product Changes (MRP, Box Packaging, Name, Pack)
  const handleSaveEdit = (e: React.FormEvent) => {
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
    setEditingProduct(null);
    setNotification(`Updated "${editingProduct.name}": MRP ₹${parsedMrp}, 1 Box = ${parsedUnitsPerBox} pcs`);
    setTimeout(() => setNotification(null), 3500);
  };

  // Delete Product
  const handleDelete = (p: Product) => {
    if (confirm(`Are you sure you want to delete ${p.name}?`)) {
      const updatedList = deleteProduct(p.id);
      setProducts(updatedList);
      setNotification(`Deleted "${p.name}" from catalog.`);
      setTimeout(() => setNotification(null), 3000);
    }
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
    setNotification(`Added company "${created.name}"! Now click "+ Add SKU" to add products under this brand.`);
    setTimeout(() => setNotification(null), 4000);
  };

  // Initiate Company Deletion
  const handleInitiateDeleteCompany = (comp: Company) => {
    setCompanyToDelete(comp);
    setDeleteConfirmationInput('');
  };

  // Confirm Company Deletion (Deletes company and all its products)
  const handleConfirmDeleteCompany = () => {
    if (!companyToDelete) return;
    if (deleteConfirmationInput.trim().toLowerCase() !== companyToDelete.name.trim().toLowerCase()) {
      return;
    }
    const target = companyToDelete;
    const { companies: updatedComps, deletedProductCount } = deleteCompany(target.id);
    setCompanies(updatedComps);
    setProducts(getStoredProducts());
    setSelectedCompanyId('all');
    setCompanyToDelete(null);
    setDeleteConfirmationInput('');
    setNotification(
      `Removed company "${target.name}" and all ${deletedProductCount} products from catalog.`
    );
    setTimeout(() => setNotification(null), 4000);
  };

  // Add Product Submit
  const handleAddSubmit = (e: React.FormEvent) => {
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
    setIsAddModalOpen(false);
    setNewName('');
    setNewPackSize('');
    setNewWdmsCode('');
    setNotification(`Added new product "${created.name}" under ${comp.name} successfully!`);
    setTimeout(() => setNotification(null), 3500);
  };

  const filtered = products.filter((p) => {
    if (selectedCompanyId !== 'all' && p.companyId !== selectedCompanyId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.wdmsCode.toLowerCase().includes(q) ||
        p.companyName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col pb-20 bg-[#F8FAFC]">
      <MobileHeader
        title="Product & Packaging Master"
        subtitle="Owner Control Desk"
        showBack={false}
        currentUser={currentUser}
      />

      <main className="p-4 space-y-4">
        {/* Owner Action Banner with 3 Parallel Full-Width Options */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-sm space-y-3">
          <div>
            <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-50 border border-purple-200/80 px-2 py-0.5 rounded-full inline-block tracking-wider">
              OWNER / ADMIN CONTROLS
            </span>
            <h2 className="text-sm font-black text-slate-900 mt-1">
              Catalog & Brand Management
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Select an action below to add products, add new brand agencies, or remove existing brands.
            </p>
          </div>

          {/* 3 Parallel Options: 1. Add SKU, 2. Add Comp, 3. Remove Comp */}
          <div className="space-y-2 pt-1">
            {/* Option 1: Add SKU */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="w-full p-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs flex items-center justify-between shadow-md shadow-emerald-700/15 active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Plus className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <span className="block font-black text-xs text-white">
                    + Add New Product (SKU)
                  </span>
                  <span className="block text-[10px] text-emerald-100 font-normal">
                    Add new items under any brand with MRP and units per box
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-200 flex-shrink-0" />
            </button>

            {/* Option 2: Add Company */}
            <button
              onClick={() => setIsAddCompanyModalOpen(true)}
              className="w-full p-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs flex items-center justify-between shadow-md shadow-purple-700/15 active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <span className="block font-black text-xs text-white">
                    + Add New Company / Brand
                  </span>
                  <span className="block text-[10px] text-purple-100 font-normal">
                    Register a new FMCG distribution company brand
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-purple-200 flex-shrink-0" />
            </button>

            {/* Option 3: Remove Company */}
            <button
              onClick={() => {
                if (selectedCompanyId !== 'all') {
                  const comp = companies.find((c) => c.id === selectedCompanyId);
                  if (comp) handleInitiateDeleteCompany(comp);
                  else setIsSelectCompanyToDeleteModalOpen(true);
                } else {
                  setIsSelectCompanyToDeleteModalOpen(true);
                }
              }}
              className="w-full p-3 rounded-2xl bg-red-50/80 hover:bg-red-100/80 text-red-600 border border-red-200 font-black text-xs flex items-center justify-between shadow-xs active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-4 h-4 text-red-600" />
                </div>
                <div className="text-left">
                  <span className="block font-black text-xs text-red-700">
                    {selectedCompanyId !== 'all'
                      ? `Remove ${companies.find((c) => c.id === selectedCompanyId)?.name || 'Company'} & All Data`
                      : 'Remove Company & All Data'}
                  </span>
                  <span className="block text-[10px] text-red-500 font-normal">
                    Leave a brand agency and delete all associated products safely
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-red-400 flex-shrink-0" />
            </button>
          </div>
        </div>

        {/* Notification banner */}
        {notification && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Search & Company Filter */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Product Name, Code, or Brand..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Company filter chips with + Add Comp at the last */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none items-center">
            <button
              onClick={() => setSelectedCompanyId('all')}
              className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-black transition-all ${
                selectedCompanyId === 'all'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Brands ({products.length})
            </button>
            {companies.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCompanyId(c.id)}
                className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-black flex items-center gap-1 transition-all ${
                  selectedCompanyId === c.id
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${c.badgeColor}`} />
                <span>{c.name.split(' ')[0]}</span>
              </button>
            ))}

            {/* At the last of company selection: + Add Comp name */}
            <button
              onClick={() => setIsAddCompanyModalOpen(true)}
              className="flex-shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-black flex items-center gap-1 bg-purple-50 text-purple-700 border border-dashed border-purple-300 hover:bg-purple-100 hover:border-purple-400 transition-all shadow-xs active:scale-95"
              title="Add New Brand / Company"
            >
              <Plus className="w-3.5 h-3.5 text-purple-600" />
              <span>+ Add Comp</span>
            </button>
          </div>
        </div>

        {/* Selected Company Action Header (Remove Company Option) */}
        {selectedCompanyId !== 'all' && (() => {
          const comp = companies.find((c) => c.id === selectedCompanyId);
          if (!comp) return null;
          const compProductsCount = products.filter((p) => p.companyId === comp.id).length;

          return (
            <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs flex items-center justify-between gap-3 animate-in fade-in">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${comp.badgeColor}`} />
                  <span className="text-[10px] font-mono font-black text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.2 rounded">
                    {comp.code}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">
                    {compProductsCount} Products in Catalog
                  </span>
                </div>
                <h3 className="font-black text-xs text-slate-900 truncate">
                  {comp.name}
                </h3>
                <p className="text-[10px] text-slate-400 truncate">
                  {comp.tagline || 'Agency Distribution Brand'}
                </p>
              </div>

              <button
                onClick={() => handleInitiateDeleteCompany(comp)}
                className="px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-[11px] font-black flex items-center gap-1 transition-all active:scale-95 flex-shrink-0"
                title="Remove Company and its products from catalog"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                <span>Remove Company</span>
              </button>
            </div>
          );
        })()}

        {/* Empty state if filtered brand has no products */}
        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3">
            <Package className="w-10 h-10 text-slate-300 mx-auto" />
            <div>
              <h4 className="font-black text-sm text-slate-800">No Products Found</h4>
              <p className="text-xs text-slate-500 mt-1">
                {selectedCompanyId !== 'all'
                  ? 'There are no products under this brand yet. Click "+ Add SKU" to add products.'
                  : 'No products match your search query.'}
              </p>
            </div>
            {selectedCompanyId !== 'all' && (
              <button
                onClick={() => {
                  setNewCompanyId(selectedCompanyId);
                  setIsAddModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs inline-flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add First SKU</span>
              </button>
            )}
          </div>
        )}

        {/* Product Items List */}
        <div className="space-y-2.5">
          {filtered.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs flex items-center justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                    {product.wdmsCode}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded">
                    {product.companyName.split(' ')[0]}
                  </span>
                </div>

                <h4 className="font-black text-slate-900 text-xs leading-snug truncate">
                  {product.name}
                </h4>

                <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                  <span>Pack: {product.packSize}</span>
                  <span className="text-emerald-800 font-bold flex items-center gap-1">
                    <Layers className="w-3 h-3 text-emerald-600" />
                    <strong>1 Box = {product.unitsPerBox} pcs</strong>
                  </span>
                </div>
              </div>

              {/* Price & Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="text-right">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">MRP</span>
                  <span className="text-sm font-black text-slate-900">
                    ₹{product.mrp.toFixed(2)}
                  </span>
                </div>

                {/* Edit Button */}
                <button
                  onClick={() => handleOpenEdit(product)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 transition-colors"
                  title="Change MRP or Box Packaging"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                {/* Delete Button */}
                <button
                  onClick={() => handleDelete(product)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-400 transition-colors"
                  title="Delete SKU"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Edit Product Modal (MRP & Box Packaging Quantity) */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="max-w-md w-full bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                  EDIT PRODUCT & PACKAGING
                </span>
                <h3 className="text-sm font-black text-slate-900 mt-1">
                  {editingProduct.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Product Name:
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* MRP EDIT */}
                <div>
                  <label className="block font-black text-slate-800 mb-1">
                    MRP Price (₹) *:
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={editMrp}
                    onChange={(e) => setEditMrp(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border-2 border-emerald-400 bg-emerald-50/40 text-emerald-950 font-black text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Salesman sees this price
                  </span>
                </div>

                {/* BOX PACKAGING QUANTITY EDIT */}
                <div>
                  <label className="block font-black text-slate-800 mb-1">
                    Total Qty per Box (Peti) *:
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editUnitsPerBox}
                    onChange={(e) => setEditUnitsPerBox(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border-2 border-blue-400 bg-blue-50/40 text-blue-950 font-black text-sm focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    e.g. 12, 24, 36, 48 pcs
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Pack Size (e.g. 100g, 250ml):
                </label>
                <input
                  type="text"
                  value={editPackSize}
                  onChange={(e) => setEditPackSize(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="max-w-md w-full bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  NEW PRODUCT
                </span>
                <h3 className="text-sm font-black text-slate-900 mt-1">
                  Add New SKU to Catalog
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">
                    Company / Brand *:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setIsAddCompanyModalOpen(true);
                    }}
                    className="text-[11px] font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ New Brand</span>
                  </button>
                </div>
                <select
                  value={newCompanyId}
                  onChange={(e) => setNewCompanyId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Product Name *:
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Britannia Good Day Butter"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Pack Size:
                  </label>
                  <input
                    type="text"
                    value={newPackSize}
                    onChange={(e) => setNewPackSize(e.target.value)}
                    placeholder="e.g. 100g, 200ml"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    WDMS Item Code:
                  </label>
                  <input
                    type="text"
                    value={newWdmsCode}
                    onChange={(e) => setNewWdmsCode(e.target.value)}
                    placeholder="e.g. BRIT-GD-100"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-slate-800 mb-1">
                    MRP Price (₹) *:
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={newMrp}
                    onChange={(e) => setNewMrp(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border-2 border-emerald-400 bg-emerald-50/40 text-emerald-950 font-black text-sm"
                  />
                </div>

                <div>
                  <label className="block font-black text-slate-800 mb-1">
                    Total Qty per Box (Peti) *:
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newUnitsPerBox}
                    onChange={(e) => setNewUnitsPerBox(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border-2 border-blue-400 bg-blue-50/40 text-blue-950 font-black text-sm"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Company / Brand Modal */}
      {isAddCompanyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="max-w-md w-full bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                  NEW COMPANY / BRAND
                </span>
                <h3 className="text-sm font-black text-slate-900 mt-1">
                  Add Brand Distribution Agency
                </h3>
              </div>
              <button
                onClick={() => setIsAddCompanyModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCompanySubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-black text-slate-800 mb-1">
                  Company / Brand Name *:
                </label>
                <input
                  type="text"
                  required
                  value={newCompanyName}
                  onChange={(e) => {
                    setNewCompanyName(e.target.value);
                    if (!newCompanyCode) {
                      setNewCompanyCode(e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase());
                    }
                  }}
                  placeholder="e.g. Britannia Industries, Balaji Wafers, Cadbury"
                  className="w-full px-3 py-2 rounded-xl border-2 border-purple-200 focus:border-purple-500 font-black text-sm text-slate-900 focus:ring-2 focus:ring-purple-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Short Code:
                  </label>
                  <input
                    type="text"
                    value={newCompanyCode}
                    onChange={(e) => setNewCompanyCode(e.target.value.toUpperCase())}
                    placeholder="e.g. BRIT, BAL"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold uppercase focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Used for item codes
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Category / Tagline:
                  </label>
                  <input
                    type="text"
                    value={newCompanyTagline}
                    onChange={(e) => setNewCompanyTagline(e.target.value)}
                    placeholder="e.g. Biscuits & Bakery"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Product category
                  </span>
                </div>
              </div>

              {/* Color Theme Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Brand Color Theme:
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {COMPANY_COLOR_PRESETS.map((preset, idx) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setNewCompanyColorIdx(idx)}
                      className={`p-1.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                        newCompanyColorIdx === idx
                          ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-300'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full ${preset.badgeColor} shadow-2xs`} />
                      <span className="text-[8px] font-bold text-slate-600 truncate max-w-full">
                        {preset.name.split(' ')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs shadow-md shadow-purple-700/20 flex items-center justify-center gap-1.5"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Save Company</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddCompanyModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Select Company To Remove Modal (when clicking Remove Comp while viewing All Brands) */}
      {isSelectCompanyToDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Remove Company / Brand
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Choose which company you want to leave & remove
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSelectCompanyToDeleteModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {companies.map((c) => {
                const prodCount = products.filter((p) => p.companyId === c.id).length;
                return (
                  <div
                    key={c.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 hover:border-slate-300 transition-all"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${c.badgeColor}`} />
                        <span className="text-xs font-black text-slate-900 truncate">
                          {c.name}
                        </span>
                        <span className="text-[9px] font-mono text-purple-700 bg-purple-50 px-1 py-0.2 rounded border border-purple-200">
                          {c.code}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        {prodCount} Products / SKUs
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setIsSelectCompanyToDeleteModalOpen(false);
                        handleInitiateDeleteCompany(c);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-black flex items-center gap-1 active:scale-95 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setIsSelectCompanyToDeleteModalOpen(false)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Company Confirmation Modal */}
      {companyToDelete && (() => {
        const prodCount = products.filter((p) => p.companyId === companyToDelete.id).length;
        const isMatched = deleteConfirmationInput.trim().toLowerCase() === companyToDelete.name.trim().toLowerCase();
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl border border-red-200 space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                    SAFETY CONFIRMATION
                  </span>
                  <h3 className="text-base font-black text-slate-900 mt-0.5">
                    Delete {companyToDelete.name}?
                  </h3>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-600">
                <p>
                  You are removing company <strong>{companyToDelete.name}</strong> from Rushabh Agency.
                </p>
                <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-red-950 font-bold space-y-1">
                  <p className="flex items-center gap-1.5 text-red-700">
                    <Trash2 className="w-4 h-4 flex-shrink-0" />
                    <span>All <strong>{prodCount} products/SKUs</strong> under this brand will also be permanently deleted.</span>
                  </p>
                  <p className="text-[11px] text-red-800 font-normal">
                    Salesmen will no longer see this brand on their phones, and all items will be cleared from Cloud Store and MySQL.
                  </p>
                </div>

                {/* Company Name Confirmation Input */}
                <div className="pt-1 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Please write <span className="font-mono text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200 font-black">{companyToDelete.name}</span> to confirm:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmationInput}
                    onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && isMatched) {
                        handleConfirmDeleteCompany();
                      }
                    }}
                    placeholder={`write ${companyToDelete.name}`}
                    autoFocus
                    className={`w-full px-3 py-2.5 rounded-xl border-2 font-bold text-slate-900 outline-none transition-all ${
                      isMatched
                        ? 'border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-100'
                        : 'border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                    }`}
                  />
                  {isMatched ? (
                    <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Company name matched. You can now delete.</span>
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400">
                      Type exact name &quot;<span className="font-bold text-slate-600">{companyToDelete.name}</span>&quot; in the box above.
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  disabled={!isMatched}
                  onClick={handleConfirmDeleteCompany}
                  className={`flex-1 py-2.5 rounded-xl font-black text-xs shadow-md flex items-center justify-center gap-1.5 transition-all ${
                    isMatched
                      ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-700/20 active:scale-95 cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isMatched ? `Permanently Delete ${companyToDelete.name}` : `Write ${companyToDelete.name} to delete`}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCompanyToDelete(null);
                    setDeleteConfirmationInput('');
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
                >
                  Cancel / Keep
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      <MobileBottomNav currentUser={currentUser} />
    </div>
  );
}
