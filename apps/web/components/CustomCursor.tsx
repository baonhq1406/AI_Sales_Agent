'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  vx: number;
  vy: number;
  alpha: number;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
}

const PARTICLE_COLORS = [
  'rgba(99, 102, 241, 0.7)',  // indigo
  'rgba(168, 85, 247, 0.7)',  // purple
  'rgba(236, 72, 153, 0.6)',  // pink
  'rgba(56, 189, 248, 0.7)',  // cyan
];

export default function CustomCursor() {
  const [enabled, setEnabled] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [hoverLabel, setHoverLabel] = useState<string | null>(null);
  const [ripples, setRipples] = useState<Ripple[]>([]);

  // Smooth lerp coordinates for follower ring
  const mousePos = useRef({ x: -100, y: -100 });
  const followerPos = useRef({ x: -100, y: -100 });
  const followerRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const lastParticleTime = useRef(0);

  useEffect(() => {
    // Disable on touch / mobile devices
    if (typeof window === 'undefined') return;
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    if (isTouch) {
      setEnabled(false);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      if (!isVisible) setIsVisible(true);

      // Directly update the instant dot
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }

      // Check for interactive elements under cursor
      const target = e.target as HTMLElement | null;
      if (target) {
        const interactive = target.closest(
          'button, a, input, textarea, select, [role="button"], [role="link"], .cursor-pointer, [data-interactive]'
        );
        if (interactive) {
          setIsHovering(true);
          const customLabel = interactive.getAttribute('data-cursor-label');
          setHoverLabel(customLabel);
        } else {
          setIsHovering(false);
          setHoverLabel(null);
        }
      }

      // Emit trailing particles with throttling
      const now = performance.now();
      if (now - lastParticleTime.current > 35) {
        lastParticleTime.current = now;
        if (particlesRef.current.length < 24) {
          const color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
          particlesRef.current.push({
            id: Math.random(),
            x: e.clientX + (Math.random() * 8 - 4),
            y: e.clientY + (Math.random() * 8 - 4),
            size: Math.random() * 3 + 2,
            color,
            vx: (Math.random() - 0.5) * 0.8,
            vy: (Math.random() - 0.5) * 0.8 - 0.2,
            alpha: 0.8,
          });
        }
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      setIsClicking(true);
      const newRipple: Ripple = {
        id: Date.now() + Math.random(),
        x: e.clientX,
        y: e.clientY,
      };
      setRipples((prev) => [...prev.slice(-4), newRipple]);

      // Emit burst of click spark particles
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 * i) / 6;
        const speed = Math.random() * 2 + 1.5;
        particlesRef.current.push({
          id: Math.random(),
          x: e.clientX,
          y: e.clientY,
          size: Math.random() * 3.5 + 2,
          color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
        });
      }
    };

    const handleMouseUp = () => {
      setIsClicking(false);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    // Canvas & Follower Animation Loop with Lerp damping
    const canvas = canvasRef.current;
    const ctx = canvas ? canvas.getContext('2d') : null;

    const resizeCanvas = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const animate = () => {
      // Lerp follower ring towards mouse
      const ease = 0.16;
      followerPos.current.x += (mousePos.current.x - followerPos.current.x) * ease;
      followerPos.current.y += (mousePos.current.y - followerPos.current.y) * ease;

      if (followerRef.current) {
        followerRef.current.style.transform = `translate3d(${followerPos.current.x}px, ${followerPos.current.y}px, 0)`;
      }

      // Render & update particles on canvas
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const p = particlesRef.current[i];
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= 0.025;
          p.size *= 0.96;

          if (p.alpha <= 0 || p.size <= 0.5) {
            particlesRef.current.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color.replace(/[\d\.]+\)$/g, `${p.alpha})`);
          ctx.shadowBlur = 6;
          ctx.shadowColor = p.color;
          ctx.fill();
          ctx.restore();
        }
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('resize', resizeCanvas);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isVisible]);

  // Clean up ripples after animation duration
  useEffect(() => {
    if (ripples.length === 0) return;
    const timer = setTimeout(() => {
      setRipples((prev) => prev.slice(1));
    }, 600);
    return () => clearTimeout(timer);
  }, [ripples]);

  if (!enabled) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden transition-opacity duration-300" style={{ opacity: isVisible ? 1 : 0 }}>
      {/* Particle trail canvas */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 block h-full w-full"
      />

      {/* Click Ripple Shockwaves */}
      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-indigo-400/80 bg-indigo-500/10 animate-cursor-ripple shadow-[0_0_20px_rgba(99,102,241,0.5)]"
          style={{
            left: `${ripple.x}px`,
            top: `${ripple.y}px`,
            width: '40px',
            height: '40px',
          }}
        />
      ))}

      {/* Smooth Lag Follower Aura Ring */}
      <div
        ref={followerRef}
        className="pointer-events-none absolute top-0 left-0 will-change-transform"
      >
        <div
          className={`-translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-200 ease-out flex items-center justify-center ${
            isHovering
              ? 'h-12 w-12 border-2 border-purple-500/80 bg-purple-500/15 shadow-[0_0_25px_rgba(168,85,247,0.45)] backdrop-blur-[1px] scale-110'
              : isClicking
              ? 'h-7 w-7 border-2 border-indigo-500 bg-indigo-500/30 scale-90 shadow-[0_0_15px_rgba(99,102,241,0.6)]'
              : 'h-9 w-9 border border-indigo-500/50 bg-indigo-500/10 shadow-[0_0_16px_rgba(99,102,241,0.25)]'
          }`}
        >
          {/* Inner rotating orbit ring on hover */}
          {isHovering && (
            <div className="absolute inset-0 rounded-full border border-dashed border-cyan-400/60 animate-spin [animation-duration:6s]" />
          )}

          {/* Hover tool badge */}
          {hoverLabel && (
            <div className="absolute top-full mt-2.5 whitespace-nowrap rounded-lg bg-slate-900/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-lg backdrop-blur-sm border border-slate-700/60 animate-fade-in">
              {hoverLabel}
            </div>
          )}
        </div>
      </div>

      {/* Instant Precision Core Dot */}
      <div
        ref={dotRef}
        className="pointer-events-none absolute top-0 left-0 will-change-transform"
      >
        <div
          className={`-translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-150 ${
            isClicking
              ? 'h-3 w-3 bg-pink-500 shadow-[0_0_12px_rgba(236,72,153,1)] scale-125'
              : isHovering
              ? 'h-2 w-2 bg-gradient-to-tr from-cyan-400 to-indigo-500 shadow-[0_0_10px_rgba(56,189,248,0.9)] scale-110'
              : 'h-2 w-2 bg-gradient-to-tr from-indigo-600 to-violet-600 shadow-[0_0_10px_rgba(99,102,241,0.8)]'
          }`}
        />
      </div>
    </div>
  );
}
