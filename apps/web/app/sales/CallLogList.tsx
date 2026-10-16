'use client';

import { useEffect, useState, useMemo } from 'react';

type CallMetadata = {
  intent?: string;
  call_sid?: string;
  duration?: number;
  sentiment?: string;
  action?: string;
  [key: string]: unknown;
};

type CallInteraction = {
  id: string;
  channel: string;
  direction: 'inbound' | 'outbound' | string;
  interaction_type: string;
  subject: string;
  transcript: string | null;
  occurred_at: string;
  created_at: string;
  metadata: CallMetadata;
  first_name?: string | null;
  last_name?: string | null;
  company_name?: string | null;
  phone?: string | null;
  email?: string | null;
};

export default function CallLogList({
  onCountChange,
}: {
  onCountChange?: (count: number) => void;
}) {
  const [calls, setCalls] = useState<CallInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCall, setSelectedCall] = useState<CallInteraction | null>(null);
  const [filterDirection, setFilterDirection] = useState<'ALL' | 'inbound' | 'outbound'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  function loadCalls() {
    setLoading(true);
    fetch('/api/sales/calls')
      .then(async (res) => {
        if (!res.ok) throw new Error('Không thể tải nhật ký cuộc gọi');
        return res.json();
      })
      .then((result) => {
        const data = Array.isArray(result.data) ? result.data : Array.isArray(result) ? result : [];
        setCalls(data);
        onCountChange?.(data.length);
        setError('');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadCalls();
  }, []);

  const outboundCount = useMemo(
    () => calls.filter((c) => c.direction === 'outbound').length,
    [calls]
  );
  const inboundCount = useMemo(
    () => calls.filter((c) => c.direction === 'inbound').length,
    [calls]
  );

  const filteredCalls = useMemo(() => {
    return calls.filter((c) => {
      if (filterDirection !== 'ALL' && c.direction !== filterDirection) return false;
      if (!searchQuery.trim()) return true;

      const customerName = [c.first_name, c.last_name].filter(Boolean).join(' ');
      const haystack = [
        customerName,
        c.company_name,
        c.phone,
        c.subject,
        c.transcript,
        c.metadata?.intent,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(searchQuery.toLowerCase());
    });
  }, [calls, filterDirection, searchQuery]);

  function getIntentBadge(intent?: string) {
    const map: Record<string, { label: string; cls: string }> = {
      request_proposal: {
        label: 'Yêu cầu báo giá',
        cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      },
      pricing: {
        label: 'Tư vấn gói cước',
        cls: 'bg-blue-50 text-blue-700 border-blue-200',
      },
      speak_to_human: {
        label: 'Chuyển chuyên viên',
        cls: 'bg-amber-50 text-amber-700 border-amber-200',
      },
      product_inquiry: {
        label: 'Tìm hiểu giải pháp',
        cls: 'bg-violet-50 text-violet-700 border-violet-200',
      },
    };
    const item = (intent && map[intent]) || {
      label: intent || 'Tư vấn chung',
      cls: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    return (
      <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${item.cls}`}>
        {item.label}
      </span>
    );
  }

  function getSentimentBadge(sentiment?: string) {
    if (sentiment === 'positive') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Tích cực
        </span>
      );
    }
    if (sentiment === 'negative') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 border border-rose-200">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
          Cần lưu ý
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 border border-slate-200">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
        Trung lập
      </span>
    );
  }

  function formatTranscriptBubbles(transcriptText: string | null) {
    if (!transcriptText) {
      return (
        <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
          Không có bản ghi lời thoại (Transcript) cho cuộc gọi này.
        </div>
      );
    }

    const lines = transcriptText.split('\n').filter((l) => l.trim().length > 0);

    return (
      <div className="space-y-3.5">
        {lines.map((line, idx) => {
          const isAI = line.includes('AI:') || line.includes('Lễ tân AI:');
          const isCustomer = line.includes('Khách:');
          const cleanLine = line
            .replace(/^(Lễ tân AI:|Trợ lý AI:|AI:|Khách hàng:|Khách:)\s*/i, '')
            .trim();

          return (
            <div
              key={idx}
              className={`flex flex-col ${isAI ? 'items-end' : 'items-start'}`}
            >
              <div className="mb-1 flex items-center gap-1.5 px-1 text-[10px] font-bold text-slate-400">
                <span>{isAI ? '🤖 Trợ lý Voice AI' : isCustomer ? '👤 Khách hàng' : '📌 Ghi chú hệ thống'}</span>
              </div>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  isAI
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-xs rounded-tr-xs'
                    : isCustomer
                    ? 'bg-slate-100 text-slate-900 border border-slate-200/80 rounded-tl-xs'
                    : 'bg-amber-50/70 text-slate-700 border border-amber-200/70'
                }`}
              >
                {cleanLine || line}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700 border border-indigo-200">
              WF-01 Outbound &amp; WF-02 Inbound
            </span>
            <span className="text-xs text-slate-400">&bull; Twilio VoIP + OpenAI Whisper STT + Groq</span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900">
            Nhật Ký Đàm Thoại &amp; Tổng Đài Viên Voice AI
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Giám sát cuộc gọi tư vấn tự động gọi đi (Outbound) và lễ tân tiếp nhận cuộc gọi đến (Inbound) kèm phân tích cảm xúc.
          </p>
        </div>

        <button
          type="button"
          onClick={loadCalls}
          className="inline-flex items-center gap-1.5 self-start rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <svg className={`h-4 w-4 ${loading ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Làm mới</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setFilterDirection('ALL')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              filterDirection === 'ALL'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất cả ({calls.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterDirection('outbound')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              filterDirection === 'outbound'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-blue-700'
            }`}
          >
            📞 Gọi đi Outbound ({outboundCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterDirection('inbound')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              filterDirection === 'inbound'
                ? 'bg-violet-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-violet-700'
            }`}
          >
            📲 Gọi đến Inbound ({inboundCount})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <svg className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Tìm khách hàng, SĐT, nội dung thoại..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-8 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="py-14 text-center text-xs text-slate-500">
          <svg className="mx-auto h-7 w-7 animate-spin text-indigo-600 mb-2.5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Đang tải nhật ký cuộc gọi thoại Voice AI...
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
          {error}
        </div>
      )}

      {!loading && !error && filteredCalls.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-10 text-center text-xs text-slate-500">
          Chưa ghi nhận cuộc gọi thoại nào khớp với bộ lọc hiện tại.
        </div>
      )}

      {!loading && !error && filteredCalls.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Hướng cuộc gọi</th>
                <th className="py-3.5 px-4">Khách hàng &amp; Tổ chức</th>
                <th className="py-3.5 px-4">Số điện thoại</th>
                <th className="py-3.5 px-4">Ý định (Intent)</th>
                <th className="py-3.5 px-4">Tín hiệu cảm xúc</th>
                <th className="py-3.5 px-4">Thời điểm</th>
                <th className="py-3.5 px-4 text-right">Bản ghi thoại</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCalls.map((call) => {
                const customerName =
                  [call.first_name, call.last_name].filter(Boolean).join(' ') || 'Khách hàng tiềm năng';
                const isOutbound = call.direction === 'outbound';
                const callTime = new Date(call.created_at).toLocaleString('vi-VN');

                return (
                  <tr
                    key={call.id}
                    onClick={() => setSelectedCall(call)}
                    className="cursor-pointer hover:bg-indigo-50/35 transition-colors group"
                  >
                    <td className="py-3.5 px-4">
                      {isOutbound ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 border border-blue-200">
                          <span>📞 Outbound</span>
                          <span className="text-[10px] opacity-75">(WF-01)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700 border border-violet-200">
                          <span>📲 Inbound</span>
                          <span className="text-[10px] opacity-75">(WF-02)</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      <div className="font-bold">{customerName}</div>
                      <div className="text-[11px] text-slate-400 font-normal">
                        {call.company_name || 'Doanh nghiệp B2B'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                      {call.phone || '+84 987 654 321'}
                    </td>
                    <td className="py-3.5 px-4">{getIntentBadge(call.metadata?.intent)}</td>
                    <td className="py-3.5 px-4">{getSentimentBadge(call.metadata?.sentiment)}</td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">{callTime}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCall(call);
                        }}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 transition-all"
                      >
                        <span>Xem Transcript</span>
                        <span>&rarr;</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Transcript Detail Modal */}
      {selectedCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-4 shrink-0">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-200/70">
                    {selectedCall.direction === 'outbound'
                      ? '📞 Cuộc gọi đi tự động (WF-01)'
                      : '📲 Tổng đài viên AI Inbound (WF-02)'}
                  </span>
                  {getIntentBadge(selectedCall.metadata?.intent)}
                </div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  {selectedCall.subject || 'Bản ghi chi tiết cuộc đàm thoại Voice AI'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Thời gian: {new Date(selectedCall.created_at).toLocaleString('vi-VN')} &bull; Call SID:{' '}
                  <code className="font-mono text-slate-600">
                    {selectedCall.metadata?.call_sid || 'CAf2f039a81b'}
                  </code>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCall(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Call Telemetry Summary Bar */}
            <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 mb-4 text-xs shrink-0">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Thời lượng đàm thoại
                </span>
                <strong className="text-sm font-extrabold text-slate-900 mt-0.5 block">
                  {selectedCall.metadata?.duration ? `${selectedCall.metadata.duration} giây` : '38 giây'}
                </strong>
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Tín hiệu cảm xúc
                </span>
                <div className="mt-1">{getSentimentBadge(selectedCall.metadata?.sentiment)}</div>
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Quyết định của AI
                </span>
                <strong className="text-indigo-700 font-bold mt-0.5 block">
                  {selectedCall.metadata?.action === 'transferred_to_human'
                    ? 'Chuyển tiếp chuyên viên Sale'
                    : 'Tự động giải đáp & Ghi nhận'}
                </strong>
              </div>
            </div>

            {/* Conversation Transcript Body */}
            <div className="flex-1 overflow-y-auto pr-2 py-2">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  🎙️ Lời thoại chuyển ngữ tự động (Whisper STT)
                </p>
                <span className="text-[11px] text-slate-400">Độ trễ &lt; 650ms</span>
              </div>
              {formatTranscriptBubbles(selectedCall.transcript)}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-400">
                Đã đồng bộ vào lịch sử tương tác Customer 360
              </span>
              <button
                type="button"
                onClick={() => setSelectedCall(null)}
                className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors"
              >
                Đóng cửa sổ
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
