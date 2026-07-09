'use client';

import { useEffect, useState } from 'react';

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 400);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scroll = () => {
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      onClick={scroll}
      aria-label="回到顶部"
      title="回到顶部"
      className={
        'fixed right-6 z-40 bottom-fab-1 w-11 h-11 rounded-full ' +
        'bg-cinnabar/90 hover:bg-cinnabar text-paper shadow-lg ' +
        'flex items-center justify-center transition-all hover:shadow-xl ' +
        'hover:-translate-y-0.5 backdrop-blur-sm ' +
        (visible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none')
      }
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
      </svg>
    </button>
  );
}
