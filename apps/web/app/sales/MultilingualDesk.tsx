'use client';

// WF-12 | Bàn hỗ trợ đa ngôn ngữ: khách nước ngoài nhắn -> dịch sang tiếng Việt; nhân viên trả lời tiếng Việt -> dịch sang ngôn ngữ của khách.
import { useEffect, useState } from 'react';

type Direction = 'inbound' | 'outbound';
type Lang = { code?: string; name?: string } | null;
type TranslateResult = {
  status: 'translated' | 'needs_review' | 'duplicate' | 'no_translation_needed' | 'rejected' | 'error';
  direction?: Direction;
  interactionId?: string | null;
  leadId?: string | null;
  language?: Lang;
  targetLanguage?: Lang;
  translatedText?: string | null;
  backTranslation?: string | null;
  confidence?: number;
  needsReview?: boolean;
  reviewReasons?: string[];
  notes?: string | null;
  languageRemembered?: boolean;
  saved?: boolean;
  message?: string;
  errors?: { code?: string; message?: string }[];
  error?: string;
};
type LeadOption = { id: string; first_name?: string | null; last_name?: string | null; company_name?: string | null; email?: string | null };
type HistoryItem = { at: string; direction: Direction; source: string; result: TranslateResult };

const MAX_CHARS = 4000;

const REASON_LABELS: Record<string, string> = {
  LOW_CONFIDENCE: 'AI không chắc chắn về bản dịch',
  LANGUAGE_UNDETECTED: 'Không nhận ra được ngôn ngữ',
  TARGET_MISMATCH: 'Bản dịch không đúng ngôn ngữ đích',
  NOT_TRANSLATED: 'Bản dịch giống hệt bản gốc (chưa được dịch)',
};

const TARGETS: { code: string; label: string }[] = [
  { code: '', label: 'Theo ngôn ngữ đã ghi nhớ của khách' },
  { code: 'en', label: 'Tiếng Anh (en)' },
  { code: 'ja', label: 'Tiếng Nhật (ja)' },
  { code: 'ko', label: 'Tiếng Hàn (ko)' },
  { code: 'zh', label: 'Tiếng Trung (zh)' },
  { code: 'fr', label: 'Tiếng Pháp (fr)' },
  { code: 'de', label: 'Tiếng Đức (de)' },
  { code: 'th', label: 'Tiếng Thái (th)' },
  { code: 'id', label: 'Tiếng Indonesia (id)' },
  { code: 'es', label: 'Tiếng Tây Ban Nha (es)' },
  { code: 'ru', label: 'Tiếng Nga (ru)' },
];

const SAMPLES: Record<Direction, { label: string; text: string }[]> = {
  inbound: [
    { label: '🇬🇧 Anh', text: 'Hello, we are a travel agency in Singapore. Could you send us a quote for 20 user accounts and tell us if a demo is available next week?' },
    { label: '🇯🇵 Nhật', text: 'こんにちは。御社のAI営業ツールに興味があります。料金プランと無料トライアルについて教えていただけますか？' },
    { label: '🇫🇷 Pháp', text: "Bonjour, nous avons un problème de connexion depuis ce matin. Pouvez-vous nous aider rapidement s'il vous plaît ?" },
  ],
  outbound: [
    { label: 'Báo giá', text: 'Cảm ơn quý khách đã quan tâm. Gói Pro cho 20 tài khoản có giá 5.000.000 VND mỗi tháng. Chúng tôi có thể đặt lịch demo vào thứ Năm tuần sau.' },
    { label: 'Hỗ trợ', text: 'Chúng tôi rất tiếc về sự bất tiện này. Đội kỹ thuật đang kiểm tra và sẽ phản hồi quý khách trong vòng 2 giờ.' },
  ],
};

const leadName = (l: LeadOption) =>
  [l.first_name, l.last_name].filter(Boolean).join(' ').trim() || l.email || l.id.slice(0, 8);

