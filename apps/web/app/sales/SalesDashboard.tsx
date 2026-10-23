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

  // Tab State: Default to 'workflows' for instant access to WF-01..06
  const [activeTab, setActiveTab] = useState<'workflows' | 'leads' | 'calls' | 'approvals'>('workflows');

  const tabs = [
    {
      id: 'workflows' as const,
      num: '01',
      title: '6 Workflow Điều Hành',
      desc: 'WF-01..06: Outbound, Inbound RAG, Orchestrator, Autonomous AI',
      icon: '⚡',
      count: 'WF-01..06',
      badge: 'Phụ trách: Bảo',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      activeRing: 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-200 shadow-sm',
    },
    {
      id: 'leads' as const,
      num: '02',
      title: 'Khách Hàng & Lead 360',
      desc: 'Hồ sơ Lead, Điểm AI & Kích hoạt gọi thoại',
      icon: '📋',
      count: customerCount !== null ? `${customerCount} Khách` : '…',
      badge: hotLeadCount !== null && hotLeadCount > 0 ? `${hotLeadCount} 🔥 Hot Lead` : 'Dữ liệu thật',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      activeRing: 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-200 shadow-sm',
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
      badge: currentUser?.role !== 'admin' ? 'Chỉ Xem (Sale)' : (approvalCount !== null && approvalCount > 0 ? 'Cần duyệt gấp' : '100% An toàn'),
      badgeColor: currentUser?.role !== 'admin' ? 'bg-amber-50 text-amber-800 border-amber-200' : (approvalCount !== null && approvalCount > 0 ? 'bg-amber-100 text-amber-800 border-amber-300 font-extrabold animate-pulse' : 'bg-emerald-50 text-emerald-700 border-emerald-200'),
      activeRing: 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-200 shadow-sm',
    },
  ];

  return (
    <div className="space-y-5">
      {/* Sleek Enterprise Workspace Header & Command Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/90 backdrop-blur-md px-6 py-4 rounded-3xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              PostgreSQL pgvector • n8n Connected
            </span>
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">&bull; 6 Core Workflows</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            Sales Workspace &amp; AI Copilot
          </h1>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="flex items-center gap-2 rounded-2xl bg-slate-100/80 px-3 py-1.5 border border-slate-200/80 text-xs">
            <span className="h-6 w-6 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-[11px] shadow-2xs">
              {currentUser?.displayName?.[0] || 'B'}
            </span>
            <span className="font-bold text-slate-800">{currentUser?.displayName || 'Nguyễn Hữu Quốc Bảo'}</span>
            <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-bold uppercase">
              {currentUser?.role || 'admin'}
            </span>
          </div>
        </div>
      </div>

      {/* Modern Segmented Navigation Dock (Linear / Raycast Style - Zero Clunky Boxes) */}
      <div className="flex items-center justify-between gap-3 bg-slate-200/60 backdrop-blur-md p-1.5 rounded-2xl border border-slate-300/70 shadow-inner overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 min-w-max">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-md shadow-slate-900/10 ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <span className="text-base">{tab.icon}</span>
                <span>{tab.title}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-200/80 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="hidden lg:flex items-center gap-2 pr-3 text-xs text-slate-500 font-semibold">
          <span className="text-[11px] bg-white/70 px-2 py-1 rounded-lg border border-slate-200/70">
            SLA Phản hồi: &lt; 30s
          </span>
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
