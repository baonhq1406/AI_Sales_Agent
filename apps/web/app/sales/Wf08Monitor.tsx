'use client';

import { useCallback, useEffect, useState } from 'react';

type Enrichment = {
  status?: 'enriched' | 'partial' | 'not_found';
  provider?: string;
  enrichedAt?: string;
  jobTitle?: string | null;
  seniority?: string | null;
  company?: {
    name?: string | null;
    domain?: string | null;
    size?: string | null;
    industry?: string | null;
  } | null;
};

type Wf08Run = {
  id: string;
  status: string;
  input: { trigger?: string; leadId?: string; force?: boolean };
  output: { leadId?: string; enrichmentStatus?: string };
  error?: { message?: string; code?: string } | string | null;
  started_at: string;
  finished_at?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  company_name?: string | null;
  email?: string | null;
  enrichment?: Enrichment | null;
};

type EnrichedLead = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  company_name?: string | null;
  email?: string | null;
  enrichment: Enrichment;
  updated_at: string;
};

type Wf08Data = {
  summary: {
    total_runs: number | string;
    running: number | string;
    success: number | string;
    skipped: number | string;
    failed: number | string;
    rejected: number | string;
    last_run_at: string | null;
    enriched_leads?: number | string;
    partial_leads?: number | string;
    not_found_leads?: number | string;
  };
  runs: Wf08Run[];
  enrichedLeads: EnrichedLead[];
};

function isWf08Data(value: unknown): value is Wf08Data {
  if (!value || typeof value !== 'object') return false;
  const data = value as Partial<Wf08Data>;
  return (
    !!data.summary &&
    typeof data.summary === 'object' &&
    Array.isArray(data.runs) &&
    Array.isArray(data.enrichedLeads)
  );
}

const statusLabels: Record<string, string> = {
  running: 'Đang chạy',
  success: 'Hoàn tất',
  skipped: 'Đã bỏ qua',
  failed: 'Thất bại',
  rejected: 'Từ chối',
  enriched: 'Đủ thông tin',
  partial: 'Một phần',
  not_found: 'Không tìm thấy',
};

const statusStyles: Record<string, string> = {
  running: 'bg-blue-50 text-blue-700 ring-blue-200',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  skipped: 'bg-slate-100 text-slate-600 ring-slate-200',
  failed: 'bg-rose-50 text-rose-700 ring-rose-200',
  rejected: 'bg-amber-50 text-amber-700 ring-amber-200',
  enriched: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  partial: 'bg-amber-50 text-amber-700 ring-amber-200',
  not_found: 'bg-slate-100 text-slate-600 ring-slate-200',
};

function formatDate(value?: string | null) {
  if (!value) return 'Chưa có dữ liệu';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Chưa có dữ liệu'
    : new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date);
}

