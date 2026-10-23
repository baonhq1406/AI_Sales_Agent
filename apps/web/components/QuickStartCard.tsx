'use client';

import { useState } from 'react';

export default function QuickStartCard() {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50/80 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-all shadow-2xs"
      >
        <span>💡</span>
        <span>Mở Hướng dẫn 30 giây để bắt đầu</span>
      </button>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-white to-violet-50/50 p-5 shadow-xs">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-xs">
            💡
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight">
              Hướng dẫn nhanh 30 giây: Sử dụng hệ thống thật dễ dàng
            </h3>
            <p className="text-[11px] text-slate-500">
              Dự án kết nối dữ liệu thật 100% qua PostgreSQL + NestJS Core API + n8n Workflows.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 transition-colors"
          title="Thu gọn hướng dẫn"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="rounded-2xl border border-white/80 bg-white/90 p-3.5 shadow-2xs">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-[11px]">
              1
            </span>
            <span>Chọn Khách hàng &amp; Gọi AI</span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500 leading-relaxed">
            Trong tab <strong>Khách hàng CRM</strong>, bấm vào hồ sơ có điểm cao (ví dụ: Trần Văn An) rồi bấm nút <strong className="text-indigo-600">📞 Gọi Thoại AI (WF-01)</strong>. AI sẽ đàm thoại và phát âm thanh thật.
          </p>
        </div>

        <div className="rounded-2xl border border-white/80 bg-white/90 p-3.5 shadow-2xs">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-[11px]">
              2
            </span>
            <span>Trải nghiệm Studio Voice AI</span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500 leading-relaxed">
            Mở tab <strong>Studio Voice AI</strong> để thử nghiệm 3 giọng nói AI tự nhiên (Hoài My, Nam Minh, Linh San) hoặc bật Micro để <strong>tự Clone giọng nói cá nhân của bạn</strong> hoàn toàn miễn phí.
          </p>
        </div>

        <div className="rounded-2xl border border-white/80 bg-white/90 p-3.5 shadow-2xs">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-[11px]">
              3
            </span>
            <span>Duyệt Báo giá &amp; Xem Thống kê</span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500 leading-relaxed">
            Mở tab <strong>Phê duyệt Báo giá</strong> để Chấp thuận đề xuất chiết khấu ngoại lệ, sau đó mở <strong className="text-indigo-600">Analytics BI</strong> để xem Gemini phân tích số liệu PostgreSQL trực tiếp.
          </p>
        </div>
      </div>
    </div>
  );
}
