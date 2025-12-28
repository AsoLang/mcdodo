// app/privacy/page.tsx
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  Database,
  Cookie,
  CreditCard,
  Link as LinkIcon,
  Mail,
  AlertCircle,
} from "lucide-react";

export const metadata = {
  title: "Privacy Policy | Mcdodo UK",
  description: "Privacy policy for shopping at Mcdodo UK",
};

export default function PrivacyPage() {
  const highlights = [
    {
      icon: Shield,
      title: "GDPR & Privacy",
      content:
        "Mcdodo UK follows the UK GDPR / EU GDPR principles. Please read this policy carefully so you understand how we handle your data.",
      accent: "orange",
    },
    {
      icon: Database,
      title: "What We Use Data For",
      content:
        "We use customer data to take and dispatch orders, administer and improve the site, and share delivery details with couriers (e.g. Royal Mail) for delivery purposes only.",
      accent: "black",
    },
    {
      icon: Cookie,
      title: "Cookies & Analytics",
      content:
        "We (and service providers such as analytics/advertising tools) may use cookies and similar technologies to improve your experience and measure marketing performance.",
      accent: "orange",
    },
    {
      icon: LinkIcon,
      title: "Third-Party Links",
      content:
        "Our site may link to third-party websites we don’t operate. Their privacy practices are governed by their own policies.",
      accent: "black",
    },
  ];

  const sections = [
    {
      title: "Information We Collect",
      paragraphs: [
        "When you use our site, we may collect personal data such as: email address, name, phone number, and your delivery address (including town/county and postcode).",
      ],
    },
    {
      title: "Information Collected Automatically",
      paragraphs: [
        "When you visit our site, we may collect log & device data such as: referrer URL, device model, operating system, browser type, unique device identifiers, IP address, network carrier, and approximate time zone/location.",
        "Advertising/analytics providers may also share aggregated performance data (e.g., who clicked an ad). If we associate it with you, we treat it as personal data.",
      ],
    },
    {
      title: "Sharing Your Information",
      paragraphs: [
        "We do not sell, trade, or rent your personal information.",
        "We only share information with third parties when necessary to fulfil your order (e.g., sharing shipping details with delivery partners). Those parties must not use the information for unrelated purposes.",
      ],
    },
    {
      title: "Payment Security",
      paragraphs: [
        "Payments are processed securely by our payment providers. We do not store full payment card details on our servers.",
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-20 md:pt-24">
      {/* Hero */}
      <div className="relative bg-gradient-to-r from-orange-500 to-orange-600 overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.05%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }}
        />
        <div className="relative max-w-7xl mx-auto px-6 py-14 md:py-20">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/90 hover:text-white font-bold transition mb-8 group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span>Back to Shop</span>
          </Link>

          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-xl text-white/90 font-medium">
              How we collect, use, and protect your information
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-16 md:py-20">
        {/* Highlight cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {highlights.map((item, idx) => {
            const Icon = item.icon;
            const isOrange = item.accent === "orange";
            return (
              <div
                key={idx}
                className={`group relative bg-white rounded-2xl border-2 ${
                  isOrange ? "border-orange-200 hover:border-orange-400" : "border-gray-200 hover:border-black"
                } p-8 transition-all duration-300 hover:shadow-xl`}
              >
                <div
                  className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${
                    isOrange ? "bg-orange-100 text-orange-600" : "bg-black text-white"
                  } mb-6 transition-transform group-hover:scale-110`}
                >
                  <Icon size={28} strokeWidth={2.5} />
                </div>

                <h2 className="text-2xl font-black text-black mb-4">{item.title}</h2>
                <p className="text-gray-700 leading-relaxed">{item.content}</p>
              </div>
            );
          })}
        </div>

        {/* Long sections */}
        <div className="space-y-12">
          {sections.map((section, idx) => (
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

          {/* Contact */}
          <div className="relative bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 md:p-10 overflow-hidden">
            <div className="absolute inset-0 bg-black/5" />
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'url("data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.05%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
              }}
            />
            <div className="relative">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm text-white mb-6">
                <Mail size={28} strokeWidth={2.5} />
              </div>

              <h2 className="text-3xl font-black text-white mb-4">Contacting Us</h2>
              <p className="text-lg text-white/95 leading-relaxed mb-6">
                Queries, comments, or requests about this policy? Contact support.
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

        {/* Footer note */}
        <div className="mt-16 p-6 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-1">
              <AlertCircle size={24} className="text-gray-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 leading-relaxed">
                <strong className="text-gray-900 font-bold">Last Updated:</strong> December 2025.
                We may update this policy from time to time. Continued use of the website means you
                accept the updated policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
