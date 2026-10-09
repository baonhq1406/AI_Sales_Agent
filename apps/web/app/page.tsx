import Link from 'next/link';

export default function HomePage() {
  const workflows = [
    {
      id: 'WF-01',
      title: 'Voice AI Outbound & Inbound',
      badge: 'Twilio + Whisper + Groq',
      color: 'from-blue-500 to-indigo-600',
      description:
        'Tự động thực hiện cuộc gọi thoại tư vấn khách hàng tiềm năng, chuyển ngữ giọng nói thời gian thực và ghi nhận kết quả vào CRM.',
      icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z',
    },
    {
      id: 'WF-02',
      title: 'Lead Qualification & Scoring',
      badge: 'Customer 360 Analysis',
      color: 'from-amber-500 to-orange-600',
      description:
        'Chấm điểm tiềm năng Lead tự động (0 - 100 điểm), phân loại nhóm Hot / Warm / Cold và dự báo nguy cơ rời bỏ (Churn Risk).',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    },
    {
      id: 'WF-03',
      title: 'Multi-Agent Orchestrator',
      badge: 'Intent Router & Sub-Agents',
      color: 'from-violet-500 to-purple-600',
      description:
        'Phân loại ý định khách hàng từ tin nhắn/form web, tự động điều phối tác vụ đến các chuyên gia AI phù hợp và kích hoạt quy trình kế tiếp.',
      icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    },
    {
      id: 'WF-23',
      title: 'Human-in-the-Loop CRM',
      badge: 'Báo giá & Phê duyệt',
      color: 'from-emerald-500 to-teal-600',
      description:
        'Quy trình kiểm soát rủi ro thông minh: nhân viên Sale xem xét và phê duyệt hoặc từ chối các mức chiết khấu & hợp đồng báo giá từ AI.',
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    },
  ];

  const quickStats = [
    { label: 'Tốc độ phản hồi Lead', value: '< 30s', hint: 'Tự động 24/7' },
    { label: 'Độ chính xác phân loại', value: '94.8%', hint: 'Llama 3.3 Groq Engine' },
    { label: 'Tỷ lệ chuyển đổi Hot Lead', value: '+35%', hint: 'Tối ưu phễu bán hàng' },
    { label: 'Tự động hóa tác vụ', value: '100%', hint: 'Đồng bộ n8n Webhook' },
  ];

  return (
    <main className="relative overflow-hidden">
      {/* Background glowing gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 h-[500px] w-full max-w-7xl opacity-40 blur-3xl pointer-events-none">
        <div className="h-full w-full bg-gradient-to-tr from-indigo-300 via-violet-200 to-teal-200 rounded-full" />
      </div>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 pt-16 pb-20 sm:px-6 lg:px-8 lg:pt-24 lg:pb-28">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-indigo-50/80 px-4 py-1.5 text-xs font-semibold text-indigo-700 shadow-xs mb-8 backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
            Nền tảng Bán Hàng & Chăm Sóc Khách Hàng 360 Thông Minh
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl sm:leading-none">
            Tối ưu hóa doanh số với <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 bg-clip-text text-transparent">
              Hệ thống AI Sales Agent Đa Kênh
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 leading-relaxed">
            Tự động tiếp nhận nhu cầu, phân loại và chấm điểm khách hàng tiềm năng, thực hiện cuộc gọi thoại tương tác bằng giọng nói và hỗ trợ phê duyệt báo giá tức thì.
          </p>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/sales"
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 hover:shadow-indigo-500/35 transition-all"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Vào Sales Workspace</span>
            </Link>

            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-base font-semibold text-slate-700 shadow-xs hover:bg-slate-50 hover:border-slate-400 transition-all"
            >
              <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Xem Dashboard Analytics</span>
            </Link>

            <Link
              href="/contact"
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100/80 px-6 py-3.5 text-base font-medium text-slate-700 hover:bg-slate-200/80 transition-all"
            >
              <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>Gửi yêu cầu Lead</span>
            </Link>
          </div>

          {/* Quick Demo Credentials Info Card */}
          <div className="mx-auto mt-10 max-w-md rounded-xl border border-indigo-100 bg-white/80 p-4 shadow-sm backdrop-blur-sm text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">Tài khoản trải nghiệm mẫu</span>
              <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Đã kích hoạt</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
              <div>
                <p className="text-slate-400">Email:</p>
                <code className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded">demo@ai-sales-agent.local</code>
              </div>
              <div>
                <p className="text-slate-400">Mật khẩu:</p>
                <code className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded">DemoSales123!</code>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Metrics Bar */}
      <section className="border-y border-slate-200/70 bg-white/60 backdrop-blur-sm py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {quickStats.map((stat) => (
              <div key={stat.label} className="border-l-2 border-indigo-500 pl-4">
                <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{stat.value}</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">{stat.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{stat.hint}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Workflows Showcase */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600">Kiến trúc Tự động hóa</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            4 Trụ Cột Workflows Thông Minh
          </p>
          <p className="mt-4 text-base text-slate-600">
            Tất cả quy trình được vận hành đồng bộ giữa Next.js Portal, NestJS Core API, PostgreSQL Vector Database và n8n Automation Engine.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {workflows.map((wf) => (
            <div
              key={wf.id}
              className="group relative rounded-2xl border border-slate-200 bg-white p-8 shadow-xs hover:shadow-xl hover:border-indigo-300 transition-all duration-300"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr ${wf.color} text-white shadow-md group-hover:scale-110 transition-transform`}>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={wf.icon} />
                  </svg>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs font-bold text-slate-400 group-hover:text-indigo-600 transition-colors">
                    {wf.id}
                  </span>
                  <div className="mt-1 inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
                    {wf.badge}
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                {wf.title}
              </h3>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                {wf.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 p-8 sm:p-12 text-white shadow-2xl">
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-3xl font-extrabold sm:text-4xl">Sẵn sàng trải nghiệm AI Sales Agent?</h2>
            <p className="mt-4 text-indigo-100 text-sm sm:text-base leading-relaxed">
              Đăng nhập vào Sales Workspace để trải nghiệm quản lý danh sách khách hàng, hệ thống phê duyệt báo giá và xem phân tích doanh nghiệp tức thì.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/login"
                className="rounded-xl bg-white px-6 py-3 font-semibold text-indigo-900 shadow-md hover:bg-indigo-50 transition-colors"
              >
                Đăng nhập Workspace
              </Link>
              <Link
                href="/contact"
                className="rounded-xl border border-indigo-400/50 bg-indigo-800/40 px-6 py-3 font-semibold text-white hover:bg-indigo-800/80 transition-colors"
              >
                Thử nghiệm gửi Lead mới
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
