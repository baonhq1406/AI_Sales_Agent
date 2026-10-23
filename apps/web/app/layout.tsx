import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import CustomCursor from '@/components/CustomCursor';
import AmbientBackground from '@/components/AmbientBackground';
import TopProgressBar from '@/components/TopProgressBar';

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
    <html lang="vi" className="h-full scroll-smooth">
      <body className="flex min-h-screen flex-col bg-slate-50 text-slate-900 antialiased selection:bg-indigo-600 selection:text-white">
        <TopProgressBar />
        <AmbientBackground />
        <CustomCursor />
        <div className="flex-1">{children}</div>
        <footer className="border-t border-slate-200/80 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold tracking-wide text-slate-900 uppercase">
                    AI Sales Agent &amp; Customer 360 Platform
                  </span>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-600">
                    v2.4 Enterprise
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Kiến trúc Microservices: Next.js Portal &bull; NestJS Core Gateway &bull; PostgreSQL pgvector &bull; n8n Orchestrator &bull; Groq Llama 3.3
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600">
                <Link href="/" className="hover:text-indigo-600 transition-colors">
                  Tổng quan
                </Link>
                <span className="text-slate-300">&bull;</span>
                <Link href="/sales" className="hover:text-indigo-600 transition-colors">
                  Sales Workspace
                </Link>
                <span className="text-slate-300">&bull;</span>
                <Link href="/dashboard" className="hover:text-indigo-600 transition-colors">
                  Analytics BI
                </Link>
                <span className="text-slate-300">&bull;</span>
                <Link href="/contact" className="hover:text-indigo-600 transition-colors">
                  Cổng Tiếp nhận Lead (WF-07)
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
