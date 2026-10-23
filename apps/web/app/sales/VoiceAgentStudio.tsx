'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type LeadOption = {
  id: string;
  name: string;
  company: string;
  phone: string;
  score: number;
};

type VoiceProfile = {
  id: string;
  display_name: string;
  type: 'neural_free' | 'cloned';
  gender: 'female' | 'male';
  region: string;
  description: string;
  reference_text?: string;
  playback_rate: number;
  pitch_shift: number;
  created_at: string;
};

type PipelineStatus = {
  pipeline?: {
    step1_stt?: {
      provider: string;
      groq_configured: boolean;
      model: string;
      cost: string;
    };
    step2_llm?: {
      provider: string;
      gemini_configured: boolean;
      model: string;
      rag_chunks_count: number;
      cost: string;
    };
    step3_tts?: {
      provider: string;
      total_voices: number;
      cloned_voices: number;
      default_voice_id: string;
      cost: string;
    };
  };
  recent_workflow_runs?: Array<{
    id: string;
    workflow_key: string;
    status: string;
    started_at: string;
  }>;
};

export default function VoiceAgentStudio({
  onApprovalCreated,
}: {
  onApprovalCreated?: () => void;
}) {
  const router = useRouter();
  const [customers, setCustomers] = useState<LeadOption[]>([]);
  const [voices, setVoices] = useState<VoiceProfile[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('vn-hoaimy-female');
  const [statusInfo, setStatusInfo] = useState<PipelineStatus | null>(null);

  // Voice Cloning Form State
  const [cloneName, setCloneName] = useState('');
  const [cloneGender, setCloneGender] = useState<'male' | 'female'>('male');
  const [cloneRegion, setCloneRegion] = useState('Miền Trung / Đà Nẵng');
  const [cloneRefText, setCloneRefText] = useState(
    'Xin chào anh chị, mình là Bảo từ hệ thống AI Sales Agent, rất vui được hỗ trợ anh chị.',
  );
  const [isRecordingClone, setIsRecordingClone] = useState(false);
  const [recordedCloneBase64, setRecordedCloneBase64] = useState<string>('');
  const [cloningLoading, setCloningLoading] = useState(false);
  const [cloneMessage, setCloneMessage] = useState('');
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);

  // Live Call Console (WF-01 & WF-02) State
  const [callMode, setCallMode] = useState<'wf01' | 'wf02'>('wf01');
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [customPhone, setCustomPhone] = useState<string>('0905123456');
  const [customerSpeech, setCustomerSpeech] = useState<string>(
    'Anh quan tâm gói Pro, báo giá chi tiết và chính sách chiết khấu cho anh nhé.',
  );
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [sttStatus, setSttStatus] = useState<string>('');
  const [callLoading, setCallLoading] = useState(false);
  const [callOutput, setCallOutput] = useState<Record<string, any> | null>(null);

  // WF-03 & WF-04 State
  const [wf03Loading, setWf03Loading] = useState(false);
  const [wf03Output, setWf03Output] = useState<Record<string, any> | null>(null);
  const [wf04Input, setWf04Input] = useState<string>(
    'Quy đổi gói Enterprise 1500 USD sang VND theo tỷ giá hôm nay là bao nhiêu?',
  );
  const [wf04Loading, setWf04Loading] = useState(false);
  const [wf04Output, setWf04Output] = useState<Record<string, any> | null>(null);

  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const speechRecRef = useRef<any>(null);

  function loadVoicesAndStatus() {
    fetch('/api/sales/leads')
      .then((r) => r.json())
      .then((res) => {
        const rows = Array.isArray(res?.data) ? res.data : [];
        const mapped: LeadOption[] = rows.map((row: any) => ({
          id: String(row.id || ''),
          name:
            [row.first_name, row.last_name].filter(Boolean).join(' ') ||
            'Khách hàng',
          company: String(row.company_name || 'Doanh nghiệp'),
          phone: String(row.phone || '+84905123456'),
          score: Number(row.score || 50),
        }));
        setCustomers(mapped);
        if (mapped.length > 0) {
          setSelectedLeadId((prev) => prev || mapped[0].id);
          setCustomPhone((prev) => prev || mapped[0].phone);
        }
      })
      .catch(() => undefined);

    fetch('/api/sales/voice-workflows?action=voices')
      .then((r) => r.json())
      .then((res) => {
        const list = res?.data?.voices || res?.voices || [];
        if (Array.isArray(list) && list.length > 0) {
          setVoices(list);
          setSelectedVoiceId((prev) => prev || list[0].id);
        }
      })
      .catch(() => undefined);

    fetch('/api/sales/voice-workflows?action=status')
      .then((r) => r.json())
      .then((res) => {
        setStatusInfo(res?.data || res || null);
      })
      .catch(() => undefined);
  }

  useEffect(() => {
    loadVoicesAndStatus();
  }, []);

  function playBase64Audio(
    base64: string,
    mimeType = 'audio/mpeg',
    playbackRate = 1.0,
  ) {
    if (!base64) return;
    const src = `data:${mimeType};base64,${base64}`;
    if (audioPlayerRef.current) {
      audioPlayerRef.current.src = src;
      audioPlayerRef.current.playbackRate = playbackRate || 1.0;
      audioPlayerRef.current.play().catch(() => undefined);
    }
  }

  // Record 10-15s sample for Step 3 Voice Cloning
  async function toggleRecordCloneSample() {
    if (isRecordingClone) {
      mediaRecorderRef.current?.stop();
      setIsRecordingClone(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setRecordedCloneBase64(String(reader.result || ''));
          setCloneMessage('Đã thu âm mẫu giọng thật từ Micro! Bấm "Lưu Giọng Clone Free" để hoàn tất.');
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecordingClone(true);
      setCloneMessage('Đang thu âm giọng mẫu của bạn (Hãy đọc câu mẫu trong 10-15 giây)...');
    } catch {
      setCloneMessage('Không thể mở Micro trình duyệt. Bạn có thể tải file âm thanh (.wav/.mp3) lên thay thế.');
    }
  }

  async function handleCloneVoiceSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cloneName.trim()) return;
    setCloningLoading(true);
    setCloneMessage('');

    try {
      const res = await fetch('/api/sales/voice-workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'clone_voice',
          payload: {
            display_name: cloneName.trim(),
            gender: cloneGender,
            region: cloneRegion,
            reference_text: cloneRefText,
            audio_base64: recordedCloneBase64 || undefined,
            mime_type: 'audio/wav',
          },
        }),
      });
      const data = await res.json();
      const created = data?.data?.voice || data?.voice;
      if (created?.id) {
        setCloneMessage(`✅ Đã tạo giọng Clone "${created.display_name}" miễn phí thành công!`);
        setCloneName('');
        setRecordedCloneBase64('');
        loadVoicesAndStatus();
        setSelectedVoiceId(created.id);
      }
    } catch {
      setCloneMessage('Có lỗi khi lưu mẫu giọng Clone.');
    } finally {
      setCloningLoading(false);
    }
  }

  async function handlePreviewVoice(voice: VoiceProfile) {
    setPreviewingVoiceId(voice.id);
    try {
      const sampleText =
        voice.reference_text ||
        `Xin chào quý khách, em đang nói bằng ${voice.display_name} trên hệ thống AI Sales Agent.`;
      const res = await fetch('/api/sales/voice-workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'tts',
          payload: {
            text: sampleText,
            voice_id: voice.id,
          },
        }),
      });
      const data = await res.json();
      const tts = data?.data || data;
      if (tts?.audio_base64) {
        playBase64Audio(tts.audio_base64, tts.mime_type, tts.playback_rate);
      }
    } finally {
      setPreviewingVoiceId(null);
    }
  }

  // Step 1: Free STT (Browser Web Speech + Groq Whisper Free API)
  async function toggleMicSpeechToText() {
    if (isListeningMic) {
      speechRecRef.current?.stop?.();
      mediaRecorderRef.current?.stop?.();
      setIsListeningMic(false);
      return;
    }

    setSttStatus('🎙️ Đang nghe giọng nói của bạn qua Micro (Bước 1 STT Free)...');
    setIsListeningMic(true);

    // 1. Browser Web Speech API (Free instant Vietnamese STT)
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'vi-VN';
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0]?.transcript || '')
          .join(' ');
        if (transcript.trim()) {
          setCustomerSpeech(transcript.trim());
          setSttStatus(`✅ Bước 1 STT Free đã nhận diện: "${transcript.trim()}"`);
        }
      };

      recognition.onerror = () => {
        setIsListeningMic(false);
      };
      recognition.onend = () => {
        setIsListeningMic(false);
      };

      speechRecRef.current = recognition;
      recognition.start();
      return;
    }

    // 2. Fallback MediaRecorder -> Groq Whisper Free API
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const b64 = String(reader.result || '');
          const res = await fetch('/api/sales/voice-workflows', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'stt',
              payload: { audio_base64: b64, mime_type: blob.type },
            }),
          });
          const data = await res.json();
          const stt = data?.data || data;
          if (stt?.text) {
            setCustomerSpeech(stt.text);
            setSttStatus(`✅ Groq Whisper Free STT: "${stt.text}"`);
          } else {
            setSttStatus(stt?.note || 'Đã thu âm xong.');
          }
        };
        reader.readAsDataURL(blob);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
    } catch {
      setIsListeningMic(false);
      setSttStatus('Không mở được Micro. Bạn có thể nhập trực tiếp câu nói của khách vào ô bên dưới.');
    }
  }

  async function handleExecuteVoiceCall() {
    setCallLoading(true);
    setCallOutput(null);

    const lead = customers.find((c) => c.id === selectedLeadId);
    const phoneToUse = lead?.phone || customPhone || '+84905123456';
    const nameToUse = lead?.name || 'Khách hàng';

    try {
      const res = await fetch('/api/sales/voice-workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: callMode,
          payload:
            callMode === 'wf01'
              ? {
                  lead_id: lead?.id,
                  phone: phoneToUse,
                  full_name: nameToUse,
                  context: `Công ty ${lead?.company || 'Doanh nghiệp'}, Điểm hiện tại: ${lead?.score ?? 60}`,
                  customer_speech: customerSpeech,
                  voice_id: selectedVoiceId,
                }
              : {
                  phone: phoneToUse,
                  caller_name: nameToUse,
                  speech: customerSpeech,
                  voice_id: selectedVoiceId,
                },
        }),
      });
      const json = await res.json();
      const result = json?.data || json;
      setCallOutput(result);

      if (result?.tts_audio?.audio_base64) {
        playBase64Audio(
          result.tts_audio.audio_base64,
          result.tts_audio.mime_type,
          result.tts_audio.voice?.playback_rate || 1.0,
        );
      }

      loadVoicesAndStatus();
      router.refresh();
    } finally {
      setCallLoading(false);
    }
  }

  async function handleExecuteWf03() {
    setWf03Loading(true);
    setWf03Output(null);
    const lead = customers.find((c) => c.id === selectedLeadId) || customers[0];

    try {
      const res = await fetch('/api/sales/voice-workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'wf03',
          payload: {
            lead_id: lead?.id,
            phone: lead?.phone || customPhone || '+84905123456',
            full_name: lead?.name || 'Khách hàng',
            intent: 'request_proposal',
            sentiment: 'positive',
            summary:
              customerSpeech ||
              `Khách hàng ${lead?.name || ''} yêu cầu báo giá gói Pro sau cuộc gọi Voice AI.`,
          },
        }),
      });
      const json = await res.json();
      const result = json?.data || json;
      setWf03Output(result);
      onApprovalCreated?.();
      loadVoicesAndStatus();
      router.refresh();
    } finally {
      setWf03Loading(false);
    }
  }

  async function handleExecuteWf04() {
    if (!wf04Input.trim()) return;
    setWf04Loading(true);
    setWf04Output(null);

    try {
      const res = await fetch('/api/sales/voice-workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'wf04',
          payload: {
            input: wf04Input.trim(),
          },
        }),
      });
      const json = await res.json();
      setWf04Output(json?.data || json);
      loadVoicesAndStatus();
    } finally {
      setWf04Loading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Hidden Audio Player for Step 3 TTS */}
      <audio ref={audioPlayerRef} className="hidden" controls />

      {/* 3-Step Pipeline Status Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Bước 1 • AI Nghe (STT)
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
              FREE 100%
            </span>
          </div>
          <p className="text-sm font-semibold text-white">
            Cloud API Free (Groq Whisper + Web Speech)
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Chuyển giọng nói Micro thành Text tiếng Việt không tốn máy local.
          </p>
        </div>

        <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Bước 2 • Bộ Não AI (LLM + RAG)
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-300">
              {statusInfo?.pipeline?.step2_llm?.gemini_configured
                ? 'Gemini 3.8 Flash Ready'
                : 'Cấu hình trong .env'}
            </span>
          </div>
          <p className="text-sm font-semibold text-white">
            Gemini 3.8 Flash + PostgreSQL pgvector
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Chỉ gửi Text ngắn (~35đ/lượt) kết hợp {statusInfo?.pipeline?.step2_llm?.rag_chunks_count ?? 4} đoạn tài liệu RAG thật trong DB.
          </p>
        </div>

        <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
              Bước 3 • Đọc & Clone Giọng (TTS)
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-purple-300">
              FREE 100% ({voices.length} giọng)
            </span>
          </div>
          <p className="text-sm font-semibold text-white">
            Zero-Shot Voice Cloning + Neural Tiếng Việt
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Tự thu âm giọng của bản thân hoặc chọn nhiều giọng tư vấn viên miễn phí.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Live Voice AI Call Center (WF-01 & WF-02) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>📞</span> Tổng Đài Đàm Thoại Voice AI Trực Tiếp (WF-01 & WF-02)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Chạy thật qua n8n Webhook + PostgreSQL + Phát giọng người thật qua loa máy tính
                </p>
              </div>

              <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setCallMode('wf01');
                    setCustomerSpeech(
                      'Anh quan tâm gói Pro, gửi báo giá chi tiết và chính sách chiết khấu cho anh nhé.',
                    );
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    callMode === 'wf01'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  WF-01: AI Gọi Đi (Outbound)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCallMode('wf02');
                    setCustomerSpeech(
                      'Cho anh hỏi bảng giá gói Pro và chính sách chiết khấu bên em thế nào?',
                    );
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    callMode === 'wf02'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  WF-02: AI Nghe Máy (Inbound RAG)
                </button>
              </div>
            </div>

            {/* Select Customer & Select Voice */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Khách hàng đàm thoại (Từ PostgreSQL)
                </label>
                <select
                  value={selectedLeadId}
                  onChange={(e) => {
                    setSelectedLeadId(e.target.value);
                    const found = customers.find((c) => c.id === e.target.value);
                    if (found?.phone) setCustomPhone(found.phone);
                  }}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.company} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Chọn Giọng Đọc AI (Bước 3 - Clone / Neural)
                </label>
                <select
                  value={selectedVoiceId}
                  onChange={(e) => setSelectedVoiceId(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                >
                  {voices.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.type === 'cloned' ? '🎙️ [Clone] ' : '🔊 [Neural] '}
                      {v.display_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Step 1: Microphone Input / Customer Speech */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300">
                  Lời nói của Khách hàng (Bước 1: Nói vào Micro hoặc chọn câu mẫu)
                </label>
                <button
                  type="button"
                  onClick={toggleMicSpeechToText}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    isListeningMic
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
                  }`}
                >
                  <span>{isListeningMic ? '⏹️ Dừng Nghe Micro' : '🎙️ Bấm Nói Bằng Micro'}</span>
                </button>
              </div>

              {sttStatus && (
                <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-1.5">
                  {sttStatus}
                </p>
              )}

              <textarea
                rows={2}
                value={customerSpeech}
                onChange={(e) => setCustomerSpeech(e.target.value)}
                placeholder="Nói vào Micro hoặc nhập câu phản hồi của khách hàng..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />

              {/* Quick preset customer utterances */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    setCustomerSpeech(
                      'Anh quan tâm gói Pro 5 triệu/tháng, em tạo báo giá giảm 12% gửi anh duyệt nhé.',
                    )
                  }
                  className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-[11px] text-slate-300 hover:border-indigo-500/50 hover:text-white"
                >
                  💬 &ldquo;Quan tâm gói Pro, gửi báo giá...&rdquo;
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCustomerSpeech(
                      'Cho anh hỏi bảng giá các gói Starter, Pro, Enterprise và chính sách dùng thử 14 ngày?',
                    )
                  }
                  className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-[11px] text-slate-300 hover:border-indigo-500/50 hover:text-white"
                >
                  💬 &ldquo;Hỏi bảng giá & dùng thử (RAG)...&rdquo;
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCustomerSpeech(
                      'Hiện tại bên anh chưa đủ ngân sách, gửi tài liệu gói tiết kiệm qua email nhé.',
                    )
                  }
                  className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-[11px] text-slate-300 hover:border-indigo-500/50 hover:text-white"
                >
                  💬 &ldquo;Chưa có ngân sách...&rdquo;
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                disabled={callLoading}
                onClick={handleExecuteVoiceCall}
                className="flex-1 inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 transition-all"
              >
                {callLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 h-6">
                      <span className="w-1 bg-white rounded-full animate-soundwave-1" />
                      <span className="w-1 bg-indigo-200 rounded-full animate-soundwave-2" />
                      <span className="w-1 bg-purple-200 rounded-full animate-soundwave-3" />
                      <span className="w-1 bg-pink-200 rounded-full animate-soundwave-4" />
                      <span className="w-1 bg-white rounded-full animate-soundwave-5" />
                    </div>
                    <span>Đang điều phối AI &amp; phát giọng nói...</span>
                  </div>
                ) : (
                  <>
                    <span className="text-base">🔊</span>
                    <span>
                      {callMode === 'wf01'
                        ? 'Bắt Đầu Gọi Thoại AI (Chạy WF-01 Thật)'
                        : 'Bắt Đầu Tổng Đài AI Nghe Máy (Chạy WF-02 RAG Thật)'}
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Live Call Output & Audio Player */}
            {callOutput && (
              <div className="rounded-xl border border-indigo-500/30 bg-slate-950/90 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-md bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                      ✅ Đã lưu PostgreSQL (Run ID: {String(callOutput.workflow_run_id || '').slice(0, 8)})
                    </span>
                    <span className="inline-flex items-center rounded-md bg-indigo-500/20 px-2 py-0.5 text-xs font-semibold text-indigo-300">
                      Intent: {callOutput.call_result?.intent || callOutput.intent || 'pricing'}
                    </span>
                    <span className="inline-flex items-center rounded-md bg-purple-500/20 px-2 py-0.5 text-xs font-semibold text-purple-300">
                      Giọng: {callOutput.tts_audio?.voice?.display_name || selectedVoiceId}
                    </span>
                  </div>

                  {callOutput.tts_audio?.audio_base64 && (
                    <button
                      type="button"
                      onClick={() =>
                        playBase64Audio(
                          callOutput.tts_audio.audio_base64,
                          callOutput.tts_audio.mime_type,
                          callOutput.tts_audio.voice?.playback_rate || 1.0,
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      🔊 Phát Lại Giọng Nói AI
                    </button>
                  )}
                </div>

                <div className="rounded-lg bg-slate-900 border border-slate-800 p-3 text-xs text-slate-200 whitespace-pre-line leading-relaxed font-mono">
                  {callOutput.call_result?.transcript ||
                    `Khách hàng: "${customerSpeech}"\nLễ tân AI (WF-02 RAG): "${callOutput.speech_response || ''}"`}
                </div>
              </div>
            )}
          </div>

          {/* WF-03 Multi-Agent Orchestrator & WF-04 Autonomous Workflow Agent */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>🤖</span> Điều Phối Đa Tác Tử (WF-03) & AI Tự Chủ Gọi API Ngoài (WF-04)
            </h3>

            {/* WF-03 Box */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    WF-03: Multi-Agent Orchestrator (Tự động tạo Báo giá thật vào DB)
                  </h4>
                  <p className="text-xs text-slate-400">
                    Đọc nội dung cuộc gọi vừa xong, quyết định Next Best Action và đẩy báo giá thật sang tab Phê duyệt Báo giá.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={wf03Loading}
                  onClick={handleExecuteWf03}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-2 text-xs font-semibold text-white transition-all"
                >
                  {wf03Loading ? 'Đang điều phối WF-03...' : '⚡ Chạy WF-03 & Tạo Báo Giá Thật'}
                </button>
              </div>

              {wf03Output && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200 space-y-1">
                  <p className="font-semibold">
                    ✅ WF-03 hoàn tất! Tool được chọn:{' '}
                    <span className="underline">{wf03Output.decision?.chosen_tool}</span> → Đích:{' '}
                    <span className="underline">{wf03Output.decision?.target_workflow}</span>
                  </p>
                  <p>{wf03Output.decision?.reason}</p>
                  {wf03Output.approval_id && (
                    <p className="text-amber-300 font-semibold">
                      📋 Đã tạo Báo giá chờ duyệt mới trong PostgreSQL (Approval ID: {wf03Output.approval_id}) — Bấm sang tab &ldquo;Phê duyệt Báo giá&rdquo; để duyệt ngay!
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* WF-04 Box */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-white">
                  WF-04: Autonomous Workflow Agent (Tự động gọi API Tỷ giá & Thời tiết thật)
                </h4>
                <p className="text-xs text-slate-400">
                  AI tự phân tích câu hỏi tự do để gọi REST API quốc tế (Open Exchange Rates / Open-Meteo).
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={wf04Input}
                  onChange={(e) => setWf04Input(e.target.value)}
                  placeholder="Nhập yêu cầu cho WF-04 (VD: Tỷ giá USD sang VND hoặc Thời tiết Đà Nẵng)..."
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  disabled={wf04Loading}
                  onClick={handleExecuteWf04}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2 text-xs font-semibold text-white whitespace-nowrap"
                >
                  {wf04Loading ? 'Đang gọi API...' : '🌐 Chạy WF-04 Thật'}
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setWf04Input(
                      'Quy đổi gói Enterprise 1500 USD sang VND theo tỷ giá hôm nay là bao nhiêu?',
                    )
                  }
                  className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white"
                >
                  💵 Quy đổi 1500 USD sang VND
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setWf04Input('Thời tiết tại Đà Nẵng hôm nay thế nào để đi gặp khách hàng?')
                  }
                  className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white"
                >
                  🌤️ Thời tiết Đà Nẵng hôm nay
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setWf04Input('Dự báo thời tiết Hà Nội hiện tại bao nhiêu độ?')
                  }
                  className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white"
                >
                  🌡️ Thời tiết Hà Nội
                </button>
              </div>

              {wf04Output && (
                <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-3 text-xs text-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-indigo-300">
                      Tool đã gọi thật: {wf04Output.tool_executed || wf04Output.action}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Run ID: {String(wf04Output.workflow_run_id || '').slice(0, 8)}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-white">
                    {wf04Output.ai_answer || wf04Output.reason}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Step 3 Free Voice Cloning Studio */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-5">
            <div>
              <span className="inline-flex items-center rounded-full bg-purple-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-purple-300 mb-2">
                Bước 3 • Tự Clone Giọng Nói Free 100%
              </span>
              <h3 className="text-lg font-bold text-white">
                🎙️ Phòng Thu Clone Giọng Cá Nhân & Kho Giọng AI
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Thu âm 10–15 giây giọng của bạn (hoặc các thành viên trong nhóm) để tạo nhiều profile giọng nói khác nhau hoàn toàn miễn phí.
              </p>
            </div>

            <form onSubmit={handleCloneVoiceSubmit} className="space-y-3.5 border-b border-slate-800 pb-5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Tên Giọng Nói Mới (VD: Giọng Bảo, Giọng Nữ Sale...)
                </label>
                <input
                  type="text"
                  required
                  value={cloneName}
                  onChange={(e) => setCloneName(e.target.value)}
                  placeholder="Nhập tên hiển thị cho giọng nói..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Giới tính giọng
                  </label>
                  <select
                    value={cloneGender}
                    onChange={(e) => setCloneGender(e.target.value as 'male' | 'female')}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                  >
                    <option value="male">Giọng Nam</option>
                    <option value="female">Giọng Nữ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Vùng miền / Phong cách
                  </label>
                  <input
                    type="text"
                    value={cloneRegion}
                    onChange={(e) => setCloneRegion(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Câu mẫu tham chiếu (Đọc câu này khi bấm Thu âm)
                </label>
                <textarea
                  rows={2}
                  value={cloneRefText}
                  onChange={(e) => setCloneRefText(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={toggleRecordCloneSample}
                  className={`flex-1 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                    isRecordingClone
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  {isRecordingClone
                    ? '⏹️ Dừng Thu Âm Mẫu Giọng'
                    : '🎙️ 1. Thu Âm Giọng Thật Qua Micro'}
                </button>

                <button
                  type="submit"
                  disabled={cloningLoading || !cloneName.trim()}
                  className="flex-1 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 px-3.5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-purple-600/20 transition-all"
                >
                  {cloningLoading ? 'Đang lưu...' : '✨ 2. Lưu Giọng Clone Free'}
                </button>
              </div>

              {cloneMessage && (
                <p className="text-xs text-purple-300 bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-2">
                  {cloneMessage}
                </p>
              )}
            </form>

            {/* List of Available Voices */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Danh sách Giọng Nói Hiện Có ({voices.length})
              </h4>

              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                {voices.map((v) => {
                  const isSelected = v.id === selectedVoiceId;
                  return (
                    <div
                      key={v.id}
                      onClick={() => setSelectedVoiceId(v.id)}
                      className={`cursor-pointer rounded-xl border p-3 transition-all ${
                        isSelected
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                                v.type === 'cloned'
                                  ? 'bg-purple-500/25 text-purple-300'
                                  : 'bg-indigo-500/20 text-indigo-300'
                              }`}
                            >
                              {v.type === 'cloned' ? 'Cloned' : 'Neural'}
                            </span>
                            <span className="text-xs font-semibold text-white">
                              {v.display_name}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">
                            {v.description}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreviewVoice(v);
                          }}
                          disabled={previewingVoiceId === v.id}
                          className="shrink-0 rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200"
                        >
                          {previewingVoiceId === v.id ? 'Đang phát...' : '🔊 Nghe thử'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
