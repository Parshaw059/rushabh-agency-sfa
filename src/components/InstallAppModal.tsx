'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone, QrCode, Copy, Check, X, Share2, PlusSquare, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import QRCode from 'qrcode';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'iphone' | 'android' | 'field'>('iphone');

  const [appUrl, setAppUrl] = useState('https://rushabh-agency-app.vercel.app');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('/app-qr.svg');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      if (origin && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        setAppUrl(origin);
      } else {
        setAppUrl('https://rushabh-agency-app.vercel.app');
      }
    }
  }, []);

  useEffect(() => {
    QRCode.toDataURL(appUrl, { margin: 1, width: 280 })
      .then((url) => setQrCodeDataUrl(url))
      .catch(() => setQrCodeDataUrl('/app-qr.svg'));
  }, [appUrl]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        onClose();
      }
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[92vh] overflow-y-auto p-5 shadow-2xl border border-slate-200 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black flex-shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Install Mobile App (PWA)
              </span>
              <h3 className="text-base font-black text-slate-900 leading-tight mt-0.5">
                Install Rushabh Agency on Phone
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Benefits badge */}
        <div className="bg-emerald-50/80 rounded-2xl p-3 border border-emerald-200/80 flex items-center gap-2.5 text-xs">
          <Zap className="w-5 h-5 text-emerald-700 flex-shrink-0" />
          <div className="text-[11px] text-emerald-900 leading-snug">
            <strong className="block font-black">100% Free • Zero Latency • Works Offline</strong>
            Installs directly to your phone. Operates full-screen like a native app even without Wi-Fi or mobile network!
          </div>
        </div>

        {/* QR Code Section */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-center space-y-2.5">
          <p className="text-xs font-black text-slate-700 flex items-center justify-center gap-1.5">
            <QrCode className="w-4 h-4 text-emerald-700" />
            <span>Scan with Phone Camera to Open App</span>
          </p>

          <div className="w-48 h-48 mx-auto bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center">
            <img
              src={qrCodeDataUrl}
              alt="Scan QR code to install Rushabh Agency App"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex items-center gap-1.5 justify-center">
            <code className="text-[11px] font-mono font-bold text-slate-700 bg-white px-2.5 py-1 rounded-xl border border-slate-200 truncate max-w-[210px]">
              {appUrl}
            </code>
            <button
              onClick={handleCopy}
              className="py-1 px-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Android Native Install Prompt if available */}
        {deferredPrompt && (
          <button
            onClick={handleNativeInstall}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-lg shadow-emerald-700/20 flex items-center justify-center gap-2"
          >
            <Smartphone className="w-4 h-4" />
            <span>1-Tap Install App on this Phone</span>
          </button>
        )}

        {/* Instructions Tabs */}
        <div>
          <div className="flex rounded-xl bg-slate-100 p-1 mb-3 text-xs font-bold">
            <button
              onClick={() => setActiveTab('iphone')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                activeTab === 'iphone'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🍎 iPhone
            </button>
            <button
              onClick={() => setActiveTab('android')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                activeTab === 'android'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🤖 Android
            </button>
            <button
              onClick={() => setActiveTab('field')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                activeTab === 'field'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🌐 No Wi-Fi / Field
            </button>
          </div>

          {activeTab === 'iphone' && (
            <ol className="space-y-2 text-xs text-slate-600 list-decimal pl-5">
              <li>
                Open the link <strong className="text-slate-900">{appUrl}</strong> in <strong>Safari</strong> on your iPhone.
              </li>
              <li className="flex items-start gap-1.5">
                <span>Tap the</span>
                <span className="inline-flex items-center gap-1 font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                  <Share2 className="w-3 h-3 text-emerald-700" /> Share
                </span>
                <span>button at the bottom bar.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span>Scroll down and tap</span>
                <span className="inline-flex items-center gap-1 font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                  <PlusSquare className="w-3 h-3 text-emerald-700" /> Add to Home Screen
                </span>
              </li>
              <li>
                Tap <strong>&quot;Add&quot;</strong> in top-right. The <strong>Rushabh Agency</strong> app icon appears on your home screen!
              </li>
            </ol>
          )}

          {activeTab === 'android' && (
            <ol className="space-y-2 text-xs text-slate-600 list-decimal pl-5">
              <li>
                Open <strong className="text-slate-900">{appUrl}</strong> in <strong>Google Chrome</strong> on Android.
              </li>
              <li>
                Tap the <strong>three dots (⋮)</strong> menu in the top right corner.
              </li>
              <li>
                Tap <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home Screen&quot;</strong>.
              </li>
              <li>
                Confirm <strong>&quot;Install&quot;</strong>. The <strong>Rushabh Agency</strong> app will launch full-screen!
              </li>
            </ol>
          )}

          {activeTab === 'field' && (
            <div className="space-y-2.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div className="space-y-1">
                <span className="font-black text-slate-900 block flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-emerald-700" />
                  1. Works 100% Offline (No Wi-Fi & No Signal)
                </span>
                <p className="text-[11px] text-slate-600 pl-5">
                  Once installed to the home screen, the app is stored inside your phone. Even in basement shops or remote villages with 0 signal, Hiren Shah can open the app, pick dukans, add new dukans, and book orders.
                </p>
              </div>

              <div className="space-y-1 pt-1.5 border-t border-slate-200">
                <span className="font-black text-slate-900 block flex items-center gap-1.5">
                  <Share2 className="w-4 h-4 text-emerald-700" />
                  2. 1-Tap WhatsApp Dispatch to Owner
                </span>
                <p className="text-[11px] text-slate-600 pl-5">
                  As soon as the phone catches cell signal, tap &quot;Share Order on WhatsApp&quot; to send the complete order slip directly to Rushabh Agency owner WhatsApp desk.
                </p>
              </div>

              <div className="space-y-1 pt-1.5 border-t border-slate-200">
                <span className="font-black text-slate-900 block flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-700" />
                  3. Universal 24/7 Global URL (Vercel)
                </span>
                <p className="text-[11px] text-slate-600 pl-5">
                  Live on Vercel worldwide: <code>https://rushabh-agency-app.vercel.app</code> accessible 24/7 on 4G/5G mobile internet!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
        >
          Got It, Done
        </button>
      </div>
    </div>
  );
};
