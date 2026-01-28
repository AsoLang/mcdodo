// Path: components/VisitorTracker.tsx
'use client';

import { useEffect, useRef } from 'react';

export default function VisitorTracker() {
  const ran = useRef(false);

  useEffect(() => {
    // Prevent double-counting in React Strict Mode
    if (ran.current) return;
    ran.current = true;

    // Track the visit (throttled to reduce DB usage)
    const visited = sessionStorage.getItem('visited_session');
    const lastTracked = localStorage.getItem('last_visit_track');
    const now = Date.now();
    const sixHours = 6 * 60 * 60 * 1000;

    const sampleRate = 0.25; // track ~25% of visits to reduce DB usage

    if (!visited && (!lastTracked || now - Number(lastTracked) > sixHours) && Math.random() < sampleRate) {
      fetch('/api/track-visit', { method: 'POST' });
      sessionStorage.setItem('visited_session', 'true');
      localStorage.setItem('last_visit_track', String(now));
    }
  }, []);

  return null; // Invisible component
}
