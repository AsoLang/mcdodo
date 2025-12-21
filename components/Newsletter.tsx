'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Send } from 'lucide-react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Add your newsletter API call here
    // For now, just show success
    setStatus('success');
    setEmail('');
    setTimeout(() => setStatus('idle'), 3000);
  };

  return (
    <section className="py-16 relative overflow-hidden">
      {/* Softened orange gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-600 to-orange-700 opacity-65" />
      {/* Slight base tint so it still reads “orange” but not neon */}
      <div className="absolute inset-0 bg-orange-600/10" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Mail className="w-8 h-8 text-orange-600" />
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Get Exclusive Offers
          </h2>
          <p className="text-lg text-white/85 mb-8 max-w-2xl mx-auto">
            Subscribe to our newsletter and be the first to know about new products, special deals, and promotions
          </p>

          <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="flex-1 px-6 py-4 rounded-xl bg-white/10 text-white placeholder-white/70 border border-white/35 outline-none focus:border-white/65 focus:ring-2 focus:ring-white/20"
              />
              <button
                type="submit"
                className="px-8 py-4 bg-white text-orange-600 font-semibold rounded-xl hover:bg-white/90 transition flex items-center justify-center gap-2 shadow-lg"
              >
                Subscribe
                <Send size={18} />
              </button>
            </div>

            {status === 'success' && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 text-white font-medium"
              >
                ✓ Thanks for subscribing!
              </motion.p>
            )}
          </form>

          <p className="text-sm text-white/80 mt-6">
            By subscribing, you agree to our privacy policy. Unsubscribe anytime.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
