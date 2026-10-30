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
        {/* Standard Minimalist Website Footer */}
        <footer className="w-full bg-white border-t border-slate-200 mt-auto text-slate-600">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Cột 1: Giới thiệu Tổng quan Dự án (col-span-5) */}
              <div className="md:col-span-5 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white text-xs font-black shadow-xs">
                    AI
                  </div>
                  <span className="text-sm font-black tracking-tight text-slate-900">
                    AI Sales Agent Platform
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                    Hệ Thống Trực Tuyến
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed pr-4">
                  Hệ sinh thái tự động hóa quy trình bán hàng toàn diện, tích hợp tổng đài Voice AI đàm thoại hai chiều thời gian thực, kho tri thức vector pgvector và điều phối đa tác tử thông minh.
                </p>
                <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-emerald-700 font-semibold">Tất cả dịch vụ sẵn sàng</span>
                  </span>
                  <span>•</span>
                  <span>Đồ án Học kỳ 5 • VKU</span>
                </div>
              </div>

              {/* Cột 2: Giải Pháp Trọng Tâm (col-span-4) */}
              <div className="md:col-span-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Giải Pháp Cốt Lõi
                </p>
                <ul className="space-y-2 text-xs text-slate-500">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold shrink-0">▸</span>
                    <span><strong>Voice AI Telephony:</strong> Đàm thoại 2 chiều rảnh tay, giọng nói thật tự train &amp; Gemini TTS.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold shrink-0">▸</span>
                    <span><strong>RAG Knowledge Base:</strong> Tra cứu tài liệu và bảng giá theo ngữ nghĩa với pgvector.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold shrink-0">▸</span>
                    <span><strong>Multi-Agent &amp; HITL:</strong> Tự động chấm điểm lead, tạo báo giá và gửi quản lý duyệt.</span>
                  </li>
                </ul>
              </div>

              {/* Cột 3: Điều Hướng Nhanh (col-span-3) */}
              <div className="md:col-span-3 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Điều Hướng
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                  <Link href="/" className="hover:text-indigo-600 transition-colors">
                    Trang chủ
                  </Link>
                  <Link href="/sales" className="hover:text-indigo-600 transition-colors">
                    Sales Console
                  </Link>
                  <Link href="/dashboard" className="hover:text-indigo-600 transition-colors">
                    Báo cáo BI
                  </Link>
                  <Link href="/contact" className="hover:text-indigo-600 transition-colors">
                    Thu thập Lead
                  </Link>
                  <Link href="/login" className="hover:text-indigo-600 transition-colors">
                    Đăng nhập
                  </Link>
                </div>
                <div className="pt-2 text-[11px] text-slate-400">
                  <div>Phụ trách: <strong className="text-slate-700">Nguyễn Hữu Quốc Bảo</strong></div>
                  <div>Trường: <span className="text-slate-600">ĐH CNTT &amp; TT Việt - Hàn (VKU)</span></div>
                </div>
              </div>
            </div>

            {/* Dòng bản quyền chuẩn tối giản */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
              <p>
                &copy; 2026 AI Sales Agent Platform &bull; Đại học CNTT &amp; Truyền thông Việt - Hàn (VKU).
              </p>
              <p className="text-[11px] text-slate-400">
                Next.js 16 • NestJS • PostgreSQL 17 pgvector • n8n Multi-Agent
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