export default function MultilingualDesk() {
  const [direction, setDirection] = useState<Direction>('inbound');
  const [text, setText] = useState('');
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [leadId, setLeadId] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TranslateResult | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    let alive = true;
    fetch('/api/sales/leads')
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => { if (alive && json && Array.isArray(json.data)) setLeads(json.data as LeadOption[]); })
      .catch(() => { /* danh sách khách chỉ là tiện ích, lỗi thì vẫn dịch nhanh được */ });
    return () => { alive = false; };
  }, []);

  function switchDirection(next: Direction) {
    setDirection(next); setResult(null); setError(''); setText('');
  }

  async function submit() {
    const body = text.trim();
    if (!body || loading) return;
    setLoading(true); setResult(null); setError(''); setCopied(false);
    try {
      const res = await fetch('/api/sales/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction, text: body, leadId: leadId || undefined, targetLanguage: direction === 'outbound' ? targetLanguage || undefined : undefined }),
      });
      const json = (await res.json().catch(() => ({}))) as TranslateResult;
      if (!res.ok && !json.status) {
        setError(json.error || 'Không dịch được lúc này.');
      } else {
        setResult(json);
        if (json.translatedText) {
          setHistory((h) => [{ at: new Date().toLocaleTimeString('vi-VN'), direction, source: body, result: json }, ...h].slice(0, 5));
        }
      }
    } catch {
      setError('Không kết nối được máy chủ.');
    } finally {
      setLoading(false);
    }
  }

  async function copy(value?: string | null) {
    if (!value) return;
    try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* trình duyệt chặn clipboard */ }
  }

  const ok = result && ['translated', 'needs_review', 'duplicate', 'no_translation_needed'].includes(result.status);
  const outLang = direction === 'inbound' ? result?.language : result?.targetLanguage;
  const isInbound = direction === 'inbound';

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Cột trái: nhập nội dung */}
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80 space-y-4">
        <div>
          <h2 className="text-lg font-black text-slate-900">Hỗ trợ khách quốc tế (WF-12)</h2>
          <p className="text-sm text-slate-600">Khách nhắn bằng tiếng mẹ đẻ, bạn đọc bằng tiếng Việt. Bạn trả lời tiếng Việt, khách nhận bằng ngôn ngữ của họ.</p>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
          {([['inbound', '📥 Khách nhắn → Tiếng Việt'], ['outbound', '📤 Mình trả lời → Ngôn ngữ khách']] as const).map(([id, label]) => (
            <button key={id} type="button" onClick={() => switchDirection(id)}
              className={`rounded-lg px-3 py-2 text-xs font-extrabold transition ${direction === id ? 'bg-white text-violet-700 shadow' : 'text-slate-600 hover:text-slate-900'}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-bold text-slate-600">
            Gắn với khách hàng (không bắt buộc)
            <select value={leadId} onChange={(e) => setLeadId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
              <option value="">Dịch nhanh — không lưu</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>{leadName(l)}{l.company_name ? ` — ${l.company_name}` : ''}</option>
              ))}
            </select>
          </label>
          {!isInbound && (
            <label className="text-xs font-bold text-slate-600">
              Dịch sang
              <select value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
                {TARGETS.map((t) => <option key={t.code} value={t.code}>{t.label}</option>)}
              </select>
            </label>
          )}
        </div>

        <label className="block text-xs font-bold text-slate-600">
          {isInbound ? 'Tin nhắn của khách (mọi ngôn ngữ)' : 'Câu trả lời của bạn (tiếng Việt)'}
          <textarea value={text} onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))} rows={7}
            placeholder={isInbound ? 'Dán tin nhắn của khách vào đây…' : 'Gõ câu trả lời bằng tiếng Việt…'}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900" />
          <span className="mt-1 block text-right text-[11px] font-normal text-slate-500">{text.length}/{MAX_CHARS}</span>
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Mẫu thử:</span>
          {SAMPLES[direction].map((s) => (
            <button key={s.label} type="button" onClick={() => { setText(s.text); setResult(null); setError(''); }}
              className="rounded-full border border-slate-300 px-3 py-1 text-xs font-bold text-slate-700 hover:border-violet-500 hover:text-violet-700">
              {s.label}
            </button>
          ))}
        </div>

        {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

        <button type="button" disabled={!text.trim() || loading} onClick={submit}
          className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3 text-sm font-extrabold text-white disabled:opacity-50">
          {loading ? 'AI đang dịch…' : isInbound ? 'Nhận diện & dịch sang tiếng Việt' : 'Dịch câu trả lời'}
        </button>
      </section>

      {/* Cột phải: kết quả */}
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80 space-y-4">
        <h3 className="text-sm font-black uppercase tracking-wide text-slate-500">Kết quả</h3>
        {!result && <p className="text-sm text-slate-500">Chưa có kết quả. Nhập nội dung và bấm nút dịch.</p>}

        {(result?.status === 'rejected' || result?.status === 'error') && (
          <div className="space-y-1 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
            {(result.errors?.length ? result.errors : [{ message: result.error || 'Không dịch được.' }]).map((e, i) => <p key={i}>{e.message}</p>)}
          </div>
        )}

        {ok && result && (
          <div className="space-y-4">
            <div className={`rounded-lg p-3 text-sm ${result.status === 'needs_review' ? 'bg-amber-50 text-amber-800' : result.status === 'duplicate' || result.status === 'no_translation_needed' ? 'bg-sky-50 text-sky-800' : 'bg-emerald-50 text-emerald-800'}`}>
              <p className="font-bold">
                {result.status === 'needs_review' ? '⚠️ Cần người xem lại' : result.status === 'duplicate' ? 'ℹ️ Đã dịch trước đó' : result.status === 'no_translation_needed' ? 'ℹ️ Không cần dịch' : '✅ Đã dịch xong'}
              </p>
              <p>{result.message}</p>
              {result.reviewReasons?.map((r) => <p key={r}>• {REASON_LABELS[r] || r}</p>)}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {outLang?.name && (
                <span className="rounded-full bg-violet-100 px-3 py-1 font-bold text-violet-800">
                  {isInbound ? 'Khách dùng' : 'Dịch sang'}: {outLang.name}{outLang.code ? ` (${outLang.code})` : ''}
                </span>
              )}
              {typeof result.confidence === 'number' && (
                <span className="rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-700">AI tự chấm: {Math.round(result.confidence * 100)}%</span>
              )}
              {result.saved && <span className="rounded-full bg-indigo-100 px-3 py-1 font-bold text-indigo-800">💾 Đã lưu vào lịch sử khách</span>}
              {result.languageRemembered && <span className="rounded-full bg-emerald-100 px-3 py-1 font-bold text-emerald-800">🧠 Đã ghi nhớ ngôn ngữ của khách</span>}
            </div>

            {result.translatedText && (
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-500">{isInbound ? 'Bản dịch tiếng Việt' : `Bản gửi cho khách${outLang?.name ? ` (${outLang.name})` : ''}`}</p>
                  <button type="button" onClick={() => copy(result.translatedText)} className="rounded-md border border-slate-300 px-2 py-0.5 text-[11px] font-bold hover:border-violet-500">
                    {copied ? 'Đã chép ✓' : 'Chép'}
                  </button>
                </div>
                <p className="whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900">{result.translatedText}</p>
              </div>
            )}

            {result.backTranslation && (
              <div>
                <p className="mb-1 text-xs font-bold text-slate-500">Dịch ngược về tiếng Việt (để bạn kiểm tra ý nghĩa trước khi gửi)</p>
                <p className="whitespace-pre-wrap break-words rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-700">{result.backTranslation}</p>
              </div>
            )}

            {result.notes && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">📝 {result.notes}</p>}
            {!isInbound && <p className="text-xs text-slate-500">Hệ thống không tự gửi gì cho khách. Hãy chép bản dịch và gửi qua kênh bạn đang chat với khách.</p>}
          </div>
        )}

        {history.length > 0 && (
          <div className="border-t border-slate-100 pt-3">
            <p className="mb-2 text-xs font-bold text-slate-500">Vừa dịch trong phiên này</p>
            <ul className="space-y-1">
              {history.map((h, i) => (
                <li key={i}>
                  <button type="button" onClick={() => { setDirection(h.direction); setText(h.source); setResult(h.result); setError(''); }}
                    className="w-full truncate rounded-md px-2 py-1 text-left text-xs text-slate-700 hover:bg-slate-100">
                    <span className="font-mono text-slate-400">{h.at}</span> · {h.direction === 'inbound' ? '📥' : '📤'} {h.source}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
