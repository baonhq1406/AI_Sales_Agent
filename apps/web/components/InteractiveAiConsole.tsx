'use client';

import { useState, useEffect } from 'react';

export default function InteractiveAiConsole() {
  const [activeMode, setActiveMode] = useState<'voice' | 'nodes' | 'approval'>('voice');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [activeScenario, setActiveScenario] = useState(0);

  const scenarios = [
    {
      company: 'Logistics Toàn Cầu Express',
      need: '40 xe vận tải & hệ thống GPS tự động',
      score: 95,
      intent: 'Enterprise Purchase',
      voiceName: 'Trúc Ly (VieNeu Neural 24kHz)',
      dialogue: [
        { speaker: 'AI Sales', text: 'Dạ chào anh Tuấn! Em là Trúc Ly từ AI Sales Agent, nhận thấy công ty đang mở rộng đội 40 xe vận tải...' },
        { speaker: 'Khách hàng', text: 'Bên anh cần tích hợp định tuyến AI và nhận báo giá gói Pro trong hôm nay để trình ban giám đốc.' },
      ],
      quoteAmount: '180.000.000 đ',
      discount: '15%',
    },
    {
      company: 'Chuỗi Bán lẻ Vinamart+',
      need: 'Nâng cấp phần mềm quản lý kho 12 chi nhánh',
      score: 88,
      intent: 'Software Upgrade',
      voiceName: 'Bảo Clone (Flow-Matching)',
      dialogue: [
        { speaker: 'AI Sales', text: 'Dạ chào chị Thảo, em Bảo từ AI Sales Agent xin phép kết nối hỗ trợ tự động hóa 12 điểm kho bán lẻ ạ.' },
        { speaker: 'Khách hàng', text: 'Chi phí triển khai thế nào em? Có hỗ trợ dùng thử 14 ngày trên dữ liệu thật của bên chị không?' },
      ],
      quoteAmount: '95.000.000 đ',
      discount: '10%',
    },
  ];

  const current = scenarios[activeScenario];

  function speakVoice() {
    if (typeof window === 'undefined') return;
    if (isPlayingAudio) {
      window.speechSynthesis?.cancel();
      setIsPlayingAudio(false);
      return;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(current.dialogue[0].text);
      utterance.lang = 'vi-VN';
      utterance.rate = 1.05;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      setIsPlayingAudio(true);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsPlayingAudio(true);
      setTimeout(() => setIsPlayingAudio(false), 3500);
    }
  }

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div className="relative w-full">
      {/* Multi-layered Aurora Ambient Backlight */}
      <div className=" -inset-3 rounded-[2.5rem] bg-gradient-to-tr from-indigo-500/35 via-fuchsia-500/25 to-cyan-400/35 blur-2xl opacity-80 animate-pulse-glow pointer-events-none" />

      {/* Floating Orbital Badge 1: Top-Right Live Velocity */}
      <div className="animate-float absolute -top-5 -right-3 z-30 hidden sm:flex items-center gap-2.5 rounded-full bg-slate-950/90 px-4 py-2 shadow-2xl ring-1 ring-cyan-400/40 backdrop-blur-xl text-white">
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-cyan-400" />
        </span>
        <span className="text-xs font-extrabold tracking-tight bg-gradient-to-r from-cyan-300 to-indigo-300 bg-clip-text text-transparent">
          VieNeu-TTS 24kHz • 0.6s
        </span>
      </div>

      {/* Floating Orbital Badge 2: Bottom-Left AI Lead Score */}
      <div className="animate-float-delayed absolute -bottom-5 -left-3 z-30 hidden sm:flex items-center gap-3 rounded-full bg-white/95 px-4 py-2 shadow-2xl ring-1 ring-indigo-500/20 backdrop-blur-xl">
        <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-mono text-xs font-black shadow-md shadow-emerald-500/30">
          {current.score}
        </div>
        <div className="pr-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">AI Lead Score</p>
          <p className="text-xs font-extrabold text-slate-900">🔥 Hot Deal ({current.discount} Off)</p>
        </div>
      </div>

      {/* Main 3D Glass Hologram Showcase */}
      <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 text-slate-100 shadow-[0_32px_64px_-16px_rgba(15,23,42,0.65)] ring-1 ring-white/15">
        {/* Top Floating Mode Switcher (Zero heavy borders) */}
        <div className="relative z-20 flex items-center justify-between px-5 pt-4 pb-3 bg-gradient-to-b from-slate-950/95 via-slate-950/70 to-transparent">
          <div className="flex items-center gap-1.5 bg-white/5 backdrop-blur-xl p-1 rounded-full ring-1 ring-white/10">
            {[
              { id: 'voice' as const, label: '🎙️ Hologram Voice AI' },
              { id: 'nodes' as const, label: '🧠 3D Multi-Agent' },
              { id: 'approval' as const, label: '💎 RAG & HITL' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveMode(tab.id)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all duration-300 ${
                  activeMode === tab.id
                    ? 'bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/30 scale-105'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setActiveScenario(activeScenario === 0 ? 1 : 0)}
            className="text-[11px] font-bold text-cyan-300 hover:text-white transition-colors flex items-center gap-1 bg-cyan-500/10 px-3 py-1 rounded-full ring-1 ring-cyan-400/20"
          >
            <span>↻ Đổi kịch bản</span>
          </button>
        </div>

        {/* ============================================================ */}
        {/* MODE 1: 3D HOLOGRAPHIC VOICE AI SHOWCASE                     */}
        {/* ============================================================ */}
        {activeMode === 'voice' && (
          <div className="relative">
            {/* Vivid 3D Artwork Canvas with Animated Sonic Rings */}
            <div className="visual-showcase relative h-64 sm:h-72 w-full overflow-hidden">
              <img
                src="/images/ai-voice-hero.jpg"
                alt="3D Holographic AI Voice Agent"
                className="h-full w-full object-cover object-center"
              />
              {/* Cinematic vignette blend */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/60 via-transparent to-slate-950/60" />

              {/* Animated Orbital Sonic Rings over Hologram Center */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div
                  className={`h-44 w-44 rounded-full border border-cyan-400/30 transition-all duration-500 ${
                    isPlayingAudio ? 'scale-125 opacity-90 animate-ping' : 'scale-100 opacity-35 animate-orbit'
                  }`}
                />
                <div
                  className={`absolute h-56 w-56 rounded-full border border-dashed border-fuchsia-400/30 ${
                    isPlayingAudio ? 'animate-orbit-fast opacity-85' : 'animate-orbit-reverse opacity-30'
                  }`}
                />
              </div>

              {/* Live Floating Audio Spectrum & Play Trigger at Bottom of Image */}
              <div className="absolute bottom-3 left-5 right-5 flex items-end justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-cyan-300 drop-shadow">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    {current.voiceName}
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-white tracking-tight drop-shadow-md">
                    {current.company}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={speakVoice}
                  className={`btn-shimmer inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-extrabold text-white shadow-xl transition-all ${
                    isPlayingAudio
                      ? 'bg-rose-600 shadow-rose-500/40 scale-105'
                      : 'bg-gradient-to-r from-indigo-600 to-cyan-500 shadow-indigo-500/40 hover:scale-105'
                  }`}
                >
                  <span>{isPlayingAudio ? '⏹ Dừng Phát' : '🔊 Nghe Giọng AI'}</span>
                </button>
              </div>
            </div>

            {/* Open Floating Conversation Stream (Zero Boxy Borders) */}
            <div className="px-5 pb-5 pt-2 space-y-3">
              {/* 16-Bar Live Equalizer Ribbon */}
              <div className="flex items-center justify-center gap-1.5 h-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 2, 5, 3, 7, 4, 6, 1, 3].map((n, i) => (
                  <span
                    key={i}
                    className={`w-1 rounded-full bg-gradient-to-t from-indigo-500 via-fuchsia-400 to-cyan-300 animate-soundwave-${n}`}
                    style={{ opacity: isPlayingAudio ? 1 : 0.45 }}
                  />
                ))}
              </div>

              {/* Clean Speech Bubbles */}
              <div className="space-y-2.5 text-xs">
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 text-[10px] font-black text-white shadow-md shadow-indigo-500/30">
                    AI
                  </span>
                  <p className="text-slate-200 leading-relaxed pt-0.5">
                    “{current.dialogue[0].text}”
                  </p>
                </div>

                <div className="flex items-start gap-3 pl-6">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-cyan-300">
                    KH
                  </span>
                  <p className="text-cyan-200/90 leading-relaxed italic pt-0.5">
                    “{current.dialogue[1].text}”
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODE 2: 3D ISOMETRIC MULTI-AGENT MESH                        */}
        {/* ============================================================ */}
        {activeMode === 'nodes' && (
          <div className="relative">
            <div className="visual-showcase relative h-72 sm:h-80 w-full overflow-hidden">
              <img
                src="/images/multi-agent-mesh.jpg"
                alt="3D Multi-Agent Neural Mesh"
                className="h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

              {/* Animated SVG Laser Data Streams Overlaid on 3D Nodes */}
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full"
                viewBox="0 0 600 320"
                fill="none"
              >
                <path
                  id="beam1"
                  d="M300 160 C 230 120, 190 100, 150 85"
                  stroke="url(#cyanGlow)"
                  strokeWidth="2.5"
                  className="animate-laser"
                />
                <path
                  id="beam2"
                  d="M300 160 C 370 120, 410 100, 450 85"
                  stroke="url(#purpleGlow)"
                  strokeWidth="2.5"
                  className="animate-laser"
                />
                <path
                  id="beam3"
                  d="M300 160 C 230 200, 190 220, 150 235"
                  stroke="url(#cyanGlow)"
                  strokeWidth="2.5"
                  className="animate-laser"
                />
                <path
                  id="beam4"
                  d="M300 160 C 370 200, 410 220, 450 235"
                  stroke="url(#purpleGlow)"
                  strokeWidth="2.5"
                  className="animate-laser"
                />
                <circle r="4" fill="#22d3ee">
                  <animateMotion dur="1.8s" repeatCount="indefinite" path="M300 160 C 230 120, 190 100, 150 85" />
                </circle>
                <circle r="4" fill="#e879f9">
                  <animateMotion dur="2.1s" repeatCount="indefinite" path="M300 160 C 370 120, 410 100, 450 85" />
                </circle>
                <circle r="4" fill="#34d399">
                  <animateMotion dur="1.6s" repeatCount="indefinite" path="M300 160 C 230 200, 190 220, 150 235" />
                </circle>
                <circle r="4" fill="#fbbf24">
                  <animateMotion dur="1.9s" repeatCount="indefinite" path="M300 160 C 370 200, 410 220, 450 235" />
                </circle>
                <defs>
                  <linearGradient id="cyanGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                  <linearGradient id="purpleGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Floating Glass Labels on the 4 Corners */}
              <div className="absolute top-3 left-4 rounded-full bg-slate-950/80 backdrop-blur-md px-3 py-1 text-[10px] font-bold text-cyan-300 ring-1 ring-cyan-400/30">
                🎙️ Voice Agent (WF-01/02)
              </div>
              <div className="absolute top-3 right-4 rounded-full bg-slate-950/80 backdrop-blur-md px-3 py-1 text-[10px] font-bold text-purple-300 ring-1 ring-purple-400/30">
                💎 pgvector RAG (12 Chủ đề)
              </div>
              <div className="absolute bottom-14 left-4 rounded-full bg-slate-950/80 backdrop-blur-md px-3 py-1 text-[10px] font-bold text-emerald-300 ring-1 ring-emerald-400/30">
                📡 Lead Scoring Radar ({current.score}đ)
              </div>
              <div className="absolute bottom-14 right-4 rounded-full bg-slate-950/80 backdrop-blur-md px-3 py-1 text-[10px] font-bold text-amber-300 ring-1 ring-amber-400/30">
                🛡️ HITL Security Gate
              </div>

              <div className="absolute bottom-3 left-5 right-5 flex items-center justify-between text-xs">
                <span className="font-bold text-white drop-shadow">
                  🧠 Nhạc Trưởng Điều Phối Gemini 3.5 Flash Lite
                </span>
                <span className="font-mono text-[11px] text-emerald-400">4/4 Agents Online</span>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODE 3: 3D RAG CRYSTAL & HITL APPROVAL                       */}
        {/* ============================================================ */}
        {activeMode === 'approval' && (
          <div className="relative">
            <div className="visual-showcase relative h-60 w-full overflow-hidden">
              <img
                src="/images/rag-vector-crystal.jpg"
                alt="3D Semantic Vector Crystal"
                className="h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

              <div className="absolute bottom-3 left-5 right-5 flex items-end justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-purple-300">
                    WF-14 &amp; WF-16 Smart Contract
                  </span>
                  <h4 className="text-base font-black text-white">
                    Báo Giá Tự Động: {current.company}
                  </h4>
                </div>
                <span className="font-mono text-lg font-black text-cyan-300">
                  {current.quoteAmount}
                </span>
              </div>
            </div>

            <div className="px-5 pb-5 pt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-300">
                Chiết khấu AI đề xuất: <strong className="text-amber-400 font-mono">{current.discount}</strong> •{' '}
                <span className={approvalStatus === 'approved' ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                  {approvalStatus === 'approved' ? '✓ Đã ký số & gửi Email' : 'Đang chờ Manager phê duyệt'}
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setApprovalStatus('approved')}
                  className="btn-shimmer flex-1 sm:flex-initial rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-xs font-extrabold text-white shadow-lg shadow-emerald-500/30 hover:scale-105 transition-all"
                >
                  ✓ Duyệt 1-Click
                </button>
                <button
                  type="button"
                  onClick={() => setApprovalStatus('rejected')}
                  className="rounded-full bg-white/10 hover:bg-white/20 px-3.5 py-2 text-xs font-semibold text-slate-300 transition-all"
                >
                  Đặt lại
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
