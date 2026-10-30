'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  VoiceConversationIllustration,
  RagVectorSearchIllustration,
  MultiAgentOrchestratorIllustration,
} from './AnimatedIllustrations';

export default function InteractiveBentoShowcase() {
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [voiceTimer, setVoiceTimer] = useState(14);
  const [selectedVoice, setSelectedVoice] = useState<'trucly' | 'baoclone' | 'minhquan'>('trucly');
  const [scoringScenario, setScoringScenario] = useState<'enterprise' | 'sme' | 'cold'>('enterprise');
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved'>('pending');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlayingVoice) {
      interval = setInterval(() => {
        setVoiceTimer((t) => (t >= 59 ? 1 : t + 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlayingVoice]);

  const scenarios = {
    enterprise: {
      name: 'Tập đoàn Công nghệ Alpha (120 nhân sự)',
      score: 95,
      tier: 'HOT LEAD 🔥',
      color: '#10b981',
      churnRisk: '4%',
      factors: [
        { label: 'Quy mô Doanh nghiệp B2B', pct: 95, value: '+35đ' },
        { label: 'Thời lượng đàm thoại > 3 phút', pct: 88, value: '+25đ' },
        { label: 'Yêu cầu báo giá & SLA trực tiếp', pct: 96, value: '+35đ' },
      ],
      recommendation: 'Kích hoạt chốt đơn nhanh (WF-04) & trình duyệt chiết khấu 15% (WF-03).',
    },
    sme: {
      name: 'Chuỗi Bán lẻ Thời trang Nova (3 Chi nhánh)',
      score: 72,
      tier: 'WARM LEAD ⚡',
      color: '#f59e0b',
      churnRisk: '22%',
      factors: [
        { label: 'Ngân sách gói Pro (5Tr/tháng)', pct: 75, value: '+25đ' },
        { label: 'Quan tâm tích hợp Zalo OA & CRM', pct: 80, value: '+25đ' },
        { label: 'Đang so sánh đối tác', pct: 60, value: '+22đ' },
      ],
      recommendation: 'Kích hoạt dùng thử 14 ngày miễn phí & hẹn gọi lại sau 48h.',
    },
    cold: {
      name: 'Khách vãng lai khảo sát thông tin',
      score: 28,
      tier: 'COLD LEAD ❄️',
      color: '#64748b',
      churnRisk: '78%',
      factors: [
        { label: 'Chưa xác định quy mô đội sale', pct: 30, value: '+15đ' },
        { label: 'Cuộc gọi kết thúc sớm (<10s)', pct: 20, value: '+13đ' },
        { label: 'Chưa có nhu cầu triển khai ngay', pct: 15, value: '+0đ' },
      ],
      recommendation: 'Lưu vào phễu chăm sóc tự động định kỳ qua n8n.',
    },
  };

  const currentScen = scenarios[scoringScenario];
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (currentScen.score / 100) * circumference;

  function toggleDemoVoice() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (isPlayingVoice) {
        window.speechSynthesis.cancel();
        setIsPlayingVoice(false);
        return;
      }
      const text =
        selectedVoice === 'trucly'
          ? 'Dạ xin kính chào quý khách đã gọi đến tổng đài AI Sales Agent! Em là Trúc Ly, rất vui được hỗ trợ anh chị ạ.'
          : selectedVoice === 'baoclone'
            ? 'Chào anh chị, em là Bảo từ hệ thống AI Sales Agent. Hôm nay em xin tư vấn giải pháp tự động hóa bán hàng cho mình ạ.'
            : 'Dạ em chào anh chị, em là Minh Quân chuyên viên tư vấn gói Pro và Enterprise của AI Sales Agent ạ.';
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'vi-VN';
      u.onend = () => setIsPlayingVoice(false);
      u.onerror = () => setIsPlayingVoice(false);
      setIsPlayingVoice(true);
      window.speechSynthesis.speak(u);
    } else {
      setIsPlayingVoice(!isPlayingVoice);
    }
  }

  return (
    <div className="space-y-8">
      {/* Open Section Title */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700 mb-2">
            <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
            Hoạt Họa Tương Tác Trực Quan
          </div>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900">
            Trải Nghiệm Sức Mạnh 4 Trụ Cột AI
          </h2>
        </div>

        <Link
          href="/sales"
          className="inline-flex items-center gap-2 text-xs font-extrabold text-indigo-600 hover:text-indigo-800 group"
        >
          <span>Mở toàn bộ 6 Workflows trong Workspace</span>
          <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
        </Link>
      </div>

      {/* Bento Grid with Animated Vector Illustrations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ========================================================= */}
        {/* BENTO 1: ANIMATED VOICE STUDIO (7 Cols)                   */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 rounded-[2rem] bg-slate-950 text-white shadow-xl overflow-hidden flex flex-col justify-between p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3.5 py-1 text-xs font-bold text-cyan-300">
              <span className={`h-2 w-2 rounded-full ${isPlayingVoice ? 'bg-emerald-400 animate-ping' : 'bg-cyan-400'}`} />
              {isPlayingVoice ? `ON AIR • 00:${voiceTimer < 10 ? `0${voiceTimer}` : voiceTimer}` : 'VieNeu-TTS v3 Nano 24kHz'}
            </span>

            <div className="flex items-center gap-1 rounded-full bg-slate-900 p-1 text-[11px] font-bold">
              {[
                { id: 'trucly' as const, label: '🌸 Trúc Ly' },
                { id: 'baoclone' as const, label: '🎙️ Bảo Clone' },
                { id: 'minhquan' as const, label: '⚡ Minh Quân' },
              ].map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVoice(v.id)}
                  className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                    selectedVoice === v.id
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Animated SVG Voice Conversation Scene */}
          <div className="rounded-2xl bg-slate-900/70 p-2 my-1">
            <VoiceConversationIllustration
              isPlaying={isPlayingVoice}
              speakerName={
                selectedVoice === 'trucly'
                  ? 'Trúc Ly (Lễ tân)'
                  : selectedVoice === 'baoclone'
                    ? 'Bảo (Voice Clone)'
                    : 'Minh Quân AI'
              }
              customerName="Khách hàng Doanh nghiệp"
            />
          </div>

          <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 max-w-md">
              <h3 className="text-lg font-black text-white">
                Đàm Thoại Rảnh Tay &amp; Zero-Shot Voice Cloning
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Tự động nhận diện giọng nói qua Micro, trả lời bằng giọng nữ lễ tân <strong className="text-cyan-300">Trúc Ly</strong> hoặc giọng <strong className="text-indigo-300">Bảo Clone</strong> chính chủ.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={toggleDemoVoice}
                className={`rounded-full px-5 py-2.5 text-xs font-extrabold text-white transition-all cursor-pointer ${
                  isPlayingVoice
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-indigo-600 hover:bg-indigo-500'
                }`}
              >
                {isPlayingVoice ? '⏹ Dừng Phát' : '🔊 Nghe Thử Ngay'}
              </button>
              <Link
                href="/sales"
                className="rounded-full bg-slate-900 hover:bg-slate-800 px-4 py-2.5 text-xs font-bold text-white transition-all"
              >
                Gọi thật &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* BENTO 2: ANIMATED RADAR LEAD SCORING (5 Cols)             */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 rounded-[2rem] glass-panel p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 block">
                  AI Predictive Radar
                </span>
                <h3 className="text-base font-black text-slate-900">
                  Chấm Điểm Lead Tự Động (0–100)
                </h3>
              </div>

              <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-full text-[11px] font-bold">
                {[
                  { id: 'enterprise' as const, label: '🔥 Hot' },
                  { id: 'sme' as const, label: '⚡ Warm' },
                  { id: 'cold' as const, label: '❄️ Cold' },
                ].map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setScoringScenario(b.id)}
                    className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                      scoringScenario === b.id ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Animated SVG Circular Radar Gauge */}
            <div className="flex items-center gap-6 my-4">
              <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
                <svg className="h-28 w-28 -rotate-90 transform" viewBox="0 0 96 96">
                  <circle
                    cx="48"
                    cy="48"
                    r={radius}
                    stroke="#e2e8f0"
                    strokeWidth="7"
                    fill="transparent"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r={radius}
                    stroke={currentScen.color}
                    strokeWidth="7"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-2xl font-black font-mono text-slate-900 block leading-none">
                    {currentScen.score}
                  </span>
                  <span className="text-[9px] font-bold uppercase text-slate-400">Điểm AI</span>
                </div>
              </div>

              <div className="space-y-1.5 min-w-0">
                <span
                  className="inline-block rounded-full px-3 py-0.5 text-[11px] font-extrabold text-white shadow-sm"
                  style={{ backgroundColor: currentScen.color }}
                >
                  {currentScen.tier}
                </span>
                <p className="text-xs font-extrabold text-slate-900 truncate">{currentScen.name}</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">{currentScen.recommendation}</p>
              </div>
            </div>

            {/* Clean Progress Bars */}
            <div className="space-y-3 pt-2">
              {currentScen.factors.map((f, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{f.label}</span>
                    <span className="font-mono font-bold text-indigo-600">{f.value}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-200/70 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-700"
                      style={{ width: `${f.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Rủi ro rời bỏ (Churn): <strong className="text-slate-700">{currentScen.churnRisk}</strong>
            </span>
            <Link href="/dashboard" className="font-extrabold text-indigo-600 hover:text-indigo-800">
              Xem biểu đồ BI &rarr;
            </Link>
          </div>
        </div>

        {/* ========================================================= */}
        {/* BENTO 3: ANIMATED VECTOR RAG SCANNER (6 Cols)             */}
        {/* ========================================================= */}
        <div className="lg:col-span-6 rounded-[2rem] glass-panel p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-700 block">
                  PostgreSQL 17 • pgvector
                </span>
                <h3 className="text-base font-black text-slate-900">Kho Tri Thức 12 Chủ Đề Nghiệp Vụ</h3>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-[11px] font-mono font-bold text-emerald-800">
                12/12 Vector Chunks
              </span>
            </div>

            <div className="rounded-2xl bg-slate-950 p-3">
              <RagVectorSearchIllustration topicLabel="Chính sách giá B2B" similarity="98.4%" />
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                '💰 Bảng giá Starter/Pro/Enterprise',
                '🎁 Ưu đãi & Chiết khấu 15-20%',
                '🆓 Dùng thử 14 ngày Free',
                '🎙️ Công nghệ VieNeu-TTS & Clone',
                '🔗 Tích hợp Zalo OA, HubSpot',
                '🛡️ Bảo mật AES-256 & ISO 27001',
              ].map((topic) => (
                <span
                  key={topic}
                  className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-bold text-indigo-800"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-200/60 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Độ tương đồng ngữ nghĩa: <strong className="text-emerald-600 font-mono">98.4%</strong>
            </span>
            <Link href="/sales" className="font-extrabold text-indigo-600 hover:text-indigo-800">
              Hỏi thử Lễ tân AI &rarr;
            </Link>
          </div>
        </div>

        {/* ========================================================= */}
        {/* BENTO 4: ANIMATED MULTI-AGENT & HITL GATE (6 Cols)        */}
        {/* ========================================================= */}
        <div className="lg:col-span-6 rounded-[2rem] glass-panel p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-700 block">
                  Multi-Agent &amp; Human-in-the-Loop
                </span>
                <h3 className="text-base font-black text-slate-900">Điều Phối Báo Giá &amp; Phê Duyệt Ngoại Lệ</h3>
              </div>
              <span
                className={`rounded-full px-3 py-0.5 text-[11px] font-bold ${
                  approvalStatus === 'approved'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {approvalStatus === 'approved' ? '✓ ĐÃ DUYỆT' : '⏳ CHỜ DUYỆT'}
              </span>
            </div>

            <div className="rounded-2xl bg-slate-950 p-3">
              <MultiAgentOrchestratorIllustration activeStep={approvalStatus === 'approved' ? 0 : 2} />
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-[11px] text-slate-500 block">Dự thảo hợp đồng #BG-2026-VKU</span>
                <p className="text-sm font-black text-slate-900">Gói AI Sales Agent Enterprise (12 Tháng)</p>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-emerald-600 font-bold block">Chiết khấu 15%</span>
                <span className="font-mono text-lg font-black text-indigo-700">42.500.000 đ</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 pt-4 mt-4 border-t border-slate-200/60">
            <button
              type="button"
              onClick={() => setApprovalStatus(approvalStatus === 'pending' ? 'approved' : 'pending')}
              className={`rounded-full px-5 py-2 text-xs font-extrabold text-white transition-all cursor-pointer ${
                approvalStatus === 'approved'
                  ? 'bg-emerald-600'
                  : 'bg-slate-900 hover:bg-indigo-600'
              }`}
            >
              {approvalStatus === 'approved' ? '✓ Đã Ký Số & Phát Hành' : '🛡️ Bấm Phê Duyệt Thử 1-Click'}
            </button>

            <Link href="/sales" className="text-xs font-extrabold text-indigo-600 hover:text-indigo-800">
              Vào cổng HITL &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
