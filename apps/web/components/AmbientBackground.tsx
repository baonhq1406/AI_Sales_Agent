import React from 'react';

export default function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Dynamic Mesh Grid */}
      <div className="absolute inset-0 bg-grid-slate opacity-40 [mask-image:radial-gradient(ellipse_at_center,white,transparent_80%)]" />

      {/* Floating Ambient Glowing Orbs */}
      <div
        className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-gradient-to-tr from-indigo-500/15 via-purple-500/10 to-transparent blur-3xl animate-float-slow"
        style={{ willChange: 'transform' }}
      />
      <div
        className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-violet-500/15 via-pink-500/10 to-transparent blur-3xl animate-float-reverse"
        style={{ willChange: 'transform' }}
      />
      <div
        className="absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-gradient-to-tr from-cyan-500/10 via-blue-500/10 to-transparent blur-3xl animate-float-slow"
        style={{ willChange: 'transform', animationDelay: '4s' }}
      />
    </div>
  );
}
