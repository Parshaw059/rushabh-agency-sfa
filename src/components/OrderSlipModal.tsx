'use client';

import React from 'react';
import { Order } from '@/types';
import { generateOrderPdf, viewOrderPdf, generateWhatsAppShareLink } from '@/utils/generatePdfReceipt';
import { X, Eye, Download, Share2, Printer, CheckCircle2, Store, Calendar, User, Phone, MapPin } from 'lucide-react';

interface OrderSlipModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderSlipModal: React.FC<OrderSlipModalProps> = ({ order, isOpen, onClose }) => {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Top Bar */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 p-3.5 text-white flex items-center justify-between shadow-xs flex-shrink-0">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-emerald-200" />
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-100">
                Order Slip Preview (No Download Needed)
              </h3>
              <p className="text-sm font-black text-white leading-tight">
                {order.orderNumber} • {order.dukanName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Printable Invoice Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4 text-slate-800 bg-[#F8FAFC]">
          {/* Authentic Document Header */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center relative overflow-hidden">
            <div className="w-12 h-12 mx-auto mb-2 rounded-2xl overflow-hidden border border-emerald-500/30 p-1 bg-white shadow-xs">
              <img src="/logo.jpg" alt="Rushabh Agency" className="w-full h-full object-cover rounded-xl" />
            </div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">RUSHABH AGENCY</h2>
            <p className="text-[11px] font-bold text-emerald-700">Authorised FMCG Distributor & Stockist</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Beat Salesman Order Indent Slip • WDMS Ready</p>

            <div className="mt-2 inline-block bg-emerald-50 text-emerald-800 px-3 py-0.5 rounded-full border border-emerald-200/80 text-xs font-black">
              ORDER SLIP: {order.orderNumber}
            </div>
          </div>

          {/* Dukan & Order Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            {/* Retailer details */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-black uppercase text-emerald-700 block border-b border-slate-100 pb-1 flex items-center gap-1">
                <Store className="w-3 h-3" /> Retailer / Dukan Details
              </span>
              <p className="font-black text-slate-900 text-xs leading-snug">{order.dukanName}</p>
              <p className="text-slate-600 text-[11px]">Proprietor: <strong>{order.ownerName}</strong></p>
              <p className="text-slate-600 text-[11px] flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" /> {order.phone}
              </p>
              <p className="text-slate-500 text-[10px] flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" /> {order.tripName}
              </p>
            </div>

            {/* Booking Details */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-black uppercase text-emerald-700 block border-b border-slate-100 pb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Order Details
              </span>
              <p className="text-slate-600 text-[11px]">Slip No: <strong className="text-slate-900">{order.orderNumber}</strong></p>
              <p className="text-slate-600 text-[11px] flex items-center gap-1">
                <User className="w-3 h-3 text-slate-400" /> Salesman: <strong className="text-slate-800">{order.salesmanName}</strong>
              </p>
              <p className="text-slate-500 text-[10px]">
                Date: {new Date(order.createdAt).toLocaleDateString('en-IN')} {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <span className="inline-block bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded-full">
                ✓ BOOKED IN FIELD
              </span>
            </div>
          </div>

          {/* Indented Items Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-black text-slate-700">
              <span>Items Indented ({order.items.length} SKUs)</span>
              <span className="text-emerald-700 font-bold">{order.totalUnits} Total Pcs</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-emerald-700 text-white text-[10px] uppercase font-black tracking-wider">
                    <th className="p-2 text-center w-6">#</th>
                    <th className="p-2">Brand & Product</th>
                    <th className="p-2 text-center">Pack</th>
                    <th className="p-2 text-center">Box</th>
                    <th className="p-2 text-center">Loose</th>
                    <th className="p-2 text-center">Total</th>
                    <th className="p-2 text-right">MRP</th>
                    <th className="p-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {order.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="p-2 text-center text-slate-400 font-bold">{idx + 1}</td>
                      <td className="p-2">
                        <span className="text-[9px] font-bold text-slate-400 block uppercase">{item.companyName}</span>
                        <span className="font-black text-slate-900 leading-tight">{item.productName}</span>
                        <span className="text-[10px] text-slate-500 font-medium ml-1">({item.packSize})</span>
                      </td>
                      <td className="p-2 text-center font-mono text-slate-500">{item.unitsPerBox}</td>
                      <td className="p-2 text-center font-black text-emerald-800">
                        {item.boxQty > 0 ? `${item.boxQty} Box` : '-'}
                      </td>
                      <td className="p-2 text-center font-bold text-slate-600">
                        {item.looseQty > 0 ? `${item.looseQty} Pcs` : '-'}
                      </td>
                      <td className="p-2 text-center font-black text-slate-900">
                        {item.totalUnits}
                      </td>
                      <td className="p-2 text-right font-mono text-slate-500">
                        Rs. {item.mrp.toFixed(2)}
                      </td>
                      <td className="p-2 text-right font-mono font-black text-slate-900">
                        Rs. {item.lineMrpTotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-emerald-50/80 font-black text-xs text-emerald-950 border-t-2 border-emerald-300">
                    <td colSpan={3} className="p-2.5 text-left font-black uppercase text-[10px] tracking-wider">
                      TOTAL SUMMARY
                    </td>
                    <td className="p-2 text-center text-emerald-800">{order.totalBoxes} Box</td>
                    <td className="p-2 text-center text-emerald-800">{order.totalLoose} Pcs</td>
                    <td className="p-2 text-center text-emerald-900 font-extrabold">{order.totalUnits} Pcs</td>
                    <td className="p-2 text-right text-[10px] text-slate-500">MRP Total</td>
                    <td className="p-2 text-right text-emerald-800 font-extrabold text-sm">
                      Rs. {order.totalMrpValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Notes & Summary Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-500 block">Dispatch Notes</span>
              <p className="text-[11px] text-slate-700 italic">
                {order.notes ? `"${order.notes}"` : 'Standard field order indented by salesman.'}
              </p>
              <p className="text-[10px] text-slate-400 pt-1">
                Wholesale billing rates, schemes, and tax invoice will be generated in WDMS upon dispatch from Rushabh Agency godown.
              </p>
            </div>

            <div className="bg-emerald-50/90 p-3 rounded-2xl border border-emerald-200/90 shadow-xs space-y-1 text-right">
              <span className="text-[10px] font-black uppercase text-emerald-800 block text-left">Estimated MRP Value</span>
              <div className="text-xl font-black text-emerald-800">
                Rs. {order.totalMrpValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[10px] text-emerald-700 font-medium">
                {order.totalBoxes} Full Boxes • {order.totalLoose} Loose • {order.totalUnits} Total Pieces
              </p>
            </div>
          </div>

          {/* Dual Signatures Preview */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between text-center text-xs pt-6">
            <div className="flex-1 border-t border-slate-300 pt-1.5 mr-4">
              <span className="font-bold text-slate-500 text-[10px] uppercase block">Dukandar / Retailer Stamp</span>
            </div>
            <div className="flex-1 border-t border-slate-300 pt-1.5 ml-4">
              <span className="font-black text-slate-800 text-[11px] block">{order.salesmanName}</span>
              <span className="text-slate-400 text-[9px] block">Rushabh Agency Field Officer</span>
            </div>
          </div>
        </div>

        {/* Action Buttons Bar (View, Download, WhatsApp, Print) */}
        <div className="p-3 bg-white border-t border-slate-200 flex flex-wrap items-center gap-2 flex-shrink-0">
          <button
            onClick={() => viewOrderPdf(order)}
            className="flex-1 min-w-[120px] py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
            title="Open raw PDF document in new browser tab without downloading"
          >
            <Eye className="w-4 h-4 text-emerald-400" />
            <span>View Full PDF</span>
          </button>

          <button
            onClick={() => generateOrderPdf(order)}
            className="flex-1 min-w-[120px] py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
            title="Save PDF file to phone downloads"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={() => window.open(generateWhatsAppShareLink(order), '_blank')}
            className="py-2.5 px-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
            title="Share text order slip to Rushabh Agency on WhatsApp"
          >
            <Share2 className="w-4 h-4" />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
