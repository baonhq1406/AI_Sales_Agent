'use client';

import { useState } from 'react';

export default function AIInsights() {
  const [insights, setInsights] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function analyze() {
    if (loading) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/dashboard/insights', {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof result.error === 'string'
            ? result.error
            : 'Không thể phân tích dữ liệu qua AI'
        );
      }

      const content = result.data?.insights ?? result.insights;

      if (typeof content !== 'string' || !content.trim()) {
        throw new Error('AI không trả về nội dung phân tích');
      }

      setInsights(content);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Có lỗi xảy ra trong quá trình AI phân tích'
      );
    } finally {
      setLoading(false);
    }
  }

  function formatAIOutput(text: string) {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} className="h-2" />;

      if (trimmed.startsWith('### ') || trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
        const title = trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, '');
        return (
          <h4 key={idx} className="mt-4 mb-2 text-sm font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-600 inline-block" />
            {title}
          </h4>
        );
      }

      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const item = trimmed.replace(/^[-*]\s*/, '').replace(/\*\*/g, '');
        return (
          <div key={idx} className="flex items-start gap-2.5 my-1.5 text-sm text-slate-700">
            <span className="text-indigo-500 font-bold shrink-0 mt-0.5">•</span>
            <span>{item}</span>
          </div>
        );
      }

      return (
        <p key={idx} className="my-1.5 text-sm text-slate-600 leading-relaxed">
          {trimmed.replace(/\*\*/g, '')}
        </p>
      );
    });
  }

  return (
    <section className="mt-8 rounded-3xl border border-indigo-100 bg-gradient-to-b from-indigo-50/50 to-white p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
              Groq Llama 3.3 Engine
            </span>
            <span className="text-xs text-slate-400">&bull; Business Intelligence</span>
          </div>
          <h3 className="mt-2 text-xl font-bold tracking-tight text-slate-900">
            ✨ AI Executive Business Insights
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Tổng hợp dữ liệu bán hàng, phân tích xu hướng và đề xuất Next Best Actions cho toàn bộ đội ngũ Sale.
          </p>
        </div>

        <button
          type="button"
          onClick={analyze}
          disabled={loading}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 hover:from-indigo-700 hover:to-violet-700 transition-all disabled:opacity-50"
        >
          {loading ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>AI đang phân tích...</span>
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>{insights ? 'Phân tích lại' : 'Tạo đề xuất AI ngay'}</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700 flex items-center gap-2">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {insights && (
        <div className="mt-6 rounded-2xl border border-indigo-100 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="text-indigo-600">📋</span> Báo cáo Phân tích Chiến lược AI
            </h4>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
              Vừa cập nhật
            </span>
          </div>

          <div className="prose prose-sm max-w-none">
            {formatAIOutput(insights)}
          </div>
        </div>
      )}

      {!insights && !loading && !error && (
        <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-indigo-200 bg-white/70 py-10 px-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-3">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-700">Chưa tạo phân tích đề xuất</p>
          <p className="mt-1 text-xs text-slate-400 max-w-md">
            Bấm &ldquo;Tạo đề xuất AI ngay&rdquo; để hệ thống quét toàn bộ dữ liệu tương tác, tính toán rủi ro và sinh khuyến nghị hành động tối ưu cho đội ngũ kinh doanh.
          </p>
        </div>
      )}
    </section>
  );
}
