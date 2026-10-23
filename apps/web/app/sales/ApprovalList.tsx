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

type UserProfile = {
  id?: string;
  role?: string;
  displayName?: string;
  email?: string;
};

export default function ApprovalList({
  currentUser,
  onCountChange,
}: {
  currentUser?: UserProfile | null;
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
        if (!res.ok) throw new Error('Không thể tải danh sách báo giá chờ duyệt');
        return res.json();
      })
      .then((result) => {
        const data = Array.isArray(result.data) ? result.data : [];
        setApprovals(data);
        onCountChange?.(data.length);
        setError('');
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
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Không thể xử lý quyết định phê duyệt báo giá');
      }

      setApprovals((current) => {
        const updated = current.filter((item) => item.id !== id);
        onCountChange?.(updated.length);
        return updated;
      });

      setMessage(
        status === 'approved'
          ? 'Đã phê duyệt báo giá thành công. Hệ thống đã kích hoạt luồng phát hành hợp đồng cho khách hàng.'
          : 'Đã từ chối đề xuất báo giá. Yêu cầu đã được chuyển lại cho chuyên viên kinh doanh điều chỉnh.'
      );
      setTimeout(() => setMessage(''), 4500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi gửi quyết định');
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

  const isAdmin = currentUser?.role === 'admin';

  return (
    <section className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900">
              Phê Duyệt Báo Giá &amp; Hợp Đồng Ngoại Lệ
            </h2>
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-200">
              {approvals.length} chờ quyết định
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Cơ chế Human-in-the-Loop (WF-16 &amp; WF-23): Kiểm soát các đề xuất vượt trần chiết khấu trước khi gửi khách hàng.
          </p>
        </div>

        <button
          type="button"
          onClick={loadApprovals}
          className="inline-flex items-center gap-1.5 self-start rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <svg className={`h-4 w-4 ${loading ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Làm mới</span>
        </button>
      </div>

      {!isAdmin && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-950 flex items-start gap-3 shadow-xs">
          <span className="text-xl leading-none">🛡️</span>
          <div className="space-y-1">
            <div className="font-bold flex items-center gap-2">
              <span>Chế độ xem dành cho Chuyên viên Kinh doanh (Sale Rep)</span>
              <span className="bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-extrabold tracking-wider">
                Chỉ Xem
              </span>
            </div>
            <p className="text-amber-900/90 leading-relaxed">
              Bạn có thể theo dõi tiến độ phê duyệt báo giá của khách hàng. Theo quy trình kiểm soát nội bộ (HITL), thẩm quyền phê duyệt chiết khấu ngoại lệ và phát hành hợp đồng thuộc về <strong>Quản lý / Ban Giám đốc (Admin)</strong>.
            </p>
          </div>
        </div>
      )}

      {loading && (
        <div className="py-12 text-center text-xs text-slate-500">
          <svg className="mx-auto h-7 w-7 animate-spin text-indigo-600 mb-2.5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Đang kiểm tra hàng đợi phê duyệt báo giá...
        </div>
      )}

      {error && (
        <div role="alert" className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 flex items-center gap-2.5"
        >
          <svg className="h-4 w-4 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <span>{message}</span>
        </div>
      )}

      {!loading && !error && approvals.length === 0 && (
        <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/30 p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 mb-3">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-slate-900">Hàng đợi phê duyệt đã xử lý hoàn tất</h3>
          <p className="mt-1 text-xs text-slate-500">
            Hiện không có đề xuất báo giá hay hợp đồng nào đang chờ quyết định từ cấp quản lý.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {!loading &&
          !error &&
          approvals.map((approval) => {
            const p = approval.payload;
            const requestedDate = new Date(approval.requested_at).toLocaleString('vi-VN');
            const discount = Number(p.discount_pct ?? 0);
            const maxAllowed = Number(p.max_allowed_discount ?? 10);
            const exceedBy = Math.max(0, discount - maxAllowed);

            return (
              <article
                key={approval.id}
                className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs hover:border-indigo-200 transition-all"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-600">
                        REF: {approval.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200">
                        ⏳ Chờ Quản lý phê duyệt
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mt-1.5">
                      {p.customer_name || 'Đề xuất Báo Giá Doanh Nghiệp'}
                    </h3>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-[11px] font-medium text-slate-400 block">Thời gian trình duyệt</span>
                    <span className="text-xs font-semibold text-slate-700">{requestedDate}</span>
                  </div>
                </div>

                {/* Quotation Metrics */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 my-4 text-xs">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Gói giải pháp
                    </span>
                    <p className="font-bold text-slate-900 mt-1">
                      {p.service_package || 'AI Sales Enterprise'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Giá trị hợp đồng
                    </span>
                    <p className="font-extrabold text-indigo-700 mt-1 text-sm">
                      {formatCurrency(p.proposed_value_vnd)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-3.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500">
                      Chiết khấu đề xuất
                    </span>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="font-extrabold text-rose-600 text-sm">{discount}%</span>
                      <span className="text-[11px] text-slate-500">
                        (Trần: {maxAllowed}%{exceedBy > 0 ? ` • +${exceedBy}%` : ''})
                      </span>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Kỳ hạn cam kết
                    </span>
                    <p className="font-bold text-slate-900 mt-1">{p.contract_period || '12 Tháng'}</p>
                  </div>
                </div>

                {/* AI Recommendation & Reason */}
                <div className="grid gap-3 sm:grid-cols-2 mb-4">
                  {p.ai_recommendation && (
                    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-3.5 text-xs text-indigo-950">
                      <div className="flex items-center gap-1.5 font-bold text-indigo-700 mb-1">
                        <span>🤖 Khuyến nghị từ AI Risk Engine:</span>
                      </div>
                      <p className="leading-relaxed text-slate-700">{p.ai_recommendation}</p>
                    </div>
                  )}

                  {p.reason && (
                    <div className="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-3.5 text-xs text-slate-700">
                      <div className="font-bold text-slate-800 mb-1">
                        📝 Giải trình từ Chuyên viên Sale:
                      </div>
                      <p className="leading-relaxed text-slate-600">{p.reason}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400">
                    Quyết định sẽ được ghi log kiểm toán (Audit Trail) và kích hoạt webhook n8n.
                  </span>
                  {isAdmin ? (
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        disabled={processingId !== null}
                        onClick={() => {
                          setDecisionNote('');
                          setActiveDecision({
                            id: approval.id,
                            type: 'rejected',
                            title: `Từ chối đề xuất báo giá — ${p.customer_name || 'Khách hàng'}`,
                          });
                        }}
                        className="rounded-xl border border-rose-200 bg-white px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 transition-colors disabled:opacity-50"
                      >
                        Từ chối
                      </button>

                      <button
                        type="button"
                        disabled={processingId !== null}
                        onClick={() => {
                          setDecisionNote('');
                          setActiveDecision({
                            id: approval.id,
                            type: 'approved',
                            title: `Phê duyệt báo giá — ${p.customer_name || 'Khách hàng'}`,
                          });
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors disabled:opacity-50"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Phê duyệt đề xuất</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/70 px-3.5 py-2 text-xs font-semibold text-amber-800">
                        <svg className="h-3.5 w-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span>🔒 Chờ Quản lý (Admin) phê duyệt</span>
                      </span>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
      </div>

      {/* Decision Confirmation Modal (Admin Only) */}
      {isAdmin && activeDecision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xl">
            <div className="mb-3">
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  activeDecision.type === 'approved'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {activeDecision.type === 'approved' ? 'Xác nhận Phê duyệt' : 'Xác nhận Từ chối'}
              </span>
              <h3 className="mt-2 text-base font-extrabold text-slate-900">
                {activeDecision.title}
              </h3>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                {activeDecision.type === 'approved'
                  ? 'Sau khi phê duyệt, báo giá chính thức sẽ được đóng dấu xác thực và gửi tự động tới khách hàng.'
                  : 'Vui lòng đính kèm ghi chú để chuyên viên phụ trách điều chỉnh lại mức chiết khấu hoặc điều khoản.'}
              </p>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Ghi chú phê duyệt (Tùy chọn)
              </label>
              <textarea
                rows={3}
                placeholder="Nhập nhận xét hoặc chỉ dẫn cho chuyên viên kinh doanh..."
                value={decisionNote}
                onChange={(e) => setDecisionNote(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
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
                className={`rounded-xl px-5 py-2 text-xs font-bold text-white shadow-xs transition-colors ${
                  activeDecision.type === 'approved'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {processingId ? 'Đang xử lý...' : 'Xác nhận quyết định'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
