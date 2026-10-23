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
  const [scoreFilter, setScoreFilter] = useState<'ALL' | 'HOT' | 'WARM' | 'COLD'>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [submittingLead, setSubmittingLead] = useState(false);
  const [addLeadSuccess, setAddLeadSuccess] = useState('');
  const [addLeadError, setAddLeadError] = useState('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');
  const [workflowRunning, setWorkflowRunning] = useState<string | null>(null);

  async function triggerCustomerWorkflow(
    wfType: 'wf01' | 'wf03',
    customer: Customer,
    customSummary?: string,
  ) {
    setWorkflowRunning(wfType);
    setActionSuccessMessage('');
    const fullName =
      [customer.first_name, customer.last_name].filter(Boolean).join(' ') ||
      'Khách hàng';

    try {
      const res = await fetch('/api/sales/voice-workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: wfType,
          payload:
            wfType === 'wf01'
              ? {
                  lead_id: customer.id,
                  phone: customer.phone || '+84905123456',
                  full_name: fullName,
                  context: `Công ty: ${customer.company_name || 'Doanh nghiệp'}, Điểm: ${customer.score || 60}`,
                  customer_speech:
                    'Anh quan tâm gói Pro 5 triệu/tháng, em gửi báo giá chi tiết và chính sách chiết khấu cho anh nhé.',
                }
              : {
                  lead_id: customer.id,
                  phone: customer.phone || '+84905123456',
                  full_name: fullName,
                  intent: 'request_proposal',
                  sentiment: 'positive',
                  summary:
                    customSummary ||
                    `Khách hàng ${fullName} (${customer.company_name || 'Doanh nghiệp'}) yêu cầu báo giá gói Pro sau khi tư vấn.`,
                },
        }),
      });

      const json = await res.json();
      const result = json?.data || json;

      if (wfType === 'wf01') {
        if (result?.tts_audio?.audio_base64) {
          const audio = new Audio(
            `data:${result.tts_audio.mime_type || 'audio/mpeg'};base64,${result.tts_audio.audio_base64}`,
          );
          audio.playbackRate = result.tts_audio.voice?.playback_rate || 1.0;
          audio.play().catch(() => undefined);
        }
        setActionSuccessMessage(
          `✅ WF-01 đã thực hiện cuộc gọi thật & phát giọng nói AI! (Run ID: ${String(result?.workflow_run_id || '').slice(0, 8)} — Đã lưu biên bản vào tab Cuộc gọi AI)`,
        );
      } else {
        setActionSuccessMessage(
          `✅ WF-03 đã điều phối & tạo Báo giá thật vào PostgreSQL! (Approval ID: ${String(result?.approval_id || '').slice(0, 8)} — Xem ngay tại tab Phê duyệt Báo giá)`,
        );
      }

      if (result?.updated_lead?.score !== undefined) {
        setSelectedCustomer((prev) =>
          prev
            ? {
                ...prev,
                score: result.updated_lead.score,
                status: result.updated_lead.status || prev.status,
              }
            : null,
        );
      }
      await fetchCustomers();
    } catch {
      setActionSuccessMessage('Lỗi kết nối khi gọi Workflow n8n.');
    } finally {
      setWorkflowRunning(null);
    }
  }

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
      setError('');
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
      if (statusFilter !== 'ALL' && customer.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }

      const numScore = Number(customer.score || 0);
      if (scoreFilter === 'HOT' && numScore < 75) return false;
      if (scoreFilter === 'WARM' && (numScore < 50 || numScore >= 75)) return false;
      if (scoreFilter === 'COLD' && numScore >= 50) return false;

      return true;
    });
  }, [customers, search, statusFilter, scoreFilter]);

  async function handleCreateLead(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingLead(true);
    setAddLeadSuccess('');
    setAddLeadError('');

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

      setAddLeadSuccess('Đã thêm hồ sơ khách hàng mới vào CRM thành công!');
      setNewLead({ firstName: '', lastName: '', companyName: '', email: '', phone: '' });
      setTimeout(() => {
        setIsAddModalOpen(false);
        setAddLeadSuccess('');
      }, 1000);

      fetchCustomers();
    } catch (err) {
      setAddLeadError(err instanceof Error ? err.message : 'Không thể tạo khách hàng');
    } finally {
      setSubmittingLead(false);
    }
  }

  function renderScoreCell(scoreVal: number | string | null) {
    const score = Math.min(100, Math.max(0, Number(scoreVal || 0)));
    if (!scoreVal || score === 0) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
          Chưa chấm điểm
        </span>
      );
    }

    const isHot = score >= 75;
    const isWarm = score >= 50 && score < 75;

    const badgeCls = isHot
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : isWarm
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-slate-100 text-slate-600 border-slate-200';

    const barCls = isHot
      ? 'bg-emerald-500'
      : isWarm
      ? 'bg-amber-500'
      : 'bg-slate-400';

    const tierLabel = isHot ? '🔥 Hot' : isWarm ? '⚡ Warm' : '❄️ Cold';

    return (
      <div className="flex items-center gap-2.5">
        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${badgeCls}`}>
          <span>{tierLabel}</span>
          <span>({score.toFixed(0)})</span>
        </span>
        <div className="hidden sm:block h-1.5 w-14 overflow-hidden rounded-full bg-slate-100">
          <div className={`h-full rounded-full ${barCls}`} style={{ width: `${score}%` }} />
        </div>
      </div>
    );
  }

  function getStatusBadge(status: string) {
    const mapping: Record<string, { label: string; cls: string; dot: string }> = {
      new: { label: 'Mới tiếp nhận', cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
      contacted: { label: 'Đã liên hệ', cls: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
      qualified: { label: 'Đủ điều kiện', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
      proposal_sent: { label: 'Đã gửi báo giá', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
      won: { label: 'Chốt thành công', cls: 'bg-teal-50 text-teal-700 border-teal-200', dot: 'bg-teal-500' },
      lost: { label: 'Tạm dừng', cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
    };

    const s = mapping[status.toLowerCase()] || {
      label: status,
      cls: 'bg-slate-100 text-slate-700 border-slate-200',
      dot: 'bg-slate-400',
    };

    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${s.cls}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
        {s.label}
      </span>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
      {/* Top Header & Actions */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900">
              Danh sách Khách hàng &amp; Hồ sơ Lead 360
            </h2>
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-200">
              {filtered.length}/{customers.length} hồ sơ
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Dữ liệu đồng bộ thời gian thực từ Web Form (WF-07), Voice AI (WF-01/02) và AI Lead Scoring (WF-13).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchCustomers}
            title="Tải lại dữ liệu"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <svg className={`h-4 w-4 ${loading ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Làm mới</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAddLeadError('');
              setAddLeadSuccess('');
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-600 transition-all"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Thêm khách hàng</span>
          </button>
        </div>
      </div>

      {/* Filter Bar & Search */}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Pills */}
          <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
            {[
              { id: 'ALL', label: 'Tất cả trạng thái' },
              { id: 'qualified', label: 'Đủ điều kiện' },
              { id: 'contacted', label: 'Đã liên hệ' },
              { id: 'proposal_sent', label: 'Đã báo giá' },
              { id: 'new', label: 'Mới' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                  statusFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Score Tier Filter */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-200/80 bg-white p-1">
            {[
              { id: 'ALL' as const, label: 'Mọi điểm số' },
              { id: 'HOT' as const, label: '🔥 Hot (≥75)' },
              { id: 'WARM' as const, label: '⚡ Warm' },
              { id: 'COLD' as const, label: '❄️ Cold' },
            ].map((tier) => (
              <button
                key={tier.id}
                type="button"
                onClick={() => setScoreFilter(tier.id)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                  scoreFilter === tier.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tier.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full lg:w-72">
          <svg className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Tìm tên, công ty, email, SĐT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-8 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Loading & Error */}
      {loading && (
        <div className="py-14 text-center text-sm text-slate-500">
          <svg className="mx-auto h-7 w-7 animate-spin text-indigo-600 mb-2.5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Đang đồng bộ danh sách khách hàng từ Core API...
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
          {error}
        </div>
      )}

      {/* CRM Customer Table */}
      {!loading && !error && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Khách hàng</th>
                <th className="py-3.5 px-4">Doanh nghiệp / Tổ chức</th>
                <th className="py-3.5 px-4">Thông tin liên hệ</th>
                <th className="py-3.5 px-4">Trạng thái phễu</th>
                <th className="py-3.5 px-4">Điểm AI (Lead Score)</th>
                <th className="py-3.5 px-4 text-right">Hồ sơ 360</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filtered.map((customer) => {
                const fullName =
                  [customer.first_name, customer.last_name].filter(Boolean).join(' ') ||
                  'Chưa cập nhật tên';
                return (
                  <tr
                    key={customer.id}
                    onClick={() => setSelectedCustomer(customer)}
                    className="cursor-pointer hover:bg-indigo-50/35 transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-xs font-bold text-white shadow-2xs">
                          {fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold">{fullName}</div>
                          <div className="font-mono text-[10px] text-slate-400">
                            ID: {customer.id.slice(0, 8)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {customer.company_name || <span className="text-slate-400 italic">Cá nhân / Tự do</span>}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="font-medium text-slate-800">{customer.email || '—'}</div>
                      <div className="font-mono text-[11px] text-slate-400 mt-0.5">{customer.phone || '—'}</div>
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(customer.status)}</td>
                    <td className="py-3.5 px-4">{renderScoreCell(customer.score)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCustomer(customer);
                        }}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-all"
                      >
                        <span>Chi tiết 360</span>
                        <span>&rarr;</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-14 text-center text-slate-500">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-sm font-bold text-slate-700">Không tìm thấy hồ sơ khách hàng phù hợp</p>
              <p className="text-xs text-slate-400 mt-1">
                Thử thay đổi từ khóa tìm kiếm hoặc đặt lại bộ lọc trạng thái / điểm số.
              </p>
              {(statusFilter !== 'ALL' || scoreFilter !== 'ALL' || search) && (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('ALL');
                    setScoreFilter('ALL');
                    setSearch('');
                  }}
                  className="mt-3 rounded-xl bg-indigo-50 px-3.5 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"
                >
                  Đặt lại bộ lọc
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Customer 360 Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-5 mb-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-xl font-extrabold text-white shadow-md">
                  {([selectedCustomer.first_name, selectedCustomer.last_name].filter(Boolean).join(' ') || 'K')
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 border border-indigo-200/60">
                      Customer 360 Profile
                    </span>
                    {getStatusBadge(selectedCustomer.status)}
                  </div>
                  <h3 className="mt-1.5 text-xl font-extrabold text-slate-900">
                    {[selectedCustomer.first_name, selectedCustomer.last_name].filter(Boolean).join(' ') || 'Khách hàng'}
                  </h3>
                  <p className="text-xs font-medium text-slate-500">
                    {selectedCustomer.company_name || 'Khách hàng cá nhân / Doanh nghiệp chưa xác định'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedCustomer(null);
                  setActionSuccessMessage('');
                }}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6 text-xs">
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Địa chỉ Email</span>
                <p className="font-semibold text-slate-900 mt-1 break-all">
                  {selectedCustomer.email || 'Chưa cung cấp'}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Số điện thoại</span>
                <p className="font-mono font-bold text-slate-900 mt-1">
                  {selectedCustomer.phone || 'Chưa cung cấp'}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Điểm Tiềm Năng (AI Lead Score)
                </span>
                <div className="mt-1.5">{renderScoreCell(selectedCustomer.score)}</div>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Mã Định Danh (UUID)</span>
                <p className="font-mono text-[11px] text-slate-600 mt-1 truncate">{selectedCustomer.id}</p>
              </div>
            </div>

            {/* Action Feedback alert */}
            {actionSuccessMessage && (
              <div className="mb-5 rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-semibold text-emerald-800 flex items-center gap-2.5">
                <svg className="h-4 w-4 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>{actionSuccessMessage}</span>
              </div>
            )}

            {/* Interactive Workflow Trigger Actions */}
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-950 mb-3">
                ⚡ Kích hoạt Tác vụ Tự động hóa n8n (AI Workflows)
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  disabled={workflowRunning !== null}
                  onClick={() => triggerCustomerWorkflow('wf01', selectedCustomer)}
                  className="flex flex-col items-start rounded-xl border border-indigo-200 bg-white p-3 text-left hover:border-indigo-400 hover:shadow-xs disabled:opacity-50 transition-all"
                >
                  <span className="text-xs font-bold text-indigo-700">
                    {workflowRunning === 'wf01' ? '⏳ Đang gọi AI...' : '📞 Gọi Thoại AI (WF-01)'}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5">
                    Chạy thật n8n + Phát giọng nói AI
                  </span>
                </button>

                <button
                  type="button"
                  disabled={workflowRunning !== null}
                  onClick={() => triggerCustomerWorkflow('wf03', selectedCustomer)}
                  className="flex flex-col items-start rounded-xl border border-violet-200 bg-white p-3 text-left hover:border-violet-400 hover:shadow-xs disabled:opacity-50 transition-all"
                >
                  <span className="text-xs font-bold text-violet-700">
                    {workflowRunning === 'wf03' ? '⏳ Đang điều phối...' : '🤖 Điều Phối AI (WF-03)'}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5">
                    Gemini 3.8 + Tạo Báo giá thật
                  </span>
                </button>

                <button
                  type="button"
                  disabled={workflowRunning !== null}
                  onClick={() =>
                    triggerCustomerWorkflow(
                      'wf03',
                      selectedCustomer,
                      `Yêu cầu sinh Báo giá PDF cá nhân hóa (WF-14) cho ${selectedCustomer.company_name || selectedCustomer.first_name || 'khách hàng'}.`,
                    )
                  }
                  className="flex flex-col items-start rounded-xl border border-emerald-200 bg-white p-3 text-left hover:border-emerald-400 hover:shadow-xs disabled:opacity-50 transition-all"
                >
                  <span className="text-xs font-bold text-emerald-700">📄 Tạo Báo Giá (WF-14)</span>
                  <span className="text-[11px] text-slate-500 mt-0.5">Đẩy thẳng sang Phê duyệt</span>
                </button>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setSelectedCustomer(null);
                  setActionSuccessMessage('');
                }}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors"
              >
                Đóng hồ sơ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                  Direct CRM Entry
                </span>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Thêm Hồ Sơ Khách Hàng Tiềm Năng
                </h3>
                <p className="text-xs text-slate-500">
                  Khởi tạo trực tiếp vào cơ sở dữ liệu PostgreSQL của tổ chức.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {addLeadSuccess && (
              <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-semibold text-emerald-800">
                {addLeadSuccess}
              </div>
            )}

            {addLeadError && (
              <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-semibold text-rose-700">
                {addLeadError}
              </div>
            )}

            <form onSubmit={handleCreateLead} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên đệm *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn"
                    value={newLead.firstName}
                    onChange={(e) => setNewLead({ ...newLead, firstName: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tên *</label>
                  <input
                    type="text"
                    required
                    placeholder="An"
                    value={newLead.lastName}
                    onChange={(e) => setNewLead({ ...newLead, lastName: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên công ty / Tổ chức</label>
                <input
                  type="text"
                  placeholder="Công ty Cổ phần Công nghệ..."
                  value={newLead.companyName}
                  onChange={(e) => setNewLead({ ...newLead, companyName: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email liên hệ *</label>
                <input
                  type="email"
                  required
                  placeholder="contact@doanhnghiep.vn"
                  value={newLead.email}
                  onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại</label>
                <input
                  type="tel"
                  placeholder="+84 905 123 456"
                  value={newLead.phone}
                  onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
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
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {submittingLead ? 'Đang lưu...' : 'Lưu hồ sơ khách hàng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
