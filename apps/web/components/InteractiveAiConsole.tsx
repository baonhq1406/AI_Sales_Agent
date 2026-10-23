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
      dialogue: [
        { speaker: 'AI Sales', text: 'Chào anh Tuấn! Em là trợ lý AI từ SmartLogistics, nhận thấy công ty đang mở rộng thêm 40 xe vận tải...' },
        { speaker: 'Khách hàng', text: 'Bên anh cần tích hợp định tuyến AI và nhận báo giá trong hôm nay để kịp trình ban giám đốc.' },
        { speaker: 'Agent Router', text: '⚡ Ý định: Mua hàng khẩn cấp • Điểm: 95/100 🟢 HOT LEAD • Đang lập Báo giá PDF (WF-14)...' },
      ],
      quoteAmount: '180.000.000 đ',
      discount: '15%',
    },
    {
      company: 'Chuỗi Bán lẻ Vinamart',
      need: 'Nâng cấp phần mềm quản lý kho 12 chi nhánh',
      score: 88,
      intent: 'Software Upgrade',
      dialogue: [
        { speaker: 'AI Sales', text: 'Dạ chào chị Thảo, AI Sales Agent xin phép kết nối để hỗ trợ khảo sát tự động hóa 12 điểm bán lẻ ạ.' },
        { speaker: 'Khách hàng', text: 'Chi phí triển khai thế nào em? Có demo trên dữ liệu thật của bên chị được không?' },
        { speaker: 'Agent Router', text: '⚡ Ý định: Yêu cầu Demo & Báo giá • Điểm: 88/100 🟡 WARM • Lên lịch gọi video chuyên sâu (WF-02)...' },
      ],
      quoteAmount: '95.000.000 đ',
      discount: '10%',
    },
  ];

  const current = scenarios[activeScenario];

  // Optional Web Speech synthesis for real voice demo
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
      setTimeout(() => setIsPlayingAudio(false), 3000);
    }
  }

  // Auto soundwave timer
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div className="relative w-full">
      {/* Ambient background glow behind the console */}
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-cyan-500/20 blur-xl opacity-75" />

      {/* Floating Widget 1: Top-Right Stats Pill */}
      <div className="animate-float absolute -top-4 -right-2 z-20 hidden sm:flex items-center gap-2 rounded-2xl bg-white/95 px-3.5 py-2 shadow-xl border border-indigo-100 backdrop-blur-md">
        <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 text-xs font-bold">
          ⚡
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold text-slate-400">Tốc độ chốt Deal</p>
          <p className="text-xs font-extrabold text-slate-900">+340% Năng suất</p>
        </div>
      </div>

      {/* Floating Widget 2: Bottom-Left Score Pill */}
      <div className="animate-float-delayed absolute -bottom-4 -left-2 z-20 hidden sm:flex items-center gap-2 rounded-2xl bg-slate-900/95 px-3.5 py-2 shadow-2xl border border-slate-700/80 text-white backdrop-blur-md">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </span>
        <span className="text-xs font-mono font-bold text-emerald-300">
          Llama 3.3: {current.score}/100 🟢 HOT
        </span>
      </div>

      {/* Main Glass Console Card */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 text-slate-100 shadow-2xl">
        {/* Terminal Window Header */}
        <div className="flex items-center justify-between border-b border-slate-800/90 bg-slate-900/80 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-rose-500/90 inline-block" />
            <span className="h-3 w-3 rounded-full bg-amber-500/90 inline-block" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/90 inline-block" />
            <span className="ml-2 font-mono text-[11px] font-medium text-slate-400 hidden sm:inline-block">
              core-engine.v2.sales-agent // live-stream
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-800/60">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE • 24ms</span>
            </span>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-800/80 bg-slate-900/40 px-3 pt-2 gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveMode('voice')}
            className={`flex items-center gap-1.5 rounded-t-xl px-3.5 py-2 text-xs font-bold transition-all ${
              activeMode === 'voice'
                ? 'bg-slate-800 text-white border-t border-x border-slate-700/80'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <span>🎙️</span>
            <span>Voice AI Live Call</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('nodes')}
            className={`flex items-center gap-1.5 rounded-t-xl px-3.5 py-2 text-xs font-bold transition-all ${
              activeMode === 'nodes'
                ? 'bg-slate-800 text-white border-t border-x border-slate-700/80'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <span>⚡</span>
            <span>Multi-Agent Mesh</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('approval')}
            className={`flex items-center gap-1.5 rounded-t-xl px-3.5 py-2 text-xs font-bold transition-all ${
              activeMode === 'approval'
                ? 'bg-slate-800 text-white border-t border-x border-slate-700/80'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <span>🛡️</span>
            <span>Phê Duyệt HITL</span>
          </button>
        </div>

        {/* Console Body */}
        <div className="p-4 sm:p-5">
          {/* MODE 1: Voice AI Call Simulation */}
          {activeMode === 'voice' && (
            <div className="space-y-4">
              {/* Call Bar & Visualizer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/90 p-3.5">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md">
                    <span className="text-base">📞</span>
                    <span className="animate-pulse-ring absolute inset-0 rounded-xl bg-indigo-500/40" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-white">{current.company}</p>
                      <span className="rounded bg-indigo-500/20 px-1.5 py-0.2 text-[9px] font-bold text-indigo-300">
                        Outbound WF-01
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">Đang đàm thoại • 00:28</p>
                  </div>
                </div>

                {/* Animated Soundwave Equalizer */}
                <div className="flex items-center gap-1 h-8 px-2 py-1 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="w-1 bg-cyan-400 rounded-full animate-soundwave-1" />
                  <span className="w-1 bg-indigo-400 rounded-full animate-soundwave-2" />
                  <span className="w-1 bg-purple-400 rounded-full animate-soundwave-3" />
                  <span className="w-1 bg-pink-400 rounded-full animate-soundwave-4" />
                  <span className="w-1 bg-cyan-400 rounded-full animate-soundwave-5" />
                  <span className="w-1 bg-indigo-400 rounded-full animate-soundwave-6" />
                  <span className="w-1 bg-purple-400 rounded-full animate-soundwave-7" />
                  <span className="w-1 bg-pink-400 rounded-full animate-soundwave-8" />
                </div>

                {/* Audio Trigger button */}
                <button
                  type="button"
                  onClick={speakVoice}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-all"
                >
                  <span>{isPlayingAudio ? '⏹ Đang phát' : '▶ Nghe Giọng Nói AI'}</span>
                </button>
              </div>

              {/* Live Transcript Stream */}
              <div className="space-y-2.5 rounded-2xl bg-slate-900/60 p-3.5 border border-slate-800/80 font-sans text-xs">
                {current.dialogue.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-2.5 p-2 rounded-xl transition-all ${
                      item.speaker === 'AI Sales'
                        ? 'bg-indigo-950/40 border border-indigo-900/40'
                        : item.speaker === 'Khách hàng'
                        ? 'bg-slate-800/50 border border-slate-700/40'
                        : 'bg-emerald-950/40 border border-emerald-900/40'
                    }`}
                  >
                    <span
                      className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                        item.speaker === 'AI Sales'
                          ? 'bg-indigo-500/20 text-indigo-300'
                          : item.speaker === 'Khách hàng'
                          ? 'bg-slate-700 text-slate-200'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {item.speaker}
                    </span>
                    <p className="text-slate-300 leading-relaxed min-w-0 flex-1">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>

              {/* Scenario Toggle */}
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-slate-400">Chuyển kịch bản thực tế:</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveScenario(0)}
                    className={`rounded-lg px-2.5 py-1 font-semibold transition-all ${
                      activeScenario === 0
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Logistics 40 xe
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveScenario(1)}
                    className={`rounded-lg px-2.5 py-1 font-semibold transition-all ${
                      activeScenario === 1
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Bán lẻ 12 kho
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODE 2: Multi-Agent Interactive Mesh */}
          {activeMode === 'nodes' && (
            <div className="space-y-4">
              <div className="relative rounded-2xl border border-slate-800 bg-slate-900/90 p-4 overflow-hidden">
                <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 mb-3">
                  Sơ đồ Tương tác Đa Tác Tử (Live n8n Webhook Architecture)
                </p>

                {/* Animated Node Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center relative z-10">
                  <div className="rounded-xl border border-indigo-500/40 bg-indigo-950/50 p-2.5">
                    <span className="text-lg">📥</span>
                    <p className="text-[11px] font-bold text-white mt-1">01. Ingestion</p>
                    <p className="text-[9px] text-indigo-300">Web Form &amp; Zalo</p>
                    <span className="inline-block mt-1.5 rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[8px] font-bold text-emerald-400">
                      WF-07 Active
                    </span>
                  </div>

                  <div className="rounded-xl border border-purple-500/40 bg-purple-950/50 p-2.5">
                    <span className="text-lg">🧠</span>
                    <p className="text-[11px] font-bold text-white mt-1">02. AI Scoring</p>
                    <p className="text-[9px] text-purple-300">Llama 3.3 70B</p>
                    <span className="inline-block mt-1.5 rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[8px] font-bold text-emerald-400">
                      Score: {current.score}/100
                    </span>
                  </div>

                  <div className="rounded-xl border border-cyan-500/40 bg-cyan-950/50 p-2.5">
                    <span className="text-lg">🎙️</span>
                    <p className="text-[11px] font-bold text-white mt-1">03. Voice Bot</p>
                    <p className="text-[9px] text-cyan-300">Whisper + ElevenLabs</p>
                    <span className="inline-block mt-1.5 rounded-full bg-cyan-500/20 px-1.5 py-0.2 text-[8px] font-bold text-cyan-400">
                      Outbound Live
                    </span>
                  </div>

                  <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/50 p-2.5">
                    <span className="text-lg">🛡️</span>
                    <p className="text-[11px] font-bold text-white mt-1">04. HITL Gate</p>
                    <p className="text-[9px] text-emerald-300">Duyệt Báo Giá PDF</p>
                    <span className="inline-block mt-1.5 rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[8px] font-bold text-amber-400">
                      Chờ Manager
                    </span>
                  </div>
                </div>

                {/* Laser animation bar */}
                <div className="relative mt-4 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-cyan-400 to-purple-500 animate-shimmer" />
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-indigo-400 text-[11px]">Payload Event JSON:</span>
                  <span className="text-[10px] text-slate-500">PostgreSQL pgvector Synced</span>
                </div>
                <pre className="mt-1.5 font-mono text-[10px] text-slate-400 bg-slate-950 p-2 rounded-lg overflow-x-auto">
{`{
  "lead_id": "LD-${current.score}981",
  "company": "${current.company}",
  "intent": "${current.intent}",
  "lead_score": ${current.score},
  "recommended_action": "TRIGGER_WF_14_PDF_QUOTE"
}`}
                </pre>
              </div>
            </div>
          )}

          {/* MODE 3: HITL Manager Approval Interactive Simulator */}
          {activeMode === 'approval' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-indigo-400">WF-16 HITL Engine</span>
                    <h4 className="text-xs font-bold text-white mt-0.5">
                      Dự Thảo Báo Giá PDF Tự Động: {current.company}
                    </h4>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      approvalStatus === 'approved'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : approvalStatus === 'rejected'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    }`}
                  >
                    {approvalStatus === 'approved'
                      ? '✓ ĐÃ PHÊ DUYỆT'
                      : approvalStatus === 'rejected'
                      ? '✕ ĐÃ TỪ CHỐI'
                      : '⏳ CHỜ GIÁM ĐỐC DUYỆT'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                  <div className="rounded-xl bg-slate-950 p-2.5 border border-slate-800/80">
                    <span className="text-slate-500 text-[10px] block">Tổng giá trị:</span>
                    <span className="font-bold text-white font-mono">{current.quoteAmount}</span>
                  </div>
                  <div className="rounded-xl bg-slate-950 p-2.5 border border-slate-800/80">
                    <span className="text-slate-500 text-[10px] block">Chiết khấu AI đề xuất:</span>
                    <span className="font-bold text-amber-400 font-mono">{current.discount}</span>
                  </div>
                </div>

                {/* Interactive Action Buttons */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setApprovalStatus('approved')}
                    className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-950/40 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>✓ Phê Duyệt &amp; Gửi Khách Ngay</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setApprovalStatus('rejected')}
                    className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-2.5 text-xs font-semibold text-slate-300 transition-all"
                  >
                    Yêu cầu sửa
                  </button>
                </div>
              </div>

              {approvalStatus === 'approved' && (
                <div className="rounded-xl bg-emerald-950/60 border border-emerald-800/80 p-3 text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
                  <span>🚀</span>
                  <span>
                    n8n WF-14 vừa kích hoạt: Đã sinh file PDF có chữ ký số và gửi email đến đại diện {current.company}!
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
