// Path: app/layout.tsx

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CartProvider } from "@/contexts/CartContext";
import CartSidebar from "@/components/CartSidebar";
import VisitorTracker from "@/components/VisitorTracker";
import { SpeedInsights } from "@vercel/speed-insights/next";

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
          <CartSidebar />
          {children}
          <Footer />
        </CartProvider>
        {process.env.NODE_ENV === "production" ? <SpeedInsights /> : null}

        {/* Plerdy Tracking Code */}
        <Script
          id="plerdy-tracking"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              var _protocol="https:"==document.location.protocol?"https://":"http://";
              _site_hash_code = "71b39c6b715efae20efa227fdf16f5dd",_suid=71790, plerdyScript=document.createElement("script");
              plerdyScript.setAttribute("defer",""),plerdyScript.dataset.plerdymainscript="plerdymainscript",
              plerdyScript.src="https://a.plerdy.com/public/js/click/main.js?v="+Math.random();
              var plerdymainscript=document.querySelector("[data-plerdymainscript='plerdymainscript']");
              plerdymainscript&&plerdymainscript.parentNode.removeChild(plerdymainscript);
              try{document.head.appendChild(plerdyScript)}catch(t){console.log(t,"unable add script tag")}
            `,
          }}
        />
      </body>
    </html>
  );
}
