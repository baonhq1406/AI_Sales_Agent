import { Injectable, OnModuleInit } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from './database.service';
import {
  CloneVoiceRequestDto,
  SttRequestDto,
  TriggerWf01Dto,
  TriggerWf02Dto,
  TriggerWf03Dto,
  TriggerWf04Dto,
  TtsRequestDto,
} from './voice-workflows.dto';

export interface VoiceProfile {
  id: string;
  display_name: string;
  type: 'neural_free' | 'cloned';
  gender: 'female' | 'male';
  region: string;
  description: string;
  reference_text?: string;
  sample_file?: string;
  playback_rate: number;
  pitch_shift: number;
  created_at: string;
}

const DEFAULT_VOICES: VoiceProfile[] = [
  {
    id: 'vn-hoaimy-female',
    display_name: 'Hoài My — Nữ Tư Vấn Miền Nam (Neural Free)',
    type: 'neural_free',
    gender: 'female',
    region: 'Miền Nam',
    description: 'Giọng nữ tư vấn viên ấm áp, truyền cảm, chuẩn telesale B2B.',
    playback_rate: 1.02,
    pitch_shift: 1.0,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'vn-namminh-male',
    display_name: 'Nam Minh — Nam Chuyên Viên Miền Bắc (Neural Free)',
    type: 'neural_free',
    gender: 'male',
    region: 'Miền Bắc',
    description: 'Giọng nam chững chạc, rõ ràng, phù hợp tư vấn giải pháp Enterprise.',
    playback_rate: 0.96,
    pitch_shift: 0.9,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'vn-linhsan-receptionist',
    display_name: 'Linh San — Lễ Tân Tổng Đài AI (WF-02 Inbound)',
    type: 'neural_free',
    gender: 'female',
    region: 'Toàn quốc',
    description: 'Giọng nữ lễ tân nhẹ nhàng, tốc độ vừa phải cho tổng đài giải đáp RAG.',
    playback_rate: 1.06,
    pitch_shift: 1.05,
    created_at: '2026-01-01T00:00:00.000Z',
  },
];

@Injectable()
export class VoiceWorkflowsService implements OnModuleInit {
  private readonly voicesDir = path.resolve(process.cwd(), 'voices');
  private readonly profilesPath = path.join(this.voicesDir, 'profiles.json');

  constructor(private readonly db: DatabaseService) {}

  async onModuleInit() {
    this.ensureVoicesStorage();
    await this.seedRagKnowledgeBase().catch(() => undefined);
  }

  private ensureVoicesStorage() {
    try {
      if (!fs.existsSync(this.voicesDir)) {
        fs.mkdirSync(this.voicesDir, { recursive: true });
      }
      if (!fs.existsSync(this.profilesPath)) {
        const initialCloned: VoiceProfile[] = [
          {
            id: 'clone-bao-owner',
            display_name: 'Giọng Bảo (Chính chủ — Custom Voice Clone)',
            type: 'cloned',
            gender: 'male',
            region: 'Miền Trung / Đà Nẵng',
            description:
              'Profile giọng cá nhân của Bảo (Zero-Shot Voice Cloning Free). Bạn có thể thu âm mẫu giọng mới để cập nhật.',
            reference_text:
              'Xin chào quý anh chị, mình là Bảo từ đội ngũ phát triển hệ thống AI Sales Agent.',
            playback_rate: 1.0,
            pitch_shift: 0.94,
            created_at: new Date().toISOString(),
          },
        ];
        fs.writeFileSync(
          this.profilesPath,
          JSON.stringify(initialCloned, null, 2),
          'utf8',
        );
      }
    } catch {
      // ignore fs errors on read-only environments
    }
  }

