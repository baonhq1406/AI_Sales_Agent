'use client';

import { useState } from 'react';
import CustomerList from './CustomerList';
import ApprovalList from './ApprovalList';

type UserProfile = {
  id?: string;
  role?: string;
  displayName?: string;
  email?: string;
};

export default function SalesDashboard({
  currentUser,
}: {
  currentUser?: UserProfile | null;
}) {
  const [customerCount, setCustomerCount] = useState<number | null>(null);
  const [hotLeadCount, setHotLeadCount] = useState<number | null>(null);
  const [approvalCount, setApprovalCount] = useState<number | null>(null);

  const kpis = [
    {
      title: 'Khách hàng CRM',
      value: customerCount === null ? '...' : customerCount,
      hint: 'Hồ sơ trong hệ thống',
      color: 'from-blue-500 to-indigo-600',
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    },
    {
      title: 'Hot Leads ưu tiên (≥75)',
      value: hotLeadCount === null ? '...' : hotLeadCount,
      hint: 'Cần liên hệ chốt đơn ngay',
      color: 'from-emerald-500 to-teal-600',
      icon: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z',
    },
    {
      title: 'Báo giá chờ phê duyệt',
      value: approvalCount === null ? '...' : approvalCount,
      hint: 'Human-in-the-Loop (WF-23)',
      color: 'from-amber-500 to-yellow-600',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    },
    {
      title: 'AI Next Best Action',
      value: 'Sẵn sàng điều phối',
      hint: 'Multi-Agent Router (WF-03)',
      color: 'from-violet-500 to-purple-600',
      icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    },
  ];

  return (
    <>
      {/* Top Banner with Personalized Welcome */}
      <div className="mb-6 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-violet-50/80 p-5 shadow-xs">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/20">
              {(currentUser?.displayName || 'Sale').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-base">
                  Xin chào, {currentUser?.displayName || 'Nhân viên kinh doanh'}
                </span>
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700 uppercase">
                  {currentUser?.role || 'sale'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Phiên làm việc bảo mật với JWT &bull; Kết nối PostgreSQL Vector Database
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Core API Healthy
            </span>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((card) => (
          <div
            key={card.title}
            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:shadow-md hover:border-indigo-200"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {card.title}
                </p>
                <h3 className="mt-2 text-2xl font-extrabold text-slate-900 tracking-tight">
                  {card.value}
                </h3>
                <p className="mt-1 text-xs text-slate-400">{card.hint}</p>
              </div>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr ${card.color} text-white shadow-md shadow-indigo-500/10 transition-transform group-hover:scale-105`}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main CRM Sections */}
      <CustomerList
        onCountChange={setCustomerCount}
        onHotLeadCountChange={setHotLeadCount}
      />
      <ApprovalList onCountChange={setApprovalCount} />
    </>
  );
}
