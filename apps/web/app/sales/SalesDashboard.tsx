'use client';

import { useState } from 'react';
import Link from 'next/link';
import CustomerList from './CustomerList';
import ApprovalList from './ApprovalList';
import CallLogList from './CallLogList';
import VoiceAgentStudio from './VoiceAgentStudio';
import LogoutButton from './LogoutButton';
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

  const tabs = [
    {
      id: 'leads' as const,
      num: '01',
      title: 'Khách Hàng & Lead 360',
      desc: 'Hồ sơ Lead, Điểm AI & Kích hoạt gọi thoại',
      icon: '📋',
      count: customerCount !== null ? `${customerCount} Khách` : '…',
      badge: hotLeadCount !== null && hotLeadCount > 0 ? `${hotLeadCount} 🔥 Hot Lead` : 'Dữ liệu thật',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      activeRing: 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-200 shadow-sm',
    },
    {
      id: 'studio' as const,
      num: '02',
      title: 'Studio Voice AI',
      desc: 'Thử nghiệm đàm thoại & Clone giọng nói cá nhân',
      icon: '🎙️',
      count: 'LIVE AI',
      badge: 'WF-01..04',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      activeRing: 'border-purple-600 bg-purple-50/50 ring-2 ring-purple-200 shadow-sm',
    },
    {
      id: 'calls' as const,
      num: '03',
      title: 'Nhật Ký Voice AI',
      desc: 'Xem transcript đàm thoại & phân tích ý định',
      icon: '📞',
      count: callCount !== null ? `${callCount} Cuộc gọi` : '…',
      badge: 'Whisper STT',
      badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      activeRing: 'border-cyan-600 bg-cyan-50/50 ring-2 ring-cyan-200 shadow-sm',
    },
    {
      id: 'approvals' as const,
      num: '04',
      title: 'Phê Duyệt Báo Giá (HITL)',
      desc: 'Kiểm soát chiết khấu ngoại lệ & phát hành hợp đồng',
      icon: '🛡️',
      count: approvalCount !== null && approvalCount > 0 ? `${approvalCount} Chờ duyệt` : 'Đã duyệt',
      badge: approvalCount !== null && approvalCount > 0 ? 'Cần duyệt gấp' : '100% An toàn',
      badgeColor: approvalCount !== null && approvalCount > 0 ? 'bg-amber-100 text-amber-800 border-amber-300 font-extrabold animate-pulse' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
      activeRing: 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-200 shadow-sm',
    },
  ];

  return (
    <div className="space-y-5">
      {/* Sleek Command Center Header */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                PostgreSQL &amp; n8n Connected
              </span>
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 border border-indigo-200/60">
                Customer 360 Workspace
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Sales CRM &amp; Điều Hành AI Tự Hành
            </h1>
          </div>

          {/* User Profile & Actions Bar */}
          <div className="flex flex-wrap items-center gap-2.5 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
            <div className="flex items-center gap-2.5 rounded-2xl bg-slate-50 px-3 py-1.5 border border-slate-200/80">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white font-bold text-xs shadow-2xs">
                {(currentUser?.displayName || 'B').charAt(0).toUpperCase()}
              </div>
              <div className="pr-1 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900">
                    {currentUser?.displayName || 'Bảo (System Manager)'}
                  </span>
                  <span className="rounded bg-indigo-100 px-1.5 py-0.2 text-[9px] font-bold text-indigo-700 uppercase">
                    {currentUser?.role || 'admin'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  {currentUser?.email || 'baonhq.24it@vku.udn.vn'}
                </p>
              </div>
            </div>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <span>📊 Báo Cáo BI</span>
            </Link>

            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              <span>+ Gửi Lead (WF-07)</span>
            </Link>

            <LogoutButton />
          </div>
        </div>
      </div>

      {/* Compact Quick Action Guide */}
      <QuickStartCard onTabChange={setActiveTab} />

      {/* Integrated Visual 4-Step Process & Tab Switcher (No Duplicate Clutter) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-in-up animation-delay-100">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`spotlight-card group relative flex flex-col justify-between rounded-2xl border p-4 text-left transition-all duration-200 ${
                isActive
                  ? `${tab.activeRing} shadow-md`
                  : 'border-slate-200/90 bg-white hover:border-indigo-200 hover:shadow-xs'
              }`}
            >
              {/* Active animated gradient indicator beam */}
              {isActive && (
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-t-2xl animate-gradient-shift" />
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl group-hover:scale-115 transition-transform duration-200">
                      {tab.icon}
                    </span>
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {tab.num}
                    </span>
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${tab.badgeColor} ${isActive ? 'animate-pulse' : ''}`}>
                    {tab.badge}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {tab.title}
                </h3>
                <p className="mt-1 text-xs text-slate-500 line-clamp-1">
                  {tab.desc}
                </p>
              </div>

              <div className="mt-3.5 pt-2.5 border-t border-slate-100/90 flex items-center justify-between text-xs">
                <span className="font-extrabold text-slate-900 font-mono">
                  {tab.count}
                </span>
                <span className={`text-[10px] font-bold ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                  {isActive ? '● Đang mở' : 'Xem &rarr;'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Tab Panels (Concurrent Loading, Animated Fade In) */}
      <div className={activeTab === 'leads' ? 'block animate-fade-in-up' : 'hidden'}>
        <CustomerList
          onCountChange={setCustomerCount}
          onHotLeadCountChange={setHotLeadCount}
        />
      </div>

      <div className={activeTab === 'studio' ? 'block animate-fade-in-up' : 'hidden'}>
        <VoiceAgentStudio />
      </div>

      <div className={activeTab === 'calls' ? 'block animate-fade-in-up' : 'hidden'}>
        <CallLogList onCountChange={setCallCount} />
      </div>

      <div className={activeTab === 'approvals' ? 'block animate-fade-in-up' : 'hidden'}>
        <ApprovalList onCountChange={setApprovalCount} />
      </div>
    </div>
  );
}
