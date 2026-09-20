'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Product, User } from '@/types';
import { INITIAL_COMPANIES } from '@/data/mockData';
import {
  getCurrentUser,
  getStoredProducts,
  addProduct,
  updateProduct,
  deleteProduct,
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
} from 'lucide-react';

export default function OwnerProductsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

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

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setCurrentUser(user);
    setProducts(getStoredProducts());
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

    const parsedMrp = parseFloat(editMrp) || editingProduct.mrp;
    const parsedUnitsPerBox = parseInt(editUnitsPerBox) || editingProduct.unitsPerBox;

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

  // Add Product Submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const comp = INITIAL_COMPANIES.find((c) => c.id === newCompanyId) || INITIAL_COMPANIES[0];
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
    setNotification(`Added new product "${created.name}" successfully!`);
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
        {/* Owner Action Banner */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-50 border border-purple-200/80 px-2 py-0.5 rounded-full block tracking-wider w-fit">
              OWNER / ADMIN CONTROLS
            </span>
            <h2 className="text-sm font-black text-slate-900 mt-1">
              Change Prices & Box Packaging
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Add products, update MRP, or edit units per box for any brand.
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="p-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs flex items-center gap-1 shadow-md shadow-emerald-700/20 flex-shrink-0 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Add SKU</span>
          </button>
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

          {/* Company filter chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
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
            {INITIAL_COMPANIES.map((c) => (
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
          </div>
        </div>

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
                <label className="block font-bold text-slate-700 mb-1">
                  Company / Brand:
                </label>
                <select
                  value={newCompanyId}
                  onChange={(e) => setNewCompanyId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {INITIAL_COMPANIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
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
                  placeholder="e.g. Dabur Red Gel Toothpaste"
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
                    placeholder="e.g. 150g"
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
                    placeholder="e.g. DAB-RED-150G"
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

      <MobileBottomNav currentUser={currentUser} />
    </div>
  );
}
