'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardCharts from './DashboardCharts';
import AIInsights from './AIInsights';

type DashboardData = {
  total_leads: number;
  total_interactions: number;
  avg_lead_score: string | null;
  avg_health_score: string | null;
  high_churn_customers: number;
  pending_tasks: number;
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  async function loadData() {
    try {
      const res = await fetch('/api/dashboard/overview');
      if (!res.ok) throw new Error('Không thể tải dữ liệu thống kê từ máy chủ');
      const result = await res.json();
      setData(result.data);
      setLastUpdated(new Date().toLocaleTimeString('vi-VN'));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleRefresh() {
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
    loadData();
  }

  const avgLeadNum = data?.avg_lead_score ? Number(data.avg_lead_score) : null;
  const avgHealthNum = data?.avg_health_score ? Number(data.avg_health_score) : null;

  const kpis = [
    {
      title: 'Khách hàng Tiềm năng',
      badge: 'Total Leads',
      value: data?.total_leads ?? 0,
      unit: 'hồ sơ',
      hint: 'Tổng số lead ghi nhận trong hệ thống',
      color: 'from-indigo-600 to-blue-600',
      progress: null,
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    },
    {
      title: 'Tương tác Đa kênh',
      badge: 'Omnichannel',
      value: data?.total_interactions ?? 0,
      unit: 'lượt',
      hint: 'Tổng hợp Voice AI, Email, Web Form',
      color: 'from-violet-600 to-purple-600',
      progress: null,
      icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
    },
    {
      title: 'Điểm Lead Trung bình',
      badge: 'AI Lead Score',
      value: avgLeadNum !== null ? avgLeadNum.toFixed(1) : '—',
      unit: '/ 100',
      hint: 'Đánh giá tự động bởi Llama 3.3 (WF-13)',
      color: 'from-emerald-600 to-teal-600',
      progress: avgLeadNum,
      icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
    },
    {
      title: 'Chỉ số Sức khỏe KH',
      badge: 'Health Score',
      value: avgHealthNum !== null ? avgHealthNum.toFixed(1) : '—',
      unit: '/ 100',
      hint: 'Mức độ gắn kết & hài lòng Customer 360',
      color: 'from-amber-500 to-orange-600',
      progress: avgHealthNum,
      icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    },
    {
      title: 'Cảnh báo Rời bỏ Cao',
      badge: 'Churn Risk ≥70',
      value: data?.high_churn_customers ?? 0,
      unit: 'khách hàng',
      hint: 'Cần kích hoạt kịch bản giữ chân (WF-22)',
      color: 'from-rose-600 to-red-600',
      progress: null,
      icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    },
    {
      title: 'Tác vụ AI Đang chờ',
      badge: 'Agent Queue',
      value: data?.pending_tasks ?? 0,
      unit: 'tác vụ',
      hint: 'Cuộc gọi & yêu cầu chờ xử lý trong hàng đợi',
      color: 'from-cyan-600 to-blue-600',
      progress: null,
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50/70 py-6 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Executive Header Card */}
        <div className="spotlight-card rounded-3xl border border-slate-200/90 bg-white/90 backdrop-blur-md p-6 shadow-xs animate-fade-in-up">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  Real-time BI Telemetry
                </span>
                <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200/60">
                  PostgreSQL + Groq Llama 3.3
                </span>
                {lastUpdated && (
                  <span className="text-xs text-slate-400">
                    &bull; Cập nhật lúc {lastUpdated}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Executive Analytics &amp; AI Business Intelligence
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">
                Tổng quan chỉ số phễu bán hàng, lưu lượng tương tác đa kênh và khuyến nghị chiến lược tự động từ AI.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center">
              <Link
                href="/sales"
                className="btn-shimmer inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-indigo-600 transition-all card-hover"
              >
                <span>Mở Sales Workspace</span>
                <span>&rarr;</span>
              </Link>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing || loading}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50"
              >
                <svg
                  className={`h-4 w-4 ${refreshing ? 'animate-spin text-indigo-600' : 'text-slate-500'}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>{refreshing ? 'Đang đồng bộ...' : 'Làm mới dữ liệu'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs animate-pulse"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-3 w-2/3">
                    <div className="h-4 w-24 rounded-md bg-slate-200" />
                    <div className="h-8 w-20 rounded-lg bg-slate-200" />
                    <div className="h-3 w-40 rounded-md bg-slate-200" />
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 flex items-center justify-between animate-fade-in-up">
            <span>{error}</span>
            <button
              type="button"
              onClick={handleRefresh}
              className="rounded-lg bg-white px-3 py-1 text-xs font-bold text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* KPI Cards Grid */}
        {!loading && !error && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {kpis.map((card, idx) => (
              <div
                key={card.title}
                className={`spotlight-card group relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs transition-all animate-fade-in-up animation-delay-${((idx % 3) + 1) * 100}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-2">
                      {card.badge}
                    </span>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {card.title}
                    </p>
                    <div className="mt-1.5 flex items-baseline gap-1.5">
                      <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">
                        {card.value}
                      </h2>
                      <span className="text-xs font-semibold text-slate-400">{card.unit}</span>
                    </div>

                    {card.progress !== null && (
                      <div className="mt-2.5 h-1.5 w-full max-w-[180px] overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${card.color} transition-all duration-1000 ease-out`}
                          style={{ width: `${Math.min(100, Math.max(0, card.progress))}%` }}
                        />
                      </div>
                    )}

                    <p className="mt-2 text-xs text-slate-400">{card.hint}</p>
                  </div>

                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr ${card.color} text-white shadow-md transition-transform duration-300 group-hover:scale-110`}
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Charts & AI Insights */}
        <DashboardCharts refreshKey={refreshKey} />
        <AIInsights />
      </div>
    </main>
  );
}
