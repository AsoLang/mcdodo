// Path: components/VisitorTracker.tsx
'use client';

import { useEffect, useRef } from 'react';

export default function VisitorTracker() {
  const ran = useRef(false);

  useEffect(() => {
    // Prevent double-counting in React Strict Mode
    if (ran.current) return;
    ran.current = true;

    // Track the visit
    const visited = sessionStorage.getItem('visited_session');
    if (!visited) {
      fetch('/api/track-visit', { method: 'POST' });
      sessionStorage.setItem('visited_session', 'true');
    }
  }, []);

  return null; // Invisible component
}