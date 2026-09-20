import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rushabh Agency - Field Salesman Order Booking",
  description: "Phone-first field order collection app for Rushabh Agency salesmen and retail dukans",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Rushabh Agency",
  },
  icons: {
    icon: "/logo.jpg",
    apple: "/logo.jpg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#047857",
};

import { NetworkStatusBanner } from "@/components/NetworkStatusBanner";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <link rel="apple-touch-icon" href="/logo.jpg" />
      </head>
      <body className="antialiased min-h-screen flex justify-center bg-gradient-to-br from-slate-200 via-stone-100 to-emerald-100/40 text-slate-800">
        {/* Mobile Device Viewport Container - feels like a premium phone app on both desktop & mobile */}
        <div className="w-full max-w-md min-h-screen bg-[#F8FAFC] shadow-[0_20px_60px_-15px_rgba(15,23,42,0.15)] flex flex-col relative overflow-x-hidden border-x border-slate-200/90">
          <NetworkStatusBanner />
          {children}
        </div>

        {/* Service worker registration for PWA and zero latency */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
