'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function InteractivePipelineFlow() {
  const [activeStep, setActiveStep] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStep, setSimStep] = useState<number | null>(null);
  const [simComplete, setSimComplete] = useState(false);

  const steps = [
    {
      id: '01',
      title: 'Tiếp Nhận & Vector Hóa',
      tag: 'WF-05 & pgvector',
      channel: 'Omnichannel + 12 Chủ Đề RAG',
      icon: '💎',
      image: '/images/rag-vector-crystal.jpg',
      color: 'from-indigo-600 to-cyan-500',
      speed: '120ms',
      tech: 'PostgreSQL 17 • pgvector Cosine 96.4%',
      inputChip: 'Câu hỏi & Lead Đa Kênh',
      outputChip: 'Vector Ngữ Nghĩa 12 Chủ Đề',
      desc: 'Tự động tiếp nhận dữ liệu khách hàng và truy vấn ngữ nghĩa thời gian thực trên 12 chủ đề nghiệp vụ trong PostgreSQL pgvector.',
    },
    {
      id: '02',
      title: 'Voice AI Đàm Thoại 2 Chiều',
      tag: 'WF-01 & WF-02',
      channel: 'Trúc Ly & Giọng Bảo Clone',
      icon: '🎙️',
      image: '/images/ai-voice-hero.jpg',
      color: 'from-fuchsia-600 to-indigo-600',
      speed: '600ms',
      tech: 'VieNeu-TTS v3 Nano • Flow-Matching 24kHz',
      inputChip: 'Giọng Nói Khách Hàng (Micro)',
      outputChip: 'Âm Thanh WAV 24kHz Tự Nhiên',
      desc: 'Quay số tự động (WF-01) hoặc trực tổng đài lễ tân 1900-8888 (WF-02) với giọng nữ Trúc Ly tự nhiên và giọng Bảo Zero-Shot Clone.',
    },
    {
      id: '03',
      title: 'Nhạc Trưởng Đa Tác Tử',
      tag: 'WF-03 & WF-04',
      channel: 'Gemini 3.5 Flash Lite',
      icon: '🧠',
      image: '/images/multi-agent-mesh.jpg',
      color: 'from-amber-500 to-purple-600',
      speed: '340ms',
      tech: 'n8n Multi-Agent • ReAct Tool Calling',
      inputChip: 'Bối Cảnh Cuộc Gọi & Ý Định',
      outputChip: 'Chấm Điểm 95/100 🔥 + Gọi API',
      desc: 'Phân tích cảm xúc, chấm điểm Lead tự động và tự chủ kích hoạt các Tool/API bên ngoài (quy đổi tỷ giá, đồng bộ CRM) không cần kịch bản cứng.',
    },
    {
      id: '04',
      title: 'Hạ Tầng Cloud & Duyệt HITL',
      tag: 'WF-05 & WF-06',
      channel: 'Docker + Nginx SSL + HITL',
      icon: '🛡️',
      image: '/images/cloud-infra-docker.jpg',
      color: 'from-emerald-500 to-teal-600',
      speed: '100% Online',
      tech: 'Docker Compose • Let’s Encrypt HTTPS',
      inputChip: 'Báo Giá Chiết Khấu Ngoại Lệ',
      outputChip: 'Phê Duyệt 1-Click An Toàn',
      desc: 'Kiểm soát chiết khấu qua cổng Human-in-the-Loop (HITL) và vận hành khép kín trên hạ tầng Docker Cloud bảo mật HTTPS.',
    },
  ];

  function startSimulation() {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimComplete(false);
    setSimStep(0);
    setActiveStep(0);

    setTimeout(() => {
      setSimStep(1);
      setActiveStep(1);
    }, 750);

    setTimeout(() => {
      setSimStep(2);
      setActiveStep(2);
    }, 1500);

    setTimeout(() => {
      setSimStep(3);
      setActiveStep(3);
    }, 2250);

    setTimeout(() => {
      setIsSimulating(false);
      setSimComplete(true);
    }, 3000);
  }

  const cur = steps[activeStep];

  return (
    <div className="relative">
      {/* Open Section Header (No outer box wrapper!) */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700 ring-1 ring-indigo-500/20 mb-2.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Kiến Trúc Luồng Tác Tử Sống Động
          </div>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900">
            Hành Trình 4 Bước Tự Động Hóa Khép Kín
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start lg:self-end">
          <button
            type="button"
            onClick={startSimulation}
            disabled={isSimulating}
            className={`btn-shimmer inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-extrabold transition-all shadow-lg ${
              isSimulating
                ? 'bg-amber-500 text-white cursor-wait shadow-amber-500/30'
                : 'bg-slate-950 text-white hover:bg-indigo-600 shadow-indigo-500/20 hover:scale-105'
            }`}
          >
            <span>{isSimulating ? '⚡ Đang Truyền Dữ Liệu Qua 4 Node...' : '▶ Chạy Mô Phỏng Luồng Dữ Liệu'}</span>
          </button>

          <Link
            href="/sales"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-4 py-2.5 text-xs font-bold text-slate-700 ring-1 ring-slate-200/80 hover:text-indigo-600 transition-all"
          >
            <span>Trải nghiệm thực tế</span>
            <span>&rarr;</span>
          </Link>
        </div>
      </div>

      {/* Animated SVG Energy Circuit Connecting the 4 Visual Cards */}
      <div className="relative mb-6">
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 hidden lg:block z-0 pointer-events-none px-16">
          <svg className="w-full h-12" viewBox="0 0 900 40" fill="none">
            <path d="M 20 20 L 880 20" stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" />
            <path
              d="M 20 20 L 880 20"
              stroke="url(#pipeline-beam)"
              strokeWidth="4"
              strokeLinecap="round"
              className="animate-flow-beam"
            />
            <circle r="6" fill="#6366f1">
              <animateMotion dur="2.4s" repeatCount="indefinite" path="M 20 20 L 880 20" />
            </circle>
            <circle r="5" fill="#06b6d4">
              <animateMotion dur="2.4s" begin="1.2s" repeatCount="indefinite" path="M 20 20 L 880 20" />
            </circle>
            <defs>
              <linearGradient id="pipeline-beam" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366F1" />
                <stop offset="50%" stopColor="#EC4899" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* 4 Illustrated Visual Node Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 relative z-10">
          {steps.map((step, idx) => {
            const isCur = activeStep === idx;
            const isSimActive = simStep === idx;

            return (
              <div
                key={step.id}
                onClick={() => setActiveStep(idx)}
                className={`visual-showcase group relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 ${
                  isCur || isSimActive
                    ? 'ring-2 ring-indigo-500 shadow-2xl shadow-indigo-500/25 -translate-y-2'
                    : 'ring-1 ring-slate-200/80 shadow-md hover:-translate-y-1 hover:shadow-xl'
                }`}
              >
                {/* 3D Illustration Background */}
                <div className="relative h-44 w-full overflow-hidden bg-slate-950">
                  <img
                    src={step.image}
                    alt={step.title}
                    className="h-full w-full object-cover opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent" />

                  {/* Top Floating Step Pill */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-full font-mono text-xs font-black text-white shadow-lg bg-gradient-to-tr ${step.color}`}
                    >
                      {step.id}
                    </span>
                    <span className="rounded-full bg-slate-950/75 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-mono font-bold text-cyan-300 ring-1 ring-white/15">
                      {step.speed}
                    </span>
                  </div>

                  {/* Bottom Title Overlaid on Artwork */}
                  <div className="absolute bottom-3 left-3.5 right-3.5 text-white">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 block">
                      {step.tag}
                    </span>
                    <h4 className="text-sm font-black tracking-tight group-hover:text-cyan-300 transition-colors">
                      {step.title}
                    </h4>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cinematic Split-View Stage for Active Step (Replaces boring text boxes) */}
      <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-2xl ring-1 ring-white/10 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
          {/* Left 5 Cols: Large Vivid 3D Artwork with Animated Radar Ring */}
          <div className="visual-showcase relative h-56 sm:h-64 lg:col-span-5 overflow-hidden">
            <img
              src={cur.image}
              alt={cur.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-950/30 to-slate-950 hidden lg:block" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent lg:hidden" />

            <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-slate-950/80 backdrop-blur-md px-3.5 py-1.5 text-xs font-bold text-cyan-300 ring-1 ring-cyan-400/30">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{cur.tech}</span>
            </div>
          </div>

          {/* Right 7 Cols: Open Holographic Telemetry Stream */}
          <div className="p-6 sm:p-8 lg:col-span-7 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-indigo-400">
                <span>{cur.icon}</span>
                <span>BƯỚC {cur.id} • {cur.channel}</span>
              </div>
              {simComplete && (
                <span className="rounded-full bg-emerald-500/20 px-3 py-0.5 text-[11px] font-bold text-emerald-300 ring-1 ring-emerald-400/40 animate-bounce">
                  🎉 Luồng 4 Bước Hoàn Tất (1.14s)
                </span>
              )}
            </div>

            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {cur.title}
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {cur.desc}
            </p>

            {/* Animated Signal Flow Strip (Input -> Laser Arrow -> Output) */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-slate-300">
                <span className="h-2 w-2 rounded-full bg-indigo-400" />
                <span className="text-slate-400">Đầu vào:</span>
                <strong className="font-mono text-white">{cur.inputChip}</strong>
              </div>

              <span className="hidden sm:inline text-cyan-400 font-black animate-pulse">━━━▶</span>

              <div className="flex items-center gap-2.5 text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-slate-400">Đầu ra:</span>
                <strong className="font-mono text-emerald-300">{cur.outputChip}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
