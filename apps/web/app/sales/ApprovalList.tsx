'use client';

import { useEffect, useState } from 'react';

type Approval = {
  id: string;
  entity_type: string;
  approval_type: string;
  status: string;
  payload: Record<string, unknown>;
  requested_at: string;
};

export default function ApprovalList() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/sales/approvals')
      .then(async (res) => {
        if (!res.ok) throw new Error('Không thể tải danh sách báo giá');
        return res.json();
      })
      .then((result) => setApprovals(result.data ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-900">
          Báo giá chờ phê duyệt
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Nhân viên Sale kiểm tra và quyết định trước khi gửi báo giá.
        </p>
      </div>

      {loading && <p className="text-slate-500">Đang tải yêu cầu...</p>}

      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && approvals.length === 0 && (
        <div className="rounded-xl bg-slate-50 p-8 text-center text-slate-500">
          Chưa có báo giá nào đang chờ phê duyệt.
        </div>
      )}

      {!loading && !error && approvals.map((approval) => (
        <article
          key={approval.id}
          className="mb-4 rounded-xl border border-slate-200 p-5"
        >
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-semibold text-slate-900">
              Yêu cầu báo giá
            </h3>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
              Chờ duyệt
            </span>
          </div>

          <p className="mt-3 text-sm text-slate-500">
            Loại: {approval.approval_type}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Ngày yêu cầu: {new Date(approval.requested_at).toLocaleString('vi-VN')}
          </p>

          <pre className="mt-4 overflow-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
            {JSON.stringify(approval.payload, null, 2)}
          </pre>

          <p className="mt-4 text-xs text-slate-400">
            Chức năng duyệt / từ chối sẽ được tích hợp tiếp theo.
          </p>
        </article>
      ))}
    </section>
  );
}
