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

export default function ApprovalList({
  onCountChange,
}: {
  onCountChange?: (count: number) => void;
}) {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!loading && !error) {
      onCountChange?.(approvals.length);
    }
  }, [approvals, loading, error, onCountChange]);

  async function handleDecision(
    id: string,
    status: 'approved' | 'rejected'
  ) {
    if (processingId) return;

    const confirmed = window.confirm(
      status === 'approved'
        ? 'Bạn chắc chắn muốn phê duyệt báo giá này?'
        : 'Bạn chắc chắn muốn từ chối báo giá này?'
    );

    if (!confirmed) return;

    setProcessingId(id);
    setError('');
    setMessage('');

    try {
      const response = await fetch(
        `/api/sales/approvals/${id}/decision`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        throw new Error('Không thể xử lý báo giá');
      }

      setApprovals((current) =>
        current.filter((item) => item.id !== id)
      );

      setMessage(
        status === 'approved'
          ? 'Đã phê duyệt báo giá thành công.'
          : 'Đã từ chối báo giá thành công.'
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Đã xảy ra lỗi'
      );
    } finally {
      setProcessingId(null);
    }
  }

  useEffect(() => {
    fetch('/api/sales/approvals')
      .then(async (res) => {
        if (!res.ok) throw new Error('Không thể tải danh sách báo giá');
        return res.json();
      })
      .then((result) => {
        const data = Array.isArray(result.data) ? result.data : [];
        setApprovals(data);
      })
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

      {error && <p role="alert" className="mb-4 text-red-600">{error}</p>}

      {message && (
        <p role="status" className="mb-4 text-green-700">
          {message}
        </p>
      )}

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

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={processingId !== null}
              onClick={() => handleDecision(approval.id, 'approved')}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {processingId === approval.id
                ? 'Đang xử lý...'
                : 'Phê duyệt'}
            </button>

            <button
              type="button"
              disabled={processingId !== null}
              onClick={() => handleDecision(approval.id, 'rejected')}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {processingId === approval.id
                ? 'Đang xử lý...'
                : 'Từ chối'}
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}
