'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const resJson = await response.json();

      if (!response.ok) {
        setError(resJson.error || 'Email hoặc mật khẩu không chính xác');
        return;
      }

      router.replace('/sales');
      router.refresh();
    } catch {
      setError('Không thể kết nối đến máy chủ xác thực');
    } finally {
      setLoading(false);
    }
  }

  function fillDemoCredentials(type: 'sale' | 'admin') {
    if (type === 'sale') {
      setEmail('demo@ai-sales-agent.local');
      setPassword('DemoSales123!');
    } else {
      setEmail('bao.admin@vku.udn.vn');
      setPassword('DemoSales123!');
    }
    setError('');
  }

  return (
    <main className="flex min-h-[calc(100vh-130px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card Header */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-8 shadow-xl shadow-slate-200/50">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Đăng nhập Sales Workspace
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Truy cập bảng điều khiển CRM, duyệt báo giá và quản lý Leads
            </p>
          </div>

          {/* Quick Demo Autofill Pills */}
          <div className="mb-6 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-3.5">
            <p className="text-xs font-semibold text-indigo-900 mb-2 flex items-center justify-between">
              <span>🚀 Tài khoản mẫu dùng nhanh:</span>
              <span className="text-[10px] text-indigo-600 font-normal">Click để tự điền</span>
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fillDemoCredentials('sale')}
                className="flex-1 rounded-xl bg-white px-2.5 py-1.5 text-xs font-semibold text-indigo-700 shadow-2xs border border-indigo-200 hover:bg-indigo-100/50 transition-colors"
              >
                👤 Demo Sales
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials('admin')}
                className="flex-1 rounded-xl bg-white px-2.5 py-1.5 text-xs font-semibold text-indigo-700 shadow-2xs border border-indigo-200 hover:bg-indigo-100/50 transition-colors"
              >
                🛡️ Bao Admin
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ten@congty.com"
                autoComplete="username"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Mật khẩu
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {error && (
              <div role="alert" className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-200">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-semibold text-white shadow-md shadow-indigo-500/25 hover:bg-indigo-700 hover:shadow-indigo-500/35 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Đang đăng nhập...</span>
                </>
              ) : (
                <span>Đăng nhập vào hệ thống</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            <Link href="/" className="hover:text-indigo-600 font-medium">
              ← Quay lại trang chủ
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
