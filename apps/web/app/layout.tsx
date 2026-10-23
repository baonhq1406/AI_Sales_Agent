import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import CustomCursor from '@/components/CustomCursor';
import AmbientBackground from '@/components/AmbientBackground';
import TopProgressBar from '@/components/TopProgressBar';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'AI Sales Agent | Nền tảng Quản trị Bán hàng & Chăm sóc Khách hàng 360',
  description:
    'Hệ thống AI Sales Agent tự động hóa tiếp nhận khách hàng đa kênh, chấm điểm tiềm năng, đàm thoại Voice AI và phê duyệt báo giá tích hợp n8n.',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full">
      <body className="flex min-h-screen flex-col bg-slate-50 text-slate-900 antialiased selection:bg-indigo-600 selection:text-white">
        <TopProgressBar />
        <AmbientBackground />
        <CustomCursor />
        <Navbar />
        <div className="flex-1">{children}</div>
        <footer className="w-full px-4 pb-6 pt-4 sm:px-6 lg:px-8 mt-auto">
          <div className="mx-auto max-w-7xl glass-panel rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs transition-all relative overflow-hidden">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between relative z-10">
              {/* Left Column: Brand & Architecture Stack */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-900 text-white text-[11px] font-black shadow-xs">
                    AI
                  </div>
                  <span className="text-xs font-black tracking-tight text-slate-900 uppercase">
                    AI Sales Agent &amp; Customer 360
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>System Active • WF-01..06</span>
                  </span>
                  <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200">
                    Phụ trách: Nguyễn Hữu Quốc Bảo
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-medium">
                  <span className="text-slate-600 font-semibold">Công nghệ:</span>
                  <span className="rounded-md bg-slate-100/90 px-2 py-0.5 font-mono text-[10px] text-slate-700 border border-slate-200/60">
                    Gemini 3.8 Flash TTS
                  </span>
                  <span className="text-slate-300">&bull;</span>
                  <span className="rounded-md bg-slate-100/90 px-2 py-0.5 font-mono text-[10px] text-slate-700 border border-slate-200/60">
                    PostgreSQL 17 pgvector
                  </span>
                  <span className="text-slate-300">&bull;</span>
                  <span className="rounded-md bg-slate-100/90 px-2 py-0.5 font-mono text-[10px] text-slate-700 border border-slate-200/60">
                    n8n Multi-Agent
                  </span>
                  <span className="text-slate-300">&bull;</span>
                  <span className="rounded-md bg-slate-100/90 px-2 py-0.5 font-mono text-[10px] text-slate-700 border border-slate-200/60">
                    NestJS Gateway
                  </span>
                </div>
              </div>

              {/* Right Column: Quick Navigation Dock */}
              <div className="flex flex-wrap items-center gap-1.5 self-start lg:self-center">
                <Link
                  href="/"
                  className="rounded-xl px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 hover:bg-slate-100/80 transition-all"
                >
                  Tổng quan
                </Link>
                <Link
                  href="/sales"
                  className="rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 bg-slate-100 border border-slate-200/80 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                >
                  Sales Workspace
                </Link>
                <Link
                  href="/dashboard"
                  className="rounded-xl px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 hover:bg-slate-100/80 transition-all"
                >
                  Analytics BI
                </Link>
                <Link
                  href="/contact"
                  className="rounded-xl px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 hover:bg-slate-100/80 transition-all"
                >
                  Gửi Lead Mẫu
                </Link>
              </div>
            </div>

            {/* Micro Academic Project Credit */}
            <div className="mt-4 pt-3.5 border-t border-slate-200/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px] text-slate-400">
              <p>
                &copy; 2026 AI Sales Agent Platform &bull; Đồ án Học kỳ 5 VKU (Đại học CNTT &amp; TT Việt - Hàn).
              </p>
              <div className="flex items-center gap-3 font-mono text-[10px] text-slate-500">
                <span>Response: &lt; 200ms</span>
                <span>&bull;</span>
                <span className="text-emerald-600 font-bold">100% Zero-Crash Architecture</span>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
