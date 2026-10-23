import type { Metadata } from 'next';
import Link from 'next/link';
import ContactForm from './ContactForm';

export const metadata: Metadata = {
  title: 'Cổng Tiếp nhận Nhu cầu & Lead Đa Kênh (WF-07) | AI Sales Agent',
  description: 'Gửi yêu cầu tư vấn hoặc báo giá. Yêu cầu được ghi nhận, khử trùng lặp và phân loại tự động qua n8n.',
};

export default function ContactPage() {
  return (
    <div className="relative min-h-[calc(100vh-140px)] overflow-hidden py-8 sm:py-12">
      <div className="absolute inset-0 -z-10 bg-grid-slate [mask-image:linear-gradient(to_bottom,white,rgba(255,255,255,0.3))]" />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
          {/* Left Column: Visual Ingestion Telemetry Hub */}
          <section className="lg:col-span-5 space-y-5 animate-fade-in">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 mb-3 animate-pulse-glow">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Cổng Tiếp Nhận Lead Đa Kênh • WF-07</span>
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl leading-tight">
                Tiếp nhận Nhu cầu &amp; Phân loại Lead Tức thì
              </h1>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Yêu cầu của bạn được tự động khử trùng lặp qua SHA-256, chuyển đổi thành vector embedding và đẩy trực tiếp vào Sales CRM Workspace trong 350ms.
              </p>
            </div>

            {/* Vivid Visual Image Illustration with Live Floating Channel Pills */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-slate-950 p-3 shadow-lg group">
              <img
                src="/images/omnichannel-funnel.svg"
                alt="Phễu tiếp nhận Lead đa kênh và khử trùng lặp"
                className="w-full h-auto rounded-2xl transition-transform duration-500 group-hover:scale-102"
              />

              {/* Floating Real-time Ingestion Channel Badges */}
              <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 backdrop-blur-md p-2 rounded-2xl border border-slate-700/60 text-[10px] font-mono text-slate-300">
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Email Inbound: 280ms
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                  Web Form: 150ms
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                  Hotline VoIP: 720ms
                </span>
              </div>
            </div>

            {/* Seamless Telemetry Ribbon HUD (No bulky duplicate boxes) */}
            <div className="rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-xs">
              <div className="grid grid-cols-3 divide-x divide-slate-100 text-center">
                <div className="px-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Tốc độ SLA</span>
                  <span className="font-mono text-base font-extrabold text-slate-900 mt-0.5 block">&lt; 350ms</span>
                  <span className="text-[10px] text-slate-500">n8n Engine</span>
                </div>
                <div className="px-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Bảo Mật</span>
                  <span className="font-mono text-base font-extrabold text-emerald-600 mt-0.5 block">100%</span>
                  <span className="text-[10px] text-slate-500">SHA-256 Anti-Spam</span>
                </div>
                <div className="px-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Lưu Trữ</span>
                  <span className="font-mono text-base font-extrabold text-indigo-600 mt-0.5 block">pgvector</span>
                  <span className="text-[10px] text-slate-500">PostgreSQL 17</span>
                </div>
              </div>

              <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">Dành cho chuyên viên kinh doanh:</span>
                <Link href="/sales" className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                  Vào Sales Workspace &rarr;
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
  );
}
