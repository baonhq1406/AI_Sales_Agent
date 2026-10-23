import Link from 'next/link';
import Navbar from '@/components/Navbar';
import InteractiveAiConsole from '@/components/InteractiveAiConsole';
import InteractivePipelineFlow from '@/components/InteractivePipelineFlow';
import InteractiveBentoShowcase from '@/components/InteractiveBentoShowcase';

export default function HomePage() {
  const quickStats = [
    { label: 'Phản hồi Lead', value: '< 30s', hint: 'Tự động 24/7 qua n8n', badge: 'SLA' },
    { label: 'Độ chuẩn xác', value: '96.4%', hint: 'Llama 3.3 70B', badge: 'AI Engine' },
    { label: 'Tăng chốt đơn', value: '+35%', hint: 'Tập trung Hot Lead', badge: 'Hiệu quả' },
    { label: 'Workflows', value: '24 WFs', hint: 'Khép kín tự hành', badge: 'Hệ sinh thái' },
  ];

  return (
    <>
      <Navbar />
      <main className="relative overflow-hidden">
      {/* Background Grid & Atmospheric Glow */}
      <div className="absolute inset-0 -z-10 bg-grid-slate [mask-image:linear-gradient(to_bottom,white,rgba(255,255,255,0.1))]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 h-[560px] w-full max-w-7xl bg-radial-glow pointer-events-none" />

      {/* Hero Section: Clean, Punchy, High Impact */}
      <section className="mx-auto max-w-7xl px-4 pt-6 pb-14 sm:px-6 lg:px-8 lg:pt-12 lg:pb-18">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
          {/* Left Hero */}
          <div className="lg:col-span-6 text-left animate-fade-in-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-white/90 px-3 py-1 text-xs font-semibold text-indigo-700 shadow-2xs mb-4 backdrop-blur-md animate-pulse-glow">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>AI Sales Agent Tự Hành • n8n &amp; PostgreSQL pgvector</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-[48px] lg:leading-[1.14]">
              Tự động hóa bán hàng với{' '}
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-600 bg-clip-text text-transparent animate-gradient-shift">
                Hệ Sinh Thái AI Đa Tác Tử
              </span>
            </h1>

            <p className="mt-3.5 max-w-lg text-base text-slate-600 leading-relaxed">
              Tiếp nhận khách hàng đa kênh, gọi điện thoại tư vấn AI và tự động sinh báo giá chuẩn xác trong tích tắc.
            </p>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/sales"
                className="btn-shimmer inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-slate-950/20 hover:bg-indigo-600 transition-all card-hover"
              >
                <span>Mở Sales Workspace</span>
                <span>&rarr;</span>
              </Link>

              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300/90 bg-white px-4 py-3 text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all card-hover"
              >
                <span>📊 Báo Cáo BI</span>
              </Link>

              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/70 px-4 py-3 text-xs sm:text-sm font-semibold text-indigo-700 hover:bg-indigo-100 transition-all card-hover"
              >
                <span>+ Gửi Lead Thử (WF-07)</span>
              </Link>
            </div>

            {/* Compact 1-Click Credential Bar */}
            <div className="mt-6 rounded-2xl border border-slate-200/90 bg-white/90 p-3 shadow-2xs backdrop-blur-sm max-w-md spotlight-card">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <span>🔑</span>
                  <span>Tài khoản Quản trị Demo</span>
                </span>
                <Link
                  href="/login"
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group"
                >
                  <span>Vào Đăng Nhập</span>
                  <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-slate-50 px-2.5 py-1 border border-slate-200/60 hover:bg-indigo-50/40 hover:border-indigo-200 transition-colors">
                  <span className="text-slate-400 text-[10px] block">Email:</span>
                  <code className="font-mono font-bold text-slate-800 text-[11px]">baonhq.24it@vku.udn.vn</code>
                </div>
                <div className="rounded-lg bg-slate-50 px-2.5 py-1 border border-slate-200/60 hover:bg-indigo-50/40 hover:border-indigo-200 transition-colors">
                  <span className="text-slate-400 text-[10px] block">Mật khẩu:</span>
                  <code className="font-mono font-bold text-slate-800 text-[11px]">DemoSales123!</code>
                </div>
              </div>
            </div>
          </div>

          {/* Right Hero: Live Interactive Animated AI Console */}
          <div className="lg:col-span-6 animate-scale-in">
            <InteractiveAiConsole />
          </div>
        </div>
      </section>

      {/* Telemetry HUD Ribbon (Unified metrics without clunky border boxes) */}
      <section className="border-y border-slate-200/80 bg-white/70 backdrop-blur-md py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-200/80">
            {quickStats.map((stat) => (
              <div
                key={stat.label}
                className="py-3 px-4 sm:px-6 flex items-center justify-between gap-4 transition-all hover:bg-slate-50/60 rounded-xl"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      {stat.badge}
                    </span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
                    {stat.value}
                  </p>
                  <p className="text-xs font-semibold text-slate-700 mt-0.5">{stat.label}</p>
                </div>
                <div className="text-right hidden sm:block">
                  <span className="text-[11px] text-slate-400 leading-tight block max-w-[90px]">
                    {stat.hint}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive 4-Step Animated Pipeline Funnel */}
      <section className="mx-auto max-w-7xl px-4 pt-12 pb-6 sm:px-6 lg:px-8">
        <InteractivePipelineFlow />
      </section>

      {/* Interactive Bento Showcase 2.0 (Living Micro-Apps, Zero Generic Rectangles) */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <InteractiveBentoShowcase />
      </section>

      {/* Bottom Minimalist Call to Action */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 sm:p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-600/30 blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-xl">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Bắt đầu trải nghiệm AI Sales Agent
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-300">
              Đăng nhập để xem danh sách khách hàng Customer 360, nghe bản ghi Voice AI và kiểm duyệt báo giá ngay.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-3 shrink-0">
            <Link
              href="/login"
              className="rounded-xl bg-white px-5 py-3 text-xs font-bold text-slate-900 shadow-md hover:bg-indigo-50 transition-colors"
            >
              Đăng nhập ngay
            </Link>
            <Link
              href="/sales"
              className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 text-xs font-bold text-white hover:bg-slate-700 transition-colors"
            >
              Xem Workspace &rarr;
            </Link>
          </div>
        </div>
      </section>
    </main>
    </>
  );
}
