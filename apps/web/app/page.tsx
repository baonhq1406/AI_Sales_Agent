import Link from 'next/link';
import InteractiveAiConsole from '@/components/InteractiveAiConsole';
import InteractivePipelineFlow from '@/components/InteractivePipelineFlow';
import InteractiveBentoShowcase from '@/components/InteractiveBentoShowcase';
import { CloudStackIllustration } from '@/components/AnimatedIllustrations';

export default function HomePage() {
  const quickStats = [
    { label: 'Phản hồi Lead', value: '< 0.5s', hint: 'Voice AI Neural Studio', percent: 96, color: '#06b6d4' },
    { label: 'Độ chuẩn xác RAG', value: '98.4%', hint: '12 Chủ đề pgvector', percent: 98, color: '#6366f1' },
    { label: 'Tăng tỷ lệ chốt', value: '+35%', hint: 'Tập trung Hot Lead', percent: 85, color: '#a855f7' },
    { label: 'Tự động hóa', value: '100%', hint: 'Khép kín 24/7 tự động', percent: 100, color: '#10b981' },
  ];

  return (
    <main className="relative overflow-hidden">
      {/* Atmospheric Background Grid & Multi-Color Radial Aurora */}
      <div className="absolute inset-0 -z-10 bg-grid-slate [mask-image:linear-gradient(to_bottom,white,rgba(255,255,255,0.05))]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 h-[640px] w-full max-w-7xl bg-radial-glow pointer-events-none" />
      <div className="absolute top-28 -left-24 -z-10 h-80 w-80 rounded-full bg-indigo-400/15 blur-3xl animate-float-slow pointer-events-none" />
      <div className="absolute top-40 -right-24 -z-10 h-80 w-80 rounded-full bg-cyan-400/15 blur-3xl animate-float-reverse pointer-events-none" />

      {/* Hero Section: Open Editorial Typography + 3D Holographic Showcase */}
      <section className="mx-auto max-w-7xl px-4 pt-8 pb-16 sm:px-6 lg:px-8 lg:pt-14 lg:pb-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          {/* Left Hero: Open, Breathable, Zero Box Clutter */}
          <div className="lg:col-span-6 text-left animate-fade-in-up space-y-6">
            <div className="inline-flex items-center gap-2.5 rounded-full bg-indigo-500/10 px-4 py-1.5 text-xs font-bold text-indigo-700 ring-1 ring-indigo-500/20 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Hệ Thống AI Sales Agent • Voice AI &amp; pgvector RAG</span>
            </div>

            <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-[52px] lg:leading-[1.12]">
              Đàm thoại &amp; Chốt đơn tự động cùng{' '}
              <span className="bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-cyan-500 bg-clip-text text-transparent text-shimmer">
                Hệ Sinh Thái AI Đa Tác Tử
              </span>
            </h1>

            <p className="max-w-xl text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
              Tổng đài giọng nói AI hai chiều thời gian thực (giọng tiếp tân <strong className="text-slate-900">Trúc Ly</strong> &amp; giọng thần tượng <strong className="text-slate-900">Sơn Tùng M-TP, Jack (J97), Độ Mixi</strong>), tra cứu 12 chủ đề tri thức vector và điều phối báo giá tự động.
            </p>

            {/* Primary Action Pills */}
            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <Link
                href="/sales"
                className="btn-shimmer inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-slate-950 via-indigo-950 to-indigo-700 px-7 py-3.5 text-sm font-extrabold text-white shadow-xl shadow-indigo-600/25 hover:scale-105 transition-all"
              >
                <span>🎙️ Bắt Đầu Trải Nghiệm Voice AI</span>
                <span>&rarr;</span>
              </Link>

              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur-md px-5 py-3.5 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200/80 hover:text-indigo-600 hover:ring-indigo-300 transition-all card-hover"
              >
                <span>📊 Báo Cáo BI</span>
              </Link>

              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full bg-indigo-50/80 px-5 py-3.5 text-sm font-bold text-indigo-700 hover:bg-indigo-100 transition-all"
              >
                <span>⚡ Gửi Lead Thử</span>
              </Link>
            </div>

            {/* Professional Enterprise Demo Access */}
            <div className="pt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 font-bold">
                  ✓
                </span>
                <span className="font-semibold text-slate-700">Hệ thống sẵn sàng:</span>
                <span className="text-slate-600">Dùng thử đầy đủ CRM 360, Voice AI &amp; BI Dashboard</span>
              </div>
              <Link
                href="/login"
                className="font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 group"
              >
                <span>Đăng nhập Trải Nghiệm Doanh Nghiệp (1-Click)</span>
                <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
              </Link>
            </div>
          </div>

          {/* Right Hero: 3D Holographic Interactive Console */}
          <div className="lg:col-span-6 animate-scale-in">
            <InteractiveAiConsole />
          </div>
        </div>
      </section>

      {/* Animated Circular SVG Gauge Ribbon (Replaces plain text boxes) */}
      <section className="relative py-8 bg-gradient-to-r from-white/40 via-white/80 to-white/40 backdrop-blur-xl border-y border-white/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {quickStats.map((stat) => {
              const radius = 24;
              const circumference = 2 * Math.PI * radius;
              const offset = circumference - (stat.percent / 100) * circumference;
              return (
                <div
                  key={stat.label}
                  className="flex items-center gap-4 group cursor-default"
                >
                  {/* Animated Circular SVG Gauge */}
                  <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
                    <svg className="h-16 w-16 -rotate-90 transform" viewBox="0 0 60 60">
                      <circle
                        cx="30"
                        cy="30"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="4.5"
                        fill="transparent"
                        className="text-slate-200/70"
                      />
                      <circle
                        cx="30"
                        cy="30"
                        r={radius}
                        stroke={stat.color}
                        strokeWidth="4.5"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-1000 group-hover:scale-105"
                      />
                    </svg>
                    <span className="absolute h-2 w-2 rounded-full animate-ping" style={{ backgroundColor: stat.color }} />
                  </div>

                  <div>
                    <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono group-hover:text-indigo-600 transition-colors">
                      {stat.value}
                    </p>
                    <p className="text-xs font-extrabold text-slate-700">{stat.label}</p>
                    <p className="text-[11px] text-slate-400">{stat.hint}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interactive 4-Step Animated Visual Pipeline */}
      <section className="mx-auto max-w-7xl px-4 pt-14 pb-6 sm:px-6 lg:px-8">
        <InteractivePipelineFlow />
      </section>

      {/* Interactive Bento Showcase 3.0 with 3D Visuals */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <InteractiveBentoShowcase />
      </section>

      {/* Bottom Animated Vector Call to Action Banner */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 text-white shadow-2xl p-8 sm:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-3">
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-400">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                Live Cloud Deployment • Enterprise Production Architecture
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                Trải nghiệm trực tiếp Tổng đài Voice AI &amp; Tác Tử Bán Hàng
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Đàm thoại rảnh tay với Lễ tân Trúc Ly, giọng Sơn Tùng M-TP, Jack và theo dõi luồng tác tử bán hàng tự động ngay trên trình duyệt.
              </p>
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Link
                  href="/sales"
                  className="rounded-full bg-indigo-600 hover:bg-indigo-500 px-6 py-3 text-xs sm:text-sm font-extrabold text-white shadow-lg transition-all"
                >
                  🎙️ Vào Phòng Lab Voice AI &rarr;
                </Link>
                <Link
                  href="/login"
                  className="rounded-full bg-slate-800 hover:bg-slate-700 px-6 py-3 text-xs sm:text-sm font-bold text-white transition-all"
                >
                  Đăng nhập tài khoản
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6 rounded-2xl bg-slate-900/70 p-3">
              <CloudStackIllustration />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
