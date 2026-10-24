'use client';

import { useState, useEffect } from 'react';
import {
  VoiceConversationIllustration,
  MultiAgentOrchestratorIllustration,
  RagVectorSearchIllustration,
} from './AnimatedIllustrations';

export default function InteractiveAiConsole() {
  const [activeMode, setActiveMode] = useState<'voice' | 'nodes' | 'approval'>('voice');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [activeScenario, setActiveScenario] = useState(0);

  const scenarios = [
    {
      company: 'Logistics Toàn Cầu Express',
      customerName: 'Anh Tuấn (CEO)',
      score: 95,
      voiceName: 'Trúc Ly (Neural 24kHz)',
      dialogue: [
        {
          speaker: 'AI Sales',
          text: 'Dạ chào anh Tuấn! Em là Trúc Ly từ AI Sales Agent, nhận thấy công ty đang mở rộng đội 40 xe vận tải...',
        },
        {
          speaker: 'Khách hàng',
          text: 'Bên anh cần tích hợp định tuyến AI và nhận báo giá gói Pro trong hôm nay để trình ban giám đốc.',
        },
      ],
      quoteAmount: '180.000.000 đ',
      discount: '15%',
    },
    {
      company: 'Chuỗi Bán lẻ Vinamart+',
      customerName: 'Chị Thảo (COO)',
      score: 88,
      voiceName: 'Bảo Clone (Zero-shot)',
      dialogue: [
        {
          speaker: 'AI Sales',
          text: 'Dạ chào chị Thảo, em Bảo từ AI Sales Agent xin phép kết nối hỗ trợ tự động hóa 12 điểm kho bán lẻ ạ.',
        },
        {
          speaker: 'Khách hàng',
          text: 'Chi phí triển khai thế nào em? Có hỗ trợ dùng thử 14 ngày trên dữ liệu thật của bên chị không?',
        },
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
      {/* Subtle clean ambient glow */}
      <div className="absolute -inset-2 rounded-[2.25rem] bg-gradient-to-tr from-indigo-500/20 via-slate-800/10 to-cyan-500/20 blur-xl pointer-events-none" />

      {/* Main Vector Animation Stage */}
      <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 text-slate-100 shadow-2xl ring-1 ring-white/10">
        {/* Top Clean Mode Switcher */}
        <div className="relative z-20 flex flex-wrap items-center justify-between gap-2 px-5 pt-4 pb-3 border-b border-white/10">
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-full">
            {[
              { id: 'voice' as const, label: '🎙️ Voice AI Live' },
              { id: 'nodes' as const, label: '🧠 Multi-Agent' },
              { id: 'approval' as const, label: '💎 RAG & HITL' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveMode(tab.id)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  activeMode === tab.id
                    ? 'bg-indigo-600 text-white shadow-sm'
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
            className="text-[11px] font-bold text-cyan-300 hover:text-white transition-colors flex items-center gap-1 bg-slate-900 px-3 py-1.5 rounded-full cursor-pointer"
          >
            <span>↻ Đổi kịch bản</span>
          </button>
        </div>

        {/* ============================================================ */}
        {/* MODE 1: ANIMATED VECTOR VOICE CONVERSATION                   */}
        {/* ============================================================ */}
        {activeMode === 'voice' && (
          <div className="p-5 space-y-4 animate-tab-pane">
            <div className="rounded-2xl bg-slate-900/70 p-2">
              <VoiceConversationIllustration
                isPlaying={isPlayingAudio}
                speakerName={current.voiceName.split(' ')[0] + ' AI'}
                customerName={current.customerName}
              />
            </div>

            <div className="flex items-center justify-between gap-4 px-1">
              <div>
                <p className="text-[11px] font-semibold text-cyan-400">{current.voiceName}</p>
                <h3 className="text-sm sm:text-base font-extrabold text-white">{current.company}</h3>
              </div>

              <button
                type="button"
                onClick={speakVoice}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold text-white transition-all cursor-pointer ${
                  isPlayingAudio
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-indigo-600 hover:bg-indigo-500'
                }`}
              >
                <span>{isPlayingAudio ? '⏹ Dừng Phát' : '🔊 Nghe Giọng AI'}</span>
              </button>
            </div>

            <div className="space-y-2 text-xs border-t border-white/10 pt-3">
              <div className="flex items-start gap-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                  AI
                </span>
                <p className="text-slate-200 leading-relaxed">“{current.dialogue[0].text}”</p>
              </div>
              <div className="flex items-start gap-2.5 pl-5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-cyan-300">
                  KH
                </span>
                <p className="text-slate-300 leading-relaxed italic">“{current.dialogue[1].text}”</p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODE 2: ANIMATED VECTOR MULTI-AGENT CANVAS                   */}
        {/* ============================================================ */}
        {activeMode === 'nodes' && (
          <div className="p-5 space-y-3 animate-tab-pane">
            <div className="rounded-2xl bg-slate-900/70 p-2">
              <MultiAgentOrchestratorIllustration activeStep={activeScenario} />
            </div>
            <div className="flex items-center justify-between text-xs px-1 pt-1">
              <span className="font-bold text-slate-200">
                🧠 Nhạc Trưởng Điều Phối Gemini 3.5 Flash Lite
              </span>
              <span className="font-mono text-[11px] text-emerald-400">● 3/3 Sub-Agents Active</span>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODE 3: ANIMATED VECTOR RAG & HITL                           */}
        {/* ============================================================ */}
        {activeMode === 'approval' && (
          <div className="p-5 space-y-4 animate-tab-pane">
            <div className="rounded-2xl bg-slate-900/70 p-2">
              <RagVectorSearchIllustration
                topicLabel={current.company}
                similarity="98.4%"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
              <div>
                <div className="text-xs text-slate-300">
                  Báo giá: <strong className="text-white font-mono">{current.quoteAmount}</strong> • Chiết khấu:{' '}
                  <strong className="text-amber-400 font-mono">{current.discount}</strong>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {approvalStatus === 'approved'
                    ? '✓ Quản lý đã phê duyệt & gửi báo giá tự động'
                    : 'Đang chờ Quản lý phê duyệt ngoại lệ (HITL Gate)'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setApprovalStatus('approved')}
                  className="rounded-full bg-emerald-600 hover:bg-emerald-500 px-4 py-1.5 text-xs font-bold text-white transition-all cursor-pointer"
                >
                  ✓ Duyệt 1-Click
                </button>
                <button
                  type="button"
                  onClick={() => setApprovalStatus('rejected')}
                  className="rounded-full bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-all cursor-pointer"
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
