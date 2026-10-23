'use client';

import { useState } from 'react';
import Link from 'next/link';
import CustomerList from './CustomerList';
import ApprovalList from './ApprovalList';
import CallLogList from './CallLogList';
import VoiceAgentStudio from './VoiceAgentStudio';
import LogoutButton from './LogoutButton';
import VisualProcessBanner from '@/components/VisualProcessBanner';
import QuickStartCard from '@/components/QuickStartCard';

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
  const [activeTab, setActiveTab] = useState<'leads' | 'studio' | 'calls' | 'approvals'>('leads');

  const kpis = [
    {
      id: 'crm-leads',
      title: 'Tổng Khách hàng CRM',
      value: customerCount === null ? '—' : customerCount,
      unit: 'hồ sơ',
      hint: 'Đồng bộ từ các kênh tiếp nhận',
      badge: 'Customer 360',
      color: 'from-indigo-600 to-blue-600',
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
      tab: 'leads' as const,
    },
    {
      id: 'hot-leads',
      title: 'Hot Leads Ưu Tiên (≥75đ)',
      value: hotLeadCount === null ? '—' : hotLeadCount,
      unit: 'tiềm năng cao',
      hint: 'Chấm điểm tự động bởi AI (WF-13)',
      badge: 'High Priority',
      color: 'from-emerald-600 to-teal-600',
      icon: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z',
      tab: 'leads' as const,
    },
    {
      id: 'voice-calls',
      title: 'Đàm thoại Voice AI',
      value: callCount === null ? '—' : callCount,
      unit: 'cuộc gọi',
      hint: 'Outbound (WF-01) & Inbound (WF-02)',
      badge: 'Twilio + Whisper',
      color: 'from-violet-600 to-purple-600',
      icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z',
      tab: 'calls' as const,
    },
    {
      id: 'pending-approvals',
      title: 'Báo giá Chờ Phê Duyệt',
      value: approvalCount === null ? '—' : approvalCount,
      unit: 'đề xuất',
      hint: 'Kiểm soát chiết khấu (WF-23)',
      badge: 'Human-in-the-Loop',
      color: 'from-amber-500 to-orange-600',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
      tab: 'approvals' as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Unified Enterprise Workspace Header */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Core API &amp; n8n Connected
              </span>
              <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200/60">
                Customer 360 Workspace
              </span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Sales CRM &amp; AI Command Center
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Quản trị danh sách khách hàng tiềm năng, giám sát cuộc gọi tự động Voice AI và phê duyệt báo giá ngoại lệ.
            </p>
          </div>

          {/* Right User Profile & Quick Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3.5 py-2 border border-slate-200/80">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white font-bold text-sm shadow-2xs">
                {(currentUser?.displayName || 'S').charAt(0).toUpperCase()}
              </div>
              <div className="pr-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900">
                    {currentUser?.displayName || 'Chuyên viên Kinh doanh'}
                  </span>
                  <span className="rounded bg-indigo-100 px-1.5 py-0.2 text-[10px] font-bold text-indigo-700 uppercase">
                    {currentUser?.role || 'sale'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {currentUser?.email || 'Phiên xác thực JWT bảo mật'}
                </p>
              </div>
            </div>

            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              <span>+ Form WF-07</span>
            </Link>

            <LogoutButton />
          </div>
        </div>
      </div>

      {/* Quick 30s Start Guide */}
      <QuickStartCard />

      {/* Visual Interactive Process Funnel (4 Steps) */}
      <VisualProcessBanner
        activeTab={activeTab}
        onTabChange={setActiveTab}
        customerCount={customerCount}
        approvalCount={approvalCount}
        callCount={callCount}
      />

      {/* KPI Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((card) => {
          const isCurrentTab = activeTab === card.tab;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => setActiveTab(card.tab)}
              className={`group relative overflow-hidden rounded-2xl border bg-white p-5 text-left transition-all focus:outline-none ${
                isCurrentTab
                  ? 'border-indigo-300 shadow-md ring-1 ring-indigo-500/20'
                  : 'border-slate-200/90 shadow-2xs hover:shadow-md hover:border-indigo-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-2">
                    {card.badge}
                  </span>
                  <p className="text-xs font-bold text-slate-500">{card.title}</p>
                  <div className="mt-1.5 flex items-baseline gap-1.5">
                    <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                      {card.value}
                    </h3>
                    <span className="text-xs font-medium text-slate-400">{card.unit}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">{card.hint}</p>
                </div>
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr ${card.color} text-white shadow-md transition-transform group-hover:scale-105`}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
                  </svg>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/*Segmented Navigation Tab Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-slate-200/70 p-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('leads')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === 'leads'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>Khách hàng &amp; Lead CRM</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === 'leads' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-300/70 text-slate-700'
              }`}
            >
              {customerCount ?? '…'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('studio')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === 'studio'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <span>🎙️</span>
            <span>Studio Voice AI &amp; Clone Giọng (WF-01..04)</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === 'studio' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              LIVE
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('calls')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === 'calls'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
            </svg>
            <span>Nhật ký Voice AI (WF-01 &amp; WF-02)</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === 'calls' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-300/70 text-slate-700'
              }`}
            >
              {callCount ?? '…'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('approvals')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === 'approvals'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span>Phê duyệt Báo giá (WF-23)</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                approvalCount && approvalCount > 0
                  ? 'bg-amber-100 text-amber-800'
                  : activeTab === 'approvals'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-slate-300/70 text-slate-700'
              }`}
            >
              {approvalCount ?? '…'}
            </span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
          <span>Đang hiển thị phân hệ:</span>
          <strong className="text-slate-800">
            {activeTab === 'leads'
              ? 'Quản lý Hồ sơ Khách hàng 360'
              : activeTab === 'studio'
              ? 'Studio Đàm thoại Voice AI & Clone Giọng (WF-01..04)'
              : activeTab === 'calls'
              ? 'Giám sát Đàm thoại Voice AI'
              : 'Kiểm duyệt Báo giá & Chiết khấu'}
          </strong>
        </div>
      </div>

      {/* Mounted Tab Panels so counts load concurrently and tab switching is instant */}
      <div className={activeTab === 'leads' ? 'block' : 'hidden'}>
        <CustomerList
          onCountChange={setCustomerCount}
          onHotLeadCountChange={setHotLeadCount}
        />
      </div>

      <div className={activeTab === 'studio' ? 'block' : 'hidden'}>
        <VoiceAgentStudio />
      </div>
      <div className={activeTab === 'calls' ? 'block' : 'hidden'}>
        <CallLogList onCountChange={setCallCount} />
      </div>

      <div className={activeTab === 'approvals' ? 'block' : 'hidden'}>
        <ApprovalList onCountChange={setApprovalCount} />
      </div>
    </div>
  );
}
