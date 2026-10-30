'use client';

import { useState } from 'react';

export default function QuickStartCard({
  onTabChange,
}: {
  onTabChange?: (tab: 'leads' | 'studio' | 'calls' | 'approvals') => void;
}) {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) {
    return (
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 shadow-2xs transition-all"
        >
          <span>💡</span>
          <span>Hiện hướng dẫn nhanh</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/60 via-white to-purple-50/40 p-3.5 shadow-2xs">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white text-xs font-bold shadow-2xs">
            💡
          </span>
          <span className="text-xs font-bold text-slate-900">
            3 Thao Tác Nhanh (100% Kết Nối Dữ Liệu Thật):
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/50 hover:text-slate-600 transition-colors"
          title="Ẩn hướng dẫn"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        <button
          type="button"
          onClick={() => onTabChange?.('leads')}
          className="flex items-center gap-2 rounded-xl border border-indigo-100 bg-white/90 p-2 text-left hover:border-indigo-300 hover:shadow-2xs transition-all"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 text-sm">
            📞
          </span>
          <div className="min-w-0">
            <p className="font-bold text-slate-900 truncate">1. Gọi Thoại AI</p>
            <p className="text-[10px] text-slate-500 truncate">Bấm chọn Lead để gọi n8n thật</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onTabChange?.('studio')}
          className="flex items-center gap-2 rounded-xl border border-purple-100 bg-white/90 p-2 text-left hover:border-purple-300 hover:shadow-2xs transition-all"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-700 text-sm">
            🎙️
          </span>
          <div className="min-w-0">
            <p className="font-bold text-slate-900 truncate">2. Thử Voice Studio</p>
            <p className="text-[10px] text-slate-500 truncate">Nghe thử 3 giọng AI &amp; Clone giọng</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onTabChange?.('approvals')}
          className="flex items-center gap-2 rounded-xl border border-amber-100 bg-white/90 p-2 text-left hover:border-amber-300 hover:shadow-2xs transition-all"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 text-sm">
            ⚖️
          </span>
          <div className="min-w-0">
            <p className="font-bold text-slate-900 truncate">3. Duyệt Báo Giá</p>
            <p className="text-[10px] text-slate-500 truncate">Phê duyệt chiết khấu 1-click HITL</p>
          </div>
        </button>
      </div>
    </div>
  );
}
