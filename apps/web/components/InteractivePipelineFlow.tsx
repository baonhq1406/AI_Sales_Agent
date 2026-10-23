'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function InteractivePipelineFlow() {
  const [activeStep, setActiveStep] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStep, setSimStep] = useState<number | null>(null);
  const [simComplete, setSimComplete] = useState(false);

  const steps = [
    {
      id: '01',
      title: 'Tiếp Nhận & Khử Trùng',
      tag: 'WF-07 & WF-08',
      channel: 'Zalo / Web / Call',
      icon: '📥',
      color: 'from-blue-600 to-indigo-600',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
      speed: '< 350ms',
      tech: 'n8n Webhook • SHA-256 Idempotency',
      inputChip: 'Lead Payload',
      outputChip: 'Customer 360 Vector',
      desc: 'Tự động bắt webhook đa kênh, băm SHA-256 chặn spam trùng lặp và lưu trữ vào PostgreSQL.',
    },
    {
      id: '02',
      title: 'Chấm Điểm & Phân Hạng',
      tag: 'WF-13 Scoring',
      channel: 'Llama 3.3 70B',
      icon: '🧠',
      color: 'from-purple-600 to-indigo-600',
      badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
      speed: '340ms',
      tech: 'Groq Cloud • Llama 3.3 70B Engine',
      inputChip: 'Hồ Sơ Doanh Nghiệp',
      outputChip: 'Lead Score: 95/100 🔥',
      desc: 'Mô hình AI đọc lịch sử tương tác, chấm điểm tiềm năng 0–100 và phân loại Hot/Warm/Cold.',
    },
    {
      id: '03',
      title: 'Voice AI Đàm Thoại',
      tag: 'WF-01 & WF-02',
      channel: 'Whisper + ElevenLabs',
      icon: '🎙️',
      color: 'from-cyan-600 to-blue-600',
      badgeBg: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      speed: '< 800ms',
      tech: 'Twilio Outbound • Whisper STT',
      inputChip: 'Kịch Bản Tư Vấn',
      outputChip: 'Transcript + Cảm Xúc',
      desc: 'Quay số tự động tiếp cận khách hàng trong 30s, đàm thoại 2 chiều với giọng đọc tự nhiên.',
    },
    {
      id: '04',
      title: 'Báo Giá & Phê Duyệt',
      tag: 'WF-14 & WF-16',
      channel: 'Human-in-the-Loop',
      icon: '🛡️',
      color: 'from-emerald-600 to-teal-600',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      speed: '1.1s',
      tech: 'PDF Engine • Telegram Bot Alert',
      inputChip: 'Chiết Khấu Đề Xuất',
      outputChip: 'Báo Giá PDF Ký Số',
      desc: 'Tự động tạo file Báo giá PDF chuẩn chỉ và gửi thông báo 1-click cho Quản lý qua Telegram.',
    },
  ];

  // Run the 4-step live pipeline simulation
  function startSimulation() {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimComplete(false);
    setSimStep(0);
    setActiveStep(0);

    // Step 0 -> 1 -> 2 -> 3 -> complete
    setTimeout(() => {
      setSimStep(1);
      setActiveStep(1);
    }, 700);

    setTimeout(() => {
      setSimStep(2);
      setActiveStep(2);
    }, 1400);

    setTimeout(() => {
      setSimStep(3);
      setActiveStep(3);
    }, 2100);

    setTimeout(() => {
      setIsSimulating(false);
      setSimComplete(true);
    }, 2800);
  }

  const cur = steps[activeStep];

  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-md p-6 sm:p-8 shadow-xs relative overflow-hidden">
      {/* Top Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-100 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200/60">
              Kiến Trúc Multi-Agent Pipeline
            </span>
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">&bull; n8n + PostgreSQL</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Quy Trình Tự Động Hóa 4 Bước Khép Kín
          </h2>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
          <button
            type="button"
            onClick={startSimulation}
            disabled={isSimulating}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm ${
              isSimulating
                ? 'bg-amber-500 text-white cursor-wait'
                : 'bg-slate-900 text-white hover:bg-indigo-600'
            }`}
          >
            <span>{isSimulating ? '⚡ Đang Chạy Luồng...' : '⚡ Bấm Chạy Mô Phỏng Luồng'}</span>
          </button>

          <Link
            href="/sales"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <span>Vào Workspace</span>
            <span>&rarr;</span>
          </Link>
        </div>
      </div>

      {/* Visual Pipeline Node Graph with Connecting Animated Beams */}
      <div className="relative mb-8">
        {/* SVG Connecting Flow Lines (Hidden on small mobile, visible sm+) */}
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 hidden lg:block z-0 pointer-events-none px-12">
          <svg className="w-full h-8" viewBox="0 0 800 24" fill="none">
            {/* Background track line */}
            <line x1="20" y1="12" x2="780" y2="12" stroke="#E2E8F0" strokeWidth="2.5" />
            {/* Animated glowing beam line */}
            <line
              x1="20"
              y1="12"
              x2="780"
              y2="12"
              stroke="url(#gradient-line)"
              strokeWidth="3"
              className="animate-flow-beam"
            />
            <defs>
              <linearGradient id="gradient-line" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366F1" />
                <stop offset="50%" stopColor="#A855F7" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* 4 Interactive Nodes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          {steps.map((step, idx) => {
            const isCur = activeStep === idx;
            const isSimActive = simStep === idx;

            return (
              <div
                key={step.id}
                onClick={() => setActiveStep(idx)}
                className={`spotlight-card group relative rounded-2xl p-5 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                  isCur || isSimActive
                    ? 'border-2 border-indigo-600 bg-white shadow-lg ring-4 ring-indigo-50 -translate-y-1'
                    : 'border border-slate-200/90 bg-white/90 hover:border-indigo-300 hover:shadow-xs'
                }`}
              >
                {/* Node Status Indicator Pill */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-xl font-mono text-xs font-black transition-all ${
                        isCur || isSimActive
                          ? 'bg-slate-900 text-white shadow-xs scale-105'
                          : 'bg-slate-100 text-slate-700 group-hover:bg-indigo-50 group-hover:text-indigo-700'
                      }`}
                    >
                      {step.id}
                    </span>
                    <span className="text-xl">{step.icon}</span>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${step.badgeBg}`}>
                    {step.tag}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {step.title}
                  </h4>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                    {step.channel}
                  </p>
                </div>

                {/* Node Output Telemetry Chip */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] font-mono text-slate-400">Độ trễ: {step.speed}</span>
                  <span
                    className={`text-[10px] font-bold ${
                      isCur ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-600'
                    }`}
                  >
                    {isCur ? '● Đang xem' : 'Chi tiết &rarr;'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic Node Inspection Console (Visual Telemetry HUD, Not boring text box) */}
      <div className="rounded-2xl border border-indigo-100/90 bg-gradient-to-r from-indigo-50/50 via-purple-50/30 to-white p-5 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-indigo-100/80 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{cur.icon}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-200">
                  Node {cur.id} Telemetry
                </span>
                <span className="text-xs font-bold text-slate-900">{cur.title}</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{cur.desc}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-indigo-100 self-start sm:self-auto">
            <span>Core: {cur.tech}</span>
          </div>
        </div>

        {/* Data In / Out Micro Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2 bg-white/90 p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Dữ liệu vào:</span>
            <span className="font-mono font-bold text-slate-800">{cur.inputChip}</span>
          </div>
          <div className="flex items-center gap-2 bg-white/90 p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Kết quả sinh ra:</span>
            <span className="font-mono font-bold text-emerald-700">{cur.outputChip}</span>
          </div>
        </div>

        {/* Simulation Finish Alert Toast */}
        {simComplete && (
          <div className="mt-3 py-2 px-3 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-between animate-fade-in border border-emerald-300">
            <span>🎉 Mô phỏng thành công! Dữ liệu đã truyền qua 4 node an toàn trong 1.14s.</span>
            <span className="text-[10px] font-mono">100% OK</span>
          </div>
        )}
      </div>
    </div>
  );
}
