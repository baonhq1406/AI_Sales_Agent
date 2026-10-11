'use client';

import { useEffect, useState } from 'react';
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

  async function loadData() {
    try {
      const res = await fetch('/api/dashboard/overview');
      if (!res.ok) throw new Error('Không thể tải dữ liệu thống kê');
      const result = await res.json();
      setData(result.data);
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
    loadData();
  }

  const kpis = [
    {
      title: 'Khách hàng tiềm năng',
      value: data?.total_leads ?? 0,
      hint: 'Tổng số lead trong hệ thống',
      color: 'from-blue-500 to-indigo-600',
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    },
    {
      title: 'Lượt tương tác đa kênh',
      value: data?.total_interactions ?? 0,
      hint: 'Cuộc gọi, email, form web',
      color: 'from-violet-500 to-purple-600',
      icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
    },
    {
      title: 'Điểm Lead trung bình',
      value: data?.avg_lead_score ? `${Number(data.avg_lead_score).toFixed(1)}/100` : '—',
      hint: 'Chấm điểm bằng Llama 3.3',
      color: 'from-emerald-500 to-teal-600',
      icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
    },
    {
      title: 'Sức khỏe khách hàng',
      value: data?.avg_health_score ? `${Number(data.avg_health_score).toFixed(1)}/100` : '—',
      hint: 'Chỉ số tương tác & hài lòng',
      color: 'from-amber-500 to-yellow-600',
      icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    },
    {
      title: 'Nguy cơ rời bỏ cao',
      value: data?.high_churn_customers ?? 0,
      hint: 'Cần can thiệp chăm sóc ngay',
      color: 'from-rose-500 to-red-600',
      icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    },
    {
      title: 'Tác vụ đang chờ',
      value: data?.pending_tasks ?? 0,
      hint: 'Cuộc gọi & phê duyệt chờ xử lý',
      color: 'from-cyan-500 to-blue-600',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50/60 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header Bar */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync Active
              </span>
              <span className="text-xs text-slate-400">&bull; PostgreSQL + Groq AI</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              AI Sales Analytics & Executive Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Tổng quan hiệu suất bán hàng, lưu lượng tương tác và phân tích tự động bằng AI.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50"
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
            <span>{refreshing ? 'Đang làm mới...' : 'Làm mới dữ liệu'}</span>
          </button>
        </div>

        {/* Loading / Error States */}
        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
            <svg className="mx-auto h-8 w-8 animate-spin text-indigo-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="mt-4 text-sm font-medium text-slate-600">Đang đồng bộ dữ liệu chỉ số kinh doanh...</p>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        {/* KPI Cards Grid */}
        {!loading && !error && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {kpis.map((card) => (
              <div
                key={card.title}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition-all hover:shadow-md hover:border-indigo-200"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {card.title}
                    </p>
                    <h2 className="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight">
                      {card.value}
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">
                      {card.hint}
                    </p>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr ${card.color} text-white shadow-md shadow-indigo-500/10 transition-transform group-hover:scale-105`}>
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
        <DashboardCharts />
        <AIInsights />
      </div>
    </main>
  );
}
