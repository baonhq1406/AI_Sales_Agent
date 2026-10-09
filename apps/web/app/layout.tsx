import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'AI Sales Agent | Nền tảng Bán Hàng & Chăm Sóc Khách Hàng 360',
  description: 'Hệ thống AI Sales Agent tự động hóa tiếp nhận khách hàng, chấm điểm tiềm năng, đề xuất báo giá và gọi điện tư vấn tích hợp n8n.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full scroll-smooth">
      <body className="flex min-h-screen flex-col bg-slate-50 text-slate-900 antialiased selection:bg-indigo-500 selection:text-white">
        <Navbar />
        <div className="flex-1">
          {children}
        </div>
        <footer className="border-t border-slate-200/80 bg-white py-6 text-center text-xs text-slate-500">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>AI Sales Agent Platform &bull; VKU Capstone Project</span>
            </p>
            <p className="text-slate-400">
              Microservices Architecture: Next.js + NestJS + PostgreSQL Vector + n8n Workflows + Groq Llama 3.3
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
