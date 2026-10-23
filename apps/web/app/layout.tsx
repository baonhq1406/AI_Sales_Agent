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
        {/* Standard Website Footer */}
        <footer className="w-full bg-white border-t border-slate-200 mt-auto text-slate-600">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Cột 1: Thông tin thương hiệu & Dự án */}
              <div className="space-y-3 md:col-span-1">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white text-xs font-black shadow-xs">
                    AI
                  </div>
                  <span className="text-sm font-black tracking-tight text-slate-900">
                    AI Sales Agent
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Nền tảng Quản trị Bán hàng Đa kênh &amp; Tổng đài Voice AI đàm thoại thời gian thực tích hợp kho tri thức pgvector.
                </p>
                <div className="pt-1 flex flex-col gap-1 text-[11px] text-slate-500">
                  <span><strong>Phụ trách:</strong> Nguyễn Hữu Quốc Bảo</span>
                  <span><strong>Học phần:</strong> Đồ án Học kỳ 5 VKU</span>
                </div>
              </div>

              {/* Cột 2: Danh sách 6 Workflow */}
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  6 Workflow Điều Hành
                </p>
                <ul className="space-y-1.5 text-xs text-slate-500">
                  <li><Link href="/sales" className="hover:text-indigo-600 transition-colors">WF-01: Voice AI Outbound Calling</Link></li>
                  <li><Link href="/sales" className="hover:text-indigo-600 transition-colors">WF-02: Inbound Receptionist &amp; RAG</Link></li>
                  <li><Link href="/sales" className="hover:text-indigo-600 transition-colors">WF-03: Nhạc Trưởng Điều Phối</Link></li>
                  <li><Link href="/sales" className="hover:text-indigo-600 transition-colors">WF-04: Tác Tử Tự Chủ Đa Năng</Link></li>
                  <li><Link href="/sales" className="hover:text-indigo-600 transition-colors">WF-05: Core REST API Gateway</Link></li>
                  <li><Link href="/sales" className="hover:text-indigo-600 transition-colors">WF-06: Twilio Voice &amp; STT/TTS</Link></li>
                </ul>
              </div>

              {/* Cột 3: Liên kết nhanh */}
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Liên Kết Nhanh
                </p>
                <ul className="space-y-1.5 text-xs text-slate-500">
                  <li><Link href="/" className="hover:text-indigo-600 transition-colors">Trang chủ Tổng quan</Link></li>
                  <li><Link href="/sales" className="hover:text-indigo-600 transition-colors">Bàn làm việc Sales Workspace</Link></li>
                  <li><Link href="/dashboard" className="hover:text-indigo-600 transition-colors">Phân tích Báo cáo BI</Link></li>
                  <li><Link href="/contact" className="hover:text-indigo-600 transition-colors">Gửi thông tin Lead Mẫu</Link></li>
                  <li><Link href="/login" className="hover:text-indigo-600 transition-colors">Đăng nhập tài khoản</Link></li>
                </ul>
              </div>

              {/* Cột 4: Công nghệ & Trạng thái */}
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Hạ Tầng Kỹ Thuật
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-mono text-slate-700 border border-slate-200">
                    Gemini 3.8 Flash TTS
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-mono text-slate-700 border border-slate-200">
                    PostgreSQL 17 pgvector
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-mono text-slate-700 border border-slate-200">
                    n8n Multi-Agent
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-mono text-slate-700 border border-slate-200">
                    NestJS + Next.js 16
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                    Giọng Tự Train Free 100%
                  </span>
                </div>
                <div className="pt-2 flex items-center gap-2 text-xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-700 font-medium">Hệ thống đang hoạt động ổn định</span>
                </div>
              </div>
            </div>

            {/* Dòng bản quyền chuẩn */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
              <p>
                &copy; 2026 AI Sales Agent Platform &bull; Đại học Công nghệ Thông tin &amp; Truyền thông Việt - Hàn (VKU).
              </p>
              <p className="text-[11px]">
                Thiết kế &amp; Triển khai bởi sinh viên Nguyễn Hữu Quốc Bảo
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
