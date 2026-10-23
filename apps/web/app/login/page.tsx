'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<'sale' | 'admin' | null>(null);
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
    setSelectedPreset(type);
    if (type === 'sale') {
      setEmail('demo@ai-sales-agent.local');
      setPassword('DemoSales123!');
    } else {
      setEmail('baonhq.24it@vku.udn.vn');
      setPassword('DemoSales123!');
    }
    setError('');
  }

  return (
    <main className="relative flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10 bg-grid-slate [mask-image:radial-gradient(ellipse_at_center,white,transparent_80%)]" />

      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-md shadow-2xl shadow-slate-200/70 lg:grid-cols-12 animate-scale-in">
        {/* Left Column: Enterprise Security & Feature Panel */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between bg-slate-900 p-10 text-white relative overflow-hidden">
          <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-indigo-600/30 blur-3xl pointer-events-none animate-float-slow" />
          <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-violet-600/25 blur-3xl pointer-events-none animate-float-reverse" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300 border border-indigo-400/30 mb-5 animate-pulse-glow">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Multi-Agent Sales Platform</span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-950/60 p-2 shadow-xl mb-5 group">
              <img
                src="/images/hero-sales-ai.svg"
                alt="AI Sales Agent Architecture"
                className="w-full h-auto rounded-xl transition-transform duration-500 group-hover:scale-105"
              />
            </div>

            <div className="space-y-2">
              {[
                'Customer 360 & AI Lead Scoring (0–100)',
                'Voice AI Outbound đàm thoại hai chiều',
                'Phê duyệt Báo giá PDF tự động qua n8n',
              ].map((item, idx) => (
                <div key={item} className={`flex items-center gap-2.5 text-xs text-slate-300 animate-fade-in-up animation-delay-${(idx + 1) * 100}`}>
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                    ✓
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Bảo mật JWT HttpOnly</span>
            <span className="font-mono text-indigo-300">RBAC Safe</span>
          </div>
        </div>

        {/* Right Column: Login Form */}
        <div className="p-6 sm:p-10 lg:col-span-7 flex flex-col justify-center animate-fade-in-up">
          <div className="mb-6">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 mb-3 lg:hidden">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Đăng nhập Sales Workspace
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Sử dụng tài khoản nội bộ hoặc chọn nhanh tài khoản mẫu bên dưới để trải nghiệm.
            </p>
          </div>

          {/* Quick Demo Account Selector Cards */}
          <div className="mb-6 rounded-2xl border border-slate-200/90 bg-slate-50/70 p-3.5">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Chọn nhanh tài khoản Demo
              </span>
              <span className="text-[11px] text-indigo-600 font-semibold animate-pulse">
                ⚡ 1-Click Autofill
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => fillDemoCredentials('sale')}
                className={`flex items-center gap-3 rounded-xl border p-2.5 text-left transition-all card-hover ${
                  selectedPreset === 'sale'
                    ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-200 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-indigo-300'
                }`}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs">
                  SL
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">Sales Executive</p>
                  <p className="text-[10px] font-mono text-slate-500 truncate">demo@ai-sales-agent.local</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => fillDemoCredentials('admin')}
                className={`flex items-center gap-3 rounded-xl border p-2.5 text-left transition-all card-hover ${
                  selectedPreset === 'admin'
                    ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-200 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-indigo-300'
                }`}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700 font-bold text-xs">
                  AD
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">System Manager</p>
                  <p className="text-[10px] font-mono text-slate-500 truncate">baonhq.24it@vku.udn.vn</p>
                </div>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                Email công việc
              </label>
              <div className="relative">
                <svg className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setSelectedPreset(null);
                  }}
                  placeholder="ten@congty.com"
                  autoComplete="username"
                  className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                Mật khẩu
              </label>
              <div className="relative">
                <svg className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-16 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 rounded-md px-2 py-0.5 text-[11px] font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                >
                  {showPassword ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-center gap-2.5 rounded-xl bg-rose-50 p-3.5 text-xs font-semibold text-rose-700 border border-rose-200"
              >
                <svg className="h-4 w-4 shrink-0 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-600 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Đang xác thực phiên làm việc...</span>
                </>
              ) : (
                <>
                  <span>Truy cập Sales Workspace</span>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <Link href="/" className="hover:text-indigo-600 font-semibold transition-colors">
              ← Quay về trang chủ
            </Link>
            <Link href="/contact" className="hover:text-indigo-600 font-medium transition-colors">
              Gửi yêu cầu tư vấn (WF-07) &rarr;
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