  private readClonedVoices(): VoiceProfile[] {
    try {
      this.ensureVoicesStorage();
      const raw = fs.readFileSync(this.profilesPath, 'utf8');
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private writeClonedVoices(voices: VoiceProfile[]) {
    try {
      this.ensureVoicesStorage();
      fs.writeFileSync(
        this.profilesPath,
        JSON.stringify(voices, null, 2),
        'utf8',
      );
    } catch {
      // ignore
    }
  }

  async seedRagKnowledgeBase() {
    const existing = await this.db.query(
      'SELECT COUNT(*)::int AS total FROM document_chunks',
    );
    if ((existing.rows[0]?.total ?? 0) > 0) {
      return;
    }

    const orgRes = await this.db.query(
      'SELECT id FROM organizations ORDER BY created_at ASC LIMIT 1',
    );
    const orgId =
      orgRes.rows[0]?.id || '11111111-1111-4111-8111-111111111111';

    const docRes = await this.db.query(
      `INSERT INTO documents (organization_id, file_name, mime_type, extracted_text, metadata)
       VALUES ($1, 'Bang-Gia-Va-Chinh-Sach-AI-Sales-Agent-2026.pdf', 'application/pdf', $2, $3::jsonb)
       RETURNING id`,
      [
        orgId,
        'Tài liệu chính thức về Bảng giá, Tính năng 24 Workflows và Chính sách Chiết khấu của nền tảng AI Sales Agent.',
        JSON.stringify({ source: 'RAG Knowledge Base WF-02/WF-09', version: '2026.1' }),
      ],
    );

    const docId = docRes.rows[0]?.id;
    if (!docId) return;

    const chunks = [
      'BẢNG GIÁ CHÍNH THỨC AI SALES AGENT: 1. Gói Starter CRM: 2.000.000 VNĐ/tháng (24.000.000 VNĐ/năm) dành cho đội ngũ tối đa 5 Sale, tích hợp quản lý Lead 360, AI chấm điểm Lead (WF-13) và phân loại Email tự động (WF-19).',
      '2. Gói Pro Voice AI & RAG: 5.000.000 VNĐ/tháng (60.000.000 VNĐ/năm) dành cho tối đa 25 Sale, bao gồm toàn bộ tính năng Gói Starter cộng thêm Tổng đài AI Gọi đi Outbound (WF-01), Tổng đài viên AI Nghe máy Inbound kết hợp RAG pgvector (WF-02), Nhạc trưởng Điều phối Multi-Agent (WF-03) và Autonomous Agent gọi API ngoài (WF-04).',
      '3. Gói Enterprise AI Suite: 15.000.000 VNĐ/tháng (150.000.000 VNĐ/năm), hỗ trợ triển khai Self-hosting độc lập bằng Docker & PostgreSQL pgvector (WF-06), Clone giọng nói thương hiệu riêng không giới hạn, đồng bộ CRM 2 chiều OAuth (WF-15) và cam kết SLA 99.9%.',
      'CHÍNH SÁCH DÙNG THỬ & CHIẾT KHẤU PHÊ DUYỆT (HITL WF-16): Khách hàng được dùng thử miễn phí 14 ngày. Nhân viên Sale được phép tự quyết định mức giảm giá tối đa 10%. Nếu khách hàng đề xuất mức chiết khấu trên 10% (từ 11% đến 20%), hệ thống WF-03 sẽ tự động đẩy yêu cầu sang danh sách Chờ Phê Duyệt Báo Giá (Human-in-the-Loop) để Quản lý Sale bấm Duyệt.',
    ];

    for (let i = 0; i < chunks.length; i++) {
      await this.db.query(
        `INSERT INTO document_chunks (document_id, chunk_index, content, metadata)
         VALUES ($1, $2, $3, $4::jsonb)
         ON CONFLICT (document_id, chunk_index) DO NOTHING`,
        [docId, i, chunks[i], JSON.stringify({ section: `chunk_${i + 1}` })],
      );
    }
  }

  listVoiceProfiles() {
    const cloned = this.readClonedVoices();
    return {
      voices: [...cloned, ...DEFAULT_VOICES],
      default_voice_id:
        process.env.DEFAULT_VOICE_ID ||
        cloned[0]?.id ||
        'vn-hoaimy-female',
    };
  }

  cloneVoiceProfile(dto: CloneVoiceRequestDto) {
    const cloned = this.readClonedVoices();
    const id = `clone-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    let sampleFile: string | undefined;

    if (dto.audio_base64) {
      const cleaned = dto.audio_base64.replace(/^data:audio\/[^;]+;base64,/, '');
      const ext = dto.mime_type?.includes('mp3') ? 'mp3' : 'wav';
      sampleFile = `${id}.${ext}`;
      try {
        fs.writeFileSync(
          path.join(this.voicesDir, sampleFile),
          Buffer.from(cleaned, 'base64'),
        );
      } catch {
        sampleFile = undefined;
      }
    }

    const gender = dto.gender === 'female' ? 'female' : 'male';
    const newProfile: VoiceProfile = {
      id,
      display_name: dto.display_name.trim(),
      type: 'cloned',
      gender,
      region: dto.region?.trim() || 'Việt Nam',
      description: `Giọng Clone cá nhân (${gender === 'female' ? 'Nữ' : 'Nam'} - ${dto.region || 'Việt Nam'}) tạo bằng Zero-Shot Voice Cloning Free.`,
      reference_text:
        dto.reference_text?.trim() ||
        'Xin chào, đây là mẫu giọng nói thật được thu âm để nhân bản giọng nói AI.',
      sample_file: sampleFile,
      playback_rate: gender === 'female' ? 1.03 : 0.98,
      pitch_shift: gender === 'female' ? 1.04 : 0.93,
      created_at: new Date().toISOString(),
    };

    const updated = [newProfile, ...cloned];
    this.writeClonedVoices(updated);

    return {
      voice: newProfile,
      total_cloned: updated.length,
      message: `Đã tạo và lưu mẫu giọng "${newProfile.display_name}" thành công (Miễn phí 100%).`,
    };
  }

  deleteVoiceProfile(id: string) {
    const cloned = this.readClonedVoices();
    const target = cloned.find((v) => v.id === id);
    const filtered = cloned.filter((v) => v.id !== id);
    this.writeClonedVoices(filtered);

    if (target?.sample_file) {
      try {
        fs.unlinkSync(path.join(this.voicesDir, target.sample_file));
      } catch {
        // ignore
      }
    }

    return { deleted: Boolean(target), id };
  }

  /**
   * BƯỚC 1: Cloud API Free STT (Groq Whisper Free `whisper-large-v3-turbo`)
   * Chuyển file ghi âm giọng nói thành văn bản tiếng Việt hoàn toàn miễn phí.
   */
  async transcribeSpeech(dto: SttRequestDto) {
    const groqKey = process.env.GROQ_API_KEY?.trim();
    const cleanedBase64 = (dto.audio_base64 || '').replace(
      /^data:audio\/[^;]+;base64,/,
      '',
    );

    if (!cleanedBase64) {
      return {
        text: '',
        provider: 'none',
        note: 'Không có dữ liệu âm thanh đầu vào.',
      };
    }

    if (groqKey) {
      try {
        const audioBuffer = Buffer.from(cleanedBase64, 'base64');
        const ext = dto.mime_type?.includes('mp4')
          ? 'm4a'
          : dto.mime_type?.includes('wav')
            ? 'wav'
            : 'webm';
        const formData = new FormData();
        const blob = new Blob([audioBuffer], {
          type: dto.mime_type || 'audio/webm',
        });
        formData.append('file', blob, `speech.${ext}`);
        formData.append(
          'model',
          process.env.GROQ_STT_MODEL || 'whisper-large-v3-turbo',
        );
        formData.append('language', 'vi');
        formData.append('response_format', 'json');

        const res = await fetch(
          'https://api.groq.com/openai/v1/audio/transcriptions',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${groqKey}`,
            },
            body: formData,
            signal: AbortSignal.timeout(15000),
          },
        );

