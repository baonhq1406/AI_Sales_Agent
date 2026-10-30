'use client';

import { useState } from 'react';
import CustomerList from './CustomerList';
import ApprovalList from './ApprovalList';
import CallLogList from './CallLogList';
import WorkflowConsole from './WorkflowConsole';

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

  const [activeTab, setActiveTab] = useState<'workflows' | 'leads' | 'calls' | 'approvals'>('workflows');

  const tabs = [
    {
      id: 'workflows' as const,
      title: 'Tổng Đài & Tác Tử Bán Hàng',
      icon: '🎙️',
      count: 'Thoại AI',
      gradient: 'from-indigo-600 via-violet-600 to-cyan-500',
    },
    {
      id: 'leads' as const,
      title: 'Khách Hàng & Lead 360',
      icon: '🔥',
      count: customerCount !== null ? `${customerCount} Khách` : 'Live',
      gradient: 'from-fuchsia-600 to-indigo-600',
    },
    {
      id: 'calls' as const,
      title: 'Nhật Ký Voice AI',
      icon: '🎧',
      count: callCount !== null ? `${callCount} Cuộc gọi` : 'Audio',
      gradient: 'from-cyan-600 to-blue-600',
    },
    {
      id: 'approvals' as const,
      title: 'Phê Duyệt Báo Giá (HITL)',
      icon: '🛡️',
      count: approvalCount !== null && approvalCount > 0 ? `${approvalCount} Chờ duyệt` : 'An toàn',
      gradient: 'from-emerald-600 to-teal-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Open Floating Header & Glass Pill Navigation Dock (Zero Clunky Box Wrapping) */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pt-1">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-extrabold text-indigo-600 mb-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Voice AI Thời Gian Thực • PostgreSQL pgvector (12 Chủ đề RAG)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Trung Tâm Điều Hành Bán Hàng &amp; Tổng Đài Voice AI
          </h1>
        </div>

        {/* Floating Pill Dock */}
        <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-xl p-1.5 rounded-full shadow-lg shadow-slate-900/5 ring-1 ring-slate-200/80 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-extrabold transition-all duration-300 whitespace-nowrap ${
                  isActive
                    ? `bg-gradient-to-r ${tab.gradient} text-white shadow-md scale-[1.02]`
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <span className="text-sm">{tab.icon}</span>
                <span>{tab.title}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Panels */}
      <div className={activeTab === 'workflows' ? 'block animate-tab-pane' : 'hidden'}>
        <WorkflowConsole currentUser={currentUser} />
      </div>

      <div className={activeTab === 'leads' ? 'block animate-tab-pane' : 'hidden'}>
        <CustomerList
          onCountChange={setCustomerCount}
          onHotLeadCountChange={setHotLeadCount}
        />
      </div>

      <div className={activeTab === 'calls' ? 'block animate-tab-pane' : 'hidden'}>
        <CallLogList onCountChange={setCallCount} />
      </div>

      <div className={activeTab === 'approvals' ? 'block animate-tab-pane' : 'hidden'}>
        <ApprovalList currentUser={currentUser} onCountChange={setApprovalCount} />
      </div>
    </div>
  );
}
