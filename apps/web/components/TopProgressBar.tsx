'use client';

import React, { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function TopProgressBar() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // When pathname changes (route transition completed)
  useEffect(() => {
    if (progress > 0) {
      setProgress(100);
      const hideTimer = setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
      }, 250);
      return () => clearTimeout(hideTimer);
    }
  }, [pathname]);

  // Intercept internal link clicks to start progress bar instantly
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      const isBlank = target.getAttribute('target') === '_blank';
      const isDownload = target.hasAttribute('download');
      const isHash = href?.startsWith('#');
      const isExternal = href?.startsWith('http://') || href?.startsWith('https://');

      if (!href || isBlank || isDownload || isHash || isExternal) return;

      // Ignore if clicking the exact current pathname
      if (href === pathname || href === window.location.pathname) return;

      // Start progress simulation
      setIsVisible(true);
      setProgress(15);

      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 85) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 85;
          }
          const increment = Math.max(1, (85 - prev) * 0.15);
          return Math.min(85, prev + increment);
        });
      }, 80);
    };

    window.addEventListener('click', handleLinkClick, { capture: true });
    return () => {
      window.removeEventListener('click', handleLinkClick, { capture: true });
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [pathname]);

  if (!isVisible && progress === 0) return null;

  return (
    <div
      className="pointer-events-none fixed top-0 left-0 right-0 z-[99999] h-[2.5px] w-full overflow-hidden"
      style={{
        opacity: progress === 100 ? 0 : 1,
        transition: 'opacity 0.25s ease-out',
      }}
    >
      <div
        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 shadow-[0_0_10px_rgba(99,102,241,0.9)] will-change-transform"
        style={{
          width: `${progress}%`,
          transition: progress === 100 ? 'width 0.15s ease-out' : 'width 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />
    </div>
  );
}
