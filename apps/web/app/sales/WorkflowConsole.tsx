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

export type CallStatus = 'idle' | 'dialing' | 'connected' | 'ended';
export type CallSpeakerState = 'ai_speaking' | 'user_listening' | 'ai_thinking' | 'idle';

export interface LiveCallTurn {
  role: 'ai' | 'customer';
  text: string;
  timestamp: string;
}

export default function WorkflowConsole({
  onApprovalCreated,
}: {
  onApprovalCreated?: () => void;
}) {
  const [activeWf, setActiveWf] = useState<WorkflowKey>('wf01');
  const [voices, setVoices] = useState<VoiceProfile[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('vn-minhquan-male');
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [phone, setPhone] = useState('0905112233');

  // Preview voice state
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewVoiceId, setPreviewVoiceId] = useState<string | null>(null);

  // Live Phone Call Engine State (WF-01 & WF-02)
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [callSpeakerState, setCallSpeakerState] = useState<CallSpeakerState>('idle');
  const [callDurationSec, setCallDurationSec] = useState(0);
  const [liveTurns, setLiveTurns] = useState<LiveCallTurn[]>([]);
  const [liveInterimSpeech, setLiveInterimSpeech] = useState('');
  const [callReport, setCallReport] = useState<any>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [customCallInput, setCustomCallInput] = useState('');

  // WF-03 State
  const [wf03Loading, setWf03Loading] = useState(false);
  const [wf03Result, setWf03Result] = useState<any>(null);

  // WF-04 State
  const [wf04Prompt, setWf04Prompt] = useState(
    'Quy đổi gói Enterprise 1500 USD sang VND theo tỷ giá hôm nay là bao nhiêu?',
  );
  const [wf04Loading, setWf04Loading] = useState(false);
  const [wf04Result, setWf04Result] = useState<any>(null);

  // Audio player & recognition refs
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptScrollRef = useRef<HTMLDivElement | null>(null);

  // Synchronization refs for async callbacks
  const callStatusRef = useRef<CallStatus>('idle');
  const callDurationSecRef = useRef<number>(0);
  const interimSpeechRef = useRef<string>('');
  const isMicMutedRef = useRef<boolean>(false);

  useEffect(() => {
    callStatusRef.current = callStatus;
  }, [callStatus]);

  useEffect(() => {
    callDurationSecRef.current = callDurationSec;
  }, [callDurationSec]);

  useEffect(() => {
    interimSpeechRef.current = liveInterimSpeech;
  }, [liveInterimSpeech]);

  useEffect(() => {
    isMicMutedRef.current = isMicMuted;
  }, [isMicMuted]);

  // Live Call Duration Timer
  useEffect(() => {
    if (callStatus === 'connected') {
      setCallDurationSec(0);
      callTimerRef.current = setInterval(() => {
        setCallDurationSec((prev) => prev + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    }
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [callStatus]);

  // Auto-scroll transcript box
  useEffect(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
    }
  }, [liveTurns, liveInterimSpeech]);

  // Clean-up on unmount
  useEffect(() => {
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
    };
  }, []);

  function formatDuration(sec: number) {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function playTelecomTone(type: 'dial' | 'hangup') {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (type === 'dial') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.frequency.value = 350;
        osc2.frequency.value = 440;
        gain.gain.value = 0.08;
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.start();
        osc2.start();
        setTimeout(() => {
          try {
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
            setTimeout(() => {
              osc1.stop();
              osc2.stop();
              ctx.close();
            }, 180);
          } catch {}
        }, 900);
      } else {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = 480;
        gain.gain.value = 0.1;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        setTimeout(() => {
          try {
            osc.stop();
            ctx.close();
          } catch {}
        }, 250);
      }
    } catch {}
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
          const baoVoice = list.find((v: any) => v.id.includes('bao'));
          setSelectedVoiceId(baoVoice ? baoVoice.id : list[0].id);
        }
      })
      .catch(() => undefined);
  }, []);

  function playBase64Audio(
    base64: string,
    mimeType = 'audio/mpeg',
    onEnded?: () => void,
  ) {
    if (!base64) {
      onEnded?.();
      return;
    }
    try {
      const audioUrl = `data:${mimeType};base64,${base64}`;
      const player = audioPlayerRef.current;
      if (player) {
        player.pause();
        player.volume = 1.0;
        player.src = audioUrl;
        player.onended = () => {
          onEnded?.();
        };
        player.onerror = () => {
          try {
            const fallback = new Audio(audioUrl);
            fallback.volume = 1.0;
            fallback.onended = () => onEnded?.();
            fallback.play().catch(() => onEnded?.());
          } catch {
            onEnded?.();
          }
        };
        const p = player.play();
        if (p) {
          p.catch(() => {
            try {
              const fallback = new Audio(audioUrl);
              fallback.volume = 1.0;
              fallback.onended = () => onEnded?.();
              fallback.play().catch(() => onEnded?.());
            } catch {
              onEnded?.();
            }
          });
        }
      } else {
        const direct = new Audio(audioUrl);
        direct.volume = 1.0;
        direct.onended = () => onEnded?.();
        direct.play().catch(() => onEnded?.());
      }
    } catch {
      onEnded?.();
    }
  }

  async function handlePreviewVoice(voiceId: string) {
    setPreviewVoiceId(voiceId);
    setPreviewLoading(true);
    try {
      const v = voices.find((item) => item.id === voiceId);
      const text =
        v?.id.includes('minhquan')
          ? 'Dạ em chào anh, em là Minh Quân chuyên viên tư vấn AI Sales Agent. Bên em có gói Starter 2 triệu và gói Pro 5 triệu một tháng rất phù hợp với quy mô công ty mình ạ!'
          : v?.id.includes('adam')
            ? 'Dạ em chào anh chị nha! Em là Adam, tư vấn viên giải pháp tự động hóa bán hàng thông minh. Rất vui được hỗ trợ công ty mình hôm nay!'
            : v?.id.includes('myduyen')
              ? 'Dạ em chào anh chị! Em là Mỹ Duyên, tư vấn viên AI Sales Agent. Em có thể giải đáp chi tiết về bảng giá và chính sách ưu đãi ạ!'
              : v?.id.includes('aihan')
                ? 'Xin chào quý khách đã gọi đến tổng đài AI Sales Agent. Em là Ái Hân, xin được hỗ trợ giải đáp mọi thắc mắc của quý khách.'
                : v?.id.includes('bao')
                  ? 'Dạ em chào anh chị, em là Bảo từ đội ngũ giải pháp trí tuệ nhân tạo AI Sales Agent.'
                  : v?.gender === 'female'
                    ? 'Dạ em chào anh chị! Em là tư vấn viên AI, rất vui được hỗ trợ tư vấn cho anh chị hôm nay.'
                    : 'Xin chào quý đối tác! Tôi là chuyên viên tư vấn giải pháp AI Sales Agent.';

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

  // ==============================================================
  // Continuous Hands-Free Live Phone Call Engine (WF-01 & WF-02)
  // ==============================================================

  function startContinuousListening(wf: 'wf01' | 'wf02') {
    if (callStatusRef.current !== 'connected') return;
    if (isMicMutedRef.current) return;

    setCallSpeakerState('user_listening');
    setLiveInterimSpeech('');

    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = 'vi-VN';
      recognition.continuous = false;
      recognition.interimResults = true;

      let finalRecognizedText = '';

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalRecognizedText = trans;
          } else {
            interim += trans;
          }
        }
        const textToDisplay = finalRecognizedText || interim;
        setLiveInterimSpeech(textToDisplay);

        // Reset silence timeout: 1.4s of no speech -> auto submit!
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          try {
            recognition.stop();
          } catch {}
        }, 1400);
      };

      recognition.onend = () => {
        if (callStatusRef.current !== 'connected') return;
        const textToSend = finalRecognizedText.trim() || interimSpeechRef.current.trim();
        if (textToSend && textToSend.length > 2) {
          sendUserSpeechTurn(wf, textToSend);
        } else {
          // If no speech detected yet, keep listening
          if (callStatusRef.current === 'connected' && !isMicMutedRef.current) {
            setCallSpeakerState('user_listening');
          }
        }
      };

      recognition.onerror = () => {
        if (callStatusRef.current === 'connected' && !isMicMutedRef.current) {
          setCallSpeakerState('user_listening');
        }
      };

      recognition.start();
    } catch {
      // recognition start error (e.g. mic permission denied)
    }
  }

  async function sendUserSpeechTurn(wf: 'wf01' | 'wf02', userText: string) {
    if (callStatusRef.current !== 'connected') return;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    const timeStamp = formatDuration(callDurationSecRef.current);
    setLiveTurns((prev) => [
      ...prev,
      { role: 'customer', text: userText, timestamp: timeStamp },
    ]);
    setLiveInterimSpeech('');
    setCallSpeakerState('ai_thinking');

    try {
      const lead = leads.find((l) => l.id === selectedLeadId) || leads[0];
      const res = await fetch('/api/sales/voice-workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: wf,
          payload:
            wf === 'wf01'
              ? {
                  lead_id: lead?.id,
                  phone: phone || lead?.phone || '0905112233',
                  voice_id: selectedVoiceId,
                  customer_speech: userText,
                }
              : {
                  query: userText,
                  speech: userText,
                  voice_id: selectedVoiceId,
                },
        }),
      });

      const data = await res.json();
      const result = data?.data || data;

      const aiReplyText =
        result?.call_result?.ai_reply ||
        result?.reply_text ||
        result?.speech_response ||
        result?.tts_audio?.spoken_text ||
        'Dạ em đã ghi nhận thông tin và sẽ gửi báo giá chi tiết qua email/Zalo cho anh chị ngay ạ!';

      const b64 = result?.tts_audio?.audio_base64 || result?.audio_base64;
      const mime = result?.tts_audio?.mime_type || result?.mime_type || 'audio/mpeg';

      setCallReport((prev: any) => ({
        ...prev,
        lastResult: result,
        proposal: result?.proposal,
        approval_id: result?.approval_id,
        intent:
          result?.call_result?.intent || result?.intent || 'request_proposal',
        sentiment:
          result?.call_result?.sentiment || result?.sentiment || 'positive',
        durationSec: callDurationSecRef.current,
      }));

      onApprovalCreated?.();

      if (callStatusRef.current !== 'connected') return;

      const replyTimestamp = formatDuration(callDurationSecRef.current);
      setLiveTurns((prev) => [
        ...prev,
        { role: 'ai', text: aiReplyText, timestamp: replyTimestamp },
      ]);
      setCallSpeakerState('ai_speaking');

      if (b64) {
        playBase64Audio(b64, mime, () => {
          // Continuous loop: automatically start listening for next turn!
          startContinuousListening(wf);
        });
      } else {
        setTimeout(() => startContinuousListening(wf), 2500);
      }
    } catch {
      setCallSpeakerState('user_listening');
    }
  }

  async function startLivePhoneCall(wf: 'wf01' | 'wf02') {
    playTelecomTone('dial');
    setCallStatus('dialing');
    setCallSpeakerState('ai_thinking');
    setLiveTurns([]);
    setLiveInterimSpeech('');
    setCallReport(null);

    // Wait 1.2s for dial tone
    await new Promise((resolve) => setTimeout(resolve, 1200));

    setCallStatus('connected');
    setCallSpeakerState('ai_speaking');

    const lead = leads.find((l) => l.id === selectedLeadId) || leads[0];
    const leadName = lead ? lead.name : 'Quý khách';
    const greetingText =
      wf === 'wf01'
        ? `Dạ em chào anh ${leadName}! Em là Bảo từ đội ngũ giải pháp AI Sales Agent. Em thấy bên mình đang quan tâm giải pháp Voice AI và tự động hóa CRM, em có thể hỗ trợ tư vấn thông tin gì cho bên anh ạ?`
        : `Tổng đài giải pháp AI Sales Agent xin nghe! Em là Bảo, chuyên viên tiếp nhận hỗ trợ. Anh chị đang quan tâm bảng giá hay chính sách giải pháp nào bên em ạ?`;

    setLiveTurns([{ role: 'ai', text: greetingText, timestamp: '00:01' }]);

    try {
      const res = await fetch('/api/sales/voice-workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'tts',
          payload: { text: greetingText, voice_id: selectedVoiceId },
        }),
      });
      const data = await res.json();
      const b64 = data?.data?.audio_base64 || data?.audio_base64;
      const mime = data?.data?.mime_type || data?.mime_type || 'audio/mpeg';

      if (b64) {
        playBase64Audio(b64, mime, () => {
          startContinuousListening(wf);
        });
      } else {
        setTimeout(() => startContinuousListening(wf), 2500);
      }
    } catch {
      setTimeout(() => startContinuousListening(wf), 2500);
    }
  }

  function endLivePhoneCall() {
    playTelecomTone('hangup');
    setCallStatus('ended');
    setCallSpeakerState('idle');
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
    setCallReport((prev: any) => ({
      ...prev,
      durationSec: callDurationSecRef.current,
      turnCount: liveTurns.length,
    }));
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
                  Voice AI Outbound Calling Agent — Đàm Thoại 2 Chiều Rảnh Tay
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Mô phỏng cuộc gọi điện thoại thực tế: Bấm Bắt đầu → AI tự động quay số & chào → Tự mở Micro để bạn nói → AI trả lời bằng giọng nói thật (Giọng Bảo tự train) → Đối thoại liên tục không cần chạm nút.
                </p>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 self-start sm:self-auto">
                n8n - Twilio - Neural TTS
              </span>
            </div>

            {/* CALL STATUS: IDLE (Setup & Ready to Dial) */}
            {callStatus === 'idle' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6">
                <div className="lg:col-span-5 space-y-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      1. Chọn khách hàng tiềm năng (Lead) cần gọi
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
                              ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-200 shadow-sm'
                              : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{lead.name}</p>
                            <p className="text-[11px] text-slate-500 truncate">{lead.company} • {lead.phone}</p>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                            {lead.score}đ Hot
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      2. Chọn giọng AI tư vấn
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'vn-minhquan-male', name: 'Minh Quân', gender: 'Nam Bắc', tag: '⭐ AI Cảm Xúc Mặc Định' },
                        { id: 'vn-adam-male', name: 'Adam', gender: 'Nam Nam', tag: 'Ấm Áp & Tự Nhiên' },
                        { id: 'vn-myduyen-female', name: 'Mỹ Duyên', gender: 'Nữ Bắc', tag: 'Diễn Cảm Truyền Cảm' },
                        { id: 'clone-bao-owner', name: 'Giọng Bảo', gender: 'Nam', tag: 'Flow-Matching Clone' },
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
                      <span className="text-[10px] text-emerald-600 font-semibold">VieNeu-TTS Flow-Matching Engine (~0.6s)</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-900 space-y-1.5">
                    <p className="font-bold flex items-center gap-1.5 text-indigo-800">
                      <span>💡</span> Trải nghiệm Hands-free Live Call:
                    </p>
                    <p className="text-[11px] text-indigo-700 leading-relaxed">
                      Khi bấm nút gọi, AI sẽ đổ chuông và tự động chào mở đầu. Ngay khi AI dứt lời, Micro trình duyệt sẽ tự động kích hoạt để bạn nói chuyện tự nhiên như một cuộc gọi điện thoại thông thường!
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => startLivePhoneCall('wf01')}
                    className="w-full flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 py-4 px-6 text-sm sm:text-base font-extrabold text-white shadow-xl shadow-emerald-600/30 hover:opacity-95 active:scale-98 transition-all"
                  >
                    <span className="text-xl">📞</span>
                    <span>BẮT ĐẦU CUỘC GỌI ĐIỆN THOẠI TRỰC TIẾP</span>
                  </button>
                </div>

                <div className="lg:col-span-7 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 rounded-3xl p-6 text-white flex flex-col justify-between border border-slate-800 shadow-2xl relative overflow-hidden min-h-[420px]">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
                      <span className="text-xs font-bold text-slate-300">Tổng Đài Viễn Thông VoIP • Sẵn sàng</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">VoLTE HD Audio</span>
                  </div>

                  <div className="my-auto py-8 flex flex-col items-center justify-center text-center">
                    <div className="relative mb-5">
                      <div className="h-24 w-24 rounded-full bg-indigo-600/20 border-2 border-indigo-500/40 flex items-center justify-center text-3xl shadow-lg">
                        👤
                      </div>
                    </div>
                    <h4 className="text-lg font-black text-white">
                      {leads.find((l) => l.id === selectedLeadId)?.name || 'Nguyễn Văn An'}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {leads.find((l) => l.id === selectedLeadId)?.company || 'An Phát Logistics'}
                    </p>
                    <p className="text-sm font-mono text-emerald-400 font-bold mt-1.5">{phone}</p>
                    <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300">
                      <span>Giọng phát:</span>
                      <strong className="text-indigo-300">
                        {voices.find((v) => v.id === selectedVoiceId)?.display_name.split('—')[0] || 'Minh Quân (VieNeu AI)'}
                      </strong>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-black/40 border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Đường truyền: <strong className="text-emerald-400">Web Audio + Web Speech API</strong></span>
                    <span className="text-slate-500">Auto-turn silence detection: 1.4s</span>
                  </div>
                </div>
              </div>
            )}

            {/* CALL STATUS: DIALING or CONNECTED (Live Conversational Softphone Terminal) */}
            {(callStatus === 'dialing' || callStatus === 'connected') && (
              <div className="pt-6">
                <div className="rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-slate-800 p-6 text-white shadow-2xl relative overflow-hidden">
                  {/* Top Call Status Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-800/80 gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                      </span>
                      <div>
                        <div className="text-xs font-mono font-black text-emerald-400 tracking-wider">
                          {callStatus === 'dialing' ? 'ĐANG ĐỔ CHUÔNG...' : `ĐÃ KẾT NỐI • ${formatDuration(callDurationSec)}`}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {leads.find((l) => l.id === selectedLeadId)?.name || 'Khách hàng'} • {phone}
                        </div>
                      </div>
                    </div>

                    {/* Live State Badge */}
                    <div className="flex items-center gap-2">
                      {callSpeakerState === 'ai_speaking' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30 animate-pulse">
                          <span>🔊</span> Bảo (AI Sales Agent) đang nói...
                        </span>
                      )}
                      {callSpeakerState === 'user_listening' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40 animate-pulse shadow-md shadow-emerald-500/20">
                          <span>🎙️</span> Micro đang mở — Bạn hãy nói vào micro...
                        </span>
                      )}
                      {callSpeakerState === 'ai_thinking' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                          <svg className="h-3 w-3 animate-spin text-amber-400" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          AI đang suy luận câu trả lời...
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Center Audio Visualizer & Dynamic Waveform */}
                  <div className="py-8 flex flex-col items-center justify-center">
                    <div className="relative mb-4 flex items-center justify-center">
                      {/* Pulsing radar rings for listening */}
                      {callSpeakerState === 'user_listening' && (
                        <>
                          <div className="absolute h-36 w-36 rounded-full bg-emerald-500/10 animate-ping pointer-events-none" />
                          <div className="absolute h-28 w-28 rounded-full bg-emerald-500/20 animate-pulse pointer-events-none" />
                        </>
                      )}
                      {/* Pulsing rings for AI speaking */}
                      {callSpeakerState === 'ai_speaking' && (
                        <>
                          <div className="absolute h-36 w-36 rounded-full bg-indigo-500/10 animate-ping pointer-events-none" />
                          <div className="absolute h-28 w-28 rounded-full bg-indigo-500/20 animate-pulse pointer-events-none" />
                        </>
                      )}
                      <div
                        className={`h-20 w-20 rounded-full flex items-center justify-center text-3xl shadow-xl transition-all ${
                          callSpeakerState === 'user_listening'
                            ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 border-2 border-emerald-400 text-white ring-4 ring-emerald-500/30'
                            : callSpeakerState === 'ai_speaking'
                              ? 'bg-gradient-to-tr from-indigo-600 to-blue-500 border-2 border-indigo-400 text-white ring-4 ring-indigo-500/30'
                              : 'bg-slate-800 border-2 border-slate-700 text-slate-300'
                        }`}
                      >
                        {callSpeakerState === 'user_listening' ? '🎙️' : callSpeakerState === 'ai_speaking' ? '🗣️' : '📞'}
                      </div>
                    </div>

                    {/* Dynamic Bouncing Waveform Spectrum */}
                    <div className="flex items-center justify-center gap-1.5 h-12 my-2">
                      {[35, 75, 45, 95, 60, 100, 50, 85, 40, 90, 55, 70, 30].map((val, idx) => {
                        const isSpeaking = callSpeakerState === 'ai_speaking' || callSpeakerState === 'user_listening';
                        return (
                          <span
                            key={idx}
                            className={`w-1 rounded-full transition-all duration-200 ${
                              callSpeakerState === 'user_listening'
                                ? 'bg-gradient-to-t from-emerald-500 to-teal-300'
                                : 'bg-gradient-to-t from-indigo-500 to-cyan-300'
                            }`}
                            style={{
                              height: isSpeaking ? `${val}%` : '20%',
                              opacity: isSpeaking ? 1 : 0.35,
                            }}
                          />
                        );
                      })}
                    </div>

                    {/* Live Speech Recognition Bubble (What user is currently saying) */}
                    {liveInterimSpeech && (
                      <div className="mt-2 max-w-md px-4 py-2 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs font-medium text-center animate-pulse shadow-lg">
                        <span className="font-bold text-emerald-400">Bạn đang nói:</span> &quot;{liveInterimSpeech}&quot;
                      </div>
                    )}
                  </div>

                  {/* Multi-Turn Interactive Transcript */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-1">
                      <span>LỊCH SỬ ĐỐI THOẠI TRỰC TIẾP ({liveTurns.length} lượt)</span>
                      <span>Tự động cuộn</span>
                    </div>
                    <div
                      ref={transcriptScrollRef}
                      className="max-h-56 overflow-y-auto space-y-2.5 p-3.5 rounded-2xl bg-black/50 border border-slate-800 text-xs scroll-smooth"
                    >
                      {liveTurns.map((turn, idx) => (
                        <div
                          key={idx}
                          className={`flex items-start gap-2.5 ${turn.role === 'customer' ? 'justify-end' : 'justify-start'}`}
                        >
                          {turn.role === 'ai' && (
                            <span className="h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] shrink-0 text-white font-bold">
                              AI
                            </span>
                          )}
                          <div
                            className={`p-3 rounded-2xl max-w-[85%] sm:max-w-[75%] leading-relaxed ${
                              turn.role === 'customer'
                                ? 'bg-emerald-600/90 text-white rounded-tr-none'
                                : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-tl-none'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3 text-[10px] opacity-75 mb-1 font-mono">
                              <span>{turn.role === 'customer' ? '👤 Khách hàng (Bạn)' : '🤖 Bảo (AI Sales)'}</span>
                              <span>{turn.timestamp}</span>
                            </div>
                            <p className="text-xs whitespace-pre-wrap">{turn.text}</p>
                          </div>
                          {turn.role === 'customer' && (
                            <span className="h-6 w-6 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] shrink-0 text-white font-bold">
                              👤
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Speech Chips: 1-Touch Speech Trigger (Super useful in noisy rooms or testing with teacher) */}
                  <div className="pt-2 border-t border-slate-800/80">
                    <div className="text-[11px] font-bold text-slate-400 mb-2">
                      💡 Gợi ý câu hỏi nhanh (Bấm để gửi ngay câu thoại vào cuộc gọi):
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'Gói Pro giá bao nhiêu và có chiết khấu không em?',
                        'Bên em có chính sách dùng thử 14 ngày miễn phí không?',
                        'Hệ thống có bảo mật và tích hợp CRM sẵn có không?',
                        'Em tạo báo giá chi tiết gửi qua Zalo cho anh nhé.',
                      ].map((promptText) => (
                        <button
                          key={promptText}
                          type="button"
                          disabled={callSpeakerState === 'ai_thinking'}
                          onClick={() => sendUserSpeechTurn('wf01', promptText)}
                          className="text-xs px-3 py-1.5 rounded-full bg-slate-800/90 hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-700 hover:border-indigo-500 transition-all active:scale-95 disabled:opacity-50"
                        >
                          💬 {promptText}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Optional write-in box during call */}
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="text"
                      value={customCallInput}
                      onChange={(e) => setCustomCallInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && customCallInput.trim()) {
                          sendUserSpeechTurn('wf01', customCallInput.trim());
                          setCustomCallInput('');
                        }
                      }}
                      placeholder="Hoặc gõ câu nói tại đây rồi nhấn Enter để gửi..."
                      className="flex-1 rounded-xl bg-slate-800/80 border border-slate-700 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
                    />
                    <button
                      type="button"
                      disabled={!customCallInput.trim() || callSpeakerState === 'ai_thinking'}
                      onClick={() => {
                        if (customCallInput.trim()) {
                          sendUserSpeechTurn('wf01', customCallInput.trim());
                          setCustomCallInput('');
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 disabled:opacity-40 transition-all shrink-0"
                    >
                      Gửi ➤
                    </button>
                  </div>

                  {/* Bottom Softphone Controls Dock */}
                  <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => setIsMicMuted(!isMicMuted)}
                      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        isMicMuted
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <span>{isMicMuted ? '🔇' : '🎙️'}</span>
                      <span>{isMicMuted ? 'Mic: Đã Tắt' : 'Mic: Đang Bật'}</span>
                    </button>

                    {/* BIG RED HANGUP BUTTON */}
                    <button
                      type="button"
                      onClick={endLivePhoneCall}
                      className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-black text-sm shadow-xl shadow-red-600/40 active:scale-95 transition-all"
                    >
                      <span className="text-lg">🔴</span>
                      <span>GÁC MÁY / KẾT THÚC CUỘC GỌI</span>
                    </button>

                    <div className="text-[11px] text-slate-400 hidden sm:block text-right">
                      <div>Thời lượng: <strong className="text-emerald-400 font-mono">{formatDuration(callDurationSec)}</strong></div>
                      <div>Chế độ: <strong className="text-indigo-400">Full Duplex Audio</strong></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CALL STATUS: ENDED (Call Summary & Deal Closing Report) */}
            {callStatus === 'ended' && (
              <div className="pt-6 space-y-5 animate-fade-in-up">
                <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-2.5 text-emerald-400">
                      <span className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-sm font-bold border border-emerald-500/40">
                        ✓
                      </span>
                      <h4 className="text-base font-black text-white">Biên Bản Tóm Tắt Cuộc Gọi (Call Debrief)</h4>
                    </div>
                    <span className="text-xs font-mono text-slate-400">
                      Tổng thời lượng: <strong className="text-emerald-400">{formatDuration(callReport?.durationSec || callDurationSec)}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Số lượt đối thoại</div>
                      <div className="text-lg font-black text-white mt-1">{callReport?.turnCount || liveTurns.length} lượt</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Ý định phân tích</div>
                      <div className="text-xs font-bold text-indigo-400 mt-2 truncate">
                        {callReport?.intent || 'request_proposal'}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Đánh giá cảm xúc</div>
                      <div className="text-xs font-bold text-emerald-400 mt-2">
                        {callReport?.sentiment || 'positive'} (+20đ Hot)
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Tạo Báo Giá CRM</div>
                      <div className="text-xs font-bold text-amber-400 mt-2 truncate">Gói Pro (5Tr/tháng)</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/50 text-xs text-indigo-200 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white mb-0.5">✓ Tự động hóa Workflow hoàn tất:</p>
                      <p className="text-[11px] text-indigo-300">
                        Hệ thống đã lưu tương tác vào CRM, tạo báo giá Gói Pro và chuyển sang cổng Phê Duyệt Quản Lý (HITL Gate).
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                      Chờ duyệt chiết khấu 15%
                    </span>
                  </div>

                  {/* Transcript Review */}
                  <div>
                    <div className="text-xs font-bold text-slate-400 mb-2">Toàn văn cuộc đàm thoại:</div>
                    <div className="max-h-48 overflow-y-auto p-3.5 rounded-xl bg-black/60 border border-slate-800 text-xs text-slate-300 space-y-2 font-mono">
                      {liveTurns.map((turn, i) => (
                        <div key={i} className="leading-relaxed">
                          <strong className={turn.role === 'customer' ? 'text-emerald-400' : 'text-indigo-400'}>
                            [{turn.timestamp}] {turn.role === 'customer' ? 'Khách hàng' : 'Bảo (AI)'}:
                          </strong>{' '}
                          {turn.text}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCallStatus('idle')}
                    className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg transition-all"
                  >
                    📞 BẮT ĐẦU CUỘC GỌI MỚI VỚI KHÁCH HÀNG KHÁC
                  </button>
                </div>
              </div>
            )}
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
                  Voice AI Inbound Receptionist — Tổng Đài Lễ Tân &amp; RAG pgvector
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Mô phỏng khách hàng gọi tới Tổng đài Hotline 1900-8888: AI Lễ Tân tiếp nhận cuộc gọi, tra cứu tri thức pgvector và đối thoại giọng nói 2 chiều liên tục.
                </p>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 self-start sm:self-auto">
                n8n - Voice API - RAG pgvector
              </span>
            </div>

            {/* CALL STATUS: IDLE (Setup & Ready to Call Hotline) */}
            {callStatus === 'idle' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6">
                <div className="lg:col-span-5 space-y-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      1. Chọn giọng Lễ Tân Tổng Đài AI
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'vn-aihan-female', name: 'Ái Hân', gender: 'Nữ Nam', tag: '⭐ Chuẩn Tiếp Tân B2B' },
                        { id: 'vn-myduyen-female', name: 'Mỹ Duyên', gender: 'Nữ Bắc', tag: 'Diễn Cảm Nhẹ Nhàng' },
                        { id: 'vn-minhquan-male', name: 'Minh Quân', gender: 'Nam Bắc', tag: 'Chuyên Viên Tư Vấn' },
                        { id: 'clone-bao-owner', name: 'Giọng Bảo', gender: 'Nam', tag: 'Flow-Matching Clone' },
                      ].map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setSelectedVoiceId(v.id)}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            selectedVoiceId === v.id
                              ? 'border-purple-600 bg-purple-50/80 ring-2 ring-purple-200'
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
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-800 transition-colors"
                      >
                        <span>🔊</span>
                        <span>{previewLoading ? 'Đang phát...' : 'Nghe thử giọng Lễ Tân'}</span>
                      </button>
                      <span className="text-[10px] text-purple-600 font-semibold">VieNeu-TTS Flow-Matching Engine (~0.6s)</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 text-xs text-purple-900 space-y-1.5">
                    <p className="font-bold flex items-center gap-1.5 text-purple-800">
                      <span>🎧</span> Trực tiếp gọi vào Hotline:
                    </p>
                    <p className="text-[11px] text-purple-700 leading-relaxed">
                      Bạn sẽ đóng vai khách hàng gọi đến Hotline 1900-8888. Lễ Tân AI sẽ chào đón và tự động mở Micro để bạn hỏi bất kỳ câu hỏi nào về bảng giá, tính năng hoặc chính sách bảo mật!
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => startLivePhoneCall('wf02')}
                    className="w-full flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 py-4 px-6 text-sm sm:text-base font-extrabold text-white shadow-xl shadow-purple-600/30 hover:opacity-95 active:scale-98 transition-all"
                  >
                    <span className="text-xl">🎧</span>
                    <span>GỌI ĐẾN TỔNG ĐÀI AI (HOTLINE 1900-8888)</span>
                  </button>
                </div>

                <div className="lg:col-span-7 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 rounded-3xl p-6 text-white flex flex-col justify-between border border-slate-800 shadow-2xl relative overflow-hidden min-h-[380px]">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <span className="font-bold text-purple-400 text-xs">Kho Tri Thức RAG (pgvector)</span>
                    <span className="text-[11px] font-mono text-emerald-400">Cosine Similarity 94.8%</span>
                  </div>

                  <div className="my-auto py-4 space-y-3">
                    <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                      <p className="font-bold text-white mb-1">Dữ liệu sẵn sàng đối soát trong PostgreSQL pgvector:</p>
                      <p className="italic text-slate-400">
                        &quot;Gói Starter 2 triệu/tháng cho 5 sales. Gói Pro 5 triệu/tháng đầy đủ Voice AI Outbound (WF-01) và Inbound RAG (WF-02). Hỗ trợ 14 ngày dùng thử miễn phí, bảo mật mã hóa AES-256.&quot;
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-800/40 text-xs text-purple-200 flex items-center justify-between">
                      <span>Cơ chế xử lý: <strong className="text-white">pgvector Semantic Search + Gemini 3.8 Flash</strong></span>
                      <span className="text-emerald-400 font-bold">Chuẩn B2B</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-black/40 border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Hotline: <strong className="text-white font-mono">1900-8888 (24/7)</strong></span>
                    <span className="text-amber-400">Hỗ trợ chuyển máy chuyên viên nếu ca khó</span>
                  </div>
                </div>
              </div>
            )}

            {/* CALL STATUS: DIALING or CONNECTED for WF-02 */}
            {(callStatus === 'dialing' || callStatus === 'connected') && (
              <div className="pt-6">
                <div className="rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-slate-800 p-6 text-white shadow-2xl relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-800/80 gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500" />
                      </span>
                      <div>
                        <div className="text-xs font-mono font-black text-purple-400 tracking-wider">
                          {callStatus === 'dialing' ? 'ĐANG KẾT NỐI TỚI TỔNG ĐÀI...' : `ĐANG TRỰC TUYẾN • ${formatDuration(callDurationSec)}`}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Hotline AI Sales Agent • 1900-8888 (Tra cứu RAG trực tiếp)
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {callSpeakerState === 'ai_speaking' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30 animate-pulse">
                          <span>🔊</span> AI Lễ Tân đang giải đáp...
                        </span>
                      )}
                      {callSpeakerState === 'user_listening' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40 animate-pulse shadow-md shadow-emerald-500/20">
                          <span>🎙️</span> Micro đang mở — Bạn hãy đặt câu hỏi...
                        </span>
                      )}
                      {callSpeakerState === 'ai_thinking' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                          <span>⚡</span> Đang tra cứu pgvector RAG...
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Center Visualizer */}
                  <div className="py-8 flex flex-col items-center justify-center">
                    <div className="relative mb-4 flex items-center justify-center">
                      {callSpeakerState === 'user_listening' && (
                        <>
                          <div className="absolute h-36 w-36 rounded-full bg-emerald-500/10 animate-ping pointer-events-none" />
                          <div className="absolute h-28 w-28 rounded-full bg-emerald-500/20 animate-pulse pointer-events-none" />
                        </>
                      )}
                      {callSpeakerState === 'ai_speaking' && (
                        <>
                          <div className="absolute h-36 w-36 rounded-full bg-purple-500/10 animate-ping pointer-events-none" />
                          <div className="absolute h-28 w-28 rounded-full bg-purple-500/20 animate-pulse pointer-events-none" />
                        </>
                      )}
                      <div
                        className={`h-20 w-20 rounded-full flex items-center justify-center text-3xl shadow-xl transition-all ${
                          callSpeakerState === 'user_listening'
                            ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 border-2 border-emerald-400 text-white ring-4 ring-emerald-500/30'
                            : 'bg-gradient-to-tr from-purple-600 to-indigo-600 border-2 border-purple-400 text-white ring-4 ring-purple-500/30'
                        }`}
                      >
                        {callSpeakerState === 'user_listening' ? '🎙️' : '🎧'}
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-1.5 h-12 my-2">
                      {[40, 80, 50, 90, 65, 95, 45, 85, 35, 100, 50, 75, 40].map((val, idx) => {
                        const isSpeaking = callSpeakerState === 'ai_speaking' || callSpeakerState === 'user_listening';
                        return (
                          <span
                            key={idx}
                            className={`w-1 rounded-full transition-all duration-200 ${
                              callSpeakerState === 'user_listening'
                                ? 'bg-gradient-to-t from-emerald-500 to-teal-300'
                                : 'bg-gradient-to-t from-purple-500 to-pink-300'
                            }`}
                            style={{
                              height: isSpeaking ? `${val}%` : '20%',
                              opacity: isSpeaking ? 1 : 0.35,
                            }}
                          />
                        );
                      })}
                    </div>

                    {liveInterimSpeech && (
                      <div className="mt-2 max-w-md px-4 py-2 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs font-medium text-center animate-pulse shadow-lg">
                        <span className="font-bold text-emerald-400">Bạn đang nói:</span> &quot;{liveInterimSpeech}&quot;
                      </div>
                    )}
                  </div>

                  {/* Transcript History */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-1">
                      <span>LỊCH SỬ ĐỐI THOẠI VỚI LỄ TÂN ({liveTurns.length} lượt)</span>
                      <span>Tra cứu RAG tự động</span>
                    </div>
                    <div
                      ref={transcriptScrollRef}
                      className="max-h-56 overflow-y-auto space-y-2.5 p-3.5 rounded-2xl bg-black/50 border border-slate-800 text-xs scroll-smooth"
                    >
                      {liveTurns.map((turn, idx) => (
                        <div
                          key={idx}
                          className={`flex items-start gap-2.5 ${turn.role === 'customer' ? 'justify-end' : 'justify-start'}`}
                        >
                          {turn.role === 'ai' && (
                            <span className="h-6 w-6 rounded-full bg-purple-600 flex items-center justify-center text-[10px] shrink-0 text-white font-bold">
                              AI
                            </span>
                          )}
                          <div
                            className={`p-3 rounded-2xl max-w-[85%] sm:max-w-[75%] leading-relaxed ${
                              turn.role === 'customer'
                                ? 'bg-emerald-600/90 text-white rounded-tr-none'
                                : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-tl-none'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3 text-[10px] opacity-75 mb-1 font-mono">
                              <span>{turn.role === 'customer' ? '👤 Khách hàng (Bạn)' : '🎧 Lễ Tân AI (Bảo)'}</span>
                              <span>{turn.timestamp}</span>
                            </div>
                            <p className="text-xs whitespace-pre-wrap">{turn.text}</p>
                          </div>
                          {turn.role === 'customer' && (
                            <span className="h-6 w-6 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] shrink-0 text-white font-bold">
                              👤
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* WF-02 Quick Chips */}
                  <div className="pt-2 border-t border-slate-800/80">
                    <div className="text-[11px] font-bold text-slate-400 mb-2">
                      💡 Gợi ý câu hỏi RAG (Bấm để hỏi ngay qua loa):
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'Bảng giá các gói dịch vụ AI Sales Agent hiện tại là bao nhiêu?',
                        'Hệ thống có chính sách dùng thử 14 ngày miễn phí và bảo mật không?',
                        'Quy trình tích hợp vào tổng đài và CRM mất khoảng bao lâu?',
                        'Em chuyển máy giúp anh sang chuyên viên tư vấn cấp cao.',
                      ].map((promptText) => (
                        <button
                          key={promptText}
                          type="button"
                          disabled={callSpeakerState === 'ai_thinking'}
                          onClick={() => sendUserSpeechTurn('wf02', promptText)}
                          className="text-xs px-3 py-1.5 rounded-full bg-slate-800/90 hover:bg-purple-600 text-slate-300 hover:text-white border border-slate-700 hover:border-purple-500 transition-all active:scale-95 disabled:opacity-50"
                        >
                          💬 {promptText}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Inline text input */}
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="text"
                      value={customCallInput}
                      onChange={(e) => setCustomCallInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && customCallInput.trim()) {
                          sendUserSpeechTurn('wf02', customCallInput.trim());
                          setCustomCallInput('');
                        }
                      }}
                      placeholder="Hoặc gõ câu hỏi tại đây rồi nhấn Enter để gửi..."
                      className="flex-1 rounded-xl bg-slate-800/80 border border-slate-700 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-purple-500 outline-none"
                    />
                    <button
                      type="button"
                      disabled={!customCallInput.trim() || callSpeakerState === 'ai_thinking'}
                      onClick={() => {
                        if (customCallInput.trim()) {
                          sendUserSpeechTurn('wf02', customCallInput.trim());
                          setCustomCallInput('');
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 disabled:opacity-40 transition-all shrink-0"
                    >
                      Gửi ➤
                    </button>
                  </div>

                  {/* Bottom Dock */}
                  <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => setIsMicMuted(!isMicMuted)}
                      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        isMicMuted
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <span>{isMicMuted ? '🔇' : '🎙️'}</span>
                      <span>{isMicMuted ? 'Mic: Đã Tắt' : 'Mic: Đang Bật'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={endLivePhoneCall}
                      className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-black text-sm shadow-xl shadow-red-600/40 active:scale-95 transition-all"
                    >
                      <span className="text-lg">🔴</span>
                      <span>GÁC MÁY / KẾT THÚC CUỘC GỌI</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => alert('Đã kích hoạt chuyển tiếp cuộc gọi sang chuyên viên tư vấn cấp cao!')}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs hidden sm:block border border-slate-700"
                    >
                      🔀 Chuyển máy chuyên viên
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* CALL STATUS: ENDED for WF-02 */}
            {callStatus === 'ended' && (
              <div className="pt-6 space-y-5 animate-fade-in-up">
                <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-2.5 text-purple-400">
                      <span className="h-6 w-6 rounded-full bg-purple-500/20 flex items-center justify-center text-sm font-bold border border-purple-500/40">
                        ✓
                      </span>
                      <h4 className="text-base font-black text-white">Kết Quả Tiếp Nhận Tổng Đài Lễ Tân (WF-02)</h4>
                    </div>
                    <span className="text-xs font-mono text-slate-400">
                      Thời lượng: <strong className="text-purple-400">{formatDuration(callReport?.durationSec || callDurationSec)}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Lượt hội thoại</div>
                      <div className="text-lg font-black text-white mt-1">{callReport?.turnCount || liveTurns.length} lượt</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Kho dữ liệu RAG</div>
                      <div className="text-xs font-bold text-emerald-400 mt-2">pgvector Match 94.8%</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Trạng thái giải quyết</div>
                      <div className="text-xs font-bold text-purple-400 mt-2">Đã giải đáp trọn vẹn ✓</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCallStatus('idle')}
                    className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-lg transition-all"
                  >
                    🎧 THỰC HIỆN CUỘC GỌI MỚI ĐẾN TỔNG ĐÀI
                  </button>
                </div>
              </div>
            )}
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
