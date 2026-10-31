'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  VoiceConversationIllustration,
  MultiAgentOrchestratorIllustration,
  RagVectorSearchIllustration,
} from './AnimatedIllustrations';

interface Message {
  role: 'ai' | 'user';
  text: string;
  source?: string;
  timestamp: string;
}

export default function InteractiveAiConsole() {
  const [activeMode, setActiveMode] = useState<'voice' | 'agent' | 'approval'>('voice');
  const [selectedVoice, setSelectedVoice] = useState('vn-trucly-female');
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioError, setAudioError] = useState('');

  // Agent State
  const [agentInput, setAgentInput] = useState('Quy đổi 1500 USD gói Enterprise sang VND theo tỷ giá thật');
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentResult, setAgentResult] = useState<any>(null);

  // Audio Player Ref
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      text: 'Dạ xin kính chào quý khách! Em là Trúc Ly từ nền tảng AI Sales Agent. Em có thể giải đáp chi tiết về bảng giá các gói dịch vụ, chính sách dùng thử 14 ngày hoặc tính năng tổng đài Voice AI ạ!',
      source: 'Tri thức RAG PostgreSQL pgvector • VieNeu & Neural Voice',
      timestamp: 'Vừa xong',
    },
  ]);

  const quickQuestions = [
    { label: '💰 Bảng giá gói Pro', text: 'Bảng giá gói Pro 5 triệu một tháng bao gồm những tính năng gì?' },
    { label: '🎁 Dùng thử 14 ngày', text: 'Chính sách dùng thử 14 ngày miễn phí có cần thanh toán trước không?' },
    { label: '⚡ Tốc độ Voice AI', text: 'Voice AI có tính năng ngắt lời tự động và tốc độ phản hồi bao nhiêu giây?' },
    { label: '🔒 Tích hợp CRM & Bảo mật', text: 'Hệ thống có tích hợp CRM và hỗ trợ triển khai on-premise an toàn không?' },
  ];

  const voiceOptions = [
    { id: 'vn-sontung-mtp', name: '🔥 Sơn Tùng M-TP (Sky Idol)', desc: 'AI Celebrity Voice (RVC v2)' },
    { id: 'vn-jack-j97', name: '🌾 Jack — J97 (Đom Đóm)', desc: 'AI Celebrity Voice (Miền Tây)' },
    { id: 'vn-domixi', name: '🎮 Độ Mixi (MixiGaming)', desc: 'AI Celebrity Voice (Hài Hước)' },
    { id: 'vn-trucly-female', name: '🌸 Trúc Ly (Nữ Tiếp Tân B2B)', desc: 'VieNeu & Neural Studio' },
    { id: 'vn-minhquan-male', name: '🎙️ Minh Quân (Nam Tư Vấn B2B)', desc: 'Truyền cảm & Sinh động' },
    { id: 'vn-hoaimy-female', name: '🌟 Hoài My (Nữ Miền Nam)', desc: 'Thân thiện & Ấm áp' },
  ];

  function playAudioFromBase64(base64: string, mimeType = 'audio/mpeg') {
    if (!base64) return;
    try {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audioUrl = `data:${mimeType};base64,${base64}`;
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => setIsPlayingAudio(true);
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => {
        setIsPlayingAudio(false);
        setAudioError('Không thể phát âm thanh trực tiếp trên trình duyệt');
      };

      audio.play().catch(() => {
        setIsPlayingAudio(false);
      });
    } catch {
      setIsPlayingAudio(false);
    }
  }

  function stopAudio() {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    }
  }

  async function handleSendQuery(queryToSend?: string) {
    const text = (queryToSend || inputText).trim();
    if (!text || isLoading) return;

    setInputText('');
    setAudioError('');
    stopAudio();

    const userMsg: Message = {
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/demo/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: text,
          voice_id: selectedVoice,
        }),
      });

      const data = await res.json();
      const aiReply =
        data?.data?.speech_response ||
        data?.speech_response ||
        'Dạ em đã ghi nhận thông tin, em sẽ tư vấn chi tiết cho mình ngay ạ!';

      const audioBase64 = data?.data?.tts_audio?.audio_base64 || data?.tts_audio?.audio_base64;
      const mimeType = data?.data?.tts_audio?.mime_type || data?.tts_audio?.mime_type || 'audio/mpeg';

      const aiMsg: Message = {
        role: 'ai',
        text: aiReply,
        source: `PostgreSQL pgvector (12 Topics) • ${data?.data?.llm_model || 'Gemini 3.5 Flash'} • Audio Thật`,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);

      if (audioBase64) {
        playAudioFromBase64(audioBase64, mimeType);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: 'Dạ hệ thống Voice AI đang cập nhật, anh chị có thể thử lại sau giây lát hoặc truy cập Phòng Lab để xem chi tiết ạ.',
          source: 'Hệ thống Dự phòng',
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function toggleSpeechRecognition() {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setAudioError('Trình duyệt không hỗ trợ Web Speech API. Bạn hãy gõ câu hỏi bằng bàn phím nhé.');
      return;
    }

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = 'vi-VN';
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecording(true);
        setAudioError('');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText(transcript);
          handleSendQuery(transcript);
        }
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch {
      setIsRecording(false);
    }
  }

  async function handleRunAgent() {
    if (!agentInput.trim() || agentLoading) return;
    setAgentLoading(true);
    setAgentResult(null);

    try {
      const res = await fetch('/api/demo/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: agentInput.trim() }),
      });
      const data = await res.json();
      setAgentResult(data?.data || data);
    } catch {
      setAgentResult({ error: 'Không thể kết nối n8n Autonomous Workflow Agent' });
    } finally {
      setAgentLoading(false);
    }
  }

  useEffect(() => {
    return () => {
      stopAudio();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
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
              { id: 'voice' as const, label: '🎙️ Voice AI Live (Thật 100%)' },
              { id: 'agent' as const, label: '🧠 Đa Tác Tử (Live Tool)' },
              { id: 'approval' as const, label: '🛡️ Quy Trình & CRM 360' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  stopAudio();
                  setActiveMode(tab.id);
                }}
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

          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-mono text-emerald-400 font-bold">API Live</span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* MODE 1: REAL VOICE AI LIVE CONVERSATION                         */}
        {/* ============================================================== */}
        {activeMode === 'voice' && (
          <div className="p-5 space-y-4">
            {/* Voice Profile Selector Ribbon */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 rounded-2xl p-2.5 border border-white/5">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold">Giọng AI:</span>
                <select
                  value={selectedVoice}
                  onChange={(e) => {
                    stopAudio();
                    setSelectedVoice(e.target.value);
                  }}
                  className="bg-slate-800 text-xs font-bold text-white rounded-xl px-3 py-1.5 border border-slate-700 outline-none cursor-pointer focus:border-indigo-500"
                >
                  {voiceOptions.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>

              {isPlayingAudio && (
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-300 animate-pulse">
                  <span className="flex gap-0.5 items-end h-3.5">
                    <span className="w-1 bg-cyan-400 h-2 animate-bounce" />
                    <span className="w-1 bg-cyan-400 h-3.5 animate-bounce [animation-delay:0.15s]" />
                    <span className="w-1 bg-cyan-400 h-2.5 animate-bounce [animation-delay:0.3s]" />
                    <span className="w-1 bg-cyan-400 h-3 animate-bounce [animation-delay:0.45s]" />
                  </span>
                  <span>Đang đọc giọng thật...</span>
                  <button
                    type="button"
                    onClick={stopAudio}
                    className="ml-2 px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] hover:bg-rose-500/30 font-bold"
                  >
                    Dừng
                  </button>
                </div>
              )}
            </div>

            {/* Conversation Messages Display */}
            <div className="h-64 overflow-y-auto space-y-3 pr-1 rounded-2xl bg-slate-900/40 p-3.5 border border-white/5">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-br-none shadow-md'
                        : 'bg-slate-900 text-slate-100 rounded-bl-none border border-slate-800 shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span className="font-bold text-[11px] text-cyan-300">
                        {m.role === 'user' ? '👤 Bạn' : '🎙️ AI Sales (Trúc Ly / Minh Quân)'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{m.timestamp}</span>
                    </div>
                    <p className="whitespace-pre-wrap">{m.text}</p>
                    {m.source && (
                      <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                        <span className="text-emerald-400">✓</span>
                        <span>{m.source}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-900 max-w-[70%] border border-slate-800">
                  <div className="h-3 w-3 rounded-full bg-indigo-500 animate-ping" />
                  <span className="text-xs text-indigo-300 font-mono">
                    Đang tra cứu RAG pgvector &amp; tạo giọng nói...
                  </span>
                </div>
              )}
            </div>

            {/* Quick 1-Click Suggestion Pills */}
            <div className="flex flex-wrap gap-1.5">
              {quickQuestions.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => handleSendQuery(q.text)}
                  disabled={isLoading}
                  className="rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3 py-1 text-[11px] font-semibold text-slate-300 hover:text-white transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50"
                >
                  {q.label}
                </button>
              ))}
            </div>

            {/* Input Bar: Mic + Text input + Send */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendQuery();
              }}
              className="flex items-center gap-2 pt-1"
            >
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                title="Bấm để nói bằng Microphone"
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all cursor-pointer ${
                  isRecording
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {isRecording ? '🛑' : '🎙️'}
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  isRecording ? 'Đang lắng nghe bạn nói...' : 'Gõ câu hỏi bất kỳ về bảng giá, RAG, tính năng...'
                }
                disabled={isLoading}
                className="flex-1 rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
              />

              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="btn-shimmer flex h-10 px-4 shrink-0 items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white transition-all disabled:opacity-40 cursor-pointer"
              >
                <span>Hỏi AI &rarr;</span>
              </button>
            </form>

            {audioError && (
              <p className="text-[11px] text-amber-300 font-mono">{audioError}</p>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* MODE 2: MULTI-AGENT AUTONOMOUS TOOL CALLING (WF-04 LIVE)         */}
        {/* ============================================================== */}
        {activeMode === 'agent' && (
          <div className="p-5 space-y-4">
            <div className="rounded-2xl bg-slate-900/80 p-3.5 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-400">Tác Tử Tự Chủ (WF-04 • ReAct Tool Calling)</span>
                <span className="text-[10px] font-mono text-cyan-300">Open Exchange Rates • Open-Meteo</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Tác tử tự động phân tích ý định, quyết định công cụ (Tool) cần gọi từ thế giới thực mà không cần kịch bản cứng, sau đó tổng hợp câu trả lời tự nhiên.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                'Quy đổi 1500 USD sang VND theo tỷ giá thật hôm nay',
                'Thời tiết Đà Nẵng hôm nay có mưa không?',
                'Quy đổi 5000 USD hợp đồng năm sang VND',
              ].map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setAgentInput(example)}
                  className="text-[11px] bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 hover:text-white"
                >
                  💡 {example}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={agentInput}
                onChange={(e) => setAgentInput(e.target.value)}
                placeholder="Nhập yêu cầu tác tử (ví dụ: quy đổi ngoại tệ, thời tiết)..."
                className="flex-1 rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleRunAgent}
                disabled={agentLoading || !agentInput.trim()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all disabled:opacity-40"
              >
                {agentLoading ? 'Đang chạy...' : 'Kích hoạt Agent'}
              </button>
            </div>

            {agentResult && (
              <div className="rounded-2xl bg-slate-900 p-4 border border-slate-800 space-y-2 animate-fade-in-up">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    ✓ Tool Executed: {agentResult?.tool_executed || 'api_call'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Status: {agentResult?.status || 'success'}
                  </span>
                </div>
                {agentResult?.reason && (
                  <p className="text-xs text-slate-300 italic">"{agentResult.reason}"</p>
                )}
                {agentResult?.ai_answer && (
                  <div className="p-3 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-xs text-indigo-100 font-semibold">
                    🤖 {agentResult.ai_answer}
                  </div>
                )}
                <div className="bg-slate-950 p-2.5 rounded-xl font-mono text-[11px] text-cyan-300 overflow-x-auto">
                  <pre>{JSON.stringify(agentResult?.tool_result || agentResult, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* MODE 3: HITL APPROVAL & CRM ARCHITECTURE                        */}
        {/* ============================================================== */}
        {activeMode === 'approval' && (
          <div className="p-5 space-y-4">
            <div className="rounded-2xl bg-slate-900/80 p-4 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400">
                  Cổng Kiểm Soát Human-In-The-Loop (HITL WF-16)
                </span>
                <span className="text-[10px] font-mono text-cyan-300">PostgreSQL Approvals</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Hệ sinh thái tự động hóa nhưng vẫn an toàn tuyệt đối với cơ chế phê duyệt chiết khấu 2 tầng:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/20">
                  <p className="text-xs font-bold text-emerald-400">🟢 Tự Quyết Định (≤ 10%)</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Nhân viên Sale được phép chủ động chiết khấu để chốt nhanh đơn hàng. Hệ thống tự động phát hành báo giá.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/20">
                  <p className="text-xs font-bold text-amber-400">🟡 Cần Quản Lý Duyệt (11 - 20%)</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    AI tự động chặn lại, phân tích lý do và đẩy vào hàng đợi chờ Quản lý bấm Duyệt 1-click trước khi gửi khách.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs text-slate-400">Xem dữ liệu khách hàng &amp; danh sách báo giá chờ duyệt thật:</span>
              <Link
                href="/sales"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-2 text-xs font-bold text-white hover:scale-105 transition-all shadow-md"
              >
                <span>Mở Trạm Điều Hành CRM</span>
                <span>&rarr;</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
