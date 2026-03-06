// Path: app/layout.tsx

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import PromoBanner from "@/components/PromoBanner";
import Footer from "@/components/Footer";
import { CartProvider } from "@/contexts/CartContext";
import CartSidebar from "@/components/CartSidebar";
import VisitorTracker from "@/components/VisitorTracker";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mcdodo UK - Premium Charging Accessories",
  description: "Fast charging cables, chargers, and accessories with patented auto power-off technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CartProvider>
          <VisitorTracker />
          <Navbar />
          <PromoBanner />
          <CartSidebar />
          {children}
          <Footer />
        </CartProvider>
        {process.env.NODE_ENV === "production" ? <SpeedInsights /> : null}
        {process.env.NODE_ENV === "production" ? <Analytics /> : null}

      </body>
    </html>
  );
}
