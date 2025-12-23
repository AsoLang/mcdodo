// app/terms/page.tsx
import Link from 'next/link';
import { ArrowLeft, Shield, Globe, CreditCard, Package, AlertCircle, Mail } from 'lucide-react';

export const metadata = {
  title: "Terms & Conditions | Mcdodo UK",
  description: "Terms and conditions for shopping at Mcdodo UK"
};

export default function TermsPage() {
  const sections = [
    {
      icon: Globe,
      title: "International Products",
      content: "International products have separate terms, are sold from abroad and may differ from local products, including fit, age ratings, and the language of product, labelling or instructions.",
      color: "orange"
    },
    {
      icon: Shield,
      title: "Products Sold by Other Suppliers",
      content: "Only products purchased from Mcdodo (UK) directly can benefit from our service. Mcdodo (UK) is not responsible for issues with Mcdodo products purchased from suppliers other than Mcdodo (UK).",
      color: "black"
    },
    {
      icon: Mail,
      title: "Contacting Mcdodo (UK)",
      content: "Our customer service is available for customers who have a question, suggestion, or queries regarding an order. We keep your data in accordance with our data holding policies. We may ask for your order ID before assisting you. Your order ID is included in your order confirmation email. Please contact us if you have not received your order confirmation email after your purchase.",
      color: "orange"
    },
    {
      icon: Package,
      title: "Duties & Taxes",
      content: "Orders shipped outside of the United Kingdom may be subject to import taxes, customs duties, fees, and/or VAT levied by the destination country. You are responsible for paying any taxes, duties, customs fees, and/or VAT charged by your government, as Mcdodo (UK) has no control over these charges and cannot predict what they may be. Please contact the local customs office in the relevant jurisdiction for additional information. International orders will not be refunded for failure to pay import duties, taxes, or fees.",
      color: "black"
    }
  ];

  const additionalSections = [
    {
      title: "Making a Purchase",
      paragraphs: [
        "Making a purchase could not be easier. Browse our store and add items to your basket. When finished, proceed to checkout and provide the details needed to complete your order.",
        "We accept card payments and supported wallet options (such as Apple Pay and Google Pay) on compatible devices and browsers.",
        "Order confirmation indicates we have received your order. If we need to correct pricing or availability issues, we will contact you before proceeding.",
        "When purchasing our products (including charging adapters and cables), we are not responsible for damage that may occur to your device if products are used outside their intended purpose. Additionally, we are not liable for any damage to your car or car battery resulting from improper use or misuse. Please follow all usage instructions carefully."
      ]
    },
    {
      title: "Errors, Inaccuracies and Omissions",
      paragraphs: [
        "Occasionally, information on our site may contain typographical errors, inaccuracies or omissions relating to product descriptions, pricing, promotions, shipping charges, transit times and availability. We reserve the right to correct errors, update information, or cancel orders if any information is inaccurate at any time without prior notice (including after you have submitted your order)."
      ]
    },
    {
      title: "Payment Security",
      paragraphs: [
        "Payments are processed securely by our payment providers. We do not store full payment card details on our servers."
      ]
    },
    {
      title: "Changes to Terms & Conditions",
      paragraphs: [
        "We reserve the right, at our sole discretion, to update, change or replace any part of these Terms & Conditions by posting updates on this page. It is your responsibility to check periodically for changes. Continued use of the website constitutes acceptance of any changes."
      ]
    },
    {
      title: "Shipping & Delivery",
      paragraphs: [
        "International deliveries will be dispatched using the buyer's selected shipping method where available.",
        "For UK orders, we offer free delivery on all orders.",
        "2-day delivery is only available for purchases made Monday to Thursday before 5pm (UK time). Purchases after 5pm may not be delivered within 2 days."
      ]
    }
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-orange-500 to-orange-600 overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }}></div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-16 md:py-24">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-white/90 hover:text-white font-bold transition mb-8 group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span>Back to Shop</span>
          </Link>
          
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">
              Terms & Conditions
            </h1>
            <p className="text-xl text-white/90 font-medium">
              Please read these terms carefully before using our service
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-16 md:py-20">
        {/* Featured Sections Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {sections.map((section, idx) => {
            const Icon = section.icon;
            return (
              <div 
                key={idx}
                className={`group relative bg-white rounded-2xl border-2 ${
                  section.color === 'orange' 
                    ? 'border-orange-200 hover:border-orange-400' 
                    : 'border-gray-200 hover:border-black'
                } p-8 transition-all duration-300 hover:shadow-xl`}
              >
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${
                  section.color === 'orange' 
                    ? 'bg-orange-100 text-orange-600' 
                    : 'bg-black text-white'
                } mb-6 transition-transform group-hover:scale-110`}>
                  <Icon size={28} strokeWidth={2.5} />
                </div>
                
                <h2 className="text-2xl font-black text-black mb-4">
                  {section.title}
                </h2>
                
                <p className="text-gray-700 leading-relaxed">
                  {section.content}
                </p>
              </div>
            );
          })}
        </div>

        {/* Additional Sections */}
        <div className="space-y-12">
          {additionalSections.map((section, idx) => (
            <div 
              key={idx}
              className="bg-white rounded-2xl border border-gray-200 p-8 md:p-10 hover:shadow-lg transition-shadow"
            >
              <h2 className="text-3xl font-black text-black mb-6 pb-4 border-b-2 border-orange-200">
                {section.title}
              </h2>
              
              <div className="space-y-4">
                {section.paragraphs.map((para, pIdx) => (
                  <p key={pIdx} className="text-lg text-gray-700 leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>
            </div>
          ))}

          {/* Contact Section - Special Styling */}
          <div className="relative bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 md:p-10 overflow-hidden">
            <div className="absolute inset-0 bg-black/5"></div>
            <div className="absolute inset-0" style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            }}></div>
            
            <div className="relative">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm text-white mb-6">
                <Mail size={28} strokeWidth={2.5} />
              </div>
              
              <h2 className="text-3xl font-black text-white mb-4">
                Contact Information
              </h2>
              
              <p className="text-lg text-white/95 leading-relaxed mb-6">
                Questions about these Terms should be sent to our support team. We're here to help!
              </p>
              
              <a
                href="mailto:support@mcdodo.co.uk"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-orange-600 font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-lg hover:shadow-xl"
              >
                <Mail size={20} />
                support@mcdodo.co.uk
              </a>
            </div>
          </div>
        </div>

        {/* Footer Notice */}
        <div className="mt-16 p-6 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-1">
              <AlertCircle size={24} className="text-gray-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 leading-relaxed">
                <strong className="text-gray-900 font-bold">Last Updated:</strong> December 2025. 
                By using our website and services, you agree to these terms and conditions. 
                We recommend reviewing this page periodically to stay informed of any updates.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}