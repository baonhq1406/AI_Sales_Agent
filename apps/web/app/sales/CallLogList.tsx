'use client';

import { useEffect, useState } from 'react';

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
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadCalls();
  }, []);

  const filteredCalls = calls.filter((c) => {
    if (filterDirection === 'ALL') return true;
    return c.direction === filterDirection;
  });

  function getIntentBadge(intent?: string) {
    const map: Record<string, { label: string; cls: string }> = {
      request_proposal: { label: 'Yêu cầu báo giá', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      pricing: { label: 'Hỏi giá cước', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
      speak_to_human: { label: 'Yêu cầu gặp nhân viên', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
      product_inquiry: { label: 'Hỏi tính năng AI', cls: 'bg-violet-50 text-violet-700 border-violet-200' },
    };
    const item = (intent && map[intent]) || { label: intent || 'Chung', cls: 'bg-slate-100 text-slate-700 border-slate-200' };
    return <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${item.cls}`}>{item.label}</span>;
  }

  function getSentimentBadge(sentiment?: string) {
    if (sentiment === 'positive') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Tích cực
        </span>
      );
    }
    if (sentiment === 'negative') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600">
          <span className="h-2 w-2 rounded-full bg-rose-500" /> Tiêu cực
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
        <span className="h-2 w-2 rounded-full bg-slate-400" /> Trung lập
      </span>
    );
  }

  function formatTranscriptBubbles(transcriptText: string | null) {
    if (!transcriptText) {
      return <p className="text-slate-400 italic">Không có dữ liệu lời thoại cho cuộc gọi này.</p>;
    }

    const lines = transcriptText.split('\n').filter((l) => l.trim().length > 0);

    return (
      <div className="space-y-3">
        {lines.map((line, idx) => {
          const isAI = line.includes('AI:') || line.includes('Lễ tân AI:');
          const isCustomer = line.includes('Khách:');

          return (
            <div
              key={idx}
              className={`flex flex-col ${isAI ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                  isAI
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
                    : isCustomer
                    ? 'bg-slate-100 text-slate-900 border border-slate-200/80'
                    : 'bg-slate-50 text-slate-700 italic border border-slate-100'
                }`}
              >
                <div className="text-[10px] font-bold opacity-80 mb-1">
                  {isAI ? '🤖 Trợ lý Voice AI' : isCustomer ? '👤 Khách hàng' : 'Hệ thống'}
                </div>
                <div>{line}</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-200">
              WF-01 & WF-02 Voice AI Engine
            </span>
            <span className="text-xs text-slate-400">&bull; Twilio VoIP + Whisper STT + Groq</span>
          </div>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
            Bảng Nhật Ký Cuộc Gọi & Trả Lời Voice AI (Phần của Bảo)
          </h2>
          <p className="text-xs text-slate-500">
            Danh sách các cuộc gọi tự động gọi đi (Outbound) và tiếp nhận cuộc gọi đến (Inbound Receptionist) kèm toàn bộ lời thoại.
          </p>
        </div>

        <button
          type="button"
          onClick={loadCalls}
          className="flex items-center gap-1.5 self-start rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <svg className={`h-4 w-4 ${loading ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Làm mới</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilterDirection('ALL')}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            filterDirection === 'ALL'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Tất cả ({calls.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterDirection('outbound')}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            filterDirection === 'outbound'
              ? 'bg-blue-600 text-white'
              : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
          }`}
        >
          📞 Gọi đi (Outbound - WF-01)
        </button>
        <button
          type="button"
          onClick={() => setFilterDirection('inbound')}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            filterDirection === 'inbound'
              ? 'bg-purple-600 text-white'
              : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
          }`}
        >
          📲 Gọi đến (Inbound Receptionist - WF-02)
        </button>
      </div>

      {loading && (
        <div className="py-12 text-center text-xs text-slate-500">
          Đang nạp nhật ký cuộc gọi thoại Voice AI...
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700">
          {error}
        </div>
      )}

      {!loading && !error && filteredCalls.length === 0 && (
        <div className="rounded-xl bg-slate-50 p-8 text-center text-xs text-slate-500">
          Chưa ghi nhận cuộc gọi thoại nào trong bộ lọc này.
        </div>
      )}

      {!loading && !error && filteredCalls.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-200/80">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Loại cuộc gọi</th>
                <th className="py-3 px-4">Khách hàng & Doanh nghiệp</th>
                <th className="py-3 px-4">Số điện thoại</th>
                <th className="py-3 px-4">Ý định (Intent)</th>
                <th className="py-3 px-4">Cảm xúc</th>
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-4 text-right">Lời thoại (Transcript)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCalls.map((call) => {
                const customerName = [call.first_name, call.last_name].filter(Boolean).join(' ') || 'Bao Nguyen';
                const isOutbound = call.direction === 'outbound';
                const callTime = new Date(call.created_at).toLocaleString('vi-VN');

                return (
                  <tr
                    key={call.id}
                    onClick={() => setSelectedCall(call)}
                    className="cursor-pointer hover:bg-indigo-50/40 transition-colors group"
                  >
                    <td className="py-3.5 px-4">
                      {isOutbound ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 border border-blue-200">
                          📞 Gọi đi (WF-01)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-1 text-[11px] font-bold text-purple-700 border border-purple-200">
                          📲 Lễ tân AI (WF-02)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      <div>{customerName}</div>
                      <div className="text-[11px] text-slate-400 font-normal">{call.company_name || 'VKU Sales Corp'}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {call.phone || '+84987654321'}
                    </td>
                    <td className="py-3.5 px-4">
                      {getIntentBadge(call.metadata?.intent)}
                    </td>
                    <td className="py-3.5 px-4">
                      {getSentimentBadge(call.metadata?.sentiment)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {callTime}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCall(call);
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 transition-all shadow-2xs"
                      >
                        Đọc lời thoại &rarr;
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-4 shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                    {selectedCall.direction === 'outbound' ? 'Cuộc gọi đi WF-01' : 'Tổng đài viên Inbound WF-02'}
                  </span>
                  {getIntentBadge(selectedCall.metadata?.intent)}
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedCall.subject || 'Chi tiết cuộc đàm thoại Voice AI'}
                </h3>
                <p className="text-xs text-slate-400">
                  Thời gian: {new Date(selectedCall.created_at).toLocaleString('vi-VN')} &bull; SID: {selectedCall.metadata?.call_sid || 'CAf2f03...'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCall(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl mb-4 text-xs shrink-0">
              <div>
                <span className="text-slate-400 block">Thời lượng:</span>
                <strong className="text-slate-800">{selectedCall.metadata?.duration ? `${selectedCall.metadata.duration}s` : '35s'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Cảm xúc nhận diện:</span>
                <div>{getSentimentBadge(selectedCall.metadata?.sentiment)}</div>
              </div>
              <div>
                <span className="text-slate-400 block">Hành động AI:</span>
                <strong className="text-indigo-700">
                  {selectedCall.metadata?.action === 'transferred_to_human'
                    ? 'Chuyển nhân viên'
                    : 'Tự động giải đáp & Chốt đơn'}
                </strong>
              </div>
            </div>

            {/* Conversation Transcript Body */}
            <div className="flex-1 overflow-y-auto pr-2 py-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                🎙️ Toàn bộ nội dung đàm thoại (Whisper STT & Voice Response):
              </p>
              {formatTranscriptBubbles(selectedCall.transcript)}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedCall(null)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
