'use client';

import { useState } from 'react';
import CustomerList from './CustomerList';
import ApprovalList from './ApprovalList';
import CallLogList from './CallLogList';

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
  const [callCount, setCallCount] = useState<number | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<'leads' | 'calls' | 'approvals'>('leads');

  const kpis = [
    {
      title: 'Khách hàng CRM',
      value: customerCount === null ? '...' : customerCount,
      hint: 'Hồ sơ trong hệ thống',
      color: 'from-blue-500 to-indigo-600',
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
      tab: 'leads' as const,
    },
    {
      title: 'Cuộc gọi thoại AI (Bảo)',
      value: callCount === null ? '...' : `${callCount} cuộc`,
      hint: 'Voice Outbound (WF-01) & Inbound (WF-02)',
      color: 'from-purple-500 to-indigo-600',
      icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z',
      tab: 'calls' as const,
    },
    {
      title: 'Hot Leads ưu tiên (≥75)',
      value: hotLeadCount === null ? '...' : hotLeadCount,
      hint: 'Cần liên hệ chốt đơn ngay',
      color: 'from-emerald-500 to-teal-600',
      icon: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z',
      tab: 'leads' as const,
    },
    {
      title: 'Báo giá chờ phê duyệt',
      value: approvalCount === null ? '...' : approvalCount,
      hint: 'Human-in-the-Loop (WF-23)',
      color: 'from-amber-500 to-yellow-600',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
      tab: 'approvals' as const,
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
              Core API & n8n Live
            </span>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((card) => (
          <button
            key={card.title}
            type="button"
            onClick={() => setActiveTab(card.tab)}
            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-xs transition-all hover:shadow-md hover:border-indigo-300 focus:outline-none"
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
          </button>
        ))}
      </div>

      {/* Navigation Tab Bar */}
      <div className="mt-8 flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('leads')}
          className={`flex items-center gap-2 border-b-2 py-3 px-4 text-sm font-semibold transition-all ${
            activeTab === 'leads'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span>Khách hàng CRM ({customerCount ?? '...'})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('calls')}
          className={`flex items-center gap-2 border-b-2 py-3 px-4 text-sm font-semibold transition-all ${
            activeTab === 'calls'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
          </svg>
          <span className="flex items-center gap-1.5">
            <span>Cuộc gọi Voice AI (Bảo - WF-01 & WF-02)</span>
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
              {callCount ?? 10}
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('approvals')}
          className={`flex items-center gap-2 border-b-2 py-3 px-4 text-sm font-semibold transition-all ${
            activeTab === 'approvals'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <span className="flex items-center gap-1.5">
            <span>Duyệt Báo giá (WF-23)</span>
            {approvalCount && approvalCount > 0 ? (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                {approvalCount}
              </span>
            ) : null}
          </span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'leads' && (
        <CustomerList
          onCountChange={setCustomerCount}
          onHotLeadCountChange={setHotLeadCount}
        />
      )}

      {activeTab === 'calls' && (
        <CallLogList onCountChange={setCallCount} />
      )}

      {activeTab === 'approvals' && (
        <ApprovalList onCountChange={setApprovalCount} />
      )}
    </>
  );
}
