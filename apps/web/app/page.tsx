import Link from 'next/link';
import InteractiveAiConsole from '@/components/InteractiveAiConsole';
import InteractivePipelineFlow from '@/components/InteractivePipelineFlow';

export default function HomePage() {
  const visualModules = [
    {
      id: 'WF-01 & WF-02',
      title: 'Đàm Thoại Voice AI Hai Chiều',
      tag: 'Whisper v3 + ElevenLabs',
      tagColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      image: '/images/voice-ai-card.svg',
      alt: 'Minh họa Voice AI Outbound',
      features: ['Nhận diện ý định khách hàng', 'Transcript hội thoại tức thì', 'Tự động phát hiện cảm xúc'],
      href: '/sales',
      cta: 'Trải Nghiệm Voice AI',
    },
    {
      id: 'WF-03 & WF-13',
      title: 'Chấm Điểm & Customer 360',
      tag: 'Llama 3.3 70B AI',
      tagColor: 'bg-purple-50 text-purple-700 border-purple-200',
      image: '/images/scoring-radar.svg',
      alt: 'Minh họa AI Lead Scoring 95/100',
      features: ['Điểm Lead Score 0–100', 'Phân loại Hot / Warm / Cold', 'Dự báo rủi ro rời bỏ (Churn)'],
      href: '/dashboard',
      cta: 'Xem Báo Cáo BI',
    },
    {
      id: 'WF-07 & WF-08',
      title: 'Tiếp Nhận Lead Đa Kênh',
      tag: 'PostgreSQL pgvector',
      tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      image: '/images/omnichannel-funnel.svg',
      alt: 'Minh họa Phễu Ingestion đa kênh',
      features: ['Thu thập Web Form, Zalo, Call', 'Chống gửi trùng lặp tự động', 'Đồng bộ CRM trong 350ms'],
      href: '/contact',
      cta: 'Gửi Lead Mẫu Thử',
    },
    {
      id: 'WF-14 & WF-16',
      title: 'Báo Giá & Phê Duyệt HITL',
      tag: 'Human-in-the-Loop',
      tagColor: 'bg-amber-50 text-amber-800 border-amber-200',
      image: '/images/hitl-approval-shield.svg',
      alt: 'Minh họa Báo giá PDF và Phê duyệt',
      features: ['Tự động sinh Báo giá PDF', 'Kiểm soát mức chiết khấu', 'Phê duyệt 1-click qua Telegram'],
      href: '/sales',
      cta: 'Kiểm Duyệt Báo Giá',
    },
  ];

  const quickStats = [
    { label: 'Phản hồi Lead', value: '< 30s', hint: 'Tự động 24/7 qua n8n', badge: 'SLA' },
    { label: 'Độ chuẩn xác', value: '96.4%', hint: 'Llama 3.3 70B', badge: 'AI Engine' },
    { label: 'Tăng chốt đơn', value: '+35%', hint: 'Tập trung Hot Lead', badge: 'Hiệu quả' },
    { label: 'Workflows', value: '24 WFs', hint: 'Khép kín tự hành', badge: 'Hệ sinh thái' },
  ];

  return (
    <main className="relative overflow-hidden">
      {/* Background Grid & Atmospheric Glow */}
      <div className="absolute inset-0 -z-10 bg-grid-slate [mask-image:linear-gradient(to_bottom,white,rgba(255,255,255,0.1))]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 h-[560px] w-full max-w-7xl bg-radial-glow pointer-events-none" />

      {/* Hero Section: Clean, Punchy, High Impact */}
      <section className="mx-auto max-w-7xl px-4 pt-6 pb-14 sm:px-6 lg:px-8 lg:pt-12 lg:pb-18">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
          {/* Left Hero */}
          <div className="lg:col-span-6 text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-white/90 px-3 py-1 text-xs font-semibold text-indigo-700 shadow-2xs mb-4 backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>AI Sales Agent Tự Hành • n8n &amp; PostgreSQL pgvector</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-[48px] lg:leading-[1.14]">
              Tự động hóa bán hàng với{' '}
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-600 bg-clip-text text-transparent">
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
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300/90 bg-white px-4 py-3 text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all"
              >
                <span>📊 Báo Cáo BI</span>
              </Link>

              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/70 px-4 py-3 text-xs sm:text-sm font-semibold text-indigo-700 hover:bg-indigo-100 transition-all"
              >
                <span>+ Gửi Lead Thử (WF-07)</span>
              </Link>
            </div>

            {/* Compact 1-Click Credential Bar */}
            <div className="mt-6 rounded-2xl border border-slate-200/90 bg-white/90 p-3 shadow-2xs backdrop-blur-sm max-w-md">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <span>🔑</span>
                  <span>Tài khoản Quản trị Demo</span>
                </span>
                <Link
                  href="/login"
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <span>Vào Đăng Nhập &rarr;</span>
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-slate-50 px-2.5 py-1 border border-slate-200/60">
                  <span className="text-slate-400 text-[10px] block">Email:</span>
                  <code className="font-mono font-bold text-slate-800 text-[11px]">baonhq.24it@vku.udn.vn</code>
                </div>
                <div className="rounded-lg bg-slate-50 px-2.5 py-1 border border-slate-200/60">
                  <span className="text-slate-400 text-[10px] block">Mật khẩu:</span>
                  <code className="font-mono font-bold text-slate-800 text-[11px]">DemoSales123!</code>
                </div>
              </div>
            </div>
          </div>

          {/* Right Hero: Live Interactive Animated AI Console */}
          <div className="lg:col-span-6">
            <InteractiveAiConsole />
          </div>
        </div>
      </section>

      {/* Quick Visual Metrics Bar */}
      <section className="border-y border-slate-200/80 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {quickStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 hover:border-indigo-100 hover:bg-indigo-50/20 transition-colors"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                    {stat.badge}
                  </span>
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {stat.value}
                </p>
                <p className="mt-0.5 text-xs font-bold text-slate-800">{stat.label}</p>
                <p className="text-[11px] text-slate-400">{stat.hint}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive 4-Step Animated Pipeline Funnel */}
      <section className="mx-auto max-w-7xl px-4 pt-12 pb-6 sm:px-6 lg:px-8">
        <InteractivePipelineFlow />
      </section>

      {/* Visual Illustrated Modules Showcase (Minimal Text, Vivid Images) */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-indigo-700 border border-indigo-200/60">
            Trực Quan Hóa 4 Phân Hệ
          </span>
          <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Xem Nhanh 4 Tính Năng Cốt Lõi
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Hình ảnh mô phỏng trực tiếp từ cơ sở dữ liệu và các tác tử tự động hóa.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {visualModules.map((m) => (
            <div
              key={m.id}
              className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xs hover:shadow-xl hover:border-indigo-300 transition-all duration-300 card-hover"
            >
              {/* Vivid Visual Image Illustration */}
              <div className="relative overflow-hidden bg-slate-950 p-2 border-b border-slate-100">
                <img
                  src={m.image}
                  alt={m.alt}
                  className="w-full h-auto rounded-2xl transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>

              {/* Minimal Text & Feature Chips */}
              <div className="p-6">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                    {m.id}
                  </span>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${m.tagColor}`}>
                    {m.tag}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {m.title}
                </h3>

                {/* 3 Concise Feature Chips */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {m.features.map((feat) => (
                    <span
                      key={feat}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 border border-slate-200/80"
                    >
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span>{feat}</span>
                    </span>
                  ))}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    href={m.href}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    <span>{m.cta}</span>
                    <span>&rarr;</span>
                  </Link>
                  <span className="text-[10px] text-slate-400 font-medium">Ready</span>
                </div>
              </div>
            </div>
          ))}
        </div>
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
  );
}
