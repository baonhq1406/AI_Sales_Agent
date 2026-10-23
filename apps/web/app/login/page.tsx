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

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sale-auth-changed', { detail: resJson.user }));
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
      <div className="absolute top-1/4 left-1/4 -z-10 h-96 w-96 rounded-full bg-indigo-500/15 blur-3xl animate-float-slow pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-96 w-96 rounded-full bg-cyan-500/15 blur-3xl animate-float-reverse pointer-events-none" />

      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-[2.5rem] bg-white/90 backdrop-blur-2xl shadow-[0_32px_80px_-20px_rgba(15,23,42,0.22)] ring-1 ring-white lg:grid-cols-12 animate-scale-in">
        {/* Left Column: Full-Bleed 3D Holographic Visual Showcase */}
        <div className="hidden lg:flex lg:col-span-6 flex-col justify-between bg-slate-950 p-10 text-white relative overflow-hidden visual-showcase">
          <img
            src="/images/ai-voice-hero.jpg"
            alt="AI Voice Sales Agent 3D"
            className="absolute inset-0 h-full w-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/60" />

          {/* Animated Orbital Sonic Rings */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-64 w-64 rounded-full border border-cyan-400/25 animate-orbit" />
            <div className="absolute h-80 w-80 rounded-full border border-dashed border-fuchsia-400/20 animate-orbit-reverse" />
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-950/75 backdrop-blur-md px-3.5 py-1.5 text-xs font-bold text-cyan-300 ring-1 ring-cyan-400/30">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span>VieNeu-TTS 24kHz • pgvector RAG</span>
            </div>
          </div>

          <div className="relative z-10 space-y-4">
            <h2 className="text-2xl font-black tracking-tight text-white drop-shadow-md leading-snug">
              Trải nghiệm Tổng Đài Voice AI &amp; Hệ Sinh Thái 6 Workflows
            </h2>
            <p className="text-xs text-slate-200 leading-relaxed">
              Đàm thoại trực tiếp với giọng nữ lễ tân <strong className="text-cyan-300">Trúc Ly</strong>, giọng <strong className="text-indigo-300">Bảo Clone</strong> chính chủ và điều phối đa tác tử tự động hóa bán hàng.
            </p>
            <div className="pt-2 flex items-center gap-4 text-[11px] font-mono text-cyan-300">
              <span>● JWT HttpOnly</span>
              <span>● 12 RAG Topics</span>
              <span>● RBAC Safe</span>
            </div>
          </div>
        </div>

        {/* Right Column: Clean Open Login Form */}
        <div className="p-7 sm:p-10 lg:col-span-6 flex flex-col justify-center animate-fade-in-up">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Chào mừng trở lại
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Chọn nhanh tài khoản mẫu 1-Click bên dưới để vào thẳng Phòng Lab Voice AI.
            </p>
          </div>

          {/* Sleek Floating Pill Selector (Zero Boxy Wrapper) */}
          <div className="mb-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                ⚡ Tự động điền 1-Click
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => fillDemoCredentials('admin')}
                className={`flex items-center gap-3 rounded-2xl p-3 text-left transition-all card-hover ${
                  selectedPreset === 'admin'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'bg-slate-100/80 hover:bg-indigo-50/70 text-slate-900'
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-black text-xs ${
                    selectedPreset === 'admin' ? 'bg-white/20 text-white' : 'bg-indigo-600 text-white'
                  }`}
                >
                  AD
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold truncate">Bảo (Quản trị viên)</p>
                  <p className={`text-[10px] font-mono truncate ${selectedPreset === 'admin' ? 'text-indigo-100' : 'text-slate-500'}`}>
                    baonhq.24it@vku.udn.vn
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => fillDemoCredentials('sale')}
                className={`flex items-center gap-3 rounded-2xl p-3 text-left transition-all card-hover ${
                  selectedPreset === 'sale'
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'bg-slate-100/80 hover:bg-indigo-50/70 text-slate-900'
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-black text-xs ${
                    selectedPreset === 'sale' ? 'bg-white/20 text-white' : 'bg-slate-800 text-white'
                  }`}
                >
                  SL
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold truncate">Sales Executive</p>
                  <p className={`text-[10px] font-mono truncate ${selectedPreset === 'sale' ? 'text-cyan-100' : 'text-slate-500'}`}>
                    demo@ai-sales-agent.local
                  </p>
                </div>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                Email công việc
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setSelectedPreset(null);
                }}
                placeholder="baonhq.24it@vku.udn.vn"
                autoComplete="username"
                className="w-full rounded-2xl bg-slate-100/80 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none ring-1 ring-slate-200/80 transition-all focus:bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full rounded-2xl bg-slate-100/80 pl-4 pr-16 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none ring-1 ring-slate-200/80 transition-all focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 rounded-full px-2.5 py-1 text-[11px] font-bold text-slate-500 hover:bg-slate-200/60 hover:text-slate-800 transition-colors"
                >
                  {showPassword ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-2xl bg-rose-500/10 px-4 py-3 text-xs font-bold text-rose-600 ring-1 ring-rose-500/20"
              >
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-shimmer w-full flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-slate-950 via-indigo-950 to-indigo-700 py-3.5 text-sm font-extrabold text-white shadow-xl shadow-indigo-600/20 hover:scale-[1.01] transition-all disabled:opacity-50"
            >
              {loading ? (
                <span>Đang mở không gian làm việc...</span>
              ) : (
                <>
                  <span>Truy cập Sales Workspace</span>
                  <span>&rarr;</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <Link href="/" className="hover:text-indigo-600 font-bold transition-colors">
              ← Trang chủ
            </Link>
            <Link href="/contact" className="hover:text-indigo-600 font-semibold transition-colors">
              Gửi yêu cầu tư vấn &rarr;
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
