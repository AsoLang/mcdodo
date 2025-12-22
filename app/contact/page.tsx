// Path: app/contact/page.tsx

'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useState } from 'react';
import { Loader2, CheckCircle, AlertCircle, Send, HelpCircle, Package, MessageSquare } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';

/* ---------- Reveal Animation Component ---------- */
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
  );
}

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState<string | null>(null);

  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Validation: Check basic lengths and if token exists
  const canSend =
    name.trim().length >= 2 &&
    email.trim().includes('@') &&
    message.trim().length >= 10 &&
    !!token;

  const jsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: 'Contact Mcdodo UK',
      url: 'https://mcdodo.co.uk/contact',
      description: 'Contact Mcdodo UK for order support, shipping questions and product help.',
    }),
    []
  );

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setDone(null);
    setError(null);

    // Combine inputs to check everything at once
    const allInputText = `${message} ${orderNumber} ${name}`.toLowerCase();

    // 1. Check for "Amazon" keyword
    if (allInputText.includes('amazon')) {
      setError('Please contact Amazon Support directly for Amazon orders.');
      return;
    }

    // 2. Check for Amazon Order ID Pattern (e.g. 123-1234567-1234567)
    // \d{3} = 3 digits, \d{7} = 7 digits
    const amazonOrderRegex = /\d{3}-\d{7}-\d{7}/;
    if (amazonOrderRegex.test(allInputText)) {
      setError('This looks like an Amazon order number. Please contact Amazon directly.');
      return;
    }

    // 4. Check standard validation
    if (!canSend) {
      setError('Please complete the captcha and fill in all fields.');
      return;
    }

    try {
      setSending(true);
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          orderNumber: orderNumber.trim() || null,
          message: message.trim(),
          token: token,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || 'Something went wrong. Please try again.');
        return;
      }

      setDone('Message sent successfully! We’ll be in touch shortly.');
      setName('');
      setEmail('');
      setOrderNumber('');
      setMessage('');
    } catch {
      setError('Network error. Please try again later.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pt-24 pb-20 px-4 font-sans text-black">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-6xl mx-auto">
        {/* MAIN LAYOUT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* LEFT COLUMN: Header + Info (Aligned top) */}
          <div className="lg:col-span-5 space-y-12">
            
            {/* Header Section */}
            <section className="text-left">
              <Reveal>
                <h1 className="text-4xl md:text-6xl font-black text-black tracking-tight leading-none">
                  Get in <span className="text-orange-600">Touch</span>
                </h1>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mt-6 text-lg text-black font-medium leading-relaxed">
                  Have a question about our fast chargers or cables? Need help with an order? 
                  Drop us a message and the Mcdodo UK team will help you out.
                </p>
              </Reveal>
            </section>

            {/* Support Info Blocks */}
            <Reveal delay={0.2}>
              <div className="space-y-8">
                <div className="flex gap-4 group">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-orange-50 group-hover:bg-orange-100 transition-colors flex items-center justify-center text-orange-600">
                    <Package size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-black">Order Support</h3>
                    <p className="mt-1 text-gray-600">
                      Include your order number (e.g., #12345) to help us find your details faster.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 group">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-orange-50 group-hover:bg-orange-100 transition-colors flex items-center justify-center text-orange-600">
                    <HelpCircle size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-black">Product Help</h3>
                    <p className="mt-1 text-gray-600">
                      Unsure which charger fits your device? Ask us about compatibility and specs.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 group">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-orange-50 group-hover:bg-orange-100 transition-colors flex items-center justify-center text-orange-600">
                    <MessageSquare size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-black">Response Time</h3>
                    <p className="mt-1 text-gray-600">
                      We typically reply within 24 hours (Mon-Fri). Check your spam folder if you don't see us!
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          {/* RIGHT COLUMN: The Form Card */}
          <div className="lg:col-span-7">
            <Reveal delay={0.3}>
              <div className="rounded-3xl bg-white p-8 shadow-2xl shadow-gray-200 border border-gray-100">
                
                {/* Success/Error Messages */}
                <AnimatePresence mode='wait'>
                  {done && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-6 rounded-xl bg-green-50 border border-green-200 p-4 flex items-start gap-3 text-green-900"
                    >
                      <CheckCircle className="flex-shrink-0 w-5 h-5 mt-0.5 text-green-600" />
                      <p className="text-sm font-bold">{done}</p>
                    </motion.div>
                  )}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-3 text-red-900"
                    >
                      <AlertCircle className="flex-shrink-0 w-5 h-5 mt-0.5 text-red-600" />
                      <p className="text-sm font-bold">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={onSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name Input */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-black ml-1">Name</label>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="name"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-black placeholder-gray-500 outline-none transition-all focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                        placeholder="Your name"
                      />
                    </div>

                    {/* Email Input */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-black ml-1">Email</label>
                      <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-black placeholder-gray-500 outline-none transition-all focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  {/* Order Number */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-black ml-1">
                      Order number <span className="text-gray-500 font-medium text-xs ml-1">(Optional)</span>
                    </label>
                    <input
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-black placeholder-gray-500 outline-none transition-all focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                      placeholder="e.g. #303288"
                    />
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-black ml-1">Message</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full min-h-[160px] rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-black placeholder-gray-500 outline-none transition-all focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 resize-y"
                      placeholder="How can we help you today?"
                    />
                    <div className="flex items-center gap-2 text-xs text-gray-500 ml-1">
                      <AlertCircle size={12} className="text-orange-500" />
                      Please do not include sensitive card details.
                    </div>
                  </div>

                  {/* Turnstile Widget */}
                  <div className="w-full">
                    <Turnstile
                      siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                      onSuccess={setToken}
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={sending}
                    className="group relative w-full overflow-hidden rounded-xl bg-orange-600 px-6 py-4 font-bold text-white shadow-lg shadow-orange-200 transition-all hover:bg-orange-700 hover:shadow-orange-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    <div className="flex items-center justify-center gap-2">
                      {sending ? (
                        <>
                          <Loader2 className="animate-spin" size={20} />
                          <span>Sending Message...</span>
                        </>
                      ) : (
                        <>
                          <span>Send Message</span>
                          <Send size={18} className="transition-transform group-hover:translate-x-1" />
                        </>
                      )}
                    </div>
                  </button>
                </form>
              </div>
            </Reveal>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="mt-20 border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <span>© {new Date().getFullYear()} Mcdodo UK</span>
          <div className="flex gap-6 font-medium text-gray-600">
            <Link href="/" className="hover:text-orange-600 transition-colors">Home</Link>
            <Link href="/shop" className="hover:text-orange-600 transition-colors">Shop</Link>
            <Link href="/contact" className="hover:text-orange-600 transition-colors">Contact</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}