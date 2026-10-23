import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ContactForm from './ContactForm';

export const metadata: Metadata = {
  title: 'Cổng Tiếp nhận Nhu cầu & Lead Đa Kênh (WF-07) | AI Sales Agent',
  description: 'Gửi yêu cầu tư vấn hoặc báo giá. Yêu cầu được ghi nhận, khử trùng lặp và phân loại tự động qua n8n.',
};

export default function ContactPage() {
  const workflowSteps = [
    {
      step: '01',
      title: 'Ghi nhận & Cấp mã đối soát (Idempotency)',
      description:
        'Hệ thống sinh khóa chống trùng lặp tự động và trả về Mã tham chiếu (Correlation ID) ngay lập tức sau khi gửi.',
      badge: 'Node 01-03 • Webhook Ingest',
    },
    {
      step: '02',
      title: 'Phân loại Ý định & Chấm điểm AI (Lead Scoring)',
      description:
        'Mô hình ngôn ngữ lớn phân tích nội dung yêu cầu (Báo giá, Dùng thử, Kỹ thuật, Hợp tác) và đánh giá mức độ ưu tiên.',
      badge: 'WF-03 & WF-13 • AI Triage',
    },
    {
      step: '03',
      title: 'Phản hồi & Điều phối Chuyên viên',
      description:
        'Tự động đồng bộ vào Sales CRM Workspace và kích hoạt cuộc gọi/email phản hồi theo thông tin liên hệ đã đăng ký.',
      badge: 'Customer 360 Sync',
    },
  ];

  return (
    <>
      <Navbar />
      <div className="relative min-h-[calc(100vh-140px)] overflow-hidden py-10 sm:py-14">
      <div className="absolute inset-0 -z-10 bg-grid-slate [mask-image:linear-gradient(to_bottom,white,rgba(255,255,255,0.3))]" />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
          {/* Left Column: Workflow WF-07 Context & Architecture */}
          <section className="lg:col-span-5 space-y-6 animate-fade-in-up">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 mb-4 animate-pulse-glow">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
                <span>WF-07 • Omnichannel Lead Ingestion</span>
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl leading-tight">
                Cho chúng tôi biết nhu cầu doanh nghiệp của bạn
              </h1>
              <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
                Yêu cầu báo giá giải pháp, đăng ký dùng thử hệ thống AI Sales Agent, hỗ trợ kỹ thuật hay đề xuất hợp tác — tất cả đều được tiếp nhận và phân luồng tự động 24/7.
              </p>
            </div>

            {/* Vivid Visual Image Illustration */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-950 p-2 shadow-md group">
              <img
                src="/images/omnichannel-funnel.svg"
                alt="Phễu tiếp nhận Lead đa kênh và khử trùng lặp"
                className="w-full h-auto rounded-xl transition-transform duration-500 group-hover:scale-105"
              />
            </div>

            {/* 3 Crisp Feature Badges */}
            <div className="grid grid-cols-3 gap-2">
              <div className="spotlight-card rounded-xl border border-slate-200 bg-white p-2.5 text-center shadow-2xs">
                <span className="text-base block">⚡</span>
                <span className="text-xs font-bold text-slate-900 block mt-0.5">&lt; 350ms</span>
                <span className="text-[10px] text-slate-500">Xử lý n8n</span>
              </div>
              <div className="spotlight-card rounded-xl border border-slate-200 bg-white p-2.5 text-center shadow-2xs">
                <span className="text-base block">🛡️</span>
                <span className="text-xs font-bold text-slate-900 block mt-0.5">100% Khử Trùng</span>
                <span className="text-[10px] text-slate-500">Deduplication</span>
              </div>
              <div className="spotlight-card rounded-xl border border-slate-200 bg-white p-2.5 text-center shadow-2xs">
                <span className="text-base block">🐘</span>
                <span className="text-xs font-bold text-slate-900 block mt-0.5">pgvector 17</span>
                <span className="text-[10px] text-slate-500">Lưu trữ Vector</span>
              </div>
            </div>

            {/* SLA & Security Guarantee Box */}
            <div className="spotlight-card rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-white to-violet-50/60 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                  Cam kết vận hành &amp; Bảo mật
                </span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 animate-pulse">
                  Anti-Spam Protected
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-white p-2.5 border border-slate-200/60 hover:border-indigo-200 transition-colors">
                  <p className="text-base font-extrabold text-slate-900">&lt; 30s</p>
                  <p className="text-[11px] text-slate-500">Xử lý Webhook</p>
                </div>
                <div className="rounded-xl bg-white p-2.5 border border-slate-200/60 hover:border-indigo-200 transition-colors">
                  <p className="text-base font-extrabold text-slate-900">100%</p>
                  <p className="text-[11px] text-slate-500">Chống trùng lặp</p>
                </div>
                <div className="rounded-xl bg-white p-2.5 border border-slate-200/60 hover:border-indigo-200 transition-colors">
                  <p className="text-base font-extrabold text-slate-900">24/7</p>
                  <p className="text-[11px] text-slate-500">AI Phân loại</p>
                </div>
              </div>
              <div className="mt-3.5 pt-3 border-t border-indigo-100/80 flex items-center justify-between text-xs">
                <span className="text-slate-500">Bạn là chuyên viên kinh doanh?</span>
                <Link href="/sales" className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                  Kiểm tra Lead trên CRM &rarr;
                </Link>
              </div>
            </div>
          </section>

          {/* Right Column: Interactive Lead Ingestion Form */}
          <div className="lg:col-span-7 animate-scale-in">
            <ContactForm />
          </div>
        </div>
      </main>
    </div>
    </>
  );
}
