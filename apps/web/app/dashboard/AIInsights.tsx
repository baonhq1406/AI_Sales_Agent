'use client';

import { useState } from 'react';

export default function AIInsights() {
  const [insights, setInsights] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

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

  async function copyInsights() {
    if (!insights) return;
    try {
      await navigator.clipboard.writeText(insights);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard errors
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
          <h4
            key={idx}
            className="mt-5 mb-2.5 text-xs font-extrabold uppercase tracking-wider text-indigo-950 flex items-center gap-2 bg-indigo-50/70 px-3 py-1.5 rounded-lg border border-indigo-100"
          >
            <span className="h-2 w-2 rounded-full bg-indigo-600 inline-block" />
            <span>{title}</span>
          </h4>
        );
      }

      if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\.\s/.test(trimmed)) {
        const item = trimmed.replace(/^([-*]|\d+\.)\s*/, '').replace(/\*\*/g, '');
        return (
          <div key={idx} className="flex items-start gap-2.5 my-2 text-xs sm:text-sm text-slate-700 pl-1">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
            <span className="leading-relaxed">{item}</span>
          </div>
        );
      }

      return (
        <p key={idx} className="my-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
          {trimmed.replace(/\*\*/g, '')}
        </p>
      );
    });
  }

  return (
    <section className="rounded-3xl border border-indigo-200/80 bg-gradient-to-b from-indigo-50/40 via-white to-white p-6 sm:p-8 shadow-xs">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-bold text-indigo-800">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
              Groq Llama 3.3 70B Engine
            </span>
            <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200">
              Executive Decision Support
            </span>
          </div>
          <h3 className="text-xl font-extrabold tracking-tight text-slate-900">
            AI Executive Business Insights &amp; Next Best Actions
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Tổng hợp dữ liệu thời gian thực từ PostgreSQL, phân tích điểm nghẽn phễu chuyển đổi và đề xuất hành động ưu tiên cho đội ngũ Sale.
          </p>
        </div>

        <button
          type="button"
          onClick={analyze}
          disabled={loading}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-indigo-500/20 hover:from-indigo-700 hover:to-violet-700 transition-all disabled:opacity-60"
        >
          {loading ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Đang tổng hợp báo cáo AI...</span>
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>{insights ? 'Phân tích lại dữ liệu mới' : 'Khởi tạo Báo cáo Chiến lược AI'}</span>
            </>
          )}
        </button>
      </div>

      {loading && (
        <div className="mt-6 rounded-2xl border border-indigo-100 bg-white p-6 space-y-3">
          <div className="h-4 w-56 rounded animate-shimmer" />
          <div className="h-3 w-full rounded animate-shimmer" />
          <div className="h-3 w-11/12 rounded animate-shimmer" />
          <div className="h-3 w-4/5 rounded animate-shimmer" />
        </div>
      )}

      {error && (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 flex items-center gap-2.5">
          <svg className="h-4 w-4 shrink-0 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {insights && !loading && (
        <div className="mt-6 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3.5 mb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 text-sm">
                📊
              </span>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">
                  Báo cáo Phân tích Chiến lược &amp; Khuyến nghị Hành động
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                Vừa cập nhật
              </span>
              <button
                type="button"
                onClick={copyInsights}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                {copied ? 'Đã sao chép' : 'Sao chép báo cáo'}
              </button>
            </div>
          </div>

          <div className="max-w-none">{formatAIOutput(insights)}</div>
        </div>
      )}

      {!insights && !loading && !error && (
        <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-indigo-200 bg-white/80 py-10 px-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-3 border border-indigo-100">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <p className="text-sm font-bold text-slate-800">
            Sẵn sàng khởi tạo phân tích chiến lược bằng AI
          </p>
          <p className="mt-1 text-xs text-slate-500 max-w-lg leading-relaxed">
            Nhấn <strong>&ldquo;Khởi tạo Báo cáo Chiến lược AI&rdquo;</strong> để mô hình Llama 3.3 quét toàn bộ dữ liệu phễu khách hàng, đánh giá rủi ro rời bỏ và đề xuất hành động ưu tiên.
          </p>
        </div>
      )}
    </section>
  );
}
