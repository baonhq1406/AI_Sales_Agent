'use client';

import { useEffect, useRef, useState } from 'react';
import {
  VoiceConversationIllustration,
  MultiAgentOrchestratorIllustration,
  RagVectorSearchIllustration,
  CloudStackIllustration,
} from '@/components/AnimatedIllustrations';

type WorkflowKey = 'wf01' | 'wf02' | 'wf03' | 'wf04';

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

  function getGreetingText(wf: 'wf01' | 'wf02', voiceId: string, leadName = 'Quý khách') {
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

  // Tự động pre-fetch âm thanh lời chào vào bộ nhớ RAM trình duyệt ngay khi đổi nhân vật hoặc lead
  useEffect(() => {
    if (!selectedVoiceId || typeof window === 'undefined') return;
    const lead = leads.find((l) => l.id === selectedLeadId) || leads[0];
    const leadName = lead ? lead.name : 'Quý khách';

    for (const w of ['wf01', 'wf02'] as const) {
      const text = getGreetingText(w, selectedVoiceId, leadName);
      const key = `${w}:${selectedVoiceId}:${text}`;

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
  }, [selectedVoiceId, selectedLeadId, leads]);

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
                }
              : {
                  phone: '1900-8888',
                  caller_name: 'Quý khách',
                  speech: userText,
                  customer_speech: userText,
                  query: userText,
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
        'Dạ bên em có gói Pro 5 triệu một tháng có đầy đủ Voice AI và hỗ trợ dùng thử miễn phí 14 ngày ạ!';

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
    const greetingText = getGreetingText(wf, selectedVoiceId, leadName);
    const cacheKey = `${wf}:${selectedVoiceId}:${greetingText}`;

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
      title: 'Gọi Thoại Outbound',
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
      title: 'Điều Phối Bán Hàng & Báo Giá',
      desc: 'Phân loại nhu cầu & tự động tạo báo giá',
      icon: '⚡',
      tech: 'Multi-Agent Tool Calling',
      color: 'from-amber-500 to-orange-600',
    },
    {
      id: 'wf04' as const,
      code: 'WF-04',
      title: 'Tác Tử Tự Chủ (Agentic AI)',
      desc: 'Tự động tính toán & gọi công cụ độc lập',
      icon: '🤖',
      tech: 'Agentic Tool Execution',
      color: 'from-emerald-600 to-teal-600',
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
              Đàm thoại 2 chiều rảnh tay với giọng lễ tân <strong className="text-cyan-300">Trúc Ly</strong>, thần tượng <strong className="text-amber-300">Sơn Tùng M-TP</strong> &amp; <strong className="text-yellow-300">Jack (J97)</strong>, tra cứu 12 chủ đề vector pgvector và điều phối đa tác tử thời gian thực.
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

      {/* 4 Workflow Floating Pill/Card Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {workflowNav.map((wf) => {
          const isActive = activeWf === wf.id;
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
                <span className="text-xl group-hover:scale-110 transition-transform">{wf.icon}</span>
                <span
                  className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full ${
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
                {wf.tech}
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

            {/* CALL STATUS: IDLE (Setup & Ready to Dial) */}
            {callStatus === 'idle' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 pt-6 items-center">
                <div className="lg:col-span-5 space-y-6">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2.5">
                      1. Chọn Khách Hàng Tiềm Năng (CRM Lead)
                    </label>
                    <div className="space-y-2">
                      {leads.slice(0, 3).map((lead) => {
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

                  <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-800/50 text-xs text-purple-200 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white mb-0.5">✓ Tự động hóa Inbound Receptionist hoàn tất:</p>
                      <p className="text-[11px] text-purple-300">
                        Hệ thống đã lưu tương tác vào CRM Interactions, đối soát dữ liệu tri thức 12 chủ đề pgvector và ghi nhận thông tin khách hàng gọi đến Hotline 1900-8888.
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                      Đã giải quyết 100%
                    </span>
                  </div>

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
      {/* WF-03: Multi-Agent Orchestrator                                 */}
      {/* ============================================================== */}
      {activeWf === 'wf03' && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="relative rounded-3xl overflow-hidden bg-slate-950 p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-white/10 gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 text-[11px] font-bold mb-2">
                  <span>Mã nghiệp vụ: WF-03</span> • <span>Phụ trách: Bảo</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Multi-Agent Orchestrator (Nhạc Trưởng Điều Phối)
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  Nhạc trưởng điều phối: Phân tích ngữ cảnh sau mỗi tương tác để ra quyết định gọi Tool/Agent nào tiếp theo.
                </p>
              </div>

              <span className="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 self-start sm:self-auto">
                n8n • LLM Tool Calling
              </span>
            </div>

            <div className="pt-6 space-y-6">
              <div className="rounded-2xl bg-slate-900/80 p-4">
                <MultiAgentOrchestratorIllustration activeStep={wf03Result ? 2 : 0} />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl">
                <span className="text-xs text-slate-200 font-semibold">
                  Tình huống mô phỏng: Khách hàng hỏi chiết khấu 18% cho hợp đồng năm (vượt mức tiêu chuẩn 10%).
                </span>
                <button
                  type="button"
                  disabled={wf03Loading}
                  onClick={runWf03Orchestrator}
                  className="px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shrink-0 cursor-pointer"
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
          <div className="relative rounded-3xl overflow-hidden bg-slate-950 p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-white/10 gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-[11px] font-bold mb-2">
                  <span>Mã nghiệp vụ: WF-04</span> • <span>Phụ trách: Bảo</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Autonomous Workflow Agent (Tác Tử Tự Chủ)
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  AI có khả năng tự động quyết định và gọi các API bên ngoài mà không cần lập trình trước kịch bản cố định.
                </p>
              </div>

              <span className="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 self-start sm:self-auto">
                n8n • Agentic AI (ReAct)
              </span>
            </div>

            <div className="pt-6 space-y-4">
              <div className="rounded-2xl bg-slate-900/80 p-3">
                <MultiAgentOrchestratorIllustration activeStep={1} />
              </div>

              <label className="block text-xs font-bold uppercase tracking-wider text-emerald-300 pt-2">
                Giao nhiệm vụ cho Tác tử tự chủ:
              </label>

              <div className="flex flex-wrap gap-2">
                {[
                  'Quy đổi gói Enterprise 1500 USD sang VND theo tỷ giá hôm nay là bao nhiêu?',
                  'Đồng bộ dữ liệu khách hàng An Phát Logistics sang webhook CRM đối tác',
                  'Tự động gửi email thông báo chiết khấu cho khách hàng tiềm năng',
                ].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => setWf04Prompt(prompt)}
                    className={`px-4 py-2.5 rounded-full text-left text-xs transition-all cursor-pointer ${
                      wf04Prompt === prompt
                        ? 'bg-emerald-500 text-slate-950 font-extrabold'
                        : 'bg-slate-900 text-slate-200 hover:bg-slate-800'
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
                className="w-full rounded-2xl bg-slate-900 px-4 py-3.5 text-xs text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-400 outline-none"
              />

              <button
                type="button"
                disabled={wf04Loading}
                onClick={runWf04AutonomousAgent}
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all cursor-pointer"
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
    </div>
  );
}
