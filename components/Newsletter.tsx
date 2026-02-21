'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Send } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || 'Thanks! Check your inbox for 10% off.');
        setEmail('');
        setTimeout(() => {
          setStatus('idle');
          setMessage('');
        }, 5000);
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong. Please try again.');
        setTimeout(() => {
          setStatus('idle');
          setMessage('');
        }, 4000);
      }
    } catch (error) {
      console.error('Newsletter error:', error);
      setStatus('error');
      setMessage('Failed to subscribe. Please try again.');
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 4000);
    }
  };

  return (
    <section className="py-16 relative overflow-hidden">
      {/* Softened orange gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-600 to-orange-700 opacity-65" />
      {/* Slight base tint so it still reads "orange" but not neon */}
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
            Get 10% Off First Order
          </h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Subscribe to our newsletter for exclusive deals, early access to new products, and your 10% discount code
          </p>

          <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <div className="flex justify-center mb-3">
              <Turnstile
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                onSuccess={setToken}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email for 10% off"
                required
                disabled={status === 'loading'}
                className="flex-1 px-4 py-2 rounded-lg bg-white/10 text-white placeholder-white/70 border border-white/35 outline-none focus:border-white/65 focus:ring-2 focus:ring-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="px-6 py-2 bg-white text-orange-600 font-bold rounded-lg hover:bg-white/90 transition flex items-center justify-center gap-2 shadow-lg whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? 'Subscribing...' : (
                  <>
                    Get 10% Off
                    <Send size={16} />
                  </>
                )}
              </button>
            </div>

            {message && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-4 font-medium ${
                  status === 'success' ? 'text-white' : 'text-red-100'
                }`}
              >
                {status === 'success' ? '✓ ' : '✗ '}{message}
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