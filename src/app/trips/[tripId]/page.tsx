'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Trip, Dukan, User } from '@/types';
import {
  getCurrentUser,
  getStoredTrips,
  getDukansByTrip,
  addDukan,
  deleteDukan,
} from '@/lib/storage';
import { MobileHeader } from '@/components/MobileHeader';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import {
  Store,
  Phone,
  MapPin,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShoppingBag,
  Search,
  UserPlus,
  Trash2,
  X,
  AlertTriangle,
  PhoneCall,
  Plus,
} from 'lucide-react';

export default function TripDukansPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.tripId as string;

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [dukans, setDukans] = useState<Dukan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Add Dukan Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newShopName, setNewShopName] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newGst, setNewGst] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  // Delete Dukan State
  const [dukanToDelete, setDukanToDelete] = useState<Dukan | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const refreshDukans = (tId: string) => {
    setDukans(getDukansByTrip(tId));
    const allTrips = getStoredTrips();
    const foundTrip = allTrips.find((t) => t.id === tId);
    if (foundTrip) setTrip(foundTrip);
  };

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setCurrentUser(user);

    const allTrips = getStoredTrips();
    const foundTrip = allTrips.find((t) => t.id === tripId) || allTrips[0];
    setTrip(foundTrip);

    if (foundTrip) {
      setDukans(getDukansByTrip(foundTrip.id));
    }
  }, [tripId, router]);

  if (!currentUser || !trip) return null;

  const filteredDukans = dukans.filter(
    (d) =>
      d.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.phone.includes(searchQuery)
  );

  const bookedCount = dukans.filter((d) => d.visitStatus === 'ORDER_BOOKED').length;

  const handleCreateDukan = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    if (!newShopName.trim()) {
      setAddError('Please enter Shop / Retailer Name');
      return;
    }
    if (!newOwnerName.trim()) {
      setAddError('Please enter Owner / Contact Person Name');
      return;
    }
    if (!newPhone.trim() || newPhone.trim().length < 10) {
      setAddError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!newAddress.trim()) {
      setAddError('Please enter shop address or landmark');
      return;
    }

    const created = addDukan({
      shopName: newShopName.trim(),
      ownerName: newOwnerName.trim(),
      phone: newPhone.trim(),
      tripId: trip.id,
      address: newAddress.trim(),
      gstNumber: newGst.trim() || undefined,
    });

    // Reset Form
    setNewShopName('');
    setNewOwnerName('');
    setNewPhone('');
    setNewAddress('');
    setNewGst('');
    setShowAddModal(false);
    refreshDukans(trip.id);

    setNotification(`New Retailer "${created.shopName}" added to ${trip.name}!`);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleConfirmDelete = () => {
    if (!dukanToDelete) return;
    deleteDukan(dukanToDelete.id);
    setNotification(`Retailer "${dukanToDelete.shopName}" removed successfully.`);
    setDukanToDelete(null);
    refreshDukans(trip.id);
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="flex-1 flex flex-col pb-20 bg-[#F8FAFC]">
      <MobileHeader
        title={trip.name}
        subtitle={`${trip.beatCode} • ${dukans.length} Retailers`}
        showBack={true}
        backHref="/trips"
        currentUser={currentUser}
      />

      <main className="p-4 space-y-4">
        {/* Notification Toast */}
        {notification && (
          <div className="p-3 bg-emerald-700 text-white text-xs font-bold rounded-2xl shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-200 flex-shrink-0" />
              {notification}
            </span>
            <button
              onClick={() => setNotification(null)}
              className="text-white/80 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Trip Overview Card */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Active Trip Beat
              </span>
              <h2 className="text-base font-black text-slate-900 mt-1 leading-tight">
                {trip.name}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{trip.area}</span>
              </p>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200 text-center min-w-[75px]">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">
                Progress
              </span>
              <span className="text-sm font-black text-emerald-700">
                {bookedCount} / {dukans.length}
              </span>
            </div>
          </div>

          {/* Salesman Action: Make New Call (Add Dukan) */}
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Make New Call (Add New Retailer to Beat)</span>
          </button>
        </div>

        {/* Search Dukan */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Dukan Name, Owner, or Phone..."
            className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          />
        </div>

        {/* Retailer / Dukan Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black text-slate-600 uppercase tracking-wider">
              Retailers on this Trip ({filteredDukans.length})
            </span>
            <span className="text-[11px] text-slate-500">
              Select dukan to take order
            </span>
          </div>

          {filteredDukans.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 text-slate-500">
              <Store className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="text-xs font-bold">No retailers found.</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-3 text-xs font-black text-emerald-700 underline"
              >
                + Add a Retailer to this Beat
              </button>
            </div>
          ) : (
            filteredDukans.map((dukan, idx) => {
              const isBooked = dukan.visitStatus === 'ORDER_BOOKED';

              return (
                <div
                  key={dukan.id}
                  className={`bg-white rounded-3xl p-4 border transition-all shadow-sm flex flex-col justify-between gap-3 ${
                    isBooked ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-xs font-black text-slate-700 flex-shrink-0 mt-0.5">
                          #{idx + 1}
                        </div>

                        <div>
                          <h3 className="font-black text-slate-900 text-sm leading-snug">
                            {dukan.shopName}
                          </h3>
                          <p className="text-xs text-slate-600 mt-0.5">
                            Proprietor: <strong>{dukan.ownerName}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {isBooked ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Booked
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        )}

                        {/* Delete retailer button */}
                        <button
                          onClick={() => setDukanToDelete(dukan)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete retailer from beat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-slate-500 space-y-1 pl-10">
                      {/* Direct Click-to-Call Link for Salesman */}
                      <div className="flex items-center justify-between">
                        <a
                          href={`tel:${dukan.phone}`}
                          className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200/80 transition-colors"
                        >
                          <PhoneCall className="w-3 h-3" />
                          <span>Call: {dukan.phone}</span>
                        </a>

                        {dukan.gstNumber && (
                          <span className="text-[10px] font-mono text-slate-400">
                            GST: {dukan.gstNumber}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500">
                        {dukan.address}
                      </p>
                    </div>
                  </div>

                  {/* Action button to order */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-400">
                      {isBooked ? 'Order already placed' : 'Ready for order'}
                    </span>

                    <Link
                      href={`/order/${dukan.id}?tripId=${trip.id}`}
                      className={`py-2 px-4 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs ${
                        isBooked
                          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/90'
                          : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-md shadow-emerald-700/20 active:scale-[0.98]'
                      }`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{isBooked ? 'Add More Items' : 'Take Order'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* MODAL: MAKE NEW CALL (ADD DUKAN) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center sm:items-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {trip.name}
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  Make New Call (Add Retailer)
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleCreateDukan} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">
                  Dukan / Shop Name *
                </label>
                <input
                  type="text"
                  value={newShopName}
                  onChange={(e) => setNewShopName(e.target.value)}
                  placeholder="e.g. Mahadev Provision & General Store"
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">
                  Proprietor / Owner Name *
                </label>
                <input
                  type="text"
                  value={newOwnerName}
                  onChange={(e) => setNewOwnerName(e.target.value)}
                  placeholder="e.g. Rameshbhai Patel"
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">
                  Mobile Number (Calling & WhatsApp) *
                </label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="e.g. 9825098765"
                  maxLength={10}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">
                  Address / Landmark in {trip.area} *
                </label>
                <textarea
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="e.g. Near Bus Stand, Main Market Road"
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">
                  GST Number (Optional)
                </label>
                <input
                  type="text"
                  value={newGst}
                  onChange={(e) => setNewGst(e.target.value.toUpperCase())}
                  placeholder="e.g. 24AAAAA0000A1Z5"
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black shadow-md shadow-emerald-700/20 active:scale-[0.98]"
                >
                  Save & Add to Beat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {dukanToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 space-y-3 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-black text-slate-900">
                Remove Retailer?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove <strong>{dukanToDelete.shopName}</strong> from <strong>{trip.name}</strong>?
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Proprietor: {dukanToDelete.ownerName} • {dukanToDelete.phone}
              </p>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDukanToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-md shadow-red-600/20 active:scale-[0.98]"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}

      <MobileBottomNav currentUser={currentUser} />
    </div>
  );
}
