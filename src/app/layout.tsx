import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rushabh Agency - Field Salesman Order Booking & Distribution Portal",
  description: "Official Field SFA & Order Booking platform for Rushabh Agency salesmen and retail dukans",
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
  maximumScale: 5,
  userScalable: true,
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
      <body className="antialiased min-h-screen bg-[#F8FAFC] text-slate-800">
        {/* Responsive Root Viewport: Native app feel on mobile; Full-width responsive web portal on desktop & laptop */}
        <div className="w-full min-h-screen bg-[#F8FAFC] flex flex-col relative overflow-x-hidden">
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
