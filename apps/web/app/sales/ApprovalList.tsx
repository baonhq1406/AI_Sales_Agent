'use client';

import { useEffect, useState } from 'react';

type ApprovalPayload = {
  customer_name?: string;
  service_package?: string;
  contract_period?: string;
  proposed_value_vnd?: number;
  discount_pct?: number;
  max_allowed_discount?: number;
  reason?: string;
  ai_recommendation?: string;
  [key: string]: unknown;
};

type Approval = {
  id: string;
  entity_type: string;
  approval_type: string;
  status: string;
  payload: ApprovalPayload;
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

  // Decision Modal State
  const [activeDecision, setActiveDecision] = useState<{
    id: string;
    type: 'approved' | 'rejected';
    title: string;
  } | null>(null);
  const [decisionNote, setDecisionNote] = useState('');

  function loadApprovals() {
    setLoading(true);
    fetch('/api/sales/approvals')
      .then(async (res) => {
        if (!res.ok) throw new Error('Không thể tải danh sách báo giá');
        return res.json();
      })
      .then((result) => {
        const data = Array.isArray(result.data) ? result.data : [];
        setApprovals(data);
        onCountChange?.(data.length);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadApprovals();
  }, []);

  async function executeDecision(id: string, status: 'approved' | 'rejected', note?: string) {
    if (processingId) return;

    setProcessingId(id);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`/api/sales/approvals/${id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          decisionNote: note || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Không thể xử lý quyết định báo giá');
      }

      setApprovals((current) => {
        const updated = current.filter((item) => item.id !== id);
        onCountChange?.(updated.length);
        return updated;
      });

      setMessage(
        status === 'approved'
          ? '✅ Đã phê duyệt báo giá thành công. Hệ thống đã kích hoạt bước gửi hợp đồng cho khách hàng.'
          : '⚠️ Đã từ chối báo giá. Yêu cầu đã được chuyển lại cho nhân viên điều chỉnh.'
      );
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi ra quyết định');
    } finally {
      setProcessingId(null);
      setActiveDecision(null);
      setDecisionNote('');
    }
  }

  function formatCurrency(val?: number) {
    if (!val) return '—';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  }

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Báo Giá & Hợp Đồng Chờ Phê Duyệt (WF-23)
            </h2>
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
              {approvals.length} đang chờ
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Cơ chế Human-in-the-Loop: Kiểm soát ngoại lệ chiết khấu và điều khoản giá trị cao trước khi phát hành.
          </p>
        </div>

        <button
          type="button"
          onClick={loadApprovals}
          className="flex items-center gap-1.5 self-start rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <svg className={`h-4 w-4 ${loading ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Làm mới</span>
        </button>
      </div>

      {loading && (
        <div className="py-8 text-center text-xs text-slate-500">
          Đang kiểm tra hàng đợi phê duyệt...
        </div>
      )}

      {error && (
        <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700">
          {error}
        </div>
      )}

      {message && (
        <div role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800 flex items-center gap-2">
          <span>{message}</span>
        </div>
      )}

      {!loading && !error && approvals.length === 0 && (
        <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 mb-3">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-slate-800">Không có báo giá nào đang chờ</h3>
          <p className="mt-1 text-xs text-slate-500">
            Tất cả đề xuất chiết khấu và hợp đồng đã được kiểm duyệt an toàn.
          </p>
        </div>
      )}

      {!loading && !error && approvals.map((approval) => {
        const p = approval.payload;
        const requestedDate = new Date(approval.requested_at).toLocaleString('vi-VN');

        return (
          <article
            key={approval.id}
            className="mb-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs hover:border-indigo-200 transition-all"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-[11px] font-semibold text-slate-400">
                  ID: {approval.id.slice(0, 8)}...
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {p.customer_name || 'Đề xuất Báo Giá Mới'}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
                  ⏳ Cần phê duyệt
                </span>
                <span className="text-[11px] text-slate-400">{requestedDate}</span>
              </div>
            </div>

            {/* Formatted Quotation Metrics */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 my-4 text-xs">
              <div className="rounded-xl bg-slate-50 p-3">
                <span className="text-slate-400">Gói Dịch Vụ:</span>
                <p className="font-semibold text-slate-800 mt-0.5">{p.service_package || 'AI Sales Enterprise'}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <span className="text-slate-400">Giá trị đề xuất:</span>
                <p className="font-bold text-indigo-700 mt-0.5 text-sm">{formatCurrency(p.proposed_value_vnd)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <span className="text-slate-400">Chiết khấu yêu cầu:</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="font-bold text-rose-600">{p.discount_pct ?? 0}%</span>
                  <span className="text-[10px] text-slate-400">(Trần: {p.max_allowed_discount ?? 10}%)</span>
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <span className="text-slate-400">Thời hạn hợp đồng:</span>
                <p className="font-semibold text-slate-800 mt-0.5">{p.contract_period || '12 Tháng'}</p>
              </div>
            </div>

            {/* AI Recommendation Alert */}
            {p.ai_recommendation && (
              <div className="mb-3 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 text-xs text-indigo-900 flex items-start gap-2">
                <span className="text-indigo-600 text-sm">🤖</span>
                <div>
                  <strong className="font-semibold">Đánh giá rủi ro AI: </strong>
                  <span>{p.ai_recommendation}</span>
                </div>
              </div>
            )}

            {/* Sales Note / Reason */}
            {p.reason && (
              <div className="mb-4 text-xs text-slate-600 bg-slate-50/70 rounded-xl p-3">
                <strong className="text-slate-700">Lý do ngoại lệ: </strong>
                <span>{p.reason}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={processingId !== null}
                onClick={() =>
                  setActiveDecision({
                    id: approval.id,
                    type: 'rejected',
                    title: `Từ chối báo giá của ${p.customer_name || 'khách hàng'}`,
                  })
                }
                className="rounded-xl border border-rose-200 bg-white px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors disabled:opacity-50"
              >
                Từ chối báo giá
              </button>

              <button
                type="button"
                disabled={processingId !== null}
                onClick={() =>
                  setActiveDecision({
                    id: approval.id,
                    type: 'approved',
                    title: `Phê duyệt báo giá cho ${p.customer_name || 'khách hàng'}`,
                  })
                }
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Phê duyệt ngay</span>
              </button>
            </div>
          </article>
        );
      })}

      {/* Decision Confirmation Modal */}
      {activeDecision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900">
              {activeDecision.title}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {activeDecision.type === 'approved'
                ? 'Sau khi phê duyệt, hợp đồng sẽ được đóng dấu điện tử và gửi tự động tới email khách hàng.'
                : 'Vui lòng cung cấp lý do từ chối để nhân viên phụ trách đàm phán lại mức giá.'}
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ghi chú quyết định (Tùy chọn)
              </label>
              <textarea
                rows={3}
                placeholder="Nhập nhận xét hoặc chỉ dẫn bổ sung..."
                value={decisionNote}
                onChange={(e) => setDecisionNote(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-200"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveDecision(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={processingId !== null}
                onClick={() =>
                  executeDecision(
                    activeDecision.id,
                    activeDecision.type,
                    decisionNote.trim()
                  )
                }
                className={`rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors ${
                  activeDecision.type === 'approved'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {processingId ? 'Đang gửi...' : 'Xác nhận quyết định'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
