'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  RagVectorSearchIllustration,
  VoiceConversationIllustration,
  MultiAgentOrchestratorIllustration,
  CloudStackIllustration,
} from './AnimatedIllustrations';

export default function InteractivePipelineFlow() {
  const [activeStep, setActiveStep] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStep, setSimStep] = useState<number | null>(null);
  const [simComplete, setSimComplete] = useState(false);

  const steps = [
    {
      id: '01',
      title: 'Tiếp Nhận & Vector Hóa',
      tag: 'pgvector RAG',
      channel: 'Omnichannel + 12 Chủ Đề RAG',
      icon: '💎',
      color: 'from-cyan-500 to-blue-600',
      speed: '120ms',
      tech: 'PostgreSQL 17 • pgvector Cosine 98.4%',
      inputChip: 'Câu hỏi & Lead Đa Kênh',
      outputChip: 'Vector Ngữ Nghĩa 1536 Chiều',
      desc: 'Tự động tiếp nhận dữ liệu khách hàng và truy vấn ngữ nghĩa thời gian thực trên 12 chủ đề nghiệp vụ trong PostgreSQL pgvector.',
    },
    {
      id: '02',
      title: 'Voice AI Đàm Thoại 2 Chiều',
      tag: 'WF-01 & WF-02',
      channel: 'Trúc Ly, Sơn Tùng & Jack AI',
      icon: '🎙️',
      color: 'from-indigo-600 to-violet-600',
      speed: '300ms',
      tech: 'Neural Voice Synthesis • 24kHz Tự Nhiên',
      inputChip: 'Giọng Nói Khách Hàng (Micro)',
      outputChip: 'Âm Thanh WAV 24kHz Tự Nhiên',
      desc: 'Quay số tự động (WF-01) hoặc trực tổng đài lễ tân 1900-8888 (WF-02) với giọng tiếp tân Trúc Ly và giọng Sơn Tùng M-TP, Jack (J97).',
    },
    {
      id: '03',
      title: 'Nhạc Trưởng Đa Tác Tử',
      tag: 'WF-03 & WF-04',
      channel: 'Gemini 3.5 Flash Lite',
      icon: '🧠',
      color: 'from-amber-500 to-orange-600',
      speed: '340ms',
      tech: 'n8n Multi-Agent • ReAct Tool Calling',
      inputChip: 'Bối Cảnh Cuộc Gọi & Ý Định',
      outputChip: 'Chấm Điểm 95/100 + Gọi API',
      desc: 'Phân tích cảm xúc, chấm điểm Lead tự động và tự chủ kích hoạt các Tool/API bên ngoài (quy đổi tỷ giá, đồng bộ CRM) không cần kịch bản cứng.',
    },
    {
      id: '04',
      title: 'Phê Duyệt HITL & Chốt Đơn',
      tag: 'Cổng Phê Duyệt HITL',
      channel: 'Quản Trị Bán Hàng 360',
      icon: '🛡️',
      color: 'from-emerald-500 to-teal-600',
      speed: 'Tức thì',
      tech: 'Human-in-the-Loop • Báo Giá & CRM',
      inputChip: 'Báo Giá Chiết Khấu Ngoại Lệ',
      outputChip: 'Phê Duyệt 1-Click An Toàn',
      desc: 'Kiểm soát chiết khấu vượt ngưỡng qua cổng Human-in-the-Loop (HITL), chốt đơn tự động và cập nhật hồ sơ khách hàng CRM 360 bảo mật.',
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
    }, 850);

    setTimeout(() => {
      setSimStep(2);
      setActiveStep(2);
    }, 1700);

    setTimeout(() => {
      setSimStep(3);
      setActiveStep(3);
    }, 2550);

    setTimeout(() => {
      setIsSimulating(false);
      setSimComplete(true);
    }, 3400);
  }

  const cur = steps[activeStep];

  return (
    <div className="relative">
      {/* Open Section Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700 mb-2.5">
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
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-extrabold transition-all shadow-md cursor-pointer ${
              isSimulating
                ? 'bg-amber-500 text-white cursor-wait'
                : 'bg-slate-950 text-white hover:bg-indigo-600'
            }`}
          >
            <span>{isSimulating ? '⚡ Đang Truyền Dữ Liệu Qua 4 Node...' : '▶ Chạy Mô Phỏng Luồng Dữ Liệu'}</span>
          </button>

          <Link
            href="/sales"
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:text-indigo-600 transition-all"
          >
            <span>Trải nghiệm thực tế</span>
            <span>&rarr;</span>
          </Link>
        </div>
      </div>

      {/* Animated SVG Connector Track + 4 Step Pills */}
      <div className="relative mb-6">
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 hidden lg:block z-0 pointer-events-none px-16">
          <svg className="w-full h-10" viewBox="0 0 900 40" fill="none">
            <path d="M 20 20 L 880 20" stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" />
            <path
              d="M 20 20 L 880 20"
              stroke="url(#pipeline-beam)"
              strokeWidth="3"
              strokeLinecap="round"
              className="animate-dash-stream"
            />
            <circle r="5" fill="#6366f1">
              <animateMotion dur="2.6s" repeatCount="indefinite" path="M 20 20 L 880 20" />
            </circle>
            <defs>
              <linearGradient id="pipeline-beam" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06B6D4" />
                <stop offset="50%" stopColor="#6366F1" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          {steps.map((step, idx) => {
            const isCur = activeStep === idx;
            const isSimActive = simStep === idx;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStep(idx)}
                className={`group text-left rounded-2xl p-4 transition-all duration-300 cursor-pointer ${
                  isCur || isSimActive
                    ? 'bg-slate-950 text-white shadow-xl -translate-y-1'
                    : 'bg-white/90 text-slate-900 shadow-sm hover:bg-white hover:-translate-y-0.5'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-xl font-mono text-xs font-black text-white bg-gradient-to-tr ${step.color}`}
                  >
                    {step.id}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold ${
                      isCur || isSimActive
                        ? 'bg-white/10 text-cyan-300'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {step.speed}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider block ${
                    isCur || isSimActive ? 'text-indigo-300' : 'text-indigo-600'
                  }`}
                >
                  {step.tag}
                </span>
                <h4 className="text-sm font-extrabold tracking-tight mt-0.5">
                  {step.title}
                </h4>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Split-View Vector Stage for Active Step */}
      <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-2xl p-6 sm:p-8 animate-tab-pane">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left 6 Cols: Live Animated Vector Illustration */}
          <div className="lg:col-span-6 rounded-2xl bg-slate-900/80 p-3">
            {activeStep === 0 && (
              <RagVectorSearchIllustration topicLabel="12 Chủ đề B2B" similarity="98.4%" />
            )}
            {activeStep === 1 && (
              <VoiceConversationIllustration
                isPlaying={true}
                speakerName="Sơn Tùng M-TP (Voice AI)"
                customerName="Khách hàng B2B"
              />
            )}
            {activeStep === 2 && <MultiAgentOrchestratorIllustration activeStep={0} />}
            {activeStep === 3 && <CloudStackIllustration />}
          </div>

          {/* Right 6 Cols: Clean Telemetry & Signal Flow */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-indigo-400">
                <span>{cur.icon}</span>
                <span>BƯỚC {cur.id} • {cur.channel}</span>
              </div>
              {simComplete && (
                <span className="rounded-full bg-emerald-500/20 px-3 py-0.5 text-[11px] font-bold text-emerald-300">
                  ✓ Luồng 4 Bước Hoàn Tất (1.14s)
                </span>
              )}
            </div>

            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {cur.title}
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {cur.desc}
            </p>

            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3.5 py-1.5 text-xs font-mono text-cyan-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{cur.tech}</span>
            </div>

            {/* Signal Flow Strip */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3 text-xs border-t border-white/10">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="text-slate-400">Đầu vào:</span>
                <strong className="font-mono text-white">{cur.inputChip}</strong>
              </div>

              <span className="hidden sm:inline text-cyan-400 font-bold">&rarr;</span>

              <div className="flex items-center gap-2 text-emerald-300">
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
