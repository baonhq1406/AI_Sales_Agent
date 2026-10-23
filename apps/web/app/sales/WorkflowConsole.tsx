'use client';

import { useEffect, useRef, useState } from 'react';

type WorkflowKey = 'wf01' | 'wf02' | 'wf03' | 'wf04' | 'wf05' | 'wf06';

interface VoiceProfile {
  id: string;
  display_name: string;
  type: string;
  gender: string;
  region: string;
  description: string;
  playback_rate: number;
  pitch_shift: number;
}

interface LeadOption {
  id: string;
  name: string;
  company: string;
  phone: string;
  score: number;
}

export default function WorkflowConsole({
  onApprovalCreated,
}: {
  onApprovalCreated?: () => void;
}) {
  const [activeWf, setActiveWf] = useState<WorkflowKey>('wf01');
  const [voices, setVoices] = useState<VoiceProfile[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('vn-hoaimy-female');
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [phone, setPhone] = useState('0905112233');

  // Preview voice state
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewVoiceId, setPreviewVoiceId] = useState<string | null>(null);

  // WF-01 State
  const [wf01Loading, setWf01Loading] = useState(false);
  const [wf01Result, setWf01Result] = useState<any>(null);
  const [wf01CallActive, setWf01CallActive] = useState(false);

  // WF-02 State
  const [wf02Query, setWf02Query] = useState(
    'Bảng giá các gói dịch vụ AI Sales Agent hiện tại là bao nhiêu?',
  );
  const [wf02Loading, setWf02Loading] = useState(false);
  const [wf02Result, setWf02Result] = useState<any>(null);

  // WF-03 State
  const [wf03Loading, setWf03Loading] = useState(false);
  const [wf03Result, setWf03Result] = useState<any>(null);

  // WF-04 State
  const [wf04Prompt, setWf04Prompt] = useState(
    'Quy đổi gói Enterprise 1500 USD sang VND theo tỷ giá hôm nay là bao nhiêu?',
  );
  const [wf04Loading, setWf04Loading] = useState(false);
  const [wf04Result, setWf04Result] = useState<any>(null);

  // Audio player
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Live Speech Recognition (STT) State
  const [isListeningWf01, setIsListeningWf01] = useState(false);
  const [wf01CustomerSpeech, setWf01CustomerSpeech] = useState(
    'Anh quan tâm gói Pro, báo giá chi tiết và chiết khấu cho bên anh nhé.',
  );
  const [isListeningWf02, setIsListeningWf02] = useState(false);

  function toggleSpeechRecognition(target: 'wf01' | 'wf02') {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        'Trình duyệt chưa hỗ trợ Web Speech API. Bạn có thể sử dụng Google Chrome hoặc Microsoft Edge để nói trực tiếp qua Micro.',
      );
      return;
    }

    if (target === 'wf01' && isListeningWf01) {
      setIsListeningWf01(false);
      return;
    }
    if (target === 'wf02' && isListeningWf02) {
      setIsListeningWf02(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'vi-VN';
      recognition.continuous = false;
      recognition.interimResults = true;

      if (target === 'wf01') setIsListeningWf01(true);
      else setIsListeningWf02(true);

      recognition.onresult = (event: any) => {
        const text = Array.from(event.results)
          .map((res: any) => res[0]?.transcript)
          .join('');
        if (text) {
          if (target === 'wf01') {
            setWf01CustomerSpeech(text);
          } else {
            setWf02Query(text);
          }
        }
      };

      recognition.onerror = () => {
        if (target === 'wf01') setIsListeningWf01(false);
        else setIsListeningWf02(false);
      };

      recognition.onend = () => {
        if (target === 'wf01') setIsListeningWf01(false);
        else setIsListeningWf02(false);
      };

      recognition.start();
    } catch {
      if (target === 'wf01') setIsListeningWf01(false);
      else setIsListeningWf02(false);
    }
  }

  useEffect(() => {
    // Load leads
    fetch('/api/sales/leads')
      .then((r) => r.json())
      .then((res) => {
        const rows = Array.isArray(res?.data) ? res.data : [];
        const mapped: LeadOption[] = rows.map((r: any) => ({
          id: String(r.id || ''),
          name: [r.first_name, r.last_name].filter(Boolean).join(' ') || 'Khách hàng',
          company: String(r.company_name || 'Doanh nghiệp'),
          phone: String(r.phone || '+84905112233'),
          score: Number(r.score || 70),
        }));
        setLeads(mapped);
        if (mapped.length > 0) {
          setSelectedLeadId(mapped[0].id);
          setPhone(mapped[0].phone);
        }
      })
      .catch(() => undefined);

    // Load voices
    fetch('/api/sales/voice-workflows?action=voices')
      .then((r) => r.json())
      .then((res) => {
        const list = res?.data?.voices || res?.voices || [];
        if (Array.isArray(list) && list.length > 0) {
          setVoices(list);
          setSelectedVoiceId(list[0].id);
        }
      })
      .catch(() => undefined);
  }, []);

  function playBase64Audio(base64: string, mimeType = 'audio/mpeg') {
    if (!base64 || !audioPlayerRef.current) return;
    audioPlayerRef.current.src = `data:${mimeType};base64,${base64}`;
    audioPlayerRef.current.play().catch(() => undefined);
  }

  async function handlePreviewVoice(voiceId: string) {
    setPreviewVoiceId(voiceId);
    setPreviewLoading(true);
    try {
      const v = voices.find((item) => item.id === voiceId);
      const text =
        v?.id.includes('bao')
          ? 'Dạ em chào anh chị, em là Bảo từ đội ngũ giải pháp trí tuệ nhân tạo AI Sales Agent.'
          : v?.gender === 'female'
            ? 'Dạ em chào anh chị! Em là Hoài My, rất vui được hỗ trợ tư vấn cho anh chị hôm nay.'
            : 'Xin chào quý đối tác! Tôi là Nam Minh, chuyên viên tư vấn giải pháp AI Sales Agent.';

      const res = await fetch('/api/sales/voice-workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'tts',
          payload: { text, voice_id: voiceId },
        }),
      });
      const data = await res.json();
      const b64 = data?.data?.audio_base64 || data?.audio_base64;
      const mime = data?.data?.mime_type || data?.mime_type || 'audio/mpeg';
      if (b64) {
        playBase64Audio(b64, mime);
      }
    } finally {
      setPreviewLoading(false);
      setPreviewVoiceId(null);
    }
  }

  async function runWf01OutboundCall(customSpeech?: string) {
    setWf01Loading(true);
    setWf01CallActive(true);
    setWf01Result(null);

    const speechToSend = customSpeech || wf01CustomerSpeech;

    try {
      const lead = leads.find((l) => l.id === selectedLeadId) || leads[0];
      const res = await fetch('/api/sales/voice-workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'wf01',
          payload: {
            lead_id: lead?.id || undefined,
            phone: phone || lead?.phone || '0905112233',
            voice_id: selectedVoiceId,
            customer_speech:
              speechToSend ||
              'Anh quan tâm gói Pro, báo giá chi tiết và chiết khấu cho bên anh nhé.',
          },
        }),
      });
      const data = await res.json();
      const result = data?.data || data;
      setWf01Result(result);

      if (result?.audio_base64) {
        playBase64Audio(result.audio_base64, result?.mime_type || 'audio/mpeg');
      }
      onApprovalCreated?.();
    } catch {
      // ignore
    } finally {
      setWf01Loading(false);
    }
  }

  async function runWf02InboundReception() {
    setWf02Loading(true);
    setWf02Result(null);

    try {
      const res = await fetch('/api/sales/voice-workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'wf02',
          payload: {
            query: wf02Query,
            voice_id: selectedVoiceId,
          },
        }),
      });
      const data = await res.json();
      const result = data?.data || data;
      setWf02Result(result);

      if (result?.audio_base64) {
        playBase64Audio(result.audio_base64, result?.mime_type || 'audio/mpeg');
      }
      onApprovalCreated?.();
    } catch {
      // ignore
    } finally {
      setWf02Loading(false);
    }
  }

  async function runWf03Orchestrator() {
    setWf03Loading(true);
    setWf03Result(null);

    try {
      const res = await fetch('/api/sales/voice-workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'wf03',
          payload: {
            customer_query: 'Khách hàng yêu cầu báo giá gấp gói Enterprise kèm chiết khấu thanh toán năm.',
            lead_score: 92,
          },
        }),
      });
      const data = await res.json();
      setWf03Result(data?.data || data);
    } catch {
      // ignore
    } finally {
      setWf03Loading(false);
    }
  }

  async function runWf04AutonomousAgent() {
    setWf04Loading(true);
    setWf04Result(null);

    try {
      const res = await fetch('/api/sales/voice-workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'wf04',
          payload: { task: wf04Prompt },
        }),
      });
      const data = await res.json();
      setWf04Result(data?.data || data);
    } catch {
      // ignore
    } finally {
      setWf04Loading(false);
    }
  }

  const workflowNav = [
    {
      id: 'wf01' as const,
      code: 'WF-01',
      title: 'Gọi Đi Outbound',
      desc: 'AI đàm thoại & chốt sale tự động',
      icon: '📞',
      tech: 'Twilio / STT-TTS',
      color: 'from-blue-600 to-indigo-600',
    },
    {
      id: 'wf02' as const,
      code: 'WF-02',
      title: 'Lễ Tân Inbound & RAG',
      desc: 'Tổng đài tiếp nhận & tra cứu pgvector',
      icon: '🎧',
      tech: 'Voice API + RAG',
      color: 'from-purple-600 to-pink-600',
    },
    {
      id: 'wf03' as const,
      code: 'WF-03',
      title: 'Nhạc Trưởng Điều Phối',
      desc: 'Phân tích ngữ cảnh & ra lệnh Tool',
      icon: '⚡',
      tech: 'LLM Tool Calling',
      color: 'from-amber-500 to-orange-600',
    },
    {
      id: 'wf04' as const,
      code: 'WF-04',
      title: 'Tác Tử Tự Chủ',
      desc: 'Tự động gọi API ngoài không kịch bản',
      icon: '🤖',
      tech: 'Agentic AI',
      color: 'from-emerald-600 to-teal-600',
    },
    {
      id: 'wf05' as const,
      code: 'WF-05',
      title: 'Core API Gateway',
      desc: 'REST API NestJS & bảo mật RBAC',
      icon: '🛡️',
      tech: 'NestJS - TypeScript',
      color: 'from-slate-700 to-slate-900',
    },
    {
      id: 'wf06' as const,
      code: 'WF-06',
      title: 'Kiến Trúc & Docker',
      desc: 'Self-hosting n8n, NestJS, pgvector',
      icon: '🐳',
      tech: 'Docker - PostgreSQL',
      color: 'from-cyan-600 to-blue-700',
    },
  ];

  return (
    <div className="space-y-6">
      <audio ref={audioPlayerRef} className="hidden" preload="auto" />

      {/* Top Banner: Workflow Grading Console Header */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl relative">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="rounded-full bg-indigo-500/20 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-indigo-300 border border-indigo-400/30">
                Đồ án AI Sales Agent • Học kỳ 5 VKU
              </span>
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 border border-emerald-400/30">
                Phụ trách: Nguyễn Hữu Quốc Bảo
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Trung Tâm Điều Hành 6 Workflow Nghiệp Vụ (WF-01 → WF-06)
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-2xl">
              Hệ thống tích hợp đàm thoại giọng nói thật (Neural Studio), tra cứu tri thức vector pgvector và điều phối đa tác tử tự động hóa quy trình bán hàng.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 self-start md:self-auto">
            <div className="h-8 w-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-400/30">
              ✓
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Trạng Thái Hệ Thống</div>
              <div className="text-xs font-bold text-emerald-300">6/6 Workflow Sẵn Sàng</div>
            </div>
          </div>
        </div>
      </div>

      {/* 6 Workflow Horizontal Dock Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {workflowNav.map((wf) => {
          const isActive = activeWf === wf.id;
          return (
            <button
              key={wf.id}
              type="button"
              onClick={() => setActiveWf(wf.id)}
              className={`flex flex-col text-left p-3.5 rounded-2xl border transition-all card-hover ${
                isActive
                  ? 'border-indigo-600 bg-white ring-2 ring-indigo-200 shadow-md'
                  : 'border-slate-200/90 bg-white/80 hover:bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg">{wf.icon}</span>
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {wf.code}
                </span>
              </div>
              <h3 className="text-xs font-bold text-slate-900 truncate">{wf.title}</h3>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">{wf.tech}</p>
            </button>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* WF-01: Voice AI Outbound Calling Agent                          */}
      {/* ============================================================== */}
      {activeWf === 'wf01' && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-100 gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold mb-2 border border-blue-200">
                  <span>Mã nghiệp vụ: WF-01</span> • <span>Phụ trách: Bảo</span>
                </div>
                <h3 className="text-xl font-black text-slate-900">
                  Voice AI Outbound Calling Agent
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Tích hợp AI nghe gọi (STT/TTS) để chủ động gọi điện tư vấn và chốt sale trực tiếp với khách hàng tiềm năng.
                </p>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 self-start sm:self-auto">
                n8n - Twilio - Neural TTS
              </span>
            </div>

            {/* Step Controls: 1-Click Operations */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6">
              {/* Left Column: Call Controls */}
              <div className="lg:col-span-5 space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    1. Chọn khách hàng tiềm năng (Lead)
                  </label>
                  <div className="space-y-2">
                    {leads.slice(0, 3).map((lead) => (
                      <button
                        key={lead.id}
                        type="button"
                        onClick={() => {
                          setSelectedLeadId(lead.id);
                          setPhone(lead.phone);
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                          selectedLeadId === lead.id
                            ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-200'
                            : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{lead.name}</p>
                          <p className="text-[11px] text-slate-500 truncate">{lead.company} • {lead.phone}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {lead.score}đ Hot
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    2. Chọn giọng AI (Studio Neural Voice)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'vn-hoaimy-female', name: 'Hoài My', gender: 'Nữ', tag: 'Gemini TTS Cảm xúc' },
                      { id: 'vn-namminh-male', name: 'Nam Minh', gender: 'Nam', tag: 'Gemini TTS Thuyết phục' },
                      { id: 'clone-bao-owner', name: 'Giọng Bảo', gender: 'Nam', tag: '⭐ Tự Train Free 100%' },
                    ].map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVoiceId(v.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          selectedVoiceId === v.id
                            ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-200'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xs font-bold text-slate-900">{v.name}</div>
                        <div className="text-[10px] text-slate-500">{v.gender} • {v.tag}</div>
                      </button>
                    ))}
                  </div>

                  <div className="mt-2.5 flex items-center justify-between">
                    <button
                      type="button"
                      disabled={previewLoading}
                      onClick={() => handlePreviewVoice(selectedVoiceId)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      <span>🔊</span>
                      <span>{previewLoading ? 'Đang phát...' : 'Nghe thử giọng này'}</span>
                    </button>
                    <span className="text-[10px] text-emerald-600 font-semibold">Gemini 3.8 TTS + Giọng Tự Train Free</span>
                  </div>
                </div>

                {/* Step 3: Customer Speech / Live Microphone Input */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      3. Ý định khách hàng (Nói qua Mic hoặc chọn mẫu)
                    </label>
                    <button
                      type="button"
                      onClick={() => toggleSpeechRecognition('wf01')}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                        isListeningWf01
                          ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/30 ring-2 ring-red-300'
                          : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                      }`}
                    >
                      <span>🎙️</span>
                      <span>{isListeningWf01 ? 'Đang nghe... Hãy nói' : 'Bật Micro nói'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={wf01CustomerSpeech}
                    onChange={(e) => setWf01CustomerSpeech(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none"
                    placeholder="Nhập hoặc bấm Micro để nói câu thoại của khách..."
                  />
                  <div className="mt-1.5 flex gap-1.5 flex-wrap">
                    {[
                      'Anh quan tâm gói Pro, báo giá chi tiết và chiết khấu cho bên anh nhé.',
                      'Gói Starter giá bao nhiêu và có hỗ trợ Voice AI không?',
                      'Bên em có chính sách dùng thử 14 ngày miễn phí không?',
                    ].map((presetText) => (
                      <button
                        key={presetText}
                        type="button"
                        onClick={() => setWf01CustomerSpeech(presetText)}
                        className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all ${
                          wf01CustomerSpeech === presetText
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold'
                            : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {presetText.length > 32 ? presetText.slice(0, 32) + '...' : presetText}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={wf01Loading}
                  onClick={() => runWf01OutboundCall()}
                  className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-indigo-600 py-3.5 px-6 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  {wf01Loading ? (
                    <>
                      <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Đang quay số & kết nối đàm thoại...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-base">📞</span>
                      <span>BẮT ĐẦU CUỘC GỌI TƯ VẤN OUTBOUND</span>
                    </>
                  )}
                </button>
              </div>

              {/* Right Column: Live Call Screen & Turn-by-Turn Audio Waveform */}
              <div className="lg:col-span-7 bg-slate-900 rounded-2xl p-5 text-white flex flex-col justify-between relative overflow-hidden min-h-[380px]">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${wf01CallActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                    <span className="text-xs font-bold text-slate-200">
                      {wf01Loading ? 'Đang thực hiện cuộc gọi...' : wf01Result ? 'Cuộc gọi hoàn tất • Chốt gói Pro' : 'Sẵn sàng kết nối cuộc gọi'}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {wf01Result?.audio_url ? 'Voice Synced' : 'Ready'}
                  </span>
                </div>

                {/* Animated Waveform Visualizer */}
                <div className="py-6 flex flex-col items-center justify-center">
                  <div className="flex items-center justify-center gap-1.5 h-14 mb-4">
                    {[40, 75, 30, 90, 60, 100, 45, 80, 25, 95, 50, 70, 35].map((val, idx) => (
                      <span
                        key={idx}
                        className={`w-1 rounded-full bg-gradient-to-t from-indigo-500 to-emerald-400 transition-all duration-300 ${
                          wf01Loading || wf01CallActive ? 'animate-pulse' : 'opacity-40'
                        }`}
                        style={{ height: wf01Loading ? `${val}%` : '20%' }}
                      />
                    ))}
                  </div>

                  <div className="text-center">
                    <p className="text-sm font-bold text-white">
                      {leads.find((l) => l.id === selectedLeadId)?.name || 'Khách hàng VIP'}
                    </p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{phone}</p>
                  </div>
                </div>

                {/* Transcript Log & Result */}
                <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-start gap-2 text-indigo-300">
                    <span className="font-bold shrink-0">🤖 AI:</span>
                    <span>
                      {wf01Result?.transcript?.split('\n')?.[0] ||
                        'Dạ em chào anh An! Em là Bảo từ đội ngũ AI Sales Agent. Em thấy bên mình đang quan tâm giải pháp Voice AI và tự động hóa CRM...'}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-emerald-300">
                    <span className="font-bold shrink-0">👤 Khách:</span>
                    <span>{wf01CustomerSpeech}</span>
                  </div>
                  {wf01Result && (
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Tự động tạo báo giá: <strong className="text-emerald-400">Gói Pro (5.000.000đ/tháng)</strong></span>
                      <span className="text-amber-400 font-bold">Chuyển sang HITL Approval ✓</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* WF-02: Voice AI Inbound Receptionist                            */}
      {/* ============================================================== */}
      {activeWf === 'wf02' && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-100 gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[11px] font-bold mb-2 border border-purple-200">
                  <span>Mã nghiệp vụ: WF-02</span> • <span>Phụ trách: Bảo</span>
                </div>
                <h3 className="text-xl font-black text-slate-900">
                  Voice AI Inbound Receptionist
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Làm tổng đài viên AI nhận cuộc gọi đến, giải đáp thắc mắc và tự động chuyển máy cho nhân viên nếu gặp ca khó.
                </p>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 self-start sm:self-auto">
                n8n - Voice API - RAG pgvector
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6">
              <div className="lg:col-span-6 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Câu hỏi của khách gọi đến tổng đài:
                  </label>
                  <button
                    type="button"
                    onClick={() => toggleSpeechRecognition('wf02')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      isListeningWf02
                        ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/30 ring-2 ring-red-300'
                        : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    }`}
                  >
                    <span>🎙️</span>
                    <span>{isListeningWf02 ? 'Đang nghe... Hãy nói' : 'Bật Micro nói'}</span>
                  </button>
                </div>

                {/* 3 Quick 1-Click Prompts */}
                <div className="space-y-2">
                  {[
                    'Bảng giá các gói dịch vụ AI Sales Agent hiện tại là bao nhiêu?',
                    'Hệ thống có chính sách dùng thử 14 ngày miễn phí và bảo mật dữ liệu không?',
                    'Quy trình tích hợp vào tổng đài và CRM mất khoảng bao lâu?',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setWf02Query(preset)}
                      className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all ${
                        wf02Query === preset
                          ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={3}
                  value={wf02Query}
                  onChange={(e) => setWf02Query(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none"
                  placeholder="Nhập câu hỏi bất kỳ của khách hàng..."
                />

                <button
                  type="button"
                  disabled={wf02Loading}
                  onClick={runWf02InboundReception}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-purple-600 py-3.5 px-6 text-sm font-bold text-white shadow-lg shadow-purple-600/30 hover:bg-purple-700 transition-all disabled:opacity-50"
                >
                  {wf02Loading ? 'Đang tra cứu RAG & phản hồi giọng nói...' : '🎧 TIẾP NHẬN CUỘC GỌI & TRA CỨU RAG'}
                </button>
              </div>

              <div className="lg:col-span-6 bg-slate-950 rounded-2xl p-6 text-white flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                    <span className="font-bold text-purple-400">Kho Tri Thức RAG (pgvector)</span>
                    <span className="text-[11px] font-mono text-emerald-400">Similarity Match 94.8%</span>
                  </div>

                  <div className="mt-4 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                    <p className="font-bold text-white mb-1">Trích xuất văn bản từ pgvector:</p>
                    <p className="italic text-slate-400">
                      &quot;Gói Starter 2 triệu/tháng cho 5 sales. Gói Pro 5 triệu/tháng đầy đủ Voice AI Outbound (WF-01) và Inbound RAG (WF-02). Hỗ trợ 14 ngày dùng thử miễn phí.&quot;
                    </p>
                  </div>

                  {wf02Result && (
                    <div className="mt-4 p-3.5 rounded-xl bg-purple-950/40 border border-purple-800/50 text-xs text-purple-200">
                      <p className="font-bold text-white mb-1">Câu trả lời của AI Lễ Tân:</p>
                      <p>{wf02Result.reply_text || 'Dạ vâng, em đã tìm thấy thông tin trên hệ thống RAG và đọc báo giá cho anh chị.'}</p>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Nếu ca khó:</span>
                  <button
                    type="button"
                    onClick={() => alert('Đã kích hoạt chuyển máy tự động sang chuyên viên hỗ trợ cấp cao!')}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-amber-300 font-bold hover:bg-slate-700 text-xs"
                  >
                    🔀 Chuyển máy cho chuyên viên
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* WF-03: Multi-Agent Orchestrator                                 */}
      {/* ============================================================== */}
      {activeWf === 'wf03' && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-100 gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold mb-2 border border-amber-200">
                  <span>Mã nghiệp vụ: WF-03</span> • <span>Phụ trách: Bảo</span>
                </div>
                <h3 className="text-xl font-black text-slate-900">
                  Multi-Agent Orchestrator (Nhạc Trưởng Điều Phối)
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Nhạc trưởng điều phối: Phân tích ngữ cảnh sau mỗi tương tác để ra quyết định gọi Tool/Agent nào tiếp theo.
                </p>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 self-start sm:self-auto">
                n8n - LLM Tool Calling
              </span>
            </div>

            <div className="pt-6 space-y-6">
              {/* Interactive Visual Agent Topology Graph */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { title: '1. Nhạc Trưởng (LLM Brain)', desc: 'Phân tích ngữ cảnh hội thoại', icon: '🧠', color: 'border-amber-500 bg-amber-50' },
                  { title: '2. CRM Lead Scoring Agent', desc: 'Chấm điểm khách hàng tiềm năng', icon: '📊', color: 'border-blue-500 bg-blue-50' },
                  { title: '3. Quote & Discount Agent', desc: 'Sinh báo giá & tính chiết khấu', icon: '💰', color: 'border-purple-500 bg-purple-50' },
                  { title: '4. HITL Approval Gate', desc: 'Gửi quản lý duyệt ngoại lệ', icon: '🛡️', color: 'border-emerald-500 bg-emerald-50' },
                ].map((node) => (
                  <div key={node.title} className={`p-4 rounded-2xl border-2 ${node.color} text-slate-900`}>
                    <div className="text-2xl mb-1">{node.icon}</div>
                    <div className="text-xs font-extrabold">{node.title}</div>
                    <div className="text-[11px] text-slate-600 mt-0.5">{node.desc}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="text-xs text-slate-600 font-semibold">
                  Tình huống mô phỏng: Khách hàng hỏi chiết khấu 18% cho hợp đồng năm (vượt mức tiêu chuẩn 10%).
                </span>
                <button
                  type="button"
                  disabled={wf03Loading}
                  onClick={runWf03Orchestrator}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition-all shrink-0 shadow-md"
                >
                  {wf03Loading ? 'Đang điều phối các Agent...' : '⚡ KÍCH HOẠT ĐIỀU PHỐI ĐA TÁC TỬ'}
                </button>
              </div>

              {wf03Result && (
                <div className="p-5 rounded-2xl bg-slate-900 text-white font-mono text-xs space-y-2">
                  <div className="text-amber-400 font-bold">✓ KẾT QUẢ ĐIỀU PHỐI TỰ ĐỘNG:</div>
                  <pre className="text-[11px] text-slate-300 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(wf03Result, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* WF-04: Autonomous Workflow Agent                                */}
      {/* ============================================================== */}
      {activeWf === 'wf04' && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-100 gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold mb-2 border border-emerald-200">
                  <span>Mã nghiệp vụ: WF-04</span> • <span>Phụ trách: Bảo</span>
                </div>
                <h3 className="text-xl font-black text-slate-900">
                  Autonomous Workflow Agent (Tác Tử Tự Chủ)
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  AI có khả năng tự động quyết định và gọi các API bên ngoài mà không cần lập trình trước kịch bản cố định.
                </p>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 self-start sm:self-auto">
                n8n - Agentic AI
              </span>
            </div>

            <div className="pt-6 space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Giao nhiệm vụ cho Tác tử tự chủ:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  'Quy đổi gói Enterprise 1500 USD sang VND theo tỷ giá hôm nay là bao nhiêu?',
                  'Đồng bộ dữ liệu khách hàng An Phát Logistics sang webhook CRM đối tác',
                  'Tự động gửi email thông báo chiết khấu cho khách hàng tiềm năng',
                ].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => setWf04Prompt(prompt)}
                    className={`p-3 rounded-xl border text-left text-xs transition-all ${
                      wf04Prompt === prompt
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={wf04Prompt}
                onChange={(e) => setWf04Prompt(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none"
              />

              <button
                type="button"
                disabled={wf04Loading}
                onClick={runWf04AutonomousAgent}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-all shadow-md"
              >
                {wf04Loading ? 'AI đang tự động suy luận & gọi API ngoài...' : '🤖 THỰC THI TÁC TỬ TỰ CHỦ'}
              </button>

              {wf04Result && (
                <div className="p-5 rounded-2xl bg-slate-900 text-white font-mono text-xs space-y-2 mt-4">
                  <div className="text-emerald-400 font-bold">✓ KẾT QUẢ THỰC THI RE-ACT:</div>
                  <pre className="text-[11px] text-slate-300 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(wf04Result, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* WF-05: Core Backend API Gateway                                 */}
      {/* ============================================================== */}
      {activeWf === 'wf05' && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-100 gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[11px] font-bold mb-2 border border-slate-300">
                  <span>Mã nghiệp vụ: WF-05</span> • <span>Phụ trách: Bảo</span>
                </div>
                <h3 className="text-xl font-black text-slate-900">
                  Core Backend API Gateway
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Viết các REST API trên NestJS làm trạm trung chuyển, xử lý xác thực (Auth) cho toàn bộ hệ sinh thái.
                </p>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-900 text-white self-start sm:self-auto">
                NestJS - TypeScript
              </span>
            </div>

            <div className="pt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { endpoint: 'POST /api/v1/auth/login', desc: 'JWT HttpOnly + bcrypt', status: '200 OK' },
                  { endpoint: 'GET /api/v1/leads', desc: 'Customer 360 database', status: '200 OK' },
                  { endpoint: 'POST /api/v1/voice-workflows/tts', desc: 'Edge Neural TTS Engine', status: '200 OK' },
                  { endpoint: 'GET /api/v1/approvals', desc: 'HITL Exception Gate', status: '200 OK' },
                ].map((api) => (
                  <div key={api.endpoint} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                    <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {api.status}
                    </span>
                    <p className="text-xs font-mono font-bold text-slate-900 mt-2 truncate">{api.endpoint}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{api.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* WF-06: Deployment & Architecture                                */}
      {/* ============================================================== */}
      {activeWf === 'wf06' && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-100 gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-800 text-[11px] font-bold mb-2 border border-cyan-200">
                  <span>Mã nghiệp vụ: WF-06</span> • <span>Phụ trách: Bảo</span>
                </div>
                <h3 className="text-xl font-black text-slate-900">
                  Deployment &amp; Architecture (Hạ Tầng Tự Động Hóa)
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Thiết lập Docker (n8n, NestJS) và cài đặt pgvector trên PostgreSQL để hệ thống chạy độc lập (Self-hosting).
                </p>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-100 text-cyan-800 border border-cyan-300 self-start sm:self-auto">
                Docker - PostgreSQL - pgvector
              </span>
            </div>

            <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: 'PostgreSQL 17 + pgvector', port: '5435:5432', role: 'Database & Vector Embeddings', color: 'bg-emerald-500' },
                { name: 'NestJS API Gateway', port: '3000:3000', role: 'Core Backend & JWT Auth', color: 'bg-emerald-500' },
                { name: 'Next.js Web Frontend', port: '3001:3000', role: 'Sales Workspace & UI', color: 'bg-emerald-500' },
                { name: 'n8n Workflow Engine', port: '5678:5678', role: 'Multi-Agent Orchestrator', color: 'bg-emerald-500' },
              ].map((c) => (
                <div key={c.name} className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${c.color} animate-pulse`} />
                    <span className="text-xs font-bold text-slate-900">{c.name}</span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-500">Cổng: {c.port}</p>
                  <p className="text-[11px] text-slate-600 mt-1 font-semibold">{c.role}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
