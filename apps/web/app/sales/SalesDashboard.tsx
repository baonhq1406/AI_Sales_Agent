'use client';

import { useState } from 'react';
import CustomerList from './CustomerList';
import ApprovalList from './ApprovalList';

export default function SalesDashboard() {
  const [customerCount, setCustomerCount] = useState<number | null>(null);
  const [approvalCount, setApprovalCount] = useState<number | null>(null);

  const cards = [
    {
      title: 'Khách hàng',
      value: customerCount === null ? 'Đang tải...' : customerCount,
    },
    {
      title: 'Báo giá chờ duyệt',
      value: approvalCount === null ? 'Đang tải...' : approvalCount,
    },
    {
      title: 'AI Next Best Action',
      value: 'Chưa tích hợp AI',
    },
  ];

  return (
    <>
      <div className="grid gap-5 md:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-slate-900">
              {card.title}
            </h2>
            <p className="mt-3 text-2xl font-bold text-indigo-600">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <CustomerList onCountChange={setCustomerCount} />
      <ApprovalList onCountChange={setApprovalCount} />
    </>
  );
}
