'use client';

import { useEffect, useState, useMemo } from 'react';

type Customer = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  score: number | string | null;
  created_at?: string;
};

export default function CustomerList({
  onCountChange,
  onHotLeadCountChange,
}: {
  onCountChange?: (count: number) => void;
  onHotLeadCountChange?: (hotCount: number) => void;
}) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [submittingLead, setSubmittingLead] = useState(false);
  const [addLeadSuccess, setAddLeadSuccess] = useState('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');

  // New Lead Form state
  const [newLead, setNewLead] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    email: '',
    phone: '',
  });

  async function fetchCustomers() {
    try {
      setLoading(true);
      const res = await fetch('/api/sales/leads');
      if (!res.ok) throw new Error('Không thể tải danh sách khách hàng');
      const result = await res.json();
      const data = Array.isArray(result.data) ? result.data : [];
      setCustomers(data);
      onCountChange?.(data.length);

      const hot = data.filter((c: Customer) => Number(c.score || 0) >= 75).length;
      onHotLeadCountChange?.(hot);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối Backend');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filtered = useMemo(() => {
    return customers.filter((customer) => {
      const fullName = [customer.first_name, customer.last_name].filter(Boolean).join(' ');
      const textMatch = [fullName, customer.company_name, customer.email, customer.phone]
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase());

      if (!textMatch) return false;
      if (statusFilter !== 'ALL' && customer.status !== statusFilter) return false;
      return true;
    });
  }, [customers, search, statusFilter]);

  async function handleCreateLead(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingLead(true);
    setAddLeadSuccess('');
    setError('');

    try {
      const res = await fetch('/api/sales/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLead),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Tạo khách hàng thất bại');
      }

      setAddLeadSuccess('Đã thêm khách hàng mới vào CRM thành công!');
      setNewLead({ firstName: '', lastName: '', companyName: '', email: '', phone: '' });
      setTimeout(() => {
        setIsAddModalOpen(false);
        setAddLeadSuccess('');
      }, 1200);

      fetchCustomers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể tạo khách hàng');
    } finally {
      setSubmittingLead(false);
    }
  }

  function getScoreBadge(scoreVal: number | string | null) {
    const score = Number(scoreVal || 0);
    if (!scoreVal || score === 0) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
          Chưa chấm
        </span>
      );
    }
    if (score >= 75) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
          🔥 Hot ({score.toFixed(0)})
        </span>
      );
    }
    if (score >= 50) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
          ⚡ Warm ({score.toFixed(0)})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
        ❄️ Cold ({score.toFixed(0)})
      </span>
    );
  }

  function getStatusBadge(status: string) {
    const mapping: Record<string, { label: string; cls: string }> = {
      new: { label: 'Mới (New)', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
      contacted: { label: 'Đã liên hệ', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
      qualified: { label: 'Đủ điều kiện', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      proposal_sent: { label: 'Đã gửi báo giá', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
      won: { label: 'Thành công', cls: 'bg-teal-50 text-teal-700 border-teal-200' },
      lost: { label: 'Mất khách', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
    };

    const s = mapping[status.toLowerCase()] || {
      label: status,
      cls: 'bg-slate-100 text-slate-700 border-slate-200',
    };

    return (
      <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>
        {s.label}
      </span>
    );
  }

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
      {/* Top Header & Actions */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Danh sách Khách hàng & Lead CRM
            </h2>
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200">
              {customers.length} tổng số
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Dữ liệu tập trung từ các kênh Voice AI, Form tiếp nhận và n8n Orchestrator.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchCustomers}
            title="Tải lại dữ liệu"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <svg className={`h-4 w-4 ${loading ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Làm mới</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-all"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>+ Thêm khách hàng</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'qualified', label: 'Đủ điều kiện' },
            { id: 'contacted', label: 'Đã liên hệ' },
            { id: 'proposal_sent', label: 'Báo giá' },
            { id: 'new', label: 'Mới' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <svg className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Tìm tên, công ty, email, số điện thoại..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-300 pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all"
          />
        </div>
      </div>

      {/* Loading & Error */}
      {loading && (
        <div className="py-12 text-center text-sm text-slate-500">
          <svg className="mx-auto h-6 w-6 animate-spin text-indigo-600 mb-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Đang đồng bộ danh sách khách hàng...
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700">
          {error}
        </div>
      )}

      {/* CRM Customer Table */}
      {!loading && !error && (
        <div className="overflow-x-auto rounded-xl border border-slate-200/80">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Họ và Tên</th>
                <th className="py-3 px-4">Công ty</th>
                <th className="py-3 px-4">Liên hệ</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4">Chất lượng (Score)</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filtered.map((customer) => {
                const fullName = [customer.first_name, customer.last_name].filter(Boolean).join(' ') || 'Chưa cập nhật tên';
                return (
                  <tr
                    key={customer.id}
                    onClick={() => setSelectedCustomer(customer)}
                    className="cursor-pointer hover:bg-indigo-50/40 transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-bold text-indigo-700">
                          {fullName.charAt(0)}
                        </div>
                        <span>{fullName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {customer.company_name || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      <div>{customer.email || '—'}</div>
                      <div className="text-[11px] text-slate-400">{customer.phone || '—'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(customer.status)}
                    </td>
                    <td className="py-3.5 px-4">
                      {getScoreBadge(customer.score)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCustomer(customer);
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                      >
                        Chi tiết 360 &rarr;
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-12 text-center text-slate-500">
              <svg className="mx-auto h-8 w-8 text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm font-semibold">Không tìm thấy khách hàng phù hợp</p>
              <p className="text-xs text-slate-400 mt-1">Thử đổi từ khóa tìm kiếm hoặc lọc trạng thái khác.</p>
            </div>
          )}
        </div>
      )}

      {/* Customer 360 Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                    Hồ sơ Customer 360
                  </span>
                  {getStatusBadge(selectedCustomer.status)}
                </div>
                <h3 className="mt-2 text-xl font-bold text-slate-900">
                  {[selectedCustomer.first_name, selectedCustomer.last_name].filter(Boolean).join(' ') || 'Khách hàng'}
                </h3>
                <p className="text-xs text-slate-500">{selectedCustomer.company_name || 'Khách hàng tự do'}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCustomer(null);
                  setActionSuccessMessage('');
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <span className="text-slate-400">Email:</span>
                <p className="font-semibold text-slate-800 mt-0.5">{selectedCustomer.email || 'Chưa cung cấp'}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <span className="text-slate-400">Số điện thoại:</span>
                <p className="font-semibold text-slate-800 mt-0.5">{selectedCustomer.phone || 'Chưa cung cấp'}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <span className="text-slate-400">Điểm tiềm năng (Lead Score):</span>
                <div className="mt-1">{getScoreBadge(selectedCustomer.score)}</div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <span className="text-slate-400">Mã định danh ID:</span>
                <p className="font-mono text-slate-600 mt-0.5 truncate">{selectedCustomer.id}</p>
              </div>
            </div>

            {/* Action Feedback alert */}
            {actionSuccessMessage && (
              <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-center gap-2">
                <svg className="h-4 w-4 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{actionSuccessMessage}</span>
              </div>
            )}

            {/* Interactive Workflow Trigger Actions */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                ⚡ Tác vụ Điều phối AI (Workflows):
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() =>
                    setActionSuccessMessage(
                      `Đã kích hoạt Workflow WF-01: Lên lịch cuộc gọi AI thoại tới ${selectedCustomer.phone || selectedCustomer.first_name}`
                    )
                  }
                  className="flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/70 py-2.5 px-3 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
                >
                  <span>📞 Gọi thoại AI (WF-01)</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setActionSuccessMessage(
                      `Đã kích hoạt Workflow WF-03: Multi-Agent Orchestrator đang phân loại nhu cầu của ${selectedCustomer.company_name || 'khách hàng'}`
                    )
                  }
                  className="flex items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50/70 py-2.5 px-3 text-xs font-semibold text-violet-700 hover:bg-violet-100 transition-colors"
                >
                  <span>🤖 Điều phối AI (WF-03)</span>
                </button>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Thêm Khách Hàng Tiềm Năng Mới</h3>
                <p className="text-xs text-slate-500">Ghi nhận thông tin lead trực tiếp vào cơ sở dữ liệu CRM</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {addLeadSuccess && (
              <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-medium text-emerald-800">
                {addLeadSuccess}
              </div>
            )}

            <form onSubmit={handleCreateLead} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Họ đệm</label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn"
                    value={newLead.firstName}
                    onChange={(e) => setNewLead({ ...newLead, firstName: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tên</label>
                  <input
                    type="text"
                    required
                    placeholder="Bảo"
                    value={newLead.lastName}
                    onChange={(e) => setNewLead({ ...newLead, lastName: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tên công ty / Doanh nghiệp</label>
                <input
                  type="text"
                  placeholder="Công ty CP Công Nghệ..."
                  value={newLead.companyName}
                  onChange={(e) => setNewLead({ ...newLead, companyName: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="contact@doanhnghiep.vn"
                  value={newLead.email}
                  onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Số điện thoại</label>
                <input
                  type="tel"
                  placeholder="+84 987 654 321"
                  value={newLead.phone}
                  onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-200"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submittingLead}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {submittingLead ? 'Đang lưu...' : 'Lưu khách hàng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
