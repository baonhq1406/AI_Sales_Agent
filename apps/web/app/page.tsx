import Link from 'next/link';

export default function HomePage() {
  const workflows = [
    {
      id: 'WF-01 & WF-02',
      title: 'Voice AI Outbound & Inbound Receptionist',
      badge: 'Twilio VoIP • Whisper STT • Groq',
      color: 'from-indigo-600 to-blue-600',
      lightBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      description:
        'Tự động thực hiện cuộc gọi khảo sát nhu cầu (Outbound) và trực tổng đài thông minh 24/7 (Inbound), chuyển ngữ giọng nói thời gian thực và phân tích cảm xúc khách hàng.',
      highlights: [
        'Nhận diện ý định (Intent) & cảm xúc cuộc gọi tức thì',
        'Lưu trữ toàn bộ lời thoại (Transcript) vào hồ sơ Customer 360',
        'Tự động chuyển tiếp nhân viên khi gặp yêu cầu phức tạp',
      ],
      href: '/sales',
      cta: 'Xem Nhật ký Voice AI',
      icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z',
    },
    {
      id: 'WF-07 & WF-08',
      title: 'Omnichannel Lead Ingestion & Enrichment',
      badge: 'Idempotency • Honeypot • Auto-Triage',
      color: 'from-violet-600 to-purple-600',
      lightBg: 'bg-violet-50 text-violet-700 border-violet-200',
      description:
        'Thu thập khách hàng tiềm năng đa kênh từ Web Form, Email và API. Tự động chuẩn hóa dữ liệu, chống trùng lặp (Deduplication) và làm giàu hồ sơ doanh nghiệp.',
      highlights: [
        'Cơ chế khóa chống gửi trùng submissionId & chống spam bot',
        'Cấp mã tham chiếu (Correlation ID) đối soát thời gian thực',
        'Đồng bộ trực tiếp vào PostgreSQL & kích hoạt luồng phân loại',
      ],
      href: '/contact',
      cta: 'Trải nghiệm Cổng Tiếp nhận',
      icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    },
    {
      id: 'WF-03 & WF-13',
      title: 'Multi-Agent Orchestrator & AI Lead Scoring',
      badge: 'Llama 3.3 70B • pgvector RAG',
      color: 'from-amber-500 to-orange-600',
      lightBg: 'bg-amber-50 text-amber-700 border-amber-200',
      description:
        'Chấm điểm tiềm năng tự động trên thang 0–100, phân nhóm Hot / Warm / Cold, dự báo rủi ro rời bỏ (Churn Risk) và điều phối tác vụ cho các Sub-Agent chuyên biệt.',
      highlights: [
        'Đánh giá đa chiều dựa trên quy mô doanh nghiệp & mức độ tương tác',
        'Tổng hợp báo cáo Executive Insights tự động bằng AI',
        'Đề xuất hành động kế tiếp (Next Best Action) cho đội ngũ Sale',
      ],
      href: '/dashboard',
      cta: 'Mở Bảng Phân tích BI',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    },
    {
      id: 'WF-16 & WF-23',
      title: 'Human-in-the-Loop Quotation Approval',
      badge: 'Risk Control • Smart Governance',
      color: 'from-emerald-600 to-teal-600',
      lightBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      description:
        'Kiểm soát rủi ro thương mại thông minh: tự động phát hiện các đề xuất báo giá vượt trần chiết khấu, đính kèm khuyến nghị từ AI và trình Quản lý phê duyệt.',
      highlights: [
        'Đối chiếu tỷ lệ chiết khấu yêu cầu với hạn mức quy định',
        'Cung cấp đánh giá rủi ro tài chính từ AI trước khi duyệt',
        'Tự động hóa phát hành hợp đồng ngay sau khi xác nhận',
      ],
      href: '/sales',
      cta: 'Kiểm duyệt Báo giá',
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    },
  ];

  const quickStats = [
    {
      label: 'Tốc độ phản hồi Lead',
      value: '< 30s',
      hint: 'Tự động hóa 24/7 qua n8n',
      badge: 'Real-time SLA',
    },
    {
      label: 'Độ chính xác phân loại',
      value: '94.8%',
      hint: 'Groq Llama 3.3 70B Engine',
      badge: 'AI Scoring',
    },
    {
      label: 'Chuyển đổi Hot Lead',
      value: '+35%',
      hint: 'Ưu tiên chăm sóc theo điểm số',
      badge: 'Conversion',
    },
    {
      label: 'Quy trình vận hành',
      value: '24 WFs',
      hint: 'Đồng bộ Core API & PostgreSQL',
      badge: 'End-to-End',
    },
  ];

  const pipelineStages = [
    {
      step: '01',
      code: 'WF-07 / WF-08',
      title: 'Tiếp nhận & Làm giàu Lead',
      desc: 'Web Form, Voice, Email → Chuẩn hóa & khử trùng lặp vào PostgreSQL',
      status: 'Active',
      dotColor: 'bg-indigo-500',
    },
    {
      step: '02',
      code: 'WF-03 / WF-13',
      title: 'Điều phối & Chấm điểm AI',
      desc: 'Phân tích Intent, tính Lead Score (0–100) & đánh giá Churn Risk',
      status: 'Scoring',
      dotColor: 'bg-violet-500',
    },
    {
      step: '03',
      code: 'WF-01 / WF-02',
      title: 'Tương tác Đàm thoại Voice AI',
      desc: 'Gọi tự động Outbound & lễ tân Inbound qua Twilio + Whisper STT',
      status: 'Voice AI',
      dotColor: 'bg-blue-500',
    },
    {
      step: '04',
      code: 'WF-16 / WF-23',
      title: 'Phê duyệt Báo giá (HITL)',
      desc: 'Kiểm soát chiết khấu ngoại lệ & phát hành hợp đồng trên CRM',
      status: 'Governance',
      dotColor: 'bg-emerald-500',
    },
  ];

  return (
    <main className="relative overflow-hidden">
      {/* Subtle Background Grid & Glow */}
      <div className="absolute inset-0 -z-10 bg-grid-slate [mask-image:linear-gradient(to_bottom,white,rgba(255,255,255,0.2))]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 h-[520px] w-full max-w-7xl opacity-35 blur-3xl pointer-events-none">
        <div className="h-full w-full bg-gradient-to-tr from-indigo-300 via-violet-200 to-sky-200 rounded-full" />
      </div>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 pt-12 pb-16 sm:px-6 lg:px-8 lg:pt-20 lg:pb-24">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          {/* Left Hero Content */}
          <div className="lg:col-span-7 text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 shadow-2xs mb-6 backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Enterprise Customer 360 &amp; Autonomous AI Sales Platform</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-[52px] lg:leading-[1.12]">
              Tự động hóa chu trình bán hàng với{' '}
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 bg-clip-text text-transparent">
                Hệ sinh thái AI Đa Tác Tử
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-base sm:text-lg text-slate-600 leading-relaxed">
              Kết hợp sức mạnh điều phối của <strong>n8n Workflows</strong>, nền tảng <strong>NestJS Core API</strong>, cơ sở dữ liệu vector <strong>PostgreSQL</strong> và mô hình ngôn ngữ lớn <strong>Groq Llama 3.3</strong> để tiếp nhận, chấm điểm, gọi thoại tư vấn và phê duyệt báo giá trong một không gian làm việc duy nhất.
            </p>

            {/* Primary Action CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <Link
                href="/sales"
                className="inline-flex items-center gap-2.5 rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 hover:bg-indigo-600 transition-all"
              >
                <svg className="h-4 w-4 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Mở Sales CRM Workspace</span>
              </Link>

              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-400 transition-all"
              >
                <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Executive Analytics</span>
              </Link>

              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/70 px-5 py-3.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100/80 transition-all"
              >
                <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Gửi Lead Thử Nghiệm (WF-07)</span>
              </Link>
            </div>

            {/* Quick Demo Credentials Bar */}
            <div className="mt-8 rounded-2xl border border-slate-200/90 bg-white/90 p-4 shadow-xs backdrop-blur-sm max-w-xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-indigo-100 text-indigo-700 text-xs font-bold">
                    🔑
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Tài khoản Demo Phiên làm việc Sale
                  </span>
                </div>
                <Link
                  href="/login"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <span>Đăng nhập tự động</span>
                  <span>&rarr;</span>
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 border border-slate-200/60">
                  <span className="text-slate-500">Tài khoản:</span>
                  <code className="font-mono font-semibold text-slate-800">baonhq.24it@vku.udn.vn</code>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 border border-slate-200/60">
                  <span className="text-slate-500">Mật khẩu:</span>
                  <code className="font-mono font-semibold text-slate-800">DemoSales123!</code>
                </div>
              </div>
            </div>
          </div>

          {/* Right Hero: Live Autonomous Pipeline Architecture Card */}
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xl shadow-slate-200/60">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                    Real-time Orchestration
                  </span>
                  <h2 className="text-base font-bold text-slate-900 mt-0.5">
                    Luồng Xử Lý AI Đa Tác Tử Khép Kín
                  </h2>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  n8n + Core API
                </span>
              </div>

              <div className="space-y-3.5">
                {pipelineStages.map((stage, index) => (
                  <div
                    key={stage.step}
                    className="group relative rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3.5 hover:bg-white hover:border-indigo-200 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white shadow-2xs group-hover:bg-indigo-600 transition-colors">
                        {stage.step}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[11px] font-bold text-indigo-600">
                            {stage.code}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-200/80">
                            <span className={`h-1.5 w-1.5 rounded-full ${stage.dotColor}`} />
                            {stage.status}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-slate-900 mt-0.5">
                          {stage.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                          {stage.desc}
                        </p>
                      </div>
                    </div>
                    {index < pipelineStages.length - 1 && (
                      <div className="absolute -bottom-3 left-8 h-3 w-0.5 bg-slate-300" />
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Cơ sở dữ liệu: PostgreSQL 16 + pgvector</span>
                <span className="font-semibold text-slate-700">API Contract v1</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Metrics Bar */}
      <section className="border-y border-slate-200/80 bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {quickStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 hover:border-indigo-100 hover:bg-indigo-50/20 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                    {stat.badge}
                  </span>
                </div>
                <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm font-bold text-slate-800">{stat.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{stat.hint}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Workflows Showcase */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-indigo-700 border border-indigo-200/60">
            Kiến trúc Module Hóa
          </span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            4 Phân Hệ Cốt Lõi Trong Nền Tảng
          </h2>
          <p className="mt-3 text-base text-slate-600">
            Mỗi phân hệ kết nối trực tiếp với các Workflows tự động trên n8n và lưu trữ trạng thái nhất quán tại Core Database.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {workflows.map((wf) => (
            <div
              key={wf.id}
              className="group flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-7 shadow-xs hover:shadow-xl hover:border-indigo-300 transition-all duration-200"
            >
              <div>
                <div className="flex items-center justify-between gap-4 mb-5">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr ${wf.color} text-white shadow-md transition-transform group-hover:scale-105`}
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={wf.icon} />
                    </svg>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                      {wf.id}
                    </span>
                    <div className="mt-1.5">
                      <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${wf.lightBg}`}>
                        {wf.badge}
                      </span>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {wf.title}
                </h3>
                <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">
                  {wf.description}
                </p>

                <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                  {wf.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-slate-600">
                      <svg className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href={wf.href}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  <span>{wf.cta}</span>
                  <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
                <span className="text-[11px] text-slate-400 font-medium">Production Ready</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom Executive Banner */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 sm:p-12 text-white shadow-2xl">
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-indigo-600/30 blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300 border border-indigo-400/30 mb-4">
                Sẵn sàng kiểm thử &amp; vận hành thực tế
              </span>
              <h2 className="text-2xl font-extrabold sm:text-3xl tracking-tight">
                Khám phá không gian làm việc của AI Sales Agent
              </h2>
              <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
                Truy cập ngay vào Sales Workspace để quản lý danh sách khách hàng tiềm năng, nghe lại lịch sử đàm thoại Voice AI và phê duyệt các đề xuất báo giá vượt khung.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3.5 shrink-0">
              <Link
                href="/login"
                className="rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-slate-900 shadow-md hover:bg-indigo-50 transition-colors"
              >
                Đăng nhập Workspace
              </Link>
              <Link
                href="/contact"
                className="rounded-xl border border-slate-700 bg-slate-800/80 px-6 py-3.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
              >
                Gửi Lead Mới (WF-07)
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