function StatusBadge({ status }: { status?: string }) {
  const normalized = status || 'unknown';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${
        statusStyles[normalized] || 'bg-slate-100 text-slate-600 ring-slate-200'
      }`}
    >
      {statusLabels[normalized] || normalized}
    </span>
  );
}

export default function Wf08Monitor() {
  const [data, setData] = useState<Wf08Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async (background = false) => {
    if (background) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await fetch('/api/sales/wf08', { cache: 'no-store' });
      const result: unknown = await response.json();
      if (!response.ok) {
        const message =
          result && typeof result === 'object' && 'error' in result
            ? String(result.error)
            : 'Không thể tải trạng thái WF-08';
        throw new Error(message);
      }
      const payload =
        result && typeof result === 'object' && 'data' in result
          ? result.data
          : result;
      if (!isWf08Data(payload)) {
        throw new Error('Dữ liệu trạng thái WF-08 không đúng định dạng');
      }
      setData(payload);
      setError('');
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Không thể tải trạng thái WF-08',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
    const interval = window.setInterval(() => void loadData(true), 30_000);
    return () => window.clearInterval(interval);
  }, [loadData]);

  const summary = data?.summary;
  const metrics = [
    { label: 'Lượt chạy', value: summary?.total_runs ?? 0, tone: 'text-slate-900' },
    { label: 'Hoàn tất', value: summary?.success ?? 0, tone: 'text-emerald-700' },
    { label: 'Đang chạy', value: summary?.running ?? 0, tone: 'text-blue-700' },
    { label: 'Lỗi', value: summary?.failed ?? 0, tone: 'text-rose-700' },
  ];

  return (
    <section className="mb-6 overflow-hidden rounded-3xl border border-indigo-100 bg-white shadow-sm shadow-indigo-950/5">
      <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-violet-900 px-5 py-5 text-white sm:px-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-xl ring-1 ring-white/15">
              ✨
            </span>
            <div>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-black">WF-08 · Tự động làm giàu lead</h2>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-1 text-[10px] font-bold text-emerald-200 ring-1 ring-emerald-300/25">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
                  Poll mỗi phút
                </span>
              </div>
              <p className="max-w-2xl text-sm leading-6 text-indigo-100/80">
                Tiếp nhận lead mới từ WF-07, tra cứu chức danh và thông tin công ty,
                sau đó đồng bộ kết quả vào hồ sơ khách hàng.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void loadData(true)}
            disabled={refreshing || loading}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-white/15 disabled:cursor-wait disabled:opacity-60"
          >
            <span className={refreshing ? 'animate-spin' : ''}>↻</span>
            {refreshing ? 'Đang cập nhật' : 'Cập nhật'}
          </button>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            'Lead mới',
            'Kiểm tra & chống trùng',
            'Tra cứu dữ liệu',
            'Cập nhật hồ sơ',
          ].map((step, index) => (
            <div
              key={step}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-black text-indigo-100">
                {index + 1}
              </span>
              <span className="text-[11px] font-semibold text-indigo-50/90">{step}</span>
              {index < 3 && <span className="ml-auto hidden text-indigo-200/60 sm:block">›</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="p-5 sm:p-7">
        {error && (
          <div
            role="alert"
            className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={() => void loadData()}
              className="font-bold underline underline-offset-2"
            >
              Thử lại
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{metric.label}</p>
              <p className={`mt-1 text-2xl font-black ${metric.tone}`}>
                {loading ? '—' : Number(metric.value).toLocaleString('vi-VN')}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Nhật ký xử lý gần đây</h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Cập nhật lần cuối: {formatDate(summary?.last_run_at)}
                </p>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">Tối đa 20 lượt</span>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-slate-100 p-6 text-center text-sm text-slate-500">
                Đang tải nhật ký WF-08…
              </div>
            ) : data?.runs.length ? (
              <div className="space-y-2">
                {data.runs.slice(0, 6).map((run) => {
                  const name =
                    [run.first_name, run.last_name].filter(Boolean).join(' ') ||
                    run.email ||
                    run.output?.leadId ||
                    run.input?.leadId ||
                    'Lead chưa xác định';
                  const errorText =
                    typeof run.error === 'string'
                      ? run.error
                      : run.error?.message || run.error?.code;
                  return (
                    <div
                      key={run.id}
                      className="flex flex-col gap-2 rounded-2xl border border-slate-100 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-bold text-slate-800">{name}</p>
                          <StatusBadge status={run.status} />
                          {run.output?.enrichmentStatus && (
                            <StatusBadge status={run.output.enrichmentStatus} />
                          )}
                        </div>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {run.company_name || run.email || 'Đang đồng bộ thông tin lead'}
                          {' · '}
                          {run.input?.trigger === 'webhook' ? 'Kích hoạt thủ công' : 'Tự động từ WF-07'}
                        </p>
                        {errorText && <p className="mt-1 truncate text-xs text-rose-600">{errorText}</p>}
                      </div>
                      <time className="shrink-0 text-[11px] font-medium text-slate-400">
                        {formatDate(run.started_at)}
                      </time>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center">
                <p className="text-sm font-semibold text-slate-700">Chưa có lượt chạy WF-08</p>
                <p className="mt-1 text-xs text-slate-500">
                  Lead được tiếp nhận từ WF-07 sẽ tự động xuất hiện tại đây.
                </p>
              </div>
            )}
          </div>

          <div>
            <div className="mb-3">
              <h3 className="text-sm font-extrabold text-slate-900">Hồ sơ vừa được làm giàu</h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Tình trạng lấy trực tiếp từ metadata của lead
              </p>
            </div>
            {loading ? (
              <div className="rounded-2xl border border-slate-100 p-6 text-center text-sm text-slate-500">
                Đang tải hồ sơ…
              </div>
            ) : data?.enrichedLeads.length ? (
              <div className="space-y-2">
                {data.enrichedLeads.slice(0, 5).map((lead) => {
                  const name =
                    [lead.first_name, lead.last_name].filter(Boolean).join(' ') ||
                    lead.email ||
                    'Lead chưa có tên';
                  const enrichment = lead.enrichment;
                  return (
                    <div key={lead.id} className="rounded-2xl border border-slate-100 px-3.5 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-800">{name}</p>
                          <p className="mt-0.5 truncate text-xs text-slate-500">
                            {enrichment.company?.name || lead.company_name || lead.email || 'Chưa có công ty'}
                          </p>
                        </div>
                        <StatusBadge status={enrichment.status} />
                      </div>
                      {(enrichment.jobTitle || enrichment.company?.industry || enrichment.company?.size) && (
                        <p className="mt-2 truncate text-xs text-indigo-700">
                          {[enrichment.jobTitle, enrichment.company?.industry, enrichment.company?.size]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      )}
                      <p className="mt-1 text-[10px] text-slate-400">
                        Làm giàu lúc {formatDate(enrichment.enrichedAt || lead.updated_at)}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center">
                <p className="text-sm font-semibold text-slate-700">Chưa có hồ sơ làm giàu</p>
                <p className="mt-1 text-xs text-slate-500">
                  Kết quả chức danh, quy mô và ngành sẽ hiển thị sau khi xử lý.
                </p>
              </div>
            )}
          </div>
        </div>

        {summary && (
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
            <span>Bỏ qua: <strong className="text-slate-700">{Number(summary.skipped).toLocaleString('vi-VN')}</strong></span>
            <span>Từ chối: <strong className="text-slate-700">{Number(summary.rejected).toLocaleString('vi-VN')}</strong></span>
            <span>
              Làm giàu đủ / một phần / không tìm thấy:{' '}
              <strong className="text-slate-700">
                {Number(summary.enriched_leads || 0)} / {Number(summary.partial_leads || 0)} / {Number(summary.not_found_leads || 0)}
              </strong>
            </span>
            <span className="ml-auto">Tự làm mới mỗi 30 giây</span>
          </div>
        )}
      </div>
    </section>
  );
}