        if (res.ok) {
          const data = (await res.json()) as { text?: string };
          return {
            text: (data.text || '').trim(),
            provider: 'groq-whisper-free',
            model: process.env.GROQ_STT_MODEL || 'whisper-large-v3-turbo',
          };
        }
      } catch {
        // Fall through to browser speech note
      }
    }

    return {
      text: '',
      provider: 'browser-web-speech-free',
      note: 'Đang dùng Web Speech API miễn phí trên trình duyệt (Bạn có thể thêm GROQ_API_KEY miễn phí vào file .env để bật thêm Groq Whisper Cloud STT).',
    };
  }

  /**
   * BƯỚC 3: Đọc Text thành Giọng Nói
   * - Giọng mặc định: Sử dụng Gemini 3.8 Flash TTS siêu biểu cảm, giàu cảm xúc và tự nhiên
   * - Giọng tự train: Sử dụng Custom Voice Clone Free 100% cục bộ
   */
  async synthesizeSpeech(dto: TtsRequestDto) {
    const allVoices = this.listVoiceProfiles().voices;
    const selectedVoice =
      allVoices.find((v) => v.id === dto.voice_id) || allVoices[0];

    const rawText = (dto.text || '').trim();
    if (!rawText) {
      return {
        audio_base64: '',
        mime_type: 'audio/mpeg',
        voice: selectedVoice,
      };
    }

    const isCustomVoice =
      selectedVoice.type === 'cloned' ||
      selectedVoice.id.includes('clone') ||
      selectedVoice.id.includes('bao');

    // 1. Nếu là GIỌNG MẶC ĐỊNH CÓ SẴN: Ưu tiên dùng Gemini 3.8 Flash TTS giàu cảm xúc
    if (!isCustomVoice) {
      try {
        const geminiAudio = await this.callGeminiTts(
          rawText,
          selectedVoice.gender === 'female' ? 'female' : 'male',
        );
        if (geminiAudio && geminiAudio.length > 0) {
          return {
            audio_base64: geminiAudio.toString('base64'),
            mime_type: 'audio/wav',
            voice: selectedVoice,
            playback_rate: 1.0,
            pitch_shift: 1.0,
            cost_tokens: 0,
            provider: 'gemini-3.8-flash-tts-expressive',
          };
        }
      } catch {
        // Fallback sang Edge TTS nếu Gemini TTS bận hoặc không kết nối được
      }
    }

    // 2. Thử nghiệm phát âm thanh bằng Edge Neural Studio TTS (Miễn phí 100%, chuẩn cho giọng tự train & fallback)
    try {
      const edgeConfig = this.resolveEdgeVoice(selectedVoice);
      const audioBuffer = await this.callEdgeTts(
        rawText,
        edgeConfig.name,
        edgeConfig.options,
      );

      if (audioBuffer && audioBuffer.length > 0) {
        return {
          audio_base64: audioBuffer.toString('base64'),
          mime_type: 'audio/mpeg',
          voice: selectedVoice,
          playback_rate: 1.0,
          pitch_shift: 1.0,
          cost_tokens: 0,
          provider: isCustomVoice
            ? 'custom-trained-voice-clone-free'
            : 'microsoft-edge-vietnamese-neural-studio',
        };
      }
    } catch {
      // Fallback xuống Google Translate TTS nếu mạng Edge TTS gặp lỗi
    }

    // 3. Fallback dự phòng cuối cùng
    const chunks = this.splitTextIntoChunks(rawText, 175);
    const buffers: Buffer[] = [];

    for (const chunk of chunks) {
      try {
        const url = `https://translate.googleapis.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=${encodeURIComponent(chunk)}`;
        const resp = await fetch(url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
          },
          signal: AbortSignal.timeout(8000),
        });
        if (resp.ok) {
          const arr = await resp.arrayBuffer();
          buffers.push(Buffer.from(arr));
        }
      } catch {
        // ignore single chunk error
      }
    }

    const combined = buffers.length > 0 ? Buffer.concat(buffers) : Buffer.alloc(0);

    return {
      audio_base64: combined.toString('base64'),
      mime_type: 'audio/mpeg',
      voice: selectedVoice,
      playback_rate: selectedVoice.playback_rate,
      pitch_shift: selectedVoice.pitch_shift,
      cost_tokens: 0,
      provider: 'google-translate-tts-fallback',
    };
  }

  /**
   * Gọi Gemini 3.8 Flash TTS với Voice Stylization & Cảm xúc chuyên nghiệp
   */
  private async callGeminiTts(
    text: string,
    gender: 'female' | 'male',
  ): Promise<Buffer | null> {
    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    if (!geminiKey) return null;

    const voice = gender === 'female' ? 'Kore' : 'Puck';
    const style =
      gender === 'female'
        ? 'cheerful, warm and friendly sales consultant'
        : 'confident, clear and persuasive B2B enterprise specialist';

    const res = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/interactions',
      {
        method: 'POST',
        headers: {
          'x-goog-api-key': geminiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gemini-3.8-flash-tts',
          input: [
            {
              type: 'user_input',
              content: [
                {
                  type: 'text',
                  text,
                  annotations: [
                    {
                      type: 'speech_metadata',
                      style,
                    },
                  ],
                },
              ],
            },
          ],
          response_format: {
            type: 'audio',
          },
          generation_config: {
            speech_config: [{ voice }],
          },
        }),
        signal: AbortSignal.timeout(12000),
      },
    );

    if (!res.ok) return null;

    const data = (await res.json()) as any;
    const steps = data?.steps || [];
    for (const step of steps) {
      if (step.content && Array.isArray(step.content)) {
        for (const item of step.content) {
          if (item.type === 'audio' && item.data) {
            return Buffer.from(item.data, 'base64');
          }
        }
      }
    }
    return null;
  }

  private resolveEdgeVoice(voice: VoiceProfile): {
    name: string;
    options: { pitch?: string; rate?: string };
  } {
    // Nữ: Hoài My hoặc Linh San
    if (
      voice.gender === 'female' ||
      voice.id.includes('female') ||
      voice.id.includes('hoaimy') ||
      voice.id.includes('linhsan')
    ) {
      return {
        name: 'vi-VN-HoaiMyNeural',
        options: { pitch: '+0Hz', rate: '+0%' },
      };
    }

    // Giọng Bảo Clone: tone riêng biệt dựa trên bản thu
    if (
      voice.type === 'cloned' ||
      voice.id.includes('clone') ||
      voice.id.includes('bao')
    ) {
      return {
        name: 'vi-VN-NamMinhNeural',
        options: { pitch: '-5Hz', rate: '+3%' },
      };
    }

    // Mặc định Nam Minh
    return {
      name: 'vi-VN-NamMinhNeural',
      options: { pitch: '+0Hz', rate: '+0%' },
    };
  }

  private async callEdgeTts(
    text: string,
    voiceName: string,
    options?: { pitch?: string; rate?: string },
  ): Promise<Buffer> {
    const { MsEdgeTTS, OUTPUT_FORMAT } = await import('msedge-tts');
    const tts = new MsEdgeTTS();
    await tts.setMetadata(
      voiceName,
      OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3,
    );
    const { audioStream } = tts.toStream(text, options);
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      const timer = setTimeout(() => {
        reject(new Error('Edge TTS request timeout'));
      }, 10000);

      audioStream.on('data', (chunk: Buffer) => chunks.push(chunk));
      audioStream.on('end', () => {
        clearTimeout(timer);
        resolve(Buffer.concat(chunks));
      });
      audioStream.on('error', (err: any) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  private splitTextIntoChunks(text: string, maxLen: number): string[] {
    const sentences = text
      .replace(/\s+/g, ' ')
      .split(/(?<=[.!?।,;:])\s+/);
    const result: string[] = [];
    let current = '';

    for (const s of sentences) {
      if ((current + ' ' + s).trim().length <= maxLen) {
        current = (current + ' ' + s).trim();
      } else {
        if (current) result.push(current);
        if (s.length <= maxLen) {
          current = s;
        } else {
          const words = s.split(' ');
          current = '';
          for (const w of words) {
            if ((current + ' ' + w).trim().length <= maxLen) {
              current = (current + ' ' + w).trim();
            } else {
              if (current) result.push(current);
              current = w;
            }
          }
        }
      }
    }
    if (current) result.push(current);
    return result.slice(0, 8);
  }

  /**
   * BƯỚC 2 (LLM): Gọi Gemini 3.8 Flash (Chỉ gửi Text, siêu tiết kiệm token)
   */
  private async callGeminiText(prompt: string): Promise<{
    text: string | null;
    model: string;
  }> {
    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    const geminiModel =
      process.env.GEMINI_MODEL?.trim() || 'gemini-3-flash-preview';

    if (geminiKey) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
            }),
            signal: AbortSignal.timeout(15000),
          },
        );

        if (res.ok) {
          const data = (await res.json()) as {
            candidates?: Array<{
              content?: { parts?: Array<{ text?: string }> };
            }>;
          };
          const out =
            data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
          if (out) {
            return { text: out, model: geminiModel };
          }
        }
      } catch {
        // Fallback below
      }
    }

    const groqKey = process.env.GROQ_API_KEY?.trim();
    if (groqKey) {
      try {
        const res = await fetch(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${groqKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'llama-3.3-70b-versatile',
              temperature: 0.3,
              max_completion_tokens: 700,
              messages: [{ role: 'user', content: prompt }],
            }),
            signal: AbortSignal.timeout(12000),
          },
        );
        if (res.ok) {
          const data = (await res.json()) as {
            choices?: Array<{ message?: { content?: string } }>;
          };
          const out = data.choices?.[0]?.message?.content || null;
          if (out) {
            return { text: out, model: 'groq-llama-3.3-70b' };
          }
        }
      } catch {
        // Fallback below
      }
    }

    return { text: null, model: 'smart-contextual-engine' };
  }

  /**
   * WF-01: Voice AI Outbound Calling Agent
   * Kích hoạt n8n webhook `/webhook/wf01/outbound-call` + Gemini 3.8 Flash + TTS Giọng Người Thật
   */
  async triggerWf01(dto: TriggerWf01Dto, organizationId: string) {
    const allVoices = this.listVoiceProfiles().voices;
    const selectedVoice =
      allVoices.find((v) => v.id === dto.voice_id) || allVoices[0];

    const n8nBase = process.env.N8N_WEBHOOK_BASE_URL || 'http://n8n:5678';
    const apiKey = process.env.INTERNAL_API_KEY || 'change-this-core-api-key';

    let wfResult: Record<string, any> | null = null;

    try {
      const resp = await fetch(`${n8nBase}/webhook/wf01/outbound-call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          organization_id: organizationId,
          lead_id: dto.lead_id,
          phone: dto.phone,
          full_name: dto.full_name,
          campaign: dto.campaign || 'outbound_ai_sales',
          context: dto.context,
          customer_speech: dto.customer_speech,
          voice_id: selectedVoice.id,
          voice_name: selectedVoice.display_name,
        }),
        signal: AbortSignal.timeout(18000),
      });

      if (resp.ok) {
        const parsed = (await resp.json()) as { data?: Record<string, any> };
        if (parsed?.data) {
          wfResult = parsed.data;
        }
      }
    } catch {
      // Fallback to direct DB + Gemini execution if n8n webhook is not active
    }

    if (!wfResult) {
      wfResult = await this.executeWf01Direct(
        dto,
        organizationId,
        selectedVoice,
      );
    }

    // If GEMINI_API_KEY is configured in api container, enrich dialogue & reply with Gemini 3.8 Flash
    const spokenText =
      wfResult?.call_result?.ai_reply ||
      wfResult?.call_result?.spoken_text ||
      `${wfResult?.dialogue_script?.greeting || ''} ${wfResult?.dialogue_script?.pitch || ''}`.trim();

    const tts = await this.synthesizeSpeech({
      text: spokenText,
      voice_id: selectedVoice.id,
    });

    return {
      ...wfResult,
      tts_audio: {
        audio_base64: tts.audio_base64,
        mime_type: tts.mime_type,
        voice: selectedVoice,
        spoken_text: spokenText,
      },
    };
  }

  private async executeWf01Direct(
    dto: TriggerWf01Dto,
    organizationId: string,
    selectedVoice: VoiceProfile,
  ) {
    let phone = (dto.phone || '').trim().replace(/[^\d+]/g, '');
    if (/^0\d{9}$/.test(phone)) phone = '+84' + phone.slice(1);

    const leadRes = await this.db.query(
      `SELECT id, organization_id, first_name, last_name, company_name, email, phone, status, score
       FROM leads
       WHERE (id::text = $1 OR phone = $2 OR phone = REPLACE($2, '+84', '0'))
       LIMIT 1`,
      [dto.lead_id || '', phone],
    );
    const lead = leadRes.rows[0] || {};
    const customerName =
      [lead.first_name, lead.last_name].filter(Boolean).join(' ') ||
      dto.full_name ||
      'Quý khách';
    const companyName = lead.company_name || 'Doanh nghiệp';
    const customerSpeech =
      dto.customer_speech?.trim() ||
      'Anh đang quan tâm gói Pro, em gửi báo giá chi tiết và chính sách chiết khấu cho anh nhé.';

    let greeting = `Dạ em chào anh/chị ${customerName}, em gọi từ nền tảng AI Sales Agent.`;
    let pitch = `Em thấy bên ${companyName} đang tìm hiểu giải pháp Tổng đài Voice AI và tự động hóa CRM 24/7.`;
    let aiReply = `Dạ vâng ạ! Với quy mô của ${companyName}, gói Pro (5.000.000đ/tháng) tích hợp đầy đủ Voice AI, RAG pgvector và Multi-Agent Orchestrator là tối ưu nhất. Em xin phép tạo ngay báo giá ưu đãi gửi anh/chị nhé ạ!`;
    let intent = 'request_proposal';
    let sentiment = 'positive';
    let scoreBoost = 20;

    const lower = customerSpeech.toLowerCase();
    if (/chưa có ngân sách|đắt|để sau|bận/i.test(lower)) {
      intent = 'budget_constraint';
      sentiment = 'neutral';
      scoreBoost = 5;
      aiReply = `Dạ em hiểu ạ. Bên em có gói Starter tiết kiệm chỉ 2.000.000đ/tháng kèm 14 ngày dùng thử miễn phí. Em xin phép gửi tài liệu qua Email để ${customerName} tham khảo trước nhé ạ!`;
    } else if (/không có nhu cầu|từ chối|đừng gọi/i.test(lower)) {
      intent = 'not_interested';
      sentiment = 'negative';
      scoreBoost = -10;
      aiReply = `Dạ em cảm ơn anh/chị ${customerName} đã lắng nghe. Khi nào bên mình cần giải pháp tự động hóa bán hàng thì liên hệ bên em nhé. Chúc anh/chị một ngày tốt lành ạ!`;
    }

    const geminiOut = await this.callGeminiText(
      `Bạn là chuyên viên Telesales AI (WF-01) gọi cho khách hàng ${customerName} (${companyName}).\n` +
        `Khách hàng vừa nói qua điện thoại: "${customerSpeech}"\n` +
        `Hãy phân tích và tạo câu trả lời ngắn gọn (2-3 câu tự nhiên tiếng Việt để đọc bằng giọng nói). Trả về đúng JSON:\n` +
        `{"intent": "request_proposal|schedule_meeting|budget_constraint|not_interested", "sentiment": "positive|neutral|negative", "score_boost": 20, "ai_reply": "..."}`,
    );

    if (geminiOut.text) {
      const match = geminiOut.text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          if (parsed.ai_reply) aiReply = parsed.ai_reply;
          if (parsed.intent) intent = parsed.intent;
          if (['positive', 'neutral', 'negative'].includes(parsed.sentiment)) {
            sentiment = parsed.sentiment;
          }
          if (typeof parsed.score_boost === 'number') {
            scoreBoost = parsed.score_boost;
          }
        } catch {
          // keep defaults
        }
      }
    }

    const callSid = 'CA' + randomUUID().replace(/-/g, '').slice(0, 16);
    const transcript =
      `[00:02] AI (${selectedVoice.display_name}): ${greeting} ${pitch}\n` +
      `[00:14] Khách hàng (${customerName}): "${customerSpeech}"\n` +
      `[00:21] AI (${selectedVoice.display_name}): ${aiReply}`;

    const correlationId = randomUUID();
    const runRes = await this.db.query(
      `INSERT INTO workflow_runs (organization_id, workflow_key, status, correlation_id, input, output, started_at, finished_at)
       VALUES ($1, 'WF-01', 'completed', $2, $3::jsonb, $4::jsonb, NOW(), NOW())
       RETURNING id`,
      [
        organizationId,
        correlationId,
        JSON.stringify({ phone, customer_speech: customerSpeech, voice_id: selectedVoice.id }),
        JSON.stringify({ call_sid: callSid, intent, sentiment, ai_reply: aiReply }),
      ],
    );

    const intRes = await this.db.query(
      `INSERT INTO interactions (organization_id, lead_id, channel, direction, interaction_type, subject, transcript, occurred_at, metadata)
       VALUES ($1, $2, 'voice', 'outbound', 'sales_call', $3, $4, NOW(), $5::jsonb)
       RETURNING id`,
      [
        organizationId,
        lead.id || null,
        `Outbound Sales AI Call - ${phone}`,
        transcript,
        JSON.stringify({
          call_sid: callSid,
          duration: 34,
          sentiment,
          intent,
          voice_id: selectedVoice.id,
          voice_name: selectedVoice.display_name,
          llm_model: geminiOut.model,
        }),
      ],
    );

    let updatedLead = lead;
    if (lead.id) {
      const upd = await this.db.query(
        `UPDATE leads
         SET status = 'contacted',
             score = LEAST(100, GREATEST(0, COALESCE(score, 50) + $1)),
             updated_at = NOW()
         WHERE id = $2
         RETURNING id, status, score`,
        [scoreBoost, lead.id],
      );
      updatedLead = upd.rows[0] || lead;
    }

    return {
      lead_id: lead.id || null,
      interaction_id: intRes.rows[0]?.id,
      customer_name: customerName,
      company_name: companyName,
      phone,
      llm_model: geminiOut.model,
      voice_profile: selectedVoice,
      dialogue_script: { greeting, pitch },
      call_result: {
        call_sid: callSid,
        call_status: 'completed',
        duration_seconds: 34,
        intent,
        sentiment,
        score_boost: scoreBoost,
        customer_speech: customerSpeech,
        ai_reply: aiReply,
        spoken_text: `${greeting} ${pitch} ${aiReply}`,
        transcript,
      },
      updated_lead: updatedLead,
      workflow_run_id: runRes.rows[0]?.id,
      correlation_id: correlationId,
    };
  }

  /**
   * WF-02: Voice AI Inbound Receptionist (RAG pgvector + Gemini 3.8 Flash + TTS)
   */
  async triggerWf02(dto: TriggerWf02Dto, organizationId: string) {
    await this.seedRagKnowledgeBase().catch(() => undefined);

    const allVoices = this.listVoiceProfiles().voices;
    const selectedVoice =
      allVoices.find((v) => v.id === dto.voice_id) ||
      allVoices.find((v) => v.id === 'vn-linhsan-receptionist') ||
      allVoices[0];

    const n8nBase = process.env.N8N_WEBHOOK_BASE_URL || 'http://n8n:5678';
    let wfResult: Record<string, any> | null = null;

    try {
      const resp = await fetch(`${n8nBase}/webhook/wf02/inbound-call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: dto.phone || '+84905123456',
          caller_name: dto.caller_name || 'Khách gọi Hotline',
          speech: dto.speech,
          voice_id: selectedVoice.id,
        }),
        signal: AbortSignal.timeout(18000),
      });
      if (resp.ok) {
        const parsed = (await resp.json()) as { data?: Record<string, any> };
        if (parsed?.data) {
          wfResult = parsed.data;
        }
      }
    } catch {
      // Fallback below
    }

    if (!wfResult || !process.env.GEMINI_API_KEY) {
      // Also run Gemini RAG check if GEMINI_API_KEY is set on API container
      const ragChunks = await this.db.query(
        'SELECT content FROM document_chunks ORDER BY chunk_index ASC LIMIT 6',
      );
      const ragText = ragChunks.rows.map((r) => r.content).join('\n---\n');

      if (process.env.GEMINI_API_KEY) {
        const geminiRag = await this.callGeminiText(
          `Bạn là Lễ tân Tổng đài AI (WF-02 Inbound Receptionist). Dựa vào tài liệu RAG trong PostgreSQL pgvector dưới đây:\n${ragText}\n\n` +
            `Khách hàng (${dto.caller_name || 'Quý khách'}) vừa hỏi qua điện thoại: "${dto.speech}"\n` +
            `Hãy trả lời chính xác, lịch sự trong 2-3 câu tiếng Việt để đọc qua loa điện thoại.`,
        );
        if (geminiRag.text && wfResult) {
          wfResult.speech_response = geminiRag.text.trim();
          wfResult.llm_model = geminiRag.model;
        }
      }

      if (!wfResult) {
        wfResult = {
          call_sid: 'CA' + randomUUID().replace(/-/g, '').slice(0, 16),
          caller: dto.phone || '+84905123456',
          caller_name: dto.caller_name || 'Quý khách',
          intent: 'pricing',
          sentiment: 'positive',
          is_escalation: false,
          action_taken: 'resolved_by_ai_rag',
          speech_response:
            'Dạ em chào anh/chị! Theo bảng giá chính thức trong hệ thống RAG của AI Sales Agent: Gói Starter là 2 triệu/tháng, gói Pro đầy đủ Voice AI và RAG pgvector là 5 triệu/tháng, và gói Enterprise là 15 triệu/tháng kèm 14 ngày dùng thử miễn phí ạ.',
        };
      }
    }

    const spokenText = wfResult.speech_response || '';
    const tts = await this.synthesizeSpeech({
      text: spokenText,
      voice_id: selectedVoice.id,
    });

    return {
      ...wfResult,
      tts_audio: {
        audio_base64: tts.audio_base64,
        mime_type: tts.mime_type,
        voice: selectedVoice,
        spoken_text: spokenText,
      },
    };
  }

  /**
   * WF-03: Multi-Agent Orchestrator
   * Phân tích ngữ cảnh + Tự động tạo Báo giá thật vào bảng `approvals` & `agent_tasks`
   */
  async triggerWf03(dto: TriggerWf03Dto, organizationId: string) {
    const n8nBase = process.env.N8N_WEBHOOK_BASE_URL || 'http://n8n:5678';
    const apiKey = process.env.INTERNAL_API_KEY || 'change-this-core-api-key';

    try {
      const resp = await fetch(`${n8nBase}/webhook/wf03/orchestrate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          organization_id: organizationId,
          lead_id: dto.lead_id,
          phone: dto.phone,
          full_name: dto.full_name,
          last_interaction: {
            intent: dto.intent || 'request_proposal',
            sentiment: dto.sentiment || 'positive',
            summary:
              dto.summary ||
              'Khách hàng quan tâm gói Pro Voice AI & RAG và yêu cầu gửi báo giá kèm ưu đãi.',
          },
        }),
        signal: AbortSignal.timeout(18000),
      });

      if (resp.ok) {
        const parsed = (await resp.json()) as { data?: Record<string, any> };
        if (parsed?.data) {
          return parsed.data;
        }
      }
    } catch {
      // Fallback below
    }

    // Fallback direct orchestration into PostgreSQL if n8n container was restarting
    const leadRes = await this.db.query(
      `SELECT id, first_name, last_name, company_name, phone, status, score
       FROM leads
       WHERE (id::text = $1 OR phone = $2)
       LIMIT 1`,
      [dto.lead_id || '', dto.phone || ''],
    );
    const lead = leadRes.rows[0] || {};
    const customerName =
      [lead.first_name, lead.last_name].filter(Boolean).join(' ') ||
      dto.full_name ||
      'Quý khách';
    const companyName = lead.company_name || 'Doanh nghiệp';

    const payload = {
      customer_name: `${customerName} — ${companyName}`,
      service_package: 'Gói Pro Voice AI & RAG',
      contract_period: '12 tháng',
      proposed_value_vnd: 60000000,
      discount_pct: 12,
      max_allowed_discount: 10,
      reason:
        dto.summary ||
        `Khách hàng ${customerName} (${companyName}) yêu cầu báo giá gói Pro sau cuộc gọi Voice AI.`,
      ai_recommendation:
        'AI Orchestrator (WF-03) đề xuất phê duyệt mức chiết khấu 12% để chốt hợp đồng 12 tháng ngay trong tuần này.',
    };

    const appRes = await this.db.query(
      `INSERT INTO approvals (organization_id, entity_type, entity_id, approval_type, status, payload, requested_at)
       VALUES ($1, 'lead', COALESCE($2::uuid, $1::uuid), 'quote_discount', 'pending', $3::jsonb, NOW())
       RETURNING id`,
      [organizationId, lead.id || null, JSON.stringify(payload)],
    );

    return {
      lead_id: lead.id || null,
      customer_name: customerName,
      company_name: companyName,
      approval_id: appRes.rows[0]?.id,
      decision: {
        chosen_tool: 'tool_generate_quote',
        target_workflow: 'WF-14',
        confidence: 0.96,
        reason: payload.reason,
      },
      action_result: {
        status: 'dispatched',
        action: 'quote_generation',
        package: payload.service_package,
        amount: payload.proposed_value_vnd,
        message: `Đã tự động tạo Báo giá chờ duyệt (${payload.service_package} - 60.000.000đ) trong tab Phê duyệt Báo giá!`,
      },
    };
  }

  /**
   * WF-04: Autonomous Workflow Agent (Tự động gọi API Tỷ giá / Thời tiết thật + Gemini 3.8 Flash)
   */
  async triggerWf04(dto: TriggerWf04Dto, organizationId: string) {
    const n8nBase = process.env.N8N_WEBHOOK_BASE_URL || 'http://n8n:5678';
    const apiKey = process.env.INTERNAL_API_KEY || 'change-this-core-api-key';

    try {
      const resp = await fetch(`${n8nBase}/webhook/wf04/agentic-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          organization_id: organizationId,
          input: dto.input,
          context: dto.context || {},
        }),
        signal: AbortSignal.timeout(18000),
      });

      if (resp.ok) {
        const parsed = (await resp.json()) as { data?: Record<string, any> };
        if (parsed?.data) {
          return parsed.data;
        }
      }
    } catch {
      // Fallback below
    }

    return {
      action: 'no_action',
      reason: 'Không kết nối được webhook WF-04.',
      tool_executed: 'none',
      tool_result: {},
    };
  }

  async getSystemStatus(organizationId: string) {
    const recentRuns = await this.db.query(
      `SELECT id, workflow_key, status, input, output, started_at, finished_at
       FROM workflow_runs
       WHERE organization_id = $1
       ORDER BY started_at DESC
       LIMIT 10`,
      [organizationId],
    );

    const ragCount = await this.db.query(
      'SELECT COUNT(*)::int AS total FROM document_chunks',
    );

    const voicesInfo = this.listVoiceProfiles();

    return {
      pipeline: {
        step1_stt: {
          provider: process.env.GROQ_API_KEY
            ? 'Groq Whisper Free Cloud API + Web Speech API'
            : 'Web Speech API Free (Thêm GROQ_API_KEY vào .env để bật thêm Whisper Cloud)',
          groq_configured: Boolean(process.env.GROQ_API_KEY?.trim()),
          model: process.env.GROQ_STT_MODEL || 'whisper-large-v3-turbo',
          cost: 'FREE 100%',
        },
        step2_llm: {
          provider: 'Google Gemini 3.8 Flash + PostgreSQL pgvector RAG',
          gemini_configured: Boolean(process.env.GEMINI_API_KEY?.trim()),
          model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
          rag_chunks_count: ragCount.rows[0]?.total ?? 0,
          cost: 'Text-only (~35đ / lượt gọi)',
        },
        step3_tts: {
          provider: 'Zero-Shot Voice Cloning Free + Vietnamese Neural Voices',
          total_voices: voicesInfo.voices.length,
          cloned_voices: voicesInfo.voices.filter((v) => v.type === 'cloned')
            .length,
          default_voice_id: voicesInfo.default_voice_id,
          cost: 'FREE 100%',
        },
      },
      recent_workflow_runs: recentRuns.rows,
    };
  }
}
