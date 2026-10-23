'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function InteractiveBentoShowcase() {
  // Voice AI Simulator State
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [voiceTimer, setVoiceTimer] = useState(14);
  const [selectedVoice, setSelectedVoice] = useState<'hoaimy' | 'minhquang' | 'tuandung'>('hoaimy');

  // Lead Scoring Scenario State
  const [scoringScenario, setScoringScenario] = useState<'enterprise' | 'sme' | 'cold'>('enterprise');

  // HITL Approval State
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved'>('pending');

  // Timer loop for voice call simulation
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
      name: 'Tập đoàn Công nghệ Alpha (Quy mô 120 nhân sự)',
      score: 95,
      tier: 'HOT LEAD 🔥',
      tierColor: 'bg-emerald-500 text-white shadow-emerald-500/30',
      churnRisk: '4%',
      factors: [
        { label: 'Quy mô Doanh nghiệp', value: '+35 pts', color: 'text-emerald-600' },
        { label: 'Thời gian gọi tư vấn > 3 phút', value: '+25 pts', color: 'text-emerald-600' },
        { label: 'Yêu cầu báo giá trực tiếp', value: '+35 pts', color: 'text-emerald-600' },
      ],
      recommendation: 'Kích hoạt kịch bản chốt đơn nhanh (WF-14), gửi Báo giá kèm chiết khấu 10%.',
    },
    sme: {
      name: 'Chuỗi Bán lẻ Thời trang Nova (3 Chi nhánh)',
      score: 72,
      tier: 'WARM LEAD ⚡',
      tierColor: 'bg-amber-500 text-white shadow-amber-500/30',
      churnRisk: '22%',
      factors: [
        { label: 'Ngân sách vừa phải', value: '+20 pts', color: 'text-indigo-600' },
        { label: 'Cần tích hợp Zalo Mini App', value: '+30 pts', color: 'text-indigo-600' },
        { label: 'Chờ đối tác duyệt thêm', value: '+22 pts', color: 'text-amber-600' },
      ],
      recommendation: 'Gửi tài liệu giải pháp qua Zalo (WF-09), lên lịch gọi chăm sóc lại sau 48h.',
    },
    cold: {
      name: 'Người dùng khảo sát vãng lai (Chưa rõ nhu cầu)',
      score: 28,
      tier: 'COLD LEAD ❄️',
      tierColor: 'bg-slate-500 text-white shadow-slate-500/20',
      churnRisk: '78%',
      factors: [
        { label: 'Số điện thoại cá nhân', value: '+10 pts', color: 'text-slate-500' },
        { label: 'Cuộc gọi tắt máy sau 8s', value: '-15 pts', color: 'text-rose-600' },
        { label: 'Không để lại thông tin công ty', value: '+0 pts', color: 'text-slate-400' },
      ],
      recommendation: 'Đưa vào danh sách nuôi dưỡng tự động qua Email Newsletter 7 ngày (WF-21).',
    },
  };

  const currentScen = scenarios[scoringScenario];

  return (
    <div className="space-y-6">
      {/* Section Header: Minimalist & Direct */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700 border border-indigo-200/60 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
            Trực Quan Hóa Tác Tử AI
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Xem Trực Tiếp 4 Tác Tử AI Hoạt Động
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-xl">
            Tương tác trực tiếp với mô phỏng đàm thoại Voice AI, chấm điểm khách hàng và phê duyệt báo giá.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-white/80 backdrop-blur-sm border border-slate-200/80 px-3 py-1.5 rounded-xl self-start md:self-auto">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
          <span>Thời gian phản hồi SLA: &lt; 800ms</span>
        </div>
      </div>

      {/* Asymmetric Bento Grid 2.0 Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ========================================================= */}
        {/* BENTO 1: LIVE VOICE AI SIMULATION (7 Cols)                */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-md p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
          {/* Subtle Ambient Gradient Corner */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />

          <div>
            {/* Top Bar with Live Call Status & Voice Selector */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="relative flex h-3 w-3">
                  <span className={`absolute inline-flex h-full w-full rounded-full ${isPlayingVoice ? 'bg-emerald-400 animate-ping opacity-75' : 'bg-slate-300'}`} />
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${isPlayingVoice ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                </div>
                <div>
                  <span className="font-mono text-xs font-bold text-slate-900 block leading-none">
                    {isPlayingVoice ? `LIVE CALL: 00:${voiceTimer < 10 ? `0${voiceTimer}` : voiceTimer}` : 'VOICE AI ENGINE: SẴN SÀNG'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Whisper v3 + ElevenLabs Neural TTS</span>
                </div>
              </div>

              {/* Voice Timbre Selector Pills */}
              <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl text-[11px] font-semibold text-slate-600">
                <button
                  type="button"
                  onClick={() => setSelectedVoice('hoaimy')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${selectedVoice === 'hoaimy' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'hover:text-slate-900'}`}
                >
                  Hoài My (Nữ)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedVoice('minhquang')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${selectedVoice === 'minhquang' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'hover:text-slate-900'}`}
                >
                  Minh Quang (Nam)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedVoice('tuandung')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${selectedVoice === 'tuandung' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'hover:text-slate-900'}`}
                >
                  Tuấn Dũng (Nam)
                </button>
              </div>
            </div>

            {/* Interactive Audio Waveform Canvas */}
            <div className="rounded-2xl bg-slate-950 p-5 text-white shadow-inner relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="font-mono text-xs text-slate-400 font-bold uppercase tracking-wider">
                    Audio Frequency Spectrum
                  </span>
                </div>

                <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-800/60 px-2 py-0.5 rounded-md">
                  Độ trễ: 720ms
                </span>
              </div>

              {/* Animated Waveform Bars */}
              <div className="h-16 flex items-center justify-between gap-1 px-2">
                {[18, 35, 60, 42, 85, 95, 70, 45, 90, 100, 75, 55, 80, 92, 65, 40, 88, 70, 45, 60, 35, 50, 25, 40].map((h, i) => (
                  <div
                    key={i}
                    className="w-1.5 rounded-full bg-gradient-to-t from-indigo-500 via-purple-400 to-cyan-300 transition-all duration-150"
                    style={{
                      height: isPlayingVoice ? `${Math.max(12, (h * (Math.sin((i + voiceTimer) * 0.8) + 1.2)) / 2)}%` : '18%',
                      opacity: isPlayingVoice ? 0.95 : 0.35,
                    }}
                  />
                ))}
              </div>

              {/* Live Transcript Bubble */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-[11px] font-bold text-white shadow-sm">
                  AI
                </div>
                <div className="space-y-1 text-xs">
                  <p className="text-slate-200 leading-relaxed font-sans">
                    {isPlayingVoice
                      ? '“Dạ chào anh Bảo, em là trợ lý AI từ SmartHub. Em thấy bên mình vừa để lại yêu cầu tích hợp CRM và tổng đài Voice AI...”'
                      : 'Bấm nút "Nghe thử đàm thoại" bên dưới để kích hoạt mô phỏng cuộc gọi thoại AI.'}
                  </p>
                  {isPlayingVoice && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="inline-flex items-center gap-1 rounded bg-indigo-950/80 border border-indigo-700/60 px-1.5 py-0.5 text-[10px] font-mono text-indigo-300">
                        Ý định: Quan tâm CRM (98.2%)
                      </span>
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-950/80 border border-emerald-700/60 px-1.5 py-0.5 text-[10px] font-mono text-emerald-300">
                        Cảm xúc: Tích cực
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setIsPlayingVoice(!isPlayingVoice)}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all ${
                isPlayingVoice
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20 hover:bg-rose-700'
                  : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700'
              }`}
            >
              <span>{isPlayingVoice ? '⏹ Dừng Cuộc Gọi' : '▶ Nghe Thử Đàm Thoại AI'}</span>
            </button>

            <Link
              href="/sales"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-indigo-600 transition-colors"
            >
              <span>Vào Studio Voice AI đầy đủ</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>

        {/* ========================================================= */}
        {/* BENTO 2: AI LEAD SCORING RADAR (5 Cols)                   */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-md p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Llama 3.3 70B AI Engine
                </span>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Mô Phỏng Chấm Điểm Lead
                </h3>
              </div>

              {/* Scenario Toggles */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setScoringScenario('enterprise')}
                  className={`px-2 py-0.5 rounded-lg transition-all ${scoringScenario === 'enterprise' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500'}`}
                >
                  Hot 🔥
                </button>
                <button
                  type="button"
                  onClick={() => setScoringScenario('sme')}
                  className={`px-2 py-0.5 rounded-lg transition-all ${scoringScenario === 'sme' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-500'}`}
                >
                  Warm ⚡
                </button>
                <button
                  type="button"
                  onClick={() => setScoringScenario('cold')}
                  className={`px-2 py-0.5 rounded-lg transition-all ${scoringScenario === 'cold' ? 'bg-white text-slate-700 shadow-2xs' : 'text-slate-500'}`}
                >
                  Cold ❄️
                </button>
              </div>
            </div>

            {/* Customer Name */}
            <div className="mb-4">
              <span className="text-[11px] text-slate-400">Hồ sơ khách hàng:</span>
              <p className="text-xs font-bold text-slate-900 line-clamp-1">{currentScen.name}</p>
            </div>

            {/* Giant Radial Score HUD */}
            <div className="flex items-center gap-5 my-4 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60">
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white shadow-xs border border-slate-200/80">
                <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                  {currentScen.score}
                </span>
                <span className="absolute bottom-1.5 text-[9px] font-bold text-slate-400">/ 100</span>
              </div>

              <div className="space-y-1.5 min-w-0">
                <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-extrabold shadow-sm ${currentScen.tierColor}`}>
                  {currentScen.tier}
                </span>
                <p className="text-[11px] text-slate-500">
                  Tỷ lệ rủi ro Churn: <span className="font-bold text-slate-900">{currentScen.churnRisk}</span>
                </p>
                <p className="text-[11px] text-slate-600 line-clamp-2 italic">
                  &ldquo;{currentScen.recommendation}&rdquo;
                </p>
              </div>
            </div>

            {/* AI Breakdown Factor Pills */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Các yếu tố AI phân tích:
              </span>
              <div className="space-y-1.5">
                {currentScen.factors.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-white border border-slate-200/70 shadow-2xs"
                  >
                    <span className="text-slate-600 font-medium">{f.label}</span>
                    <span className={`font-mono font-bold ${f.color}`}>{f.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-400">Tự động gắn thẻ CRM trong 350ms</span>
            <Link
              href="/dashboard"
              className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Xem BI Analytics &rarr;
            </Link>
          </div>
        </div>

        {/* ========================================================= */}
        {/* BENTO 3: REAL-TIME INGESTION FEED (6 Cols)                */}
        {/* ========================================================= */}
        <div className="lg:col-span-6 rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-md p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  Phễu Ingestion Đa Kênh Tự Hành
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60 font-semibold">
                WF-07 &amp; WF-08
              </span>
            </div>

            {/* Live Event Stream Telemetry (Not plain text boxes!) */}
            <div className="space-y-2.5">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-indigo-50/40 border border-indigo-100 transition-all hover:bg-indigo-50/70">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-2xs">
                  Zalo
                </div>
                <div className="min-w-0 flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 truncate">Nguyễn Hoàng Bảo (Giám đốc Dự án)</span>
                    <span className="text-[10px] text-slate-400 font-mono">Vừa xong</span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">Yêu cầu demo gói Doanh nghiệp • Đã vector hóa vào pgvector</p>
                  <div className="mt-1 flex items-center gap-1.5 text-[10px]">
                    <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-emerald-800 font-bold">Khử trùng lặp: Đạt</span>
                    <span className="rounded bg-indigo-100 px-1.5 py-0.2 text-indigo-800 font-bold">Điểm AI: 96</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50/80 border border-slate-200/70 transition-all hover:bg-slate-50">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white font-bold text-xs shadow-2xs">
                  Web
                </div>
                <div className="min-w-0 flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 truncate">Trần Thu Hà (Trưởng phòng Thu mua)</span>
                    <span className="text-[10px] text-slate-400 font-mono">18s trước</span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">Web Form tư vấn • Đồng bộ CRM trong 320ms</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50/80 border border-slate-200/70 transition-all hover:bg-slate-50">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-600 text-white font-bold text-xs shadow-2xs">
                  Call
                </div>
                <div className="min-w-0 flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 truncate">Lê Anh Tuấn (Công ty Nova Smart)</span>
                    <span className="text-[10px] text-slate-400 font-mono">45s trước</span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">Cuộc gọi Voice AI tự động hoàn tất • 02:45 phút</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-400 font-medium">Bảo vệ chống Spam &amp; Gửi trùng</span>
            <Link
              href="/contact"
              className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <span>Gửi Lead Thử Nghiệm</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>

        {/* ========================================================= */}
        {/* BENTO 4: HITL QUOTATION & TELEGRAM APPROVAL (6 Cols)      */}
        {/* ========================================================= */}
        <div className="lg:col-span-6 rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-md p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-base">🛡️</span>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Báo Giá &amp; Phê Duyệt HITL 1-Click
                </h3>
              </div>
              <span className="text-[10px] font-mono text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 font-semibold">
                WF-14 &amp; WF-16
              </span>
            </div>

            {/* Quotation Slip Preview */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3 border-b border-slate-200/70 pb-2.5">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Số hiệu báo giá</span>
                  <span className="font-mono text-xs font-black text-slate-900">#BG-2026-VKU-08</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Trạng thái duyệt</span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      approvalStatus === 'approved'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {approvalStatus === 'approved' ? '✓ ĐÃ PHÊ DUYỆT' : '⏳ CHỜ QUẢN LÝ DUYỆT'}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Gói Dịch Vụ:</span>
                  <span className="font-semibold text-slate-900">AI Sales Agent Enterprise (12 Tháng)</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Mức chiết khấu đề xuất:</span>
                  <span className="font-mono font-bold text-emerald-600">15.0% (-7,500,000 đ)</span>
                </div>
                <div className="flex justify-between text-slate-900 pt-2 border-t border-slate-200 font-bold">
                  <span>Tổng thanh toán:</span>
                  <span className="font-mono text-sm text-indigo-700">42,500,000 VNĐ</span>
                </div>
              </div>
            </div>

            {/* Interactive Approval Simulator */}
            <div className="mt-4 flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-100/80 border border-slate-200/80">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500 text-white text-xs font-bold shadow-2xs">
                  TG
                </div>
                <div className="text-[11px]">
                  <span className="font-bold text-slate-800 block">Telegram HITL Webhook</span>
                  <span className="text-slate-500">Phê duyệt từ xa bảo mật qua JWT</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setApprovalStatus(approvalStatus === 'pending' ? 'approved' : 'pending')}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all shadow-sm ${
                  approvalStatus === 'approved'
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-slate-900 text-white hover:bg-indigo-600'
                }`}
              >
                {approvalStatus === 'approved' ? '✓ Hoàn Tất' : 'Bấm Phê Duyệt Thử'}
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-400">Kiểm soát chiết khấu tự động</span>
            <Link
              href="/sales"
              className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Quản trị Báo giá &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
