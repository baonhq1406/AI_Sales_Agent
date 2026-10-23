'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function InteractivePipelineFlow() {
  const [selectedStep, setSelectedStep] = useState(0);

  const steps = [
    {
      num: '01',
      title: 'Tiếp Nhận & Làm Giàu Lead',
      workflows: 'WF-07 & WF-08',
      desc: 'Thu thập đa kênh Web, Zalo & chuẩn hóa vào pgvector.',
      icon: '📥',
      badge: 'Ingestion Engine',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      glow: 'group-hover:border-indigo-400 group-hover:shadow-indigo-500/10',
      statLabel: 'Tốc độ',
      statValue: '< 350ms',
      detail: {
        inputs: 'SĐT, Email, Nhu cầu ban đầu',
        outputs: 'Customer 360 Vector Embedding',
        aiModel: 'PostgreSQL pgvector + n8n',
      },
    },
    {
      num: '02',
      title: 'AI Chấm Điểm & Phân Hạng',
      workflows: 'WF-13 Scoring',
      desc: 'Llama 3.3 tính điểm 0–100 & xếp hạng Hot Lead.',
      icon: '🧠',
      badge: 'Llama 3.3 70B',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      glow: 'group-hover:border-purple-400 group-hover:shadow-purple-500/10',
      statLabel: 'Độ chuẩn xác',
      statValue: '96.4%',
      detail: {
        inputs: 'Quy mô, Nhu cầu, Tương tác',
        outputs: 'Lead Score 0-100 & Churn Risk',
        aiModel: 'Groq Llama 3.3 70B Engine',
      },
    },
    {
      num: '03',
      title: 'Voice AI Đàm Thoại 2 Chiều',
      workflows: 'WF-01 & WF-02',
      desc: 'Quay số tự động & hội thoại Whisper tiếng Việt.',
      icon: '🎙️',
      badge: 'Voice AI Outbound',
      badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      glow: 'group-hover:border-cyan-400 group-hover:shadow-cyan-500/10',
      statLabel: 'Độ trễ',
      statValue: '< 800ms',
      detail: {
        inputs: 'SĐT khách & Kịch bản',
        outputs: 'Audio ghi âm, Transcript, Intent',
        aiModel: 'Whisper Large v3 + ElevenLabs',
      },
    },
    {
      num: '04',
      title: 'Báo Giá PDF & Duyệt HITL',
      workflows: 'WF-14 & WF-16',
      desc: 'Sinh Báo giá PDF & Quản lý duyệt 1-click.',
      icon: '🛡️',
      badge: 'HITL Governance',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      glow: 'group-hover:border-emerald-400 group-hover:shadow-emerald-500/10',
      statLabel: 'An toàn giá',
      statValue: '100% Khóa trần',
      detail: {
        inputs: 'Gói giải pháp, Chiết khấu đề xuất',
        outputs: 'Báo giá PDF chính thức & Token duyệt',
        aiModel: 'PDF Generator + Telegram Alert',
      },
    },
  ];

  return (
    <div className="relative rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-6 mb-8">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 border border-indigo-200/80">
            <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
            Kiến Trúc Tự Động Hóa 4 Bước
          </span>
          <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Quy Trình Vận Hành Bán Hàng Tự Hành Khép Kín
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-2xl">
            Tất cả 4 bước được n8n Orchestrator kết nối trực tiếp với PostgreSQL pgvector và NestJS Core Gateway. Bấm vào từng bước để xem chi tiết.
          </p>
        </div>

        <Link
          href="/sales"
          className="btn-shimmer inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-600 transition-all self-start md:self-auto"
        >
          <span>Mở Workspace Trải Nghiệm</span>
          <span>&rarr;</span>
        </Link>
      </div>

      {/* 4 Interactive Step Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative">
        {steps.map((step, index) => {
          const isSelected = selectedStep === index;
          return (
            <div
              key={step.num}
              onClick={() => setSelectedStep(index)}
              className={`group relative flex flex-col justify-between rounded-2xl border p-5 cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-200 shadow-md -translate-y-1'
                  : 'border-slate-200/90 bg-white hover:border-indigo-300 hover:shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white font-mono text-sm font-extrabold group-hover:bg-indigo-600 transition-colors shadow-2xs">
                    {step.num}
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${step.badgeColor}`}
                  >
                    {step.workflows}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xl">{step.icon}</span>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {step.title}
                  </h4>
                </div>

                <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                  {step.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">{step.statLabel}:</span>
                <span className="font-mono font-extrabold text-indigo-600">{step.statValue}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded Step Deep Dive Panel */}
      <div className="mt-6 rounded-2xl border border-indigo-100 bg-slate-50/80 p-5 transition-all animate-in fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{steps[selectedStep].icon}</span>
            <div>
              <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                Chi tiết Kỹ thuật: {steps[selectedStep].workflows}
              </p>
              <h5 className="text-sm font-extrabold text-slate-900">
                {steps[selectedStep].title}
              </h5>
            </div>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-500">
            Node AI: {steps[selectedStep].detail.aiModel}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="rounded-xl bg-white p-3 border border-slate-200/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Dữ liệu đầu vào (Payload Input):
            </span>
            <p className="font-mono text-slate-700">{steps[selectedStep].detail.inputs}</p>
          </div>
          <div className="rounded-xl bg-white p-3 border border-slate-200/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Kết quả trả về (Payload Output):
            </span>
            <p className="font-mono text-emerald-700 font-semibold">{steps[selectedStep].detail.outputs}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
