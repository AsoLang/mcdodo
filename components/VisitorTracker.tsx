// Path: components/VisitorTracker.tsx
'use client';

import { useEffect, useRef } from 'react';

export default function VisitorTracker() {
  const ran = useRef(false);

  useEffect(() => {
    // Prevent double-counting in React Strict Mode
    if (ran.current) return;
    ran.current = true;

    // Make one sampling decision per browser per day. Previously the random
    // check repeated on every page until it succeeded, causing excess writes.
    const today = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem('visit_sample_day') === today) return;

    localStorage.setItem('visit_sample_day', today);
    const sampleRate = 0.25;
    if (Math.random() >= sampleRate) return;

    fetch('/api/track-visit', {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => {});
  }, []);

  return null; // Invisible component
}
