'use client';

import React, { useState, useRef } from 'react';
import { X, Upload, CheckCircle2, RotateCcw, ImageIcon, Sparkles } from 'lucide-react';
import { updateAgencyLogo } from '@/lib/storage';

interface ChangeLogoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLogo: string;
  onLogoUpdated: (newLogo: string) => void;
}

export function ChangeLogoModal({
  isOpen,
  onClose,
  currentLogo,
  onLogoUpdated,
}: ChangeLogoModalProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const img = new Image();
      img.onload = () => {
        // Compress image to max 256x256 using HTML5 Canvas for instantaneous loading and light cloud payload
        const canvas = document.createElement('canvas');
        const maxDim = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setPreview(compressedDataUrl);
        } else {
          setPreview(loadEvent.target?.result as string);
        }
      };
      img.src = loadEvent.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!preview) return;
    setIsSaving(true);
    setError(null);

    try {
      const ok = await updateAgencyLogo(preview);
      onLogoUpdated(preview);
      setSuccessMsg('Logo updated everywhere at once! All devices, bills, and headers are refreshed.');
      setTimeout(() => {
        setIsSaving(false);
        setSuccessMsg(null);
        setPreview(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Failed to update logo. Please check internet connection.');
      setIsSaving(false);
    }
  };

  const handleResetDefault = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await updateAgencyLogo('/logo.jpg');
      onLogoUpdated('/logo.jpg');
      setSuccessMsg('Reset to default Rushabh Agency logo.');
      setTimeout(() => {
        setIsSaving(false);
        setSuccessMsg(null);
        setPreview(null);
        onClose();
      }, 1000);
    } catch (err: any) {
      setError('Failed to reset logo.');
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-teal-50 to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-700/20">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Change Agency Logo</h3>
              <p className="text-[11px] text-slate-500 font-medium">Updates everywhere at once across all devices & bills</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Current vs New Preview */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 text-center flex flex-col items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Current Logo
              </span>
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-slate-200 bg-white p-1 shadow-xs flex items-center justify-center">
                <img
                  src={currentLogo || '/logo.jpg'}
                  alt="Current Logo"
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-2 font-medium">Active on all screens</span>
            </div>

            <div className="bg-emerald-50/50 rounded-2xl p-3 border border-emerald-200/80 text-center flex flex-col items-center">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-2">
                New Logo Preview
              </span>
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-emerald-400 bg-white p-1 shadow-sm flex items-center justify-center">
                {preview ? (
                  <img
                    src={preview}
                    alt="New Preview"
                    className="w-full h-full object-cover rounded-xl animate-in zoom-in-95"
                  />
                ) : (
                  <span className="text-[11px] text-slate-400 font-bold px-2 text-center">
                    Select an image below
                  </span>
                )}
              </div>
              <span className="text-[10px] text-emerald-700 mt-2 font-bold">
                {preview ? 'Ready to sync' : 'Pending upload'}
              </span>
            </div>
          </div>

          {/* Upload Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSaving}
            className="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-emerald-400/80 hover:border-emerald-600 bg-emerald-50/40 hover:bg-emerald-50 text-emerald-800 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>{preview ? 'Choose a Different Image' : 'Choose Logo from Phone / Laptop'}</span>
          </button>

          <p className="text-[10px] text-slate-400 text-center font-medium">
            Supported formats: PNG, JPG, WebP. Automatically optimized for crisp bills & instant cloud sync.
          </p>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleResetDefault}
            disabled={isSaving}
            className="px-3 py-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 text-xs font-bold transition-colors flex items-center gap-1.5"
            title="Reset to default Rushabh Agency logo"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-800 text-xs font-bold transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={!preview || isSaving}
              className={`px-4 py-2 rounded-xl text-xs font-black text-white flex items-center gap-1.5 shadow-md transition-all ${
                !preview || isSaving
                  ? 'bg-slate-300 cursor-not-allowed shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-700/20 active:scale-95'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>{isSaving ? 'Updating Everywhere...' : 'Save & Update Everywhere'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
