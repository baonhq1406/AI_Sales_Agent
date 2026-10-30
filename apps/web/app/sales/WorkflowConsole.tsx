'use client';

import { useEffect, useRef, useState } from 'react';
import {
  VoiceConversationIllustration,
  MultiAgentOrchestratorIllustration,
  AutonomousAgentReActIllustration,
  RagVectorSearchIllustration,
  CloudStackIllustration,
} from '@/components/AnimatedIllustrations';
import { RETAIL_PRODUCTS, RetailProduct } from '@/lib/retail-catalog.data';

type WorkflowKey = 'wf01' | 'wf02' | 'wf_engine' | 'wf03' | 'wf04';

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

type UserProfile = {
  id?: string;
  role?: string;
  displayName?: string;
  email?: string;
};

export default function WorkflowConsole({
  onApprovalCreated,
  currentUser,
}: {
  onApprovalCreated?: () => void;
  currentUser?: UserProfile | null;
}) {
  const isAdmin = currentUser?.role === 'admin';
  const [activeWf, setActiveWf] = useState<WorkflowKey>('wf01');
  const [voices, setVoices] = useState<VoiceProfile[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('vn-sontung-mtp');
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
  const [selectedWf03Scenario, setSelectedWf03Scenario] = useState<
    'scenario_discount' | 'scenario_demo' | 'scenario_nurture'
  >('scenario_discount');
  const [wf03Loading, setWf03Loading] = useState(false);
  const [wf03Result, setWf03Result] = useState<any>(null);

  // WF-04 State
  const [selectedWf04Task, setSelectedWf04Task] = useState<
    'followup_email' | 'roi_calculator' | 'company_enrichment' | 'crm_sync'
  >('followup_email');
  const [wf04Prompt, setWf04Prompt] = useState(
    'Soạn email follow-up và tin nhắn Zalo kèm ưu đãi 15% gói Pro cho khách hàng Trần Văn An (An Phát Logistics)',
  );
  const [wf04Loading, setWf04Loading] = useState(false);
  const [wf04Result, setWf04Result] = useState<any>(null);
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  // Autonomous Background Engine State (WF-03 + WF-04)
  const [autoBgStatus, setAutoBgStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [engineActiveSubTab, setEngineActiveSubTab] = useState<'wf03' | 'wf04'>('wf03');

  // Demo Scenario Mode: 'b2b' (Mặc định Doanh nghiệp B2B) vs 'retail' (Test Shop Công Nghệ Thực Tế)
  const [scenarioMode, setScenarioMode] = useState<'b2b' | 'retail'>('b2b');
  const scenarioModeRef = useRef<'b2b' | 'retail'>('b2b');
  useEffect(() => {
    scenarioModeRef.current = scenarioMode;
  }, [scenarioMode]);

  // Retail Catalog State (134+ items)
  const [retailSearch, setRetailSearch] = useState('');
  const [retailCategory, setRetailCategory] = useState<string>('all');
  const [isCatalogExpanded, setIsCatalogExpanded] = useState(false);
  const [retailPage, setRetailPage] = useState(1);

  // Audio player & recognition refs
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioCacheRef = useRef<Map<string, { b64: string; mime: string }>>(new Map());
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

  function getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          audioContextRef.current = new AudioCtx();
        }
      }
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(() => {});
      }
      return audioContextRef.current;
    } catch {
      return null;
    }
  }

  function playTelecomTone(type: 'dial' | 'hangup') {
    if (typeof window === 'undefined') return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
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
              try { osc1.stop(); } catch {}
              try { osc2.stop(); } catch {}
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
          const sontungVoice = list.find((v: any) => v.id.includes('sontung'));
          setSelectedVoiceId(sontungVoice ? sontungVoice.id : list[0].id);
        }
      })
      .catch(() => undefined);

    // Pre-warm background autonomous engine
    triggerAutonomousBackgroundExecution();
  }, []);

  function b64toBlob(b64Data: string, contentType = 'audio/wav'): Blob {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];
    const sliceSize = 1024;
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      byteArrays.push(new Uint8Array(byteNumbers));
    }
    return new Blob(byteArrays, { type: contentType });
  }

  function getGreetingText(
    wf: 'wf01' | 'wf02',
    voiceId: string,
    leadName = 'Quý khách',
    scenario: 'b2b' | 'retail' = 'b2b',
  ) {
    if (scenario === 'retail') {
      if (wf === 'wf01') {
        if (voiceId.includes('sontung') || voiceId.includes('mtp')) {
          return `Ú òa, chào ${leadName} nha! Mình là Sơn Tùng M-TP đại sứ TechZone đây! Thấy bạn vừa quan tâm iPhone 16 Series và MacBook chính hãng, Tùng hỗ trợ báo giá và quà tặng ngay nhé!`;
        }
        if (voiceId.includes('jack') || voiceId.includes('j97')) {
          return `Dạ em chào anh ${leadName} nha! Em là Jack đại sứ Cửa hàng Công nghệ TechZone đây ạ. Hôm nay em hỗ trợ tư vấn phiên bản và kiểm tra tồn kho máy cho mình nghen!`;
        }
        if (voiceId.includes('domixi') || voiceId.includes('mixi')) {
          return `Hế lô anh ${leadName}, Độ Phùng đại sứ TechZone đây anh em ơi! Nghe nói anh đang tăm tia con iPhone 16 Pro Max hay MacBook M4, để tôi check giá ưu đãi và quà tặng cho anh em luôn nhé!`;
        }
        return `Dạ em chào anh ${leadName}! Em là Trúc Ly từ Cửa Hàng Công Nghệ TechZone. Em thấy mình vừa quan tâm iPhone 16 Series và MacBook chính hãng, em có thể hỗ trợ tư vấn phiên bản nào cho mình ạ?`;
      } else {
        if (voiceId.includes('sontung') || voiceId.includes('mtp')) {
          return `Cửa hàng Công nghệ TechZone xin chào! Mình là Sơn Tùng M-TP đây, rất vui được hỗ trợ kiểm tra giá, tồn kho máy và ưu đãi hôm nay cho bạn nha!`;
        }
        if (voiceId.includes('jack') || voiceId.includes('j97')) {
          return `Dạ, Hotline Cửa Hàng TechZone xin nghe ạ! Em là Jack đây, chúc anh chị một ngày vui vẻ. Mình đang quan tâm dòng máy hay cần kiểm tra tồn kho ở chi nhánh nào ạ?`;
        }
        if (voiceId.includes('domixi') || voiceId.includes('mixi')) {
          return `Alo alo, Hotline Cửa Hàng TechZone xin nghe! Độ Phùng đây anh em ơi, đang muốn check giá iPhone 16, MacBook hay hỏi địa chỉ chi nhánh gần nhất thế?`;
        }
        return `Dạ, Cửa hàng Công nghệ TechZone xin kính chào quý khách! Em là Trúc Ly, rất vui được hỗ trợ anh chị tra cứu giá bán, quà tặng và kiểm tra tồn kho sản phẩm ạ!`;
      }
    }

    if (wf === 'wf01') {
      if (voiceId.includes('sontung') || voiceId.includes('mtp')) {
        return `Ú òa, chào anh ${leadName} nha! Mình là Sơn Tùng M-TP đây! Thấy công ty mình đang tìm hiểu giải pháp AI Sales Agent siêu đỉnh này, Tùng có thể hỗ trợ tư vấn chi tiết cho anh nhé!`;
      }
      if (voiceId.includes('jack') || voiceId.includes('j97')) {
        return `Dạ em chào anh ${leadName} nha! Em là Jack đây ạ, thấy công ty mình đang quan tâm giải pháp Voice AI và tự động hóa bán hàng bên em, em có thể hỗ trợ anh thông tin gì hôm nay ạ?`;
      }
      if (voiceId.includes('domixi') || voiceId.includes('mixi')) {
        return `Hế lô anh ${leadName}, lại là tôi Tộc Trưởng Độ Phùng đây! Thấy anh đang quan tâm nền tảng AI Sales Agent thông minh, để tôi tư vấn cho anh giải pháp phù hợp nhất luôn nhé!`;
      }
      return `Dạ em chào anh ${leadName}! Em là Trúc Ly từ đội ngũ giải pháp AI Sales Agent. Em thấy bên mình đang quan tâm giải pháp Voice AI và tự động hóa CRM, em có thể hỗ trợ tư vấn thông tin gì cho bên anh ạ?`;
    } else {
      if (voiceId.includes('sontung') || voiceId.includes('mtp')) {
        return `Tổng đài AI Sales Agent xin chào! Mình là Sơn Tùng M-TP đây, rất vui được trực tiếp hỗ trợ giải đáp mọi thắc mắc về bảng giá và tính năng cho bạn nha!`;
      }
      if (voiceId.includes('jack') || voiceId.includes('j97')) {
        return `Dạ, Tổng đài AI xin nghe ạ! Em là Jack đây, chúc anh chị một ngày làm việc thật nhiều năng lượng. Em có thể hỗ trợ tư vấn thông tin gì cho mình ạ?`;
      }
      if (voiceId.includes('domixi') || voiceId.includes('mixi')) {
        return `Alo alo, Tổng đài AI Sales Agent xin nghe! Tộc Trưởng Độ Phùng đây anh em ơi, anh em đang muốn tìm hiểu về bảng giá hay tính năng nào của hệ thống thế?`;
      }
      return `Dạ, Tổng đài AI Sales Agent xin kính chào quý khách! Em là Trúc Ly - Lễ tân AI tiếp nhận cuộc gọi, rất vui được hỗ trợ giải đáp thông tin về bảng giá và tính năng cho anh chị ạ!`;
    }
  }

  // Tự động pre-fetch âm thanh lời chào vào bộ nhớ RAM trình duyệt ngay khi đổi nhân vật, lead, hoặc kịch bản
  useEffect(() => {
    if (!selectedVoiceId || typeof window === 'undefined') return;
    const lead = leads.find((l) => l.id === selectedLeadId) || leads[0];
    const leadName = lead ? lead.name : 'Quý khách';

    for (const w of ['wf01', 'wf02'] as const) {
      const text = getGreetingText(w, selectedVoiceId, leadName, scenarioMode);
      const key = `${w}:${scenarioMode}:${selectedVoiceId}:${text}`;

      if (audioCacheRef.current.has(key)) continue;

      fetch('/api/sales/voice-workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'tts',
          payload: { text, voice_id: selectedVoiceId },
        }),
      })
        .then((r) => r.json())
        .then((res) => {
          const b64 = res?.data?.audio_base64 || res?.audio_base64;
          const mime = res?.data?.mime_type || res?.mime_type || 'audio/wav';
          if (b64) {
            audioCacheRef.current.set(key, { b64, mime });
          }
        })
        .catch(() => {});
    }
  }, [selectedVoiceId, selectedLeadId, leads, scenarioMode]);

  const SILENT_WAV_BASE64 =
    'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

  function primeAudioPlayback() {
    if (typeof window === 'undefined') return;
    try {
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      if (audioPlayerRef.current) {
        audioPlayerRef.current.src = SILENT_WAV_BASE64;
        audioPlayerRef.current.play().catch(() => {});
      }
    } catch {}
  }

  async function playBase64Audio(
    base64: string,
    mimeType = 'audio/wav',
    onEnded?: () => void,
  ) {
    if (!base64) {
      onEnded?.();
      return;
    }

    // 1. Web Audio API Engine: Không bao giờ bị trình duyệt chặn âm thanh
    // sau khi AudioContext đã được mở khóa ở lần bấm đầu tiên
    try {
      const ctx = getAudioContext();
      if (ctx) {
        if (ctx.state === 'suspended') {
          await ctx.resume().catch(() => {});
        }

        if (activeAudioSourceRef.current) {
          try {
            activeAudioSourceRef.current.stop();
          } catch {}
          activeAudioSourceRef.current = null;
        }

        const raw = base64.replace(/^data:audio\/[^;]+;base64,/, '');
        const binary = atob(raw);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }

        const audioBuffer = await new Promise<AudioBuffer>((resolve, reject) => {
          ctx.decodeAudioData(bytes.buffer.slice(0), resolve, reject);
        });

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);

        let finished = false;
        source.onended = () => {
          if (!finished) {
            finished = true;
            activeAudioSourceRef.current = null;
            onEnded?.();
          }
        };

        activeAudioSourceRef.current = source;
        source.start(0);
        return;
      }
    } catch (e) {
      console.warn('Web Audio API playback failed, falling back to HTML5 audio:', e);
    }

    // 2. Dự phòng: HTML5 Audio element
    try {
      const blob = b64toBlob(base64, mimeType);
      const objectUrl = URL.createObjectURL(blob);
      let finished = false;

      const finishOnce = () => {
        if (!finished) {
          finished = true;
          try {
            URL.revokeObjectURL(objectUrl);
          } catch {}
          onEnded?.();
        }
      };

      const player = audioPlayerRef.current;
      if (player) {
        player.pause();
        player.volume = 1.0;
        player.src = objectUrl;
        player.onended = finishOnce;
        player.onerror = () => finishOnce();
        const playPromise = player.play();
        if (playPromise) {
          playPromise.catch(() => finishOnce());
        }
      } else {
        const direct = new Audio(objectUrl);
        direct.volume = 1.0;
        direct.onended = finishOnce;
        direct.onerror = finishOnce;
        direct.play().catch(() => finishOnce());
      }
    } catch {
      onEnded?.();
    }
  }

  async function handlePreviewVoice(voiceId: string) {
    primeAudioPlayback();
    setPreviewVoiceId(voiceId);
    setPreviewLoading(true);
    try {
      const v = voices.find((item) => item.id === voiceId);
      const text =
        v?.id.includes('sontung') || v?.id.includes('mtp')
          ? 'Ú òa! Sơn Tùng M-TP xin chào cả nhà Sky và quý khách hàng nha! Rất vui được đồng hành cùng giải pháp AI Sales Agent siêu đỉnh này!'
          : v?.id.includes('jack') || v?.id.includes('j97')
            ? 'Dạ em chào anh chị và đại gia đình Đom Đóm nha! Em là Jack đây, chúc anh chị một ngày làm việc thật nhiều niềm vui và may mắn!'
            : v?.id.includes('domixi') || v?.id.includes('mixi')
              ? 'Hế lô anh em, lại là tôi Tộc Trưởng Độ Phùng đây! Giải pháp AI Sales Agent này nó phải gọi là đỉnh nóc kịch trần luôn anh em ơi!'
              : 'Dạ xin kính chào quý khách đã gọi đến tổng đài AI Sales Agent! Em là Trúc Ly, rất vui được giải đáp mọi thắc mắc của anh chị về giải pháp Voice AI và bảng giá bên em ạ!';

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
      const mime = data?.data?.mime_type || data?.mime_type || 'audio/wav';
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

        // Reset silence timeout: 800ms of no speech -> auto submit for rapid turn turnaround!
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          try {
            recognition.stop();
          } catch {}
        }, 800);
      };

      recognition.onend = () => {
        if (callStatusRef.current !== 'connected') return;
        const textToSend = finalRecognizedText.trim() || interimSpeechRef.current.trim();
        if (textToSend && textToSend.length > 2) {
          sendUserSpeechTurn(wf, textToSend);
        } else {
          // If no speech detected yet, restart listening loop so mic stays alive continuously!
          if (callStatusRef.current === 'connected' && !isMicMutedRef.current) {
            setTimeout(() => {
              if (callStatusRef.current === 'connected' && !isMicMutedRef.current) {
                startContinuousListening(wf);
              }
            }, 300);
          }
        }
      };

      recognition.onerror = (event: any) => {
        if (callStatusRef.current === 'connected' && !isMicMutedRef.current) {
          const err = event?.error;
          if (err === 'no-speech' || err === 'network') {
            setTimeout(() => {
              if (callStatusRef.current === 'connected' && !isMicMutedRef.current) {
                startContinuousListening(wf);
              }
            }, 500);
          } else {
            setCallSpeakerState('user_listening');
          }
        }
      };

      recognition.start();
    } catch {
      // recognition start error (e.g. mic permission denied)
    }
  }

  async function sendUserSpeechTurn(wf: 'wf01' | 'wf02', userText: string) {
    if (callStatusRef.current !== 'connected') return;
    primeAudioPlayback();

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
                  scenario: scenarioModeRef.current === 'retail' ? 'retail_tech_store' : 'b2b_saas',
                }
              : {
                  phone: '1900-8888',
                  caller_name: 'Quý khách',
                  speech: userText,
                  customer_speech: userText,
                  query: userText,
                  voice_id: selectedVoiceId,
                  scenario: scenarioModeRef.current === 'retail' ? 'retail_tech_store' : 'b2b_saas',
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
        (scenarioModeRef.current === 'retail'
          ? 'Dạ iPhone 16 Pro Max 256GB bên em hôm nay ưu đãi chỉ 31 triệu 490 nghìn, tặng kèm sạc nhanh Apple 30W ạ!'
          : 'Dạ bên em có gói Pro 5 triệu một tháng có đầy đủ Voice AI và hỗ trợ dùng thử miễn phí 14 ngày ạ!');

      const b64 = result?.tts_audio?.audio_base64 || result?.audio_base64;
      const mime = result?.tts_audio?.mime_type || result?.mime_type || 'audio/wav';

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
    primeAudioPlayback();
    playTelecomTone('dial');
    setCallStatus('dialing');
    setCallSpeakerState('ai_thinking');
    setLiveTurns([]);
    setLiveInterimSpeech('');
    setCallReport(null);

    const lead = leads.find((l) => l.id === selectedLeadId) || leads[0];
    const leadName = lead ? lead.name : 'Quý khách';
    const greetingText = getGreetingText(wf, selectedVoiceId, leadName, scenarioMode);
    const cacheKey = `${wf}:${scenarioMode}:${selectedVoiceId}:${greetingText}`;

    // Kiểm tra cache âm thanh đã pre-load sẵn trên RAM trình duyệt
    const cached = audioCacheRef.current.get(cacheKey);
    const ttsFetchPromise = cached
      ? Promise.resolve({ data: { audio_base64: cached.b64, mime_type: cached.mime } })
      : fetch('/api/sales/voice-workflows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'tts',
            payload: { text: greetingText, voice_id: selectedVoiceId },
          }),
        })
          .then((r) => r.json())
          .then((res) => {
            const b64 = res?.data?.audio_base64 || res?.audio_base64;
            const mime = res?.data?.mime_type || res?.mime_type || 'audio/wav';
            if (b64) audioCacheRef.current.set(cacheKey, { b64, mime });
            return res;
          })
          .catch(() => null);

    // Chuông chờ nhấc máy 500ms tạo cảm giác tự nhiên như cuộc gọi thật
    const [ttsData] = await Promise.all([
      ttsFetchPromise,
      new Promise((resolve) => setTimeout(resolve, 500)),
    ]);

    setCallStatus('connected');
    setCallSpeakerState('ai_speaking');
    setLiveTurns([{ role: 'ai', text: greetingText, timestamp: '00:01' }]);

    const b64 = ttsData?.data?.audio_base64 || ttsData?.audio_base64;
    const mime = ttsData?.data?.mime_type || ttsData?.mime_type || 'audio/wav';

    if (b64) {
      playBase64Audio(b64, mime, () => {
        startContinuousListening(wf);
      });
    } else {
      setTimeout(() => startContinuousListening(wf), 2000);
    }
  }

  function endLivePhoneCall() {
    playTelecomTone('hangup');
    setCallStatus('ended');
    setCallSpeakerState('idle');
    if (activeAudioSourceRef.current) {
      try {
        activeAudioSourceRef.current.stop();
      } catch {}
      activeAudioSourceRef.current = null;
    }
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

    // TỰ ĐỘNG HÓA HOÀN TOÀN HẬU CUỘC GỌI: Kích hoạt ngay hệ thống ngầm WF-03 & WF-04
    const lead = leads.find((l) => l.id === selectedLeadId);
    triggerAutonomousBackgroundExecution(liveTurns, lead, scenarioModeRef.current);
  }

  async function triggerAutonomousBackgroundExecution(
    turns?: LiveCallTurn[],
    lead?: LeadOption,
    forcedScenario?: 'b2b' | 'retail',
  ) {
    setAutoBgStatus('running');
    setWf03Loading(true);
    setWf04Loading(true);

    const activeMode = forcedScenario || scenarioModeRef.current;
    const fullText =
      turns && turns.length > 0
        ? turns.map((t) => t.text).join(' ')
        : (activeMode === 'retail'
            ? 'Khách hàng Hoàng Long đặt mua iPhone 16 Pro Max 256GB Titan Sa Mạc qua hotline TechZone, áp dụng voucher ưu đãi giảm 3.500.000đ và tặng sạc nhanh Apple 30W.'
            : 'Khách hàng Trần Văn An (An Phát Logistics) yêu cầu chiết khấu 15% cho hợp đồng năm gói Pro sau cuộc gọi tư vấn Voice AI.');

    let detectedScenario: string = activeMode === 'retail' ? 'retail_tech_store' : 'scenario_discount';
    if (activeMode !== 'retail') {
      if (/lịch|demo|khảo sát|họp|meet|kỹ thuật/i.test(fullText)) {
        detectedScenario = 'scenario_demo';
      } else if (/hoãn|ngân sách|quý 2|sau|bận/i.test(fullText)) {
        detectedScenario = 'scenario_nurture';
      }
    }

    try {
      // 1. Chạy ngầm WF-03 (Policy Orchestrator & Quote Approval Gate / Retail Order Provisioning)
      const resWf03 = await fetch('/api/sales/voice-workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'wf03',
          payload: {
            scenario_id: detectedScenario,
            customer_query: fullText,
            lead_id: lead?.id,
            full_name: activeMode === 'retail' ? (lead?.name || 'Anh Hoàng Long') : (lead?.name || 'Trần Văn An'),
            lead_score: lead?.score || 88,
          },
        }),
      });
      const dataWf03 = await resWf03.json();
      setWf03Result(dataWf03?.data || dataWf03);
      if (onApprovalCreated) {
        onApprovalCreated();
      }

      // 2. Chạy ngầm WF-04 (Autonomous ReAct Copilot: Email/Zalo Copywriter & Webhook)
      const resWf04 = await fetch('/api/sales/voice-workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'wf04',
          payload: {
            task_type: 'followup_email',
            task: activeMode === 'retail'
              ? `Soạn tin nhắn xác nhận đơn hàng TechZone và Zalo ZNS cho khách hàng ${lead?.name || 'Hoàng Long'}.`
              : `Soạn email follow-up và tin nhắn Zalo kèm ưu đãi cho khách hàng ${lead?.name || 'Trần Văn An'} sau cuộc đàm thoại.`,
            input: fullText,
            company_name: activeMode === 'retail' ? 'Cửa Hàng Công Nghệ TechZone' : (lead?.company || 'An Phát Logistics'),
          },
        }),
      });
      const dataWf04 = await resWf04.json();
      setWf04Result(dataWf04?.data || dataWf04);

      setAutoBgStatus('completed');
    } catch {
      setAutoBgStatus('error');
    } finally {
      setWf03Loading(false);
      setWf04Loading(false);
    }
  }

  function handleCopyText(text: string, label: string) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedToast(`Đã sao chép ${label}!`);
      setTimeout(() => setCopiedToast(null), 3000);
    }
  }

  async function runWf03Orchestrator() {
    setWf03Loading(true);
    setWf03Result(null);

    const scenarioQueries = {
      scenario_discount:
        'Khách hàng Trần Văn An (An Phát Logistics) yêu cầu chiết khấu 15% cho hợp đồng năm gói Pro sau cuộc gọi tư vấn.',
      scenario_demo:
        'Khách hàng Lê Thị Mai (Mai Linh Logistics) yêu cầu khảo sát hạ tầng VoIP và đặt lịch Demo kỹ thuật chuyên sâu.',
      scenario_nurture:
        'Khách hàng Phạm Hoàng Nam (Nam Long Real) hoãn ngân sách Q1, hẹn liên hệ lại đầu Quý 2/2026.',
    };

    try {
      const res = await fetch('/api/sales/voice-workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'wf03',
          payload: {
            scenario_id: selectedWf03Scenario,
            customer_query: scenarioQueries[selectedWf03Scenario],
            lead_score: selectedWf03Scenario === 'scenario_nurture' ? 94 : 88,
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
          payload: {
            task_type: selectedWf04Task,
            task: wf04Prompt,
            input: wf04Prompt,
            company_name: 'Công ty TNHH Vận Tải An Phát Logistics',
          },
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

  function renderScenarioSelector() {
    const filteredProducts = RETAIL_PRODUCTS.filter((p) => {
      const matchCat = retailCategory === 'all' || p.category === retailCategory;
      const q = retailSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.variant.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.highlights.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });

    const PAGE_SIZE = 6;
    const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE) || 1;
    const currentPage = Math.min(retailPage, totalPages);
    const paginatedProducts = filteredProducts.slice(
      (currentPage - 1) * PAGE_SIZE,
      currentPage * PAGE_SIZE,
    );

    const handleAskQuestion = (qText: string) => {
      if (callStatus === 'connected') {
        sendUserSpeechTurn(activeWf === 'wf02' ? 'wf02' : 'wf01', qText);
      } else {
        setCustomCallInput(qText);
      }
    };

    return (
      <div className="p-4 bg-slate-900/95 rounded-2xl border border-slate-750 shadow-lg space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🎯</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                  Kịch Bản Đàm Thoại &amp; Cơ Sở Dữ Liệu Bán Hàng
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    scenarioMode === 'retail'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}
                >
                  {scenarioMode === 'retail'
                    ? `🛒 Shop Bán Lẻ TechZone (${RETAIL_PRODUCTS.length}+ Sản Phẩm Sẵn Hàng)`
                    : '🏢 Doanh Nghiệp B2B SaaS'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {scenarioMode === 'b2b'
                  ? 'Quy trình chuẩn Doanh Nghiệp B2B SaaS (Gói Starter, Pro, Enterprise, Lead Scoring, Báo giá HITL).'
                  : `Cửa hàng TechZone thực tế: Kho ${RETAIL_PRODUCTS.length} sản phẩm Apple & Phụ kiện, tồn kho 3 chi nhánh (Hà Nội, Đà Nẵng, TP.HCM), bảo hành 1 đổi 1 30 ngày, ship 2h, trả góp 0%.`}
              </p>
            </div>
          </div>

          <div className="flex items-center bg-slate-950 p-1 rounded-xl shrink-0 border border-slate-800">
            <button
              type="button"
              onClick={() => setScenarioMode('b2b')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                scenarioMode === 'b2b'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🏢 Doanh Nghiệp B2B
            </button>
            <button
              type="button"
              onClick={() => setScenarioMode('retail')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                scenarioMode === 'retail'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🛒 Test Shop Bán Lẻ</span>
              <span className="px-1.5 py-0.5 text-[9px] bg-white/20 rounded font-mono font-bold">
                {RETAIL_PRODUCTS.length} Data
              </span>
            </button>
          </div>
        </div>

        {scenarioMode === 'retail' && (
          <div className="space-y-3 pt-3 border-t border-slate-800 text-[11px] text-slate-300">
            {/* Header Toolbar: Search & Category Filter */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">📦</span>
                  <span className="font-extrabold text-amber-300 text-xs uppercase tracking-wide">
                    Kho Dữ Liệu Bán Lẻ TechZone ({filteredProducts.length}/{RETAIL_PRODUCTS.length} sản phẩm)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                    3 Chi Nhánh Real-time
                  </span>
                </div>
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    value={retailSearch}
                    onChange={(e) => {
                      setRetailSearch(e.target.value);
                      setRetailPage(1);
                    }}
                    placeholder="🔍 Tìm 16 Pro Max, M4, Marshall..."
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  {retailSearch && (
                    <button
                      type="button"
                      onClick={() => setRetailSearch('')}
                      className="absolute right-2.5 top-1.5 text-slate-400 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px]">
                {[
                  { key: 'all', label: `Tất Cả (${RETAIL_PRODUCTS.length})` },
                  { key: 'iphone', label: `📱 iPhone (${RETAIL_PRODUCTS.filter((p) => p.category === 'iphone').length})` },
                  { key: 'macbook', label: `💻 Mac (${RETAIL_PRODUCTS.filter((p) => p.category === 'macbook').length})` },
                  { key: 'ipad', label: `📟 iPad (${RETAIL_PRODUCTS.filter((p) => p.category === 'ipad').length})` },
                  { key: 'watch', label: `⌚ Watch (${RETAIL_PRODUCTS.filter((p) => p.category === 'watch').length})` },
                  { key: 'audio', label: `🎧 Audio (${RETAIL_PRODUCTS.filter((p) => p.category === 'audio').length})` },
                  { key: 'accessories', label: `🔌 Phụ kiện (${RETAIL_PRODUCTS.filter((p) => p.category === 'accessories').length})` },
                ].map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => {
                      setRetailCategory(cat.key);
                      setRetailPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
                      retailCategory === cat.key
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Product Grid (Paginated) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                {paginatedProducts.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 transition-all flex flex-col justify-between space-y-2 group"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[9.5px] text-slate-400 mb-1">
                        <span className="font-mono text-indigo-400 font-bold">{p.sku}</span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">
                          Tiết kiệm -{(p.discount_vnd / 1000000).toFixed(1)}Tr
                        </span>
                      </div>
                      <div className="font-bold text-white text-xs leading-snug group-hover:text-amber-300 transition-colors">
                        {p.name}
                      </div>
                      <div className="text-[10px] text-slate-400">{p.variant}</div>

                      <div className="flex items-baseline gap-2 mt-1.5">
                        <span className="text-sm font-black text-amber-400">
                          {p.sale_price_vnd.toLocaleString('vi-VN')} đ
                        </span>
                        <span className="text-[10px] text-slate-500 line-through">
                          {p.list_price_vnd.toLocaleString('vi-VN')} đ
                        </span>
                      </div>

                      <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                        🎁 <span className="text-slate-300">{p.gift}</span>
                      </div>

                      <div className="flex items-center gap-2 text-[9.5px] text-slate-400 mt-1 font-mono">
                        <span>Kho:</span>
                        <span className="text-cyan-300">HN:{p.stock_hn}</span>
                        <span>•</span>
                        <span className="text-emerald-300">ĐN:{p.stock_dn}</span>
                        <span>•</span>
                        <span className="text-amber-300">HCM:{p.stock_hcm}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleAskQuestion(
                          `Shop còn ${p.name} màu ${p.variant} tại chi nhánh Đà Nẵng không, giá hôm nay và khuyến mãi thế nào em?`,
                        )
                      }
                      className="w-full py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-bold text-[10.5px] transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-amber-500/30"
                    >
                      <span>💬</span>
                      <span>Hỏi AI Về Máy Này</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px] text-slate-400">
                  <span>
                    Hiển thị {(currentPage - 1) * PAGE_SIZE + 1} -{' '}
                    {Math.min(currentPage * PAGE_SIZE, filteredProducts.length)} / {filteredProducts.length} sản phẩm
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setRetailPage((p) => Math.max(1, p - 1))}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 cursor-pointer"
                    >
                      ◀ Trang trước
                    </button>
                    <span className="font-bold text-amber-400">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setRetailPage((p) => Math.min(totalPages, p + 1))}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 cursor-pointer"
                    >
                      Trang sau ▶
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Testing Chips (Click to ask immediately) */}
            <div>
              <div className="flex items-center justify-between font-bold text-amber-400 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span>💡</span>
                  <span>Gợi ý 12 câu hỏi thực tế test RAG &amp; Phản hồi Voice AI tức thì (Click để hỏi):</span>
                </div>
                <span className="text-[10px] text-slate-400 font-normal">Tự động điền &amp; gửi vào cuộc gọi</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
                {[
                  'Shop còn iPhone 16 Pro Max 256GB Titan Sa Mạc không, giá hôm nay bao nhiêu?',
                  'MacBook Pro 14 M4 24GB RAM giá bao nhiêu và có quà tặng gì em?',
                  'Mac Mini M4 nhỏ gọn có sẵn máy tại Đà Nẵng không, ship mất bao lâu?',
                  'AirPods Pro 2 cổng USB-C chống ồn giá ưu đãi hôm nay bao nhiêu?',
                  'Apple Watch Ultra 2 Titanium đen có bảo hành rơi vỡ không em?',
                  'Loa Marshall Stanmore III kem công suất bao nhiêu, ship 2h không?',
                  'Bên em hỗ trợ thu cũ đổi mới lên đời iPhone 16 trợ giá thế nào?',
                  'Chính sách trả góp 0% thẻ tín dụng hoặc CCCD duyệt trong bao lâu?',
                  'iPad Gen 10 64GB màu xanh có giảm thêm cho học sinh sinh viên không?',
                  'Củ sạc Apple 30W chính hãng hôm nay mua kèm có được tặng miễn phí không?',
                  'Chính sách bảo hành lỗi 1 đổi 1 trong 30 ngày áp dụng ra sao em?',
                  'TechZone có những chi nhánh nào ở Hà Nội, Đà Nẵng và TP.HCM vậy em?',
                ].map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAskQuestion(sample)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-amber-950/40 border border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-white text-[10.5px] flex items-center gap-2 text-left transition-all cursor-pointer group"
                  >
                    <span className="text-amber-400 shrink-0 group-hover:scale-110 transition-transform">💬</span>
                    <span className="truncate">&ldquo;{sample}&rdquo;</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderAutonomousPostCallPanel() {
    return (
      <div className="rounded-3xl bg-slate-950 border border-indigo-500/30 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm sm:text-base font-black text-white">
                  ⚡🤖 Hệ Thống Tác Tử Tự Động Hóa Chạy Ngầm (Autonomous Engine)
                </h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  Tự động kích hoạt hậu cuộc gọi
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Tác tử WF-03 &amp; WF-04 tự động phân tích đàm thoại, thẩm định chính sách báo giá và soạn thảo email/zalo ngầm 100%.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveWf('wf_engine')}
            className="text-xs px-3.5 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white transition-all font-bold border border-slate-700 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <span>Bảng điều khiển ngầm</span>
            <span>➔</span>
          </button>
        </div>

        {autoBgStatus === 'running' ? (
          <div className="p-6 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 text-center space-y-3 animate-pulse">
            <div className="inline-block h-6 w-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <div className="text-xs font-bold text-indigo-200">
              Đang tự động phân tích biên bản đàm thoại, kiểm tra quy chế thẩm quyền chiết khấu và soạn thảo follow-up...
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* CARD 1: WF-03 Policy Orchestrator & Quote Result */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">⚡</span>
                  <span className="text-xs font-bold text-white">Tác Tử WF-03: Thẩm Định Chính Sách &amp; Báo Giá</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                  {wf03Result?.status === 'calendar_confirmed' ? 'Calendar Sync' : 'HITL Gate'}
                </span>
              </div>

              {wf03Result?.scenario_type === 'demo' ? (
                <div className="space-y-2 text-xs">
                  <div className="text-slate-300">
                    Khách hàng: <strong className="text-white">{wf03Result.customer_name}</strong> ({wf03Result.company_name})
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
                    📅 Đã lên lịch: <strong className="text-indigo-400">{wf03Result.scheduled_time}</strong>
                  </div>
                  <a
                    href={wf03Result.meeting_link}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-center text-[11px] transition-all"
                  >
                    Mở Google Meet Demo ↗
                  </a>
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Gói đề xuất: <strong className="text-white">{wf03Result?.package || 'Gói Pro Voice AI'}</strong></span>
                    <span className="text-amber-400 font-bold">Chiết khấu: -{wf03Result?.discount_pct || 15}%</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-[9.5px] text-slate-400 uppercase">Giá niêm yết</div>
                      <div className="text-xs font-bold text-slate-400 line-through">
                        {(wf03Result?.original_price_vnd || 60000000).toLocaleString('vi-VN')} đ
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950 border border-emerald-500/30">
                      <div className="text-[9.5px] text-emerald-400 uppercase">Giá đề xuất cuối</div>
                      <div className="text-xs font-bold text-emerald-400">
                        {(wf03Result?.final_price_vnd || 51000000).toLocaleString('vi-VN')} đ
                      </div>
                    </div>
                  </div>
                  <div className="text-[10.5px] text-amber-200/90 leading-snug">
                    💡 {wf03Result?.ai_recommendation || 'AI Orchestrator đề xuất duyệt chiết khấu 15% vì khách thanh toán trong 48h.'}
                  </div>
                  <a
                    href="#approvals"
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = '/sales#approvals';
                    }}
                    className="block w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-center text-[11px] transition-all shadow-md"
                  >
                    👉 Đến Cổng Phê Duyệt Báo Giá (HITL)
                  </a>
                </div>
              )}
            </div>

            {/* CARD 2: WF-04 Autonomous ReAct Copilot Result */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">🤖</span>
                  <span className="text-xs font-bold text-white">Tác Tử WF-04: ReAct Follow-up &amp; CRM Sync</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                  Gemini 3.5 Flash
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="text-[11px] text-slate-300 line-clamp-1">
                  📧 Tiêu đề Email: <strong className="text-emerald-400">{wf04Result?.content?.subject || '[AI Sales Agent] Báo giá & kế hoạch Voice AI'}</strong>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyText(wf04Result?.content?.email_body || '', 'Email')}
                    className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white transition-all text-[11px] font-bold border border-slate-700 cursor-pointer"
                  >
                    📋 Sao Chép Email
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyText(wf04Result?.content?.zalo_message || '', 'Tin nhắn Zalo')}
                    className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white transition-all text-[11px] font-bold border border-slate-700 cursor-pointer"
                  >
                    📋 Sao Chép Zalo
                  </button>
                </div>

                {/* Webhook Sync Badges */}
                <div className="pt-2 border-t border-slate-800 space-y-1">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Đồng bộ Webhook Đa Kênh:</div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                      HubSpot CRM ✓ 200 OK
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
                      Zalo OA ZNS ✓ 200 OK
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/60 text-purple-400 border border-purple-800/40">
                      SAP ERP ✓ 200 OK
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const workflowNav = [
    {
      id: 'wf01' as const,
      code: 'WF-01',
      layer: 'Frontline Voice AI',
      title: 'Gọi Thoại Outbound',
      desc: 'AI đàm thoại & chốt sale tự động',
      icon: '📞',
      tech: 'Twilio / STT-TTS Full Duplex',
      color: 'from-blue-600 to-indigo-600',
    },
    {
      id: 'wf02' as const,
      code: 'WF-02',
      layer: 'Frontline Voice AI',
      title: 'Lễ Tân Inbound & RAG',
      desc: 'Tổng đài tiếp nhận & tra cứu pgvector',
      icon: '🎧',
      tech: 'Voice API + pgvector Knowledge',
      color: 'from-purple-600 to-pink-600',
    },
    {
      id: 'wf_engine' as const,
      code: 'WF-03 • WF-04',
      layer: 'Underlying Daemon Engine',
      title: 'Hệ Thống Tác Tử Tự Động Hóa Chạy Ngầm',
      desc: 'Tự động kích hoạt hậu cuộc gọi: Duyệt giá & ReAct Copilot',
      icon: '⚡🤖',
      tech: 'Multi-Agent Daemon • n8n • ReAct',
      color: 'from-amber-500 via-emerald-500 to-teal-600',
    },
  ];

  return (
    <div className="space-y-6">
      <audio
        ref={audioPlayerRef}
        style={{ position: 'fixed', top: -9999, left: -9999, opacity: 0, pointerEvents: 'none' }}
        preload="auto"
      />

      {/* Top Banner: Clean Vector Multi-Agent Command Stage */}
      <div className="overflow-hidden rounded-[2.25rem] bg-slate-950 p-7 sm:p-9 text-white shadow-xl relative">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-indigo-950/80 to-slate-950" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2.5 text-xs font-extrabold uppercase tracking-wider text-cyan-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Đồ Án AI Sales Agent • Học Kỳ 5 VKU • Nguyễn Hữu Quốc Bảo</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Trung Tâm Điều Hành 4 Tác Tử Bán Hàng &amp; Voice AI (WF-01 → WF-04)
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Đàm thoại 2 chiều rảnh tay với giọng lễ tân <strong className="text-cyan-300">Trúc Ly</strong>, thần tượng <strong className="text-amber-300">Sơn Tùng M-TP</strong>, <strong className="text-yellow-300">Jack (J97)</strong> &amp; <strong className="text-red-400">Độ Mixi</strong>, tra cứu 12 chủ đề vector pgvector và điều phối đa tác tử thời gian thực.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-full bg-slate-900 px-5 py-2.5 self-start md:self-auto">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400" />
            </span>
            <span className="text-xs font-extrabold text-emerald-300">4/4 Tác Tử Trực Tuyến</span>
          </div>
        </div>
      </div>

      {/* 3 Operational Architecture Pillars Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {workflowNav.map((wf) => {
          const isActive =
            activeWf === wf.id ||
            (wf.id === 'wf_engine' && (activeWf === 'wf03' || activeWf === 'wf04'));
          return (
            <button
              key={wf.id}
              type="button"
              onClick={() => {
                setActiveWf(wf.id);
              }}
              className={`group relative overflow-hidden flex flex-col text-left p-4 rounded-3xl transition-all duration-300 cursor-pointer ${
                isActive
                  ? 'bg-slate-950 text-white shadow-xl -translate-y-1 ring-2 ring-indigo-500'
                  : 'glass-panel text-slate-900 hover:-translate-y-1 hover:shadow-lg'
              }`}
            >
              <div
                className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${wf.color} transition-opacity ${
                  isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
              />
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl group-hover:scale-110 transition-transform">{wf.icon}</span>
                  <span
                    className={`text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white/10 text-slate-200 border border-white/20'
                        : 'bg-slate-200/80 text-slate-600'
                    }`}
                  >
                    {wf.layer}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-full ${
                    isActive
                      ? `bg-gradient-to-r ${wf.color} text-white`
                      : 'bg-slate-200/70 text-slate-600'
                  }`}
                >
                  {wf.code}
                </span>
              </div>
              <h3 className={`text-xs font-extrabold truncate ${isActive ? 'text-white' : 'text-slate-900'}`}>
                {wf.title}
              </h3>
              <p className={`text-[10px] truncate mt-0.5 ${isActive ? 'text-slate-400' : 'text-slate-500'}`}>
                {wf.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* WF-01: Voice AI Outbound Calling Agent                          */}
      {/* ============================================================== */}
      {activeWf === 'wf01' && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="rounded-[2.25rem] glass-panel p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-200/60 gap-4">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-extrabold text-indigo-600 mb-1">
                  <span className="h-2 w-2 rounded-full bg-indigo-600 animate-ping" />
                  <span>WF-01 • Outbound AI Telesales • VieNeu-TTS 24kHz</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  Voice AI Outbound Calling Agent — Đàm Thoại 2 Chiều Rảnh Tay
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Bấm bắt đầu để AI tự động quay số, chào khách hàng bằng giọng thật và mở Micro đàm thoại liên tục.
                </p>
              </div>

              <button
                type="button"
                disabled={previewLoading}
                onClick={() => handlePreviewVoice(selectedVoiceId)}
                className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-xs font-extrabold text-indigo-700 hover:bg-indigo-100 transition-all self-start sm:self-auto cursor-pointer"
              >
                <span>🔊</span>
                <span>{previewLoading ? 'Đang phát mẫu giọng...' : 'Nghe thử giọng đang chọn'}</span>
              </button>
            </div>

            {/* SCENARIO MODE SELECTOR */}
            <div className="pt-6">
              {renderScenarioSelector()}
            </div>

            {/* CALL STATUS: IDLE (Setup & Ready to Dial) */}
            {callStatus === 'idle' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 pt-6 items-center">
                <div className="lg:col-span-5 space-y-6">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2.5">
                      1. Chọn Khách Hàng Tiềm Năng (CRM Lead)
                    </label>
                    <div className="space-y-2">
                      {(scenarioMode === 'retail'
                        ? [
                            ...leads.filter(
                              (l) =>
                                l.company.toLowerCase().includes('techzone') ||
                                l.company.toLowerCase().includes('bán lẻ'),
                            ),
                            ...leads,
                          ]
                        : [
                            ...leads.filter(
                              (l) => !l.company.toLowerCase().includes('techzone'),
                            ),
                            ...leads,
                          ]
                      )
                        .filter(
                          (lead, index, self) =>
                            self.findIndex((t) => t.id === lead.id) === index,
                        )
                        .slice(0, 4)
                        .map((lead) => {
                        const active = selectedLeadId === lead.id;
                        return (
                          <button
                            key={lead.id}
                            type="button"
                            onClick={() => {
                              setSelectedLeadId(lead.id);
                              setPhone(lead.phone);
                            }}
                            className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-left transition-all cursor-pointer ${
                              active
                                ? 'bg-slate-900 text-white shadow-lg scale-[1.01]'
                                : 'bg-white/70 hover:bg-white text-slate-900 ring-1 ring-slate-200/70'
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-extrabold truncate">{lead.name}</p>
                              <p className={`text-[11px] truncate ${active ? 'text-slate-300' : 'text-slate-500'}`}>
                                {lead.company} • {lead.phone}
                              </p>
                            </div>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 shrink-0">
                              🔥 {lead.score}đ
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2.5">
                      2. Chọn Nhân Vật Giọng Nói AI (24kHz Neural)
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { id: 'vn-sontung-mtp', name: '🔥 Sơn Tùng M-TP', tag: 'AI Celebrity (Sky)' },
                        { id: 'vn-jack-j97', name: '🌾 Jack (J97)', tag: 'AI Celebrity (Đom Đóm)' },
                        { id: 'vn-domixi', name: '⚡ Độ Mixi', tag: 'AI Celebrity (MixiGaming)' },
                        { id: 'vn-trucly-female', name: '🌸 Trúc Ly', tag: '⭐ Lễ Tân Tự Nhiên' },
                      ].map((v) => {
                        const active = selectedVoiceId === v.id;
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => setSelectedVoiceId(v.id)}
                            className={`p-3 rounded-2xl text-left transition-all cursor-pointer ${
                              active
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-white/70 hover:bg-white text-slate-900 ring-1 ring-slate-200/70'
                            }`}
                          >
                            <div className="text-xs font-extrabold">{v.name}</div>
                            <div className={`text-[10px] mt-0.5 ${active ? 'text-indigo-100' : 'text-slate-500'}`}>
                              {v.tag}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => startLivePhoneCall('wf01')}
                    className="w-full flex items-center justify-center gap-3 rounded-full bg-indigo-600 hover:bg-indigo-500 py-4 px-6 text-sm sm:text-base font-black text-white shadow-xl transition-all cursor-pointer"
                  >
                    <span className="text-xl">📞</span>
                    <span>QUAY SỐ &amp; BẮT ĐẦU ĐÀM THOẠI</span>
                  </button>
                </div>

                {/* Right 7 Cols: Animated Vector Voice Stage */}
                <div className="lg:col-span-7 rounded-[2rem] bg-slate-950 text-white flex flex-col justify-between p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3.5 py-1 text-xs font-bold text-cyan-300">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                      VoIP Full-Duplex • 12 Chủ Đề RAG
                    </span>
                    <span className="font-mono text-xs text-indigo-300 bg-slate-900 px-3 py-1 rounded-full">
                      {phone}
                    </span>
                  </div>

                  <div className="rounded-2xl bg-slate-900/70 p-2 my-2">
                    <VoiceConversationIllustration
                      isPlaying={true}
                      speakerName={
                        voices.find((v) => v.id === selectedVoiceId)?.display_name.split('—')[0] || 'Sơn Tùng M-TP'
                      }
                      customerName={leads.find((l) => l.id === selectedLeadId)?.name || 'Nguyễn Văn An'}
                    />
                  </div>

                  <div className="text-center space-y-1 pt-2">
                    <h4 className="text-lg font-black text-white">
                      {leads.find((l) => l.id === selectedLeadId)?.name || 'Nguyễn Văn An'} —{' '}
                      <span className="text-cyan-300">
                        {leads.find((l) => l.id === selectedLeadId)?.company || 'An Phát Logistics'}
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      Giọng tư vấn đang chọn:{' '}
                      <strong className="text-white">
                        {voices.find((v) => v.id === selectedVoiceId)?.display_name.split('—')[0] || 'Sơn Tùng / Trúc Ly'}
                      </strong>
                    </p>
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
                          <span>🔊</span> {voices.find((v) => v.id === selectedVoiceId)?.display_name.split('—')[0] || 'AI Voice'} đang nói...
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
                              <span>{turn.role === 'customer' ? '👤 Khách hàng (Bạn)' : `🤖 ${voices.find((v) => v.id === selectedVoiceId)?.display_name.split('—')[0] || 'AI Sales'}`}</span>
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
                        'Bên em có những gói cước nào và chi phí cụ thể ra sao em?',
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

                  {/* Underlying Autonomous Engine Results (WF-03 & WF-04) */}
                  {renderAutonomousPostCallPanel()}

                  {/* Transcript Review */}
                  <div>
                    <div className="text-xs font-bold text-slate-400 mb-2">Toàn văn cuộc đàm thoại:</div>
                    <div className="max-h-48 overflow-y-auto p-3.5 rounded-xl bg-black/60 border border-slate-800 text-xs text-slate-300 space-y-2 font-mono">
                      {liveTurns.map((turn, i) => (
                        <div key={i} className="leading-relaxed">
                          <strong className={turn.role === 'customer' ? 'text-emerald-400' : 'text-indigo-400'}>
                            [{turn.timestamp}] {turn.role === 'customer' ? 'Khách hàng' : 'Voice AI'}:
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
          <div className="rounded-[2.25rem] glass-panel p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-200/60 gap-4">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-extrabold text-purple-600 mb-1">
                  <span className="h-2 w-2 rounded-full bg-purple-600 animate-ping" />
                  <span>WF-02 • Hotline 1900-8888 • Lễ Tân Trúc Ly &amp; 12 Chủ Đề RAG</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  Voice AI Inbound Receptionist — Tổng Đài Lễ Tân &amp; RAG pgvector
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Gọi vào Hotline 1900-8888: Lễ Tân AI Trúc Ly bắt máy, tra cứu ngữ nghĩa 12 chủ đề trong PostgreSQL pgvector và giải đáp tự nhiên.
                </p>
              </div>

              <button
                type="button"
                disabled={previewLoading}
                onClick={() => handlePreviewVoice(selectedVoiceId)}
                className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-4 py-2 text-xs font-extrabold text-purple-700 hover:bg-purple-100 transition-all self-start sm:self-auto"
              >
                <span>🔊</span>
                <span>{previewLoading ? 'Đang phát giọng Lễ Tân...' : 'Nghe thử giọng Lễ Tân'}</span>
              </button>
            </div>

            {/* SCENARIO MODE SELECTOR */}
            <div className="pt-6">
              {renderScenarioSelector()}
            </div>

            {/* CALL STATUS: IDLE (Setup & Ready to Call Hotline) */}
            {callStatus === 'idle' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 pt-6 items-center">
                <div className="lg:col-span-5 space-y-6">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2.5">
                      1. Chọn Nhân Vật Lễ Tân Tổng Đài AI
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { id: 'vn-sontung-mtp', name: '🔥 Sơn Tùng M-TP', tag: 'AI Celebrity (Sky)' },
                        { id: 'vn-jack-j97', name: '🌾 Jack (J97)', tag: 'AI Celebrity (Đom Đóm)' },
                        { id: 'vn-domixi', name: '⚡ Độ Mixi', tag: 'AI Celebrity (MixiGaming)' },
                        { id: 'vn-trucly-female', name: '🌸 Trúc Ly', tag: '⭐ Lễ Tân Tự Nhiên' },
                      ].map((v) => {
                        const active = selectedVoiceId === v.id;
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => setSelectedVoiceId(v.id)}
                            className={`p-3 rounded-2xl text-left transition-all ${
                              active
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/25'
                                : 'bg-white/70 hover:bg-white text-slate-900 ring-1 ring-slate-200/70'
                            }`}
                          >
                            <div className="text-xs font-extrabold">{v.name}</div>
                            <div className={`text-[10px] mt-0.5 ${active ? 'text-purple-100' : 'text-slate-500'}`}>
                              {v.tag}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Floating Topic Pills instead of boxy text card */}
                  <div>
                    <span className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">
                      2. Các Chủ Đề Bạn Có Thể Hỏi Trực Tiếp Qua Micro
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        '💰 Bảng giá Starter/Pro/Enterprise',
                        '🎁 Ưu đãi 15-20% & Giới thiệu',
                        '🆓 Dùng thử 14 ngày Free',
                        '🎙️ Công nghệ VieNeu-TTS & Clone',
                        '🔗 Tích hợp Zalo OA, HubSpot, SAP',
                        '🛡️ Bảo mật AES-256 & ISO 27001',
                        '⚡ SLA 99.9% & Chuyển máy chuyên viên',
                      ].map((chip) => (
                        <span
                          key={chip}
                          className="rounded-full bg-purple-50/90 px-3 py-1 text-[11px] font-bold text-purple-800"
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => startLivePhoneCall('wf02')}
                    className="btn-shimmer w-full flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 py-4 px-6 text-sm sm:text-base font-black text-white shadow-xl shadow-purple-600/30 hover:scale-[1.02] active:scale-98 transition-all"
                  >
                    <span className="text-xl animate-bounce">🎧</span>
                    <span>GỌI ĐẾN TỔNG ĐÀI AI (HOTLINE 1900-8888)</span>
                  </button>
                </div>

                {/* Right 7 Cols: Animated Vector RAG Scanner & Reception Stage */}
                <div className="lg:col-span-7 rounded-[2rem] bg-slate-950 text-white flex flex-col justify-between p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3.5 py-1 text-xs font-bold text-purple-300">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                      PostgreSQL 17 pgvector • 12 Vector Chunks
                    </span>
                    <span className="font-mono text-xs text-cyan-300 bg-slate-900 px-3 py-1 rounded-full">
                      Cosine Match 98.4%
                    </span>
                  </div>

                  <div className="rounded-2xl bg-slate-900/70 p-2 my-2">
                    <RagVectorSearchIllustration topicLabel="12 Chủ đề B2B" similarity="98.4%" />
                  </div>

                  <div className="text-center space-y-1 pt-2">
                    <h4 className="text-lg font-black text-white">
                      Hotline Chăm Sóc Khách Hàng 1900-8888
                    </h4>
                    <p className="text-xs text-slate-400">
                      Lễ tân trực tuyến:{' '}
                      <strong className="text-cyan-300">
                        {voices.find((v) => v.id === selectedVoiceId)?.display_name.split('—')[0] || 'Trúc Ly (Lễ Tân AI)'}
                      </strong>{' '}
                      • Tra cứu ngữ nghĩa tức thì
                    </p>
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
                          <span>🔊</span> {voices.find((v) => v.id === selectedVoiceId)?.display_name.split('—')[0] || 'Lễ Tân AI'} đang giải đáp...
                        </span>
                      )}
                      {callSpeakerState === 'user_listening' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40 animate-pulse shadow-md shadow-emerald-500/20">
                          <span>🎙️</span> Micro đang mở — Bạn hãy đặt câu hỏi...
                        </span>
                      )}
                      {callSpeakerState === 'ai_thinking' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                          <svg className="h-3 w-3 animate-spin text-amber-400" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Đang tra cứu pgvector RAG &amp; suy luận câu trả lời...
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
                              <span>{turn.role === 'customer' ? '👤 Khách hàng (Bạn)' : `🎧 ${voices.find((v) => v.id === selectedVoiceId)?.display_name.split('—')[0] || 'Lễ Tân AI'}`}</span>
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

            {/* CALL STATUS: ENDED for WF-02 (Comprehensive Debrief & Transcript Review) */}
            {callStatus === 'ended' && (
              <div className="pt-6 space-y-5 animate-fade-in-up">
                <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-2.5 text-purple-400">
                      <span className="h-6 w-6 rounded-full bg-purple-500/20 flex items-center justify-center text-sm font-bold border border-purple-500/40">
                        ✓
                      </span>
                      <h4 className="text-base font-black text-white">Biên Bản Tiếp Nhận Tổng Đài Lễ Tân (Call Debrief)</h4>
                    </div>
                    <span className="text-xs font-mono text-slate-400">
                      Tổng thời lượng: <strong className="text-purple-400">{formatDuration(callReport?.durationSec || callDurationSec)}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Số lượt đối thoại</div>
                      <div className="text-lg font-black text-white mt-1">{callReport?.turnCount || liveTurns.length} lượt</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Ý định phân tích</div>
                      <div className="text-xs font-bold text-purple-400 mt-2 truncate">
                        {callReport?.intent === 'pricing' ? 'Tra cứu Bảng giá' : callReport?.intent || 'Tra cứu RAG pgvector'}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Đánh giá cảm xúc</div>
                      <div className="text-xs font-bold text-emerald-400 mt-2">
                        {callReport?.sentiment || 'positive'} (+20đ Hot Lead)
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Kho Tri Thức RAG</div>
                      <div className="text-xs font-bold text-emerald-400 mt-2 truncate">Match 98.4% pgvector ✓</div>
                    </div>
                  </div>

                  {/* Underlying Autonomous Engine Results (WF-03 & WF-04) */}
                  {renderAutonomousPostCallPanel()}

                  {/* Transcript Review */}
                  <div>
                    <div className="text-xs font-bold text-slate-400 mb-2">Toàn văn cuộc tiếp nhận qua Hotline 1900-8888:</div>
                    <div className="max-h-48 overflow-y-auto p-3.5 rounded-xl bg-black/60 border border-slate-800 text-xs text-slate-300 space-y-2 font-mono">
                      {liveTurns.map((turn, i) => (
                        <div key={i} className="leading-relaxed">
                          <strong className={turn.role === 'customer' ? 'text-emerald-400' : 'text-purple-400'}>
                            [{turn.timestamp}] {turn.role === 'customer' ? 'Khách hàng' : (voices.find((v) => v.id === selectedVoiceId)?.display_name.split('—')[0] || 'Lễ Tân AI')}:
                          </strong>{' '}
                          {turn.text}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCallStatus('idle')}
                    className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-lg transition-all cursor-pointer"
                  >
                    🎧 THỰC HIỆN CUỘC GỌI MỚI ĐẾN TỔNG ĐÀI LỄ TÂN (HOTLINE 1900-8888)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* UNDERLYING AUTONOMOUS DAEMON ENGINE (WF-03 + WF-04)           */}
      {/* ============================================================== */}
      {(activeWf === 'wf_engine' || activeWf === 'wf03' || activeWf === 'wf04') && (
        <div className="space-y-6 animate-fade-in-up">
          {/* Top Engine Cockpit Header */}
          <div className="rounded-3xl bg-slate-950 p-6 sm:p-8 shadow-xl border border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-white/10 gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-300 text-[11px] font-bold mb-2">
                  <span>Lớp Nền Tảng Chạy Ngầm • WF-03 &amp; WF-04</span> • <span>Phụ trách: Bảo</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Autonomous Background Engine (Hệ Thống Tác Tử Tự Động Hóa Chạy Ngầm)
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  Hoạt động ngầm 24/7: Tự động kích hoạt sau mỗi cuộc gọi thoại từ WF-01 &amp; WF-02 để thẩm định chính sách chiết khấu, sinh báo giá CRM, soạn thảo follow-up và đồng bộ webhook.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400" />
                </span>
                <span className="px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  3 Daemons Đang Chạy Ngầm
                </span>
              </div>
            </div>

            {/* 3 Active Daemons Status Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                <span className="text-lg">📡</span>
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Telephony Hangup Hook</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Bắt sự kiện gác máy từ WF-01 &amp; WF-02 để tự động khởi chạy chuỗi xử lý hậu cuộc gọi.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                <span className="text-lg">⚡</span>
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>WF-03 Policy &amp; Quoting</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Thẩm định thẩm quyền chiết khấu 10%, tạo báo giá và đẩy vào cổng HITL PostgreSQL.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                <span className="text-lg">🤖</span>
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>WF-04 ReAct &amp; Webhooks</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Gemini soạn Email/Zalo cá nhân hóa, tính ROI và đồng bộ HubSpot &amp; Zalo OA.
                  </p>
                </div>
              </div>
            </div>

            {/* Sub-agent Cockpit Selector Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 mr-1">Tác tử theo dõi:</span>
                <button
                  type="button"
                  onClick={() => setEngineActiveSubTab('wf03')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    engineActiveSubTab === 'wf03'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>⚡</span>
                  <span>Tác Tử WF-03: Nhạc Trưởng Phân Luồng</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEngineActiveSubTab('wf04')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    engineActiveSubTab === 'wf04'
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>🤖</span>
                  <span>Tác Tử WF-04: Tác Tử Tự Chủ ReAct</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => triggerAutonomousBackgroundExecution()}
                className="text-xs px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all self-start sm:self-auto flex items-center gap-2 cursor-pointer shadow-md"
              >
                <span>⚡</span>
                <span>MÔ PHỎNG KÍCH HOẠT SỰ KIỆN GÁC MÁY</span>
              </button>
            </div>
          </div>

          {/* SUB-AGENT 1: WF-03 */}
          {engineActiveSubTab === 'wf03' && (
            <div className="space-y-6">
          <div className="relative rounded-3xl overflow-hidden bg-slate-950 p-6 sm:p-8 shadow-xl border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-white/10 gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 text-[11px] font-bold mb-2">
                  <span>Mã nghiệp vụ: WF-03</span> • <span>Phụ trách: Bảo</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Multi-Agent Policy Orchestrator (Nhạc Trưởng Điều Phối)
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  Phân tích ngữ cảnh đàm thoại, thẩm định thẩm quyền chiết khấu và tự động phân luồng công việc đa tác tử.
                </p>
              </div>

              <span className="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 self-start sm:self-auto">
                n8n • LLM Tool Calling • PostgreSQL Approvals
              </span>
            </div>

            <div className="pt-6 space-y-6">
              {/* Visual Multi-Agent Architecture Illustration */}
              <div className="rounded-2xl bg-slate-900/80 p-4 border border-slate-800/80">
                <MultiAgentOrchestratorIllustration activeStep={wf03Result ? 2 : 0} />
              </div>

              {/* Scenario Selection Header */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-amber-300">
                    Chọn Kịch Bản Điều Phối Nghiệp Vụ Doanh Nghiệp (B2B Sales Scenarios):
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Mỗi kịch bản kích hoạt luồng xử lý chuyên biệt
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Scenario 1 */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedWf03Scenario('scenario_discount');
                      setWf03Result(null);
                    }}
                    className={`p-4 rounded-2xl text-left border transition-all cursor-pointer relative ${
                      selectedWf03Scenario === 'scenario_discount'
                        ? 'bg-amber-950/40 border-amber-500/80 ring-2 ring-amber-500/30'
                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg">🎯</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                        HITL GATE
                      </span>
                    </div>
                    <div className="text-xs font-black text-white mb-1">
                      Chiết Khấu Vượt Thẩm Quyền 15%
                    </div>
                    <div className="text-[11px] text-slate-300 line-clamp-2">
                      Trần Văn An (An Phát Logistics) yêu cầu giảm 15% hợp đồng năm gói Pro.
                    </div>
                    <div className="mt-2 text-[10px] text-amber-400/90 font-mono">
                      ➜ Tự động tạo hồ sơ duyệt tại Cổng Quản lý
                    </div>
                  </button>

                  {/* Scenario 2 */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedWf03Scenario('scenario_demo');
                      setWf03Result(null);
                    }}
                    className={`p-4 rounded-2xl text-left border transition-all cursor-pointer relative ${
                      selectedWf03Scenario === 'scenario_demo'
                        ? 'bg-indigo-950/40 border-indigo-500/80 ring-2 ring-indigo-500/30'
                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg">📅</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold">
                        CALENDAR
                      </span>
                    </div>
                    <div className="text-xs font-black text-white mb-1">
                      Lên Lịch Demo Kỹ Thuật Chuyên Sâu
                    </div>
                    <div className="text-[11px] text-slate-300 line-clamp-2">
                      Lê Thị Mai (Mai Linh Corp) cần khảo sát bảo mật pgvector &amp; hạ tầng SIP.
                    </div>
                    <div className="mt-2 text-[10px] text-indigo-400/90 font-mono">
                      ➜ Tự động mở Google Meet &amp; gán Solutions Engineer
                    </div>
                  </button>

                  {/* Scenario 3 */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedWf03Scenario('scenario_nurture');
                      setWf03Result(null);
                    }}
                    className={`p-4 rounded-2xl text-left border transition-all cursor-pointer relative ${
                      selectedWf03Scenario === 'scenario_nurture'
                        ? 'bg-emerald-950/40 border-emerald-500/80 ring-2 ring-emerald-500/30'
                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg">⏰</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                        DRIP NURTURE
                      </span>
                    </div>
                    <div className="text-xs font-black text-white mb-1">
                      Hoãn Ngân Sách &amp; Nuôi Dưỡng Lead VIP
                    </div>
                    <div className="text-[11px] text-slate-300 line-clamp-2">
                      Phạm Hoàng Nam (Nam Long Real - 94đ) hẹn đầu Quý 2/2026.
                    </div>
                    <div className="mt-2 text-[10px] text-emerald-400/90 font-mono">
                      ➜ Đưa vào chuỗi ZNS + hẹn AI Bot gọi lại sau 45 ngày
                    </div>
                  </button>
                </div>
              </div>

              {/* Trigger Button & Context Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
                <div className="text-xs text-slate-200">
                  <span className="font-bold text-amber-400">Ngữ cảnh đàm thoại: </span>
                  {selectedWf03Scenario === 'scenario_discount' &&
                    'Khách hàng Trần Văn An (An Phát Logistics) đề nghị chiết khấu 15% gói Pro thanh toán năm (Vượt trần thẩm quyền 10%).'}
                  {selectedWf03Scenario === 'scenario_demo' &&
                    'Khách hàng Lê Thị Mai (Mai Linh Corp) đề nghị tổ chức buổi họp kỹ thuật trực tuyến với chuyên gia giải pháp.'}
                  {selectedWf03Scenario === 'scenario_nurture' &&
                    'Khách hàng Phạm Hoàng Nam (Nam Long Real - Điểm Lead 94) chưa duyệt kinh phí Q1, hẹn liên hệ lại đầu Q2.'}
                </div>
                <button
                  type="button"
                  disabled={wf03Loading}
                  onClick={runWf03Orchestrator}
                  className="px-6 py-3 rounded-full bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs transition-all shrink-0 cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {wf03Loading ? (
                    <>
                      <span className="inline-block h-3.5 w-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Đang điều phối các Agent...</span>
                    </>
                  ) : (
                    <>
                      <span>⚡</span>
                      <span>KÍCH HOẠT ĐIỀU PHỐI ĐA TÁC TỬ</span>
                    </>
                  )}
                </button>
              </div>

              {/* RESULT PRESENTATION (Zero Raw JSON) */}
              {wf03Result && (
                <div className="space-y-5 pt-2">
                  {/* Visual 4-Step Execution Pipeline */}
                  <div className="p-5 rounded-3xl bg-slate-900/95 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="h-6 w-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold border border-amber-500/30">
                          ⚙️
                        </span>
                        <h4 className="text-sm font-black text-white">
                          Quy Trình Điều Phối 4 Bước (Execution Pipeline)
                        </h4>
                      </div>
                      <span className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/40">
                        ✓ 100% HOÀN TẤT THỰC THI
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {(wf03Result.steps || []).map((step: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/90 flex flex-col justify-between space-y-2 relative overflow-hidden"
                        >
                          <div className="flex items-center justify-between">
                            <span className="h-5 w-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px] font-black">
                              {step.step_index || idx + 1}
                            </span>
                            <span className="text-[9.5px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                              {step.agent}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-white line-clamp-2">
                            {step.name}
                          </div>
                          <div className="text-[11px] text-slate-300 leading-relaxed">
                            {step.detail}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Strategic Decision & Enterprise Output Card */}
                  {wf03Result.scenario_type === 'discount' && (
                    <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/40 space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-amber-500/20">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xl">📋</span>
                            <h4 className="text-base font-black text-white">
                              Hồ Sơ Duyệt Báo Giá Chiết Khấu #Q-2026-8814
                            </h4>
                          </div>
                          <p className="text-xs text-slate-300 mt-1">
                            Khách hàng: <strong className="text-white">{wf03Result.customer_name}</strong> • Công ty: <strong className="text-amber-300">{wf03Result.company_name}</strong>
                          </p>
                        </div>
                        <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 self-start sm:self-auto">
                          ⏳ Chờ Phê Duyệt Cấp Quản Lý (Pending)
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Gói Giải Pháp</div>
                          <div className="text-sm font-black text-white mt-1">{wf03Result.package}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Thời hạn: {wf03Result.contract_period}</div>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Giá Niêm Yết</div>
                          <div className="text-sm font-bold text-slate-400 line-through mt-1">
                            {(wf03Result.original_price_vnd || 60000000).toLocaleString('vi-VN')} đ
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">Giá gốc chưa giảm</div>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-amber-500/30">
                          <div className="text-[10px] text-amber-400 font-bold uppercase">Mức Chiết Khấu</div>
                          <div className="text-base font-black text-amber-400 mt-1">
                            -{wf03Result.discount_pct}% ({(wf03Result.savings_vnd || 9000000).toLocaleString('vi-VN')} đ)
                          </div>
                          <div className="text-[10px] text-amber-300/80 mt-0.5">Vượt trần 10% quy định</div>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-emerald-500/30">
                          <div className="text-[10px] text-emerald-400 font-bold uppercase">Giá Đề Xuất Cuối</div>
                          <div className="text-base font-black text-emerald-400 mt-1">
                            {(wf03Result.final_price_vnd || 51000000).toLocaleString('vi-VN')} đ
                          </div>
                          <div className="text-[10px] text-emerald-300/80 mt-0.5">Thanh toán trong 48h</div>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 leading-relaxed flex items-start gap-3">
                        <span className="text-base shrink-0 mt-0.5">💡</span>
                        <div>
                          <strong className="text-amber-300">Khuyến nghị từ AI Orchestrator: </strong>
                          {wf03Result.ai_recommendation}
                        </div>
                      </div>

                      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="text-xs text-slate-400">
                          Quy tắc chính sách: <span className="text-slate-200">{wf03Result.decision?.policy_rule}</span>
                        </div>
                        <a
                          href="#approvals"
                          onClick={(e) => {
                            e.preventDefault();
                            window.location.href = '/sales#approvals';
                          }}
                          className="w-full sm:w-auto px-6 py-3 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all text-center cursor-pointer shadow-lg"
                        >
                          👉 ĐẾN CỔNG PHÊ DUYỆT BÁO GIÁ (HITL GATE)
                        </a>
                      </div>
                    </div>
                  )}

                  {wf03Result.scenario_type === 'demo' && (
                    <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/40 space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-indigo-500/20">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xl">📅</span>
                            <h4 className="text-base font-black text-white">
                              Xác Nhận Lịch Hẹn Demo Kỹ Thuật (Google Meet Provisioned)
                            </h4>
                          </div>
                          <p className="text-xs text-slate-300 mt-1">
                            Khách hàng: <strong className="text-white">{wf03Result.customer_name}</strong> • Doanh nghiệp: <strong className="text-indigo-300">{wf03Result.company_name}</strong>
                          </p>
                        </div>
                        <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 self-start sm:self-auto">
                          ✓ Lịch Hẹn Đã Xác Nhận
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Thời Gian Họp Trực Tuyến</div>
                          <div className="text-sm font-black text-white mt-1">{wf03Result.scheduled_time}</div>
                          <div className="text-[10px] text-indigo-300 mt-1">Thời lượng dự kiến: 60 phút</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Chuyên Gia Phụ Trách</div>
                          <div className="text-sm font-black text-white mt-1">{wf03Result.engineer}</div>
                          <div className="text-[10px] text-emerald-400 mt-1">Solutions Engineer Lead</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-950/80 border border-indigo-500/30">
                          <div className="text-[10px] text-indigo-400 font-bold uppercase">Liên Kết Phòng Họp</div>
                          <a
                            href={wf03Result.meeting_link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-mono font-bold text-indigo-300 hover:text-white underline mt-1.5 block truncate"
                          >
                            {wf03Result.meeting_link}
                          </a>
                          <div className="text-[10px] text-slate-400 mt-1">Đã cấp quyền truy cập khách hàng</div>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-800/40 text-xs text-indigo-200 flex items-center justify-between">
                        <div>
                          <strong className="text-white">Chủ đề làm việc: </strong>
                          <span>{wf03Result.topic}</span>
                        </div>
                        <a
                          href={wf03Result.meeting_link}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shrink-0 transition-all"
                        >
                          MỞ PHÒNG HỌP GOOGLE MEET ↗
                        </a>
                      </div>
                    </div>
                  )}

                  {wf03Result.scenario_type === 'nurture' && (
                    <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/40 space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-emerald-500/20">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xl">🌱</span>
                            <h4 className="text-base font-black text-white">
                              Chiến Dịch Nuôi Dưỡng Tự Động (VIP Lead Drip Nurture)
                            </h4>
                          </div>
                          <p className="text-xs text-slate-300 mt-1">
                            Khách hàng: <strong className="text-white">{wf03Result.customer_name}</strong> • Doanh nghiệp: <strong className="text-emerald-300">{wf03Result.company_name}</strong>
                          </p>
                        </div>
                        <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 self-start sm:self-auto">
                          ● Đang Nuôi Dưỡng (Active Drip)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Điểm Tiềm Năng Lead</div>
                          <div className="text-lg font-black text-emerald-400 mt-1">{wf03Result.lead_score} / 100 điểm</div>
                          <div className="text-[10px] text-emerald-300 mt-0.5">Hạng VIP (Hot Prospect)</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Thời Điểm Chăm Sóc Lại</div>
                          <div className="text-sm font-black text-white mt-1">{wf03Result.next_touchpoint}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Tự động kích hoạt AI Outbound</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30">
                          <div className="text-[10px] text-emerald-400 font-bold uppercase">Kênh Chăm Sóc Đa Kênh</div>
                          <div className="text-xs font-bold text-white mt-1">{wf03Result.channel}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Kịch bản: 3 Case Study chuyển đổi số</div>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-800/40 text-xs text-emerald-200">
                        <strong className="text-white">Chiến dịch kích hoạt: </strong>
                        <span>{wf03Result.campaign}</span>
                        <div className="mt-1 text-[11px] text-slate-300">
                          Quy tắc kích hoạt: {wf03Result.decision?.policy_rule}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

          {/* SUB-AGENT 2: WF-04 (Autonomous Sales Copilot) */}
          {engineActiveSubTab === 'wf04' && (
            <div className="space-y-6">
          <div className="relative rounded-3xl overflow-hidden bg-slate-950 p-6 sm:p-8 shadow-xl border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-white/10 gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-[11px] font-bold mb-2">
                  <span>Mã nghiệp vụ: WF-04</span> • <span>Phụ trách: Bảo</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Autonomous Sales Copilot (Tác Tử Bán Hàng Tự Chủ)
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  Ứng dụng mô hình ReAct (Thought ➔ Action ➔ Observation) tự động tính toán tài chính, thẩm định deal và đồng bộ CRM.
                </p>
              </div>

              <span className="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 self-start sm:self-auto">
                Gemini 3.5 Flash Lite • ReAct Agent • Dynamic Tools
              </span>
            </div>

            <div className="pt-6 space-y-6">
              {/* Unique Animated Illustration for WF-04 */}
              <div className="rounded-2xl bg-slate-900/80 p-3 border border-slate-800/80">
                <AutonomousAgentReActIllustration />
              </div>

              {/* 4 B2B Sales Agentic Tasks */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-300">
                  Chọn Nhiệm Vụ B2B Sales Cho Tác Tử Tự Chủ (ReAct Copilot):
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {[
                    {
                      id: 'followup_email' as const,
                      title: 'Soạn Email & Zalo Follow-up',
                      desc: 'Gemini tự động viết thư chốt hợp đồng kèm ưu đãi 15%',
                      icon: '📝',
                      sample: 'Soạn email follow-up và tin nhắn Zalo kèm ưu đãi 15% gói Pro cho khách hàng Trần Văn An (An Phát Logistics)',
                    },
                    {
                      id: 'roi_calculator' as const,
                      title: 'Tính Hiệu Quả Đầu Tư (ROI)',
                      desc: 'So sánh chi phí telesales truyền thống vs AI Voice',
                      icon: '📊',
                      sample: 'Lập bảng phân tích ROI và thời gian hoàn vốn cho doanh nghiệp 3 nhân viên telesales khi chuyển sang dùng Voice AI',
                    },
                    {
                      id: 'company_enrichment' as const,
                      title: 'Thẩm Định Doanh Nghiệp & Deal',
                      desc: 'Phân tích quy mô, điểm đau và chấm điểm tiềm năng',
                      icon: '🔍',
                      sample: 'Thẩm định hồ sơ doanh nghiệp An Phát Logistics và chấm điểm tiềm năng cơ hội bán hàng B2B',
                    },
                    {
                      id: 'crm_sync' as const,
                      title: 'Đồng Bộ Đa Kênh CRM & Webhook',
                      desc: 'Đẩy dữ liệu song song đến HubSpot, Zalo OA và SAP',
                      icon: '🔗',
                      sample: 'Đồng bộ dữ liệu khách hàng An Phát Logistics sang webhook HubSpot CRM và Zalo Official Account',
                    },
                  ].map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => {
                        setSelectedWf04Task(task.id);
                        setWf04Prompt(task.sample);
                        setWf04Result(null);
                      }}
                      className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${
                        selectedWf04Task === task.id
                          ? 'bg-emerald-950/50 border-emerald-500/80 ring-2 ring-emerald-500/30'
                          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-base">{task.icon}</span>
                        <div className="text-xs font-bold text-white">{task.title}</div>
                      </div>
                      <div className="text-[11px] text-slate-300 leading-snug">{task.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Text Box with Prompt */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Yêu cầu giao cho tác tử (Agent Prompt):</span>
                  <span className="text-[11px] text-emerald-400 font-mono">Tự động chọn tool phù hợp theo ReAct</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={wf04Prompt}
                    onChange={(e) => setWf04Prompt(e.target.value)}
                    placeholder="Nhập yêu cầu nghiệp vụ bán hàng cho tác tử..."
                    className="flex-1 rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                  <button
                    type="button"
                    disabled={wf04Loading}
                    onClick={runWf04AutonomousAgent}
                    className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs transition-all cursor-pointer shrink-0 shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {wf04Loading ? (
                      <>
                        <span className="inline-block h-3.5 w-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>AI đang suy luận &amp; gọi tool...</span>
                      </>
                    ) : (
                      <>
                        <span>🤖</span>
                        <span>THỰC THI TÁC TỬ TỰ CHỦ (ReAct)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* RE-ACT TRACE & FORMATTED BUSINESS RESULT (Zero Raw JSON) */}
              {wf04Result && (
                <div className="space-y-5 pt-2">
                  {/* Visual ReAct Chain-of-Thought (Thought -> Action -> Observation) */}
                  <div className="p-5 rounded-3xl bg-slate-900/95 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold border border-emerald-500/30">
                          🔄
                        </span>
                        <h4 className="text-sm font-black text-white">
                          Vết Suy Luận Tác Tử ReAct (Chain of Thought &amp; Tool Execution)
                        </h4>
                      </div>
                      <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-full border border-cyan-800/40">
                        {wf04Result.task_title || 'Autonomous Execution Complete'}
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {/* 1. Thought */}
                      <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-emerald-500/30 flex items-start gap-3">
                        <div className="h-6 w-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs shrink-0 font-bold">
                          💭
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wide">
                            Suy Nghĩ (Thought):
                          </div>
                          <p className="text-xs text-slate-200 leading-relaxed">
                            {wf04Result.react_trace?.thought}
                          </p>
                        </div>
                      </div>

                      {/* 2. Action */}
                      <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-cyan-500/30 flex items-start gap-3">
                        <div className="h-6 w-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs shrink-0 font-bold">
                          🛠️
                        </div>
                        <div className="space-y-0.5 flex-1">
                          <div className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-wide">
                            Hành Động Gọi Công Cụ (Action):
                          </div>
                          <code className="text-xs font-mono text-cyan-200 bg-cyan-950/40 px-2.5 py-1 rounded-lg block overflow-x-auto">
                            {wf04Result.react_trace?.action}
                          </code>
                        </div>
                      </div>

                      {/* 3. Observation */}
                      <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-purple-500/30 flex items-start gap-3">
                        <div className="h-6 w-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs shrink-0 font-bold">
                          👁️
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-[11px] font-mono font-bold text-purple-400 uppercase tracking-wide">
                            Quan Sát Kết Quả (Observation):
                          </div>
                          <p className="text-xs text-slate-200 leading-relaxed">
                            {wf04Result.react_trace?.observation}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* FORMATTED OUTPUT CARDS PER TASK TYPE */}

                  {/* TASK 1: FOLLOWUP EMAIL & ZALO */}
                  {wf04Result.task_type === 'followup_email' && wf04Result.content && (
                    <div className="p-6 rounded-3xl bg-slate-900 border border-emerald-500/40 space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xl">✉️</span>
                            <h4 className="text-base font-black text-white">
                              Bản Thảo Email &amp; Zalo Follow-up Do AI Tạo Lập
                            </h4>
                          </div>
                          <p className="text-xs text-slate-300 mt-1">
                            Người nhận: <strong className="text-white">{wf04Result.content.recipient_name}</strong> ({wf04Result.content.recipient_email} • {wf04Result.content.recipient_phone})
                          </p>
                        </div>
                        {copiedToast && (
                          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500 text-slate-950 animate-fade-in">
                            ✓ {copiedToast}
                          </span>
                        )}
                      </div>

                      {/* Email Section */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-300">
                            📧 Tiêu đề Email: <strong className="text-emerald-400">{wf04Result.content.subject}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(wf04Result.content.email_body, 'Email')}
                            className="text-xs px-3 py-1 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white transition-all font-bold cursor-pointer"
                          >
                            📋 Sao Chép Email
                          </button>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
                          {wf04Result.content.email_body}
                        </div>
                      </div>

                      {/* Zalo ZNS Section */}
                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-cyan-300">
                            💬 Tin Nhắn Zalo ZNS / OA (Kèm lời kêu gọi phản hồi):
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(wf04Result.content.zalo_message, 'Tin nhắn Zalo')}
                            className="text-xs px-3 py-1 rounded-xl bg-slate-800 hover:bg-cyan-600 text-slate-300 hover:text-white transition-all font-bold cursor-pointer"
                          >
                            📋 Sao Chép Zalo
                          </button>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-800/40 text-xs text-cyan-100 leading-relaxed">
                          {wf04Result.content.zalo_message}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TASK 2: FINANCIAL ROI CALCULATOR */}
                  {wf04Result.task_type === 'roi_calculator' && wf04Result.metrics && (
                    <div className="p-6 rounded-3xl bg-slate-900 border border-emerald-500/40 space-y-5">
                      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">📊</span>
                          <h4 className="text-base font-black text-white">
                            Bảng Tính Hiệu Quả Đầu Tư Tài Chính (Business Case ROI)
                          </h4>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Hoàn Vốn {wf04Result.metrics.payback_period}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Chi Phí Nhân Sự Cũ</div>
                          <div className="text-base font-black text-red-400 mt-1">{wf04Result.metrics.current_telesales_cost}</div>
                          <div className="text-[10px] text-slate-500 mt-1">Đội ngũ telesales 3 người</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Chi Phí Voice AI</div>
                          <div className="text-base font-black text-indigo-400 mt-1">{wf04Result.metrics.ai_platform_cost}</div>
                          <div className="text-[10px] text-slate-500 mt-1">Gói Pro 24/7 không giới hạn</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/40">
                          <div className="text-[10px] text-emerald-400 font-bold uppercase">Tiết Kiệm Ròng / Năm</div>
                          <div className="text-base font-black text-emerald-400 mt-1">{wf04Result.metrics.net_savings}</div>
                          <div className="text-[10px] text-emerald-300/80 mt-1">Cắt giảm {wf04Result.metrics.savings_pct} chi phí</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/40">
                          <div className="text-[10px] text-cyan-400 font-bold uppercase">Tăng Trưởng Năng Suất</div>
                          <div className="text-base font-black text-cyan-400 mt-1">{wf04Result.metrics.capacity_multiplier}</div>
                          <div className="text-[10px] text-cyan-300/80 mt-1">{wf04Result.metrics.call_abandonment_reduction}</div>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-200 leading-relaxed flex items-center justify-between">
                        <span>
                          💡 <strong>Kết luận trình Ban Giám Đốc: </strong> Chuyển đổi sang AI Sales Agent giúp tiết kiệm ngay 480.000.000đ ngân sách thường niên, giải quyết triệt để vấn đề nhân viên nghỉ việc và cuộc gọi nhỡ ca đêm.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* TASK 3: COMPANY ENRICHMENT */}
                  {wf04Result.task_type === 'company_enrichment' && wf04Result.enrichment && (
                    <div className="p-6 rounded-3xl bg-slate-900 border border-emerald-500/40 space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xl">🔍</span>
                            <h4 className="text-base font-black text-white">
                              Hồ Sơ Doanh Nghiệp &amp; Chấm Điểm Cơ Hội (Deal Intelligence)
                            </h4>
                          </div>
                          <p className="text-xs text-slate-300 mt-1">
                            {wf04Result.enrichment.company_name} • {wf04Result.enrichment.industry}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-emerald-500 text-slate-950 shadow-md">
                            {wf04Result.enrichment.deal_score}/100 ĐIỂM
                          </span>
                          <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-slate-800 text-emerald-300 border border-emerald-500/30">
                            {wf04Result.enrichment.deal_tier}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                          Điểm đau trọng yếu của khách hàng (Identified Pain Points):
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {(wf04Result.enrichment.pain_points || []).map((pt: string, idx: number) => (
                            <div key={idx} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
                              <span className="text-red-400 font-bold shrink-0 mt-0.5">⚠️</span>
                              <span>{pt}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/50 text-xs text-indigo-200 leading-relaxed">
                        <strong className="text-indigo-300">Chiến lược bán hàng đề xuất (Sales Playbook): </strong>
                        {wf04Result.enrichment.recommended_playbook}
                      </div>
                    </div>
                  )}

                  {/* TASK 4: CRM SYNC */}
                  {wf04Result.task_type === 'crm_sync' && wf04Result.sync_result && (
                    <div className="p-6 rounded-3xl bg-slate-900 border border-emerald-500/40 space-y-5">
                      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🔗</span>
                          <h4 className="text-base font-black text-white">
                            Trạng Thái Đồng Bộ Đa Kênh CRM &amp; Webhook Đối Tác
                          </h4>
                        </div>
                        <span className="text-xs font-mono text-slate-400">
                          Mã payload: <strong className="text-emerald-400">{wf04Result.sync_result.payload_id}</strong>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {(wf04Result.sync_result.endpoints || []).map((ep: any, idx: number) => (
                          <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-white">{ep.name}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                200 OK • {ep.latency_ms}ms
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-300">{ep.detail}</div>
                          </div>
                        ))}
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                        <span>Chữ ký số: <code className="text-emerald-400 font-mono">HMAC-SHA256 (aes-gcm-256)</code></span>
                        <span>Thời gian đồng bộ: <strong className="text-slate-200">{new Date(wf04Result.sync_result.synced_at).toLocaleTimeString('vi-VN')}</strong></span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
        </div>
      )}
    </div>
  );
}
