'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

type ThreatLevel = 'LOW' | 'MEDIUM' | 'HIGH';

type Evidence = {
  id: string;
  title: string;
  source?: string;
  publishedAt: string;
  url: string;
};

type CompetitorFinding = {
  name: string;
  headline: string;
  keyMoves: string[];
  threatLevel: ThreatLevel;
  evidence: Evidence[];
  articleCount: number;
};

type StrategyReport = {
  period: { from: string; to: string; days: number };
  executiveSummary: string;
  competitors: CompetitorFinding[];
  opportunities: string[];
  risks: string[];
  recommendedActions: string[];
  overallThreat: ThreatLevel;
};

type ReportDocument = {
  id: string;
  file_name: string;
  extracted_text: string;
  metadata: {
    title?: string;
    report?: StrategyReport;
    articleCount?: number;
    articles?: { name: string; articles: Evidence[] }[];
    competitors?: string[];
    trigger?: 'schedule' | 'webhook';
  };
  created_at: string;
};

type WorkflowRun = {
  id: string;
  status: string;
  correlation_id?: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  error?: Record<string, unknown> | null;
  started_at: string;
  finished_at?: string | null;
};

type RunStatusResponse = WorkflowRun | null;

type DashboardData = {
  competitors: string[];
  reports: ReportDocument[];
  runs: WorkflowRun[];
};

type ApiError = {
  error?: string | { message?: string | string[] };
  message?: string | string[];
};

const THREAT_LABELS: Record<ThreatLevel, string> = {
  LOW: 'Thấp',
  MEDIUM: 'Trung bình',
  HIGH: 'Cao',
};

const THREAT_STYLES: Record<ThreatLevel, string> = {
  LOW: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  MEDIUM: 'bg-amber-50 text-amber-700 ring-amber-200',
  HIGH: 'bg-rose-50 text-rose-700 ring-rose-200',
};

function messageFrom(payload: ApiError, fallback: string) {
  const message =
    typeof payload.error === 'object' && payload.error !== null
      ? payload.error.message
      : payload.error || payload.message;
  if (Array.isArray(message)) return message.join(', ');
  return typeof message === 'string' && message ? message : fallback;
}

function formatDate(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatDateTime(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isThreatLevel(value: unknown): value is ThreatLevel {
  return value === 'LOW' || value === 'MEDIUM' || value === 'HIGH';
}

function ThreatBadge({ level }: { level?: string }) {
  const threat = isThreatLevel(level) ? level : 'LOW';
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${THREAT_STYLES[threat]}`}>
      Đe dọa {THREAT_LABELS[threat]}
    </span>
  );
}

function ArticleLink({ article }: { article: Evidence }) {
  let safeUrl = '';
  try {
    const url = new URL(article.url);
    if (url.protocol === 'https:' || url.protocol === 'http:') safeUrl = url.toString();
  } catch {
    safeUrl = '';
  }

  return (
    <li className="flex items-start gap-2 text-sm">
      <span className="mt-1 text-indigo-500">↗</span>
      <div className="min-w-0">
        {safeUrl ? (
          <a
            href={safeUrl}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-slate-800 underline decoration-slate-300 underline-offset-2 hover:text-indigo-700"
          >
            {article.title}
          </a>
        ) : (
          <span className="font-semibold text-slate-800">{article.title}</span>
        )}
        <p className="mt-0.5 text-xs text-slate-500">
          {[article.source, formatDate(article.publishedAt)].filter(Boolean).join(' · ')}
        </p>
      </div>
    </li>
  );
}

export default function CompetitorMonitor() {
  const [data, setData] = useState<DashboardData>({
    competitors: [],
    reports: [],
    runs: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [draftName, setDraftName] = useState('');
  const [days, setDays] = useState(7);
  const [selectedReportId, setSelectedReportId] = useState('');
  const [pendingCorrelationId, setPendingCorrelationId] = useState('');
  const pendingBaselineRunIds = useRef<string[]>([]);
  const pendingCompetitors = useRef<string[]>([]);

  const loadData = useCallback(async () => {
    try {
      const response = await fetch('/api/sales/wf11', { cache: 'no-store' });
      const payload = (await response.json()) as DashboardData & ApiError;
      if (!response.ok) throw new Error(messageFrom(payload, 'Không thể tải dữ liệu WF-11.'));
      setData({
        competitors: Array.isArray(payload.competitors) ? payload.competitors : [],
        reports: Array.isArray(payload.reports) ? payload.reports : [],
        runs: Array.isArray(payload.runs) ? payload.runs : [],
      });
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Không thể tải dữ liệu WF-11.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!pendingCorrelationId) return;

    let active = true;
    let attempts = 0;
    let consecutiveFailures = 0;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        const statusResponse = await fetch(
          `/api/sales/wf11?correlationId=${encodeURIComponent(pendingCorrelationId)}`,
          { cache: 'no-store' },
        );
        if (!statusResponse.ok) throw new Error('Không thể tải trạng thái WF-11.');
        let currentRun = (await statusResponse.json()) as RunStatusResponse;
        if (!active) return;
        consecutiveFailures = 0;

        let latest: DashboardData | null = null;
        if (!currentRun || currentRun.status === 'running') {
          const response = await fetch('/api/sales/wf11', { cache: 'no-store' });
          if (!response.ok) throw new Error('Không thể tải lịch sử WF-11.');
          latest = (await response.json()) as DashboardData;
          if (!active) return;
          const fallbackRun = latest.runs
            ?.filter(
              (run) =>
                !pendingBaselineRunIds.current.includes(run.id) &&
                run.input?.trigger === 'webhook' &&
                Array.isArray(run.input?.competitors) &&
                JSON.stringify(run.input.competitors) ===
                  JSON.stringify(pendingCompetitors.current),
            )
            .sort((left, right) => right.started_at.localeCompare(left.started_at))[0];
          if (fallbackRun && fallbackRun.status !== 'running') {
            currentRun = fallbackRun;
          }
        } else {
          const response = await fetch('/api/sales/wf11', { cache: 'no-store' });
          if (!response.ok) throw new Error('Không thể tải báo cáo WF-11.');
          latest = (await response.json()) as DashboardData;
          if (!active) return;
        }

        if (latest) {
          setData({
            competitors: Array.isArray(latest.competitors) ? latest.competitors : [],
            reports: Array.isArray(latest.reports) ? latest.reports : [],
            runs: Array.isArray(latest.runs) ? latest.runs : [],
          });
        }
        if (currentRun && currentRun.status !== 'running') {
          setPendingCorrelationId('');
          pendingBaselineRunIds.current = [];
          pendingCompetitors.current = [];
          if (currentRun.status === 'success') {
            setSelectedReportId('');
            setNotice('Báo cáo mới đã sẵn sàng bên dưới.');
          } else if (currentRun.status === 'skipped') {
            setNotice('WF-11 đã hoàn tất nhưng không tạo báo cáo mới cho lượt chạy này.');
          } else {
            setError('WF-11 chưa hoàn tất thành công. Hãy xem trạng thái lượt chạy bên dưới.');
          }
          return;
        }
      } catch (caught) {
        if (!active) return;
        consecutiveFailures += 1;
        if (consecutiveFailures >= 10) {
          setPendingCorrelationId('');
          pendingBaselineRunIds.current = [];
          pendingCompetitors.current = [];
          setError(
            caught instanceof Error
              ? `Không thể kiểm tra trạng thái WF-11: ${caught.message}`
              : 'Không thể kiểm tra trạng thái WF-11. Hãy tải lại dữ liệu.',
          );
          return;
        }
      }

      attempts += 1;
      if (attempts >= 60) {
        setPendingCorrelationId('');
        pendingBaselineRunIds.current = [];
        pendingCompetitors.current = [];
        setNotice('Chưa tìm thấy trạng thái của lượt chạy này trong 3 phút. Hãy tải lại để kiểm tra lịch sử WF-11.');
        return;
      }
      timer = setTimeout(poll, 3000);
    };

    timer = setTimeout(poll, 1000);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [pendingCorrelationId]);

  const selectedReport = useMemo(
    () =>
      data.reports.find((report) => report.id === selectedReportId) ||
      data.reports[0],
    [data.reports, selectedReportId],
  );
  const report = selectedReport?.metadata?.report;

  async function saveCompetitorList(competitors: string[]) {
    const response = await fetch('/api/sales/wf11', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ competitors }),
    });
    const payload = (await response.json()) as ApiError & { competitors?: string[] };
    if (!response.ok) throw new Error(messageFrom(payload, 'Không thể lưu danh sách đối thủ.'));
    return Array.isArray(payload.competitors) ? payload.competitors : competitors;
  }

  async function addCompetitor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = draftName.trim();
    if (!name) return;
    if (name.length > 80) {
      setError('Tên đối thủ không được vượt quá 80 ký tự.');
      return;
    }
    if (data.competitors.some((competitor) => competitor.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      setError('Đối thủ này đã có trong danh sách theo dõi.');
      return;
    }
    if (data.competitors.length >= 8) {
      setError('WF-11 hỗ trợ tối đa 8 đối thủ mỗi tổ chức.');
      return;
    }
    const previous = data.competitors;
    const next = [...previous, name];
    setData((current) => ({ ...current, competitors: next }));
    setDraftName('');
    setError('');
    setNotice('');
    setSaving(true);
    try {
      const saved = await saveCompetitorList(next);
      setData((current) => ({ ...current, competitors: saved }));
      setNotice('Đã thêm và lưu đối thủ. Lịch tuần sẽ sử dụng danh sách này.');
    } catch (caught) {
      setData((current) => ({ ...current, competitors: previous }));
      setError(caught instanceof Error ? caught.message : 'Không thể lưu danh sách đối thủ.');
    } finally {
      setSaving(false);
    }
  }

  async function removeCompetitor(name: string) {
    const previous = data.competitors;
    const next = previous.filter((competitor) => competitor !== name);
    if (!next.length) {
      setError('Cần theo dõi ít nhất một đối thủ.');
      return;
    }
    setData((current) => ({ ...current, competitors: next }));
    setError('');
    setNotice('');
    setSaving(true);
    try {
      const saved = await saveCompetitorList(next);
      setData((current) => ({ ...current, competitors: saved }));
      setNotice('Đã xóa và lưu đối thủ. Lịch tuần sẽ sử dụng danh sách mới.');
    } catch (caught) {
      setData((current) => ({ ...current, competitors: previous }));
      setError(caught instanceof Error ? caught.message : 'Không thể lưu danh sách đối thủ.');
    } finally {
      setSaving(false);
    }
  }

  async function saveCompetitors() {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/sales/wf11', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitors: data.competitors }),
      });
      const payload = (await response.json()) as ApiError & { competitors?: string[] };
      if (!response.ok) throw new Error(messageFrom(payload, 'Không thể lưu danh sách đối thủ.'));
      if (Array.isArray(payload.competitors)) {
        setData((current) => ({ ...current, competitors: payload.competitors! }));
      }
      setNotice('Đã lưu danh sách. Lịch chạy tuần sẽ sử dụng cấu hình này.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Không thể lưu danh sách đối thủ.');
    } finally {
      setSaving(false);
    }
  }

  async function runAnalysis() {
    setRunning(true);
    setError('');
    setNotice('');
    try {
      const beforeResponse = await fetch('/api/sales/wf11', { cache: 'no-store' });
      if (beforeResponse.ok) {
        const before = (await beforeResponse.json()) as DashboardData;
        pendingBaselineRunIds.current = (before.runs || []).map((run) => run.id);
      } else {
        pendingBaselineRunIds.current = [];
      }

      const correlationId = crypto.randomUUID();
      pendingCompetitors.current = [...data.competitors];
      const response = await fetch('/api/sales/wf11', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitors: data.competitors, days, correlationId }),
      });
      const payload = (await response.json()) as ApiError;
      if (!response.ok) {
        pendingBaselineRunIds.current = [];
        pendingCompetitors.current = [];
        throw new Error(messageFrom(payload, 'Không thể chạy phân tích đối thủ.'));
      }

      setNotice('WF-11 đã nhận yêu cầu. Đang thu thập tin và tạo báo cáo…');
      setPendingCorrelationId(correlationId);
      await loadData();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Không thể chạy phân tích đối thủ.');
    } finally {
      setRunning(false);
      await loadData();
    }
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 p-6 text-white shadow-xl shadow-indigo-950/10 sm:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-200">Competitive intelligence · WF-11</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Theo dõi động thái đối thủ</h2>
            <p className="mt-2 text-sm leading-6 text-indigo-100">
              Thu thập tiêu đề tin công khai từ Google News RSS, đối chiếu bằng chứng và tạo báo cáo chiến lược tiếng Việt.
              Cấu hình đã lưu sẽ được lịch tuần sử dụng tự động.
            </p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
            <p className="text-xs font-semibold text-indigo-200">Lịch tự động</p>
            <p className="mt-1 text-sm font-bold">Thứ Hai · 07:00 (múi giờ n8n)</p>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-slate-900">Danh sách theo dõi</h3>
              <p className="mt-1 text-sm text-slate-500">Thêm hoặc bỏ đối thủ; tối đa 8 tên cho mỗi tổ chức.</p>
            </div>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
              {data.competitors.length}/8
            </span>
          </div>

          <form onSubmit={addCompetitor} className="mt-4 flex gap-2">
            <input
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              maxLength={80}
              placeholder="Ví dụ: HubSpot, Salesforce…"
              aria-label="Tên đối thủ cần theo dõi"
              className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            <button
              type="submit"
              disabled={saving || running || pendingCorrelationId !== '' || data.competitors.length >= 8}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Thêm
            </button>
          </form>

          <ul className="mt-4 flex min-h-16 flex-wrap content-start gap-2">
            {data.competitors.map((name) => (
              <li key={name}>
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 py-1.5 pl-3 pr-1.5 text-sm font-semibold text-slate-700">
                  {name}
                  <button
                    type="button"
                    disabled={saving || running || pendingCorrelationId !== ''}
                    onClick={() => void removeCompetitor(name)}
                    aria-label={`Bỏ ${name} khỏi danh sách`}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-slate-500 hover:bg-rose-100 hover:text-rose-700"
                  >
                    ×
                  </button>
                </span>
              </li>
            ))}
            {!data.competitors.length && (
              <li className="text-sm text-slate-500">Hãy thêm ít nhất một đối thủ để bắt đầu.</li>
            )}
          </ul>

          <label className="mt-4 block text-xs font-bold text-slate-600">
            Khoảng thời gian tin tức
            <select
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-800"
            >
              {[3, 7, 14, 30].map((period) => (
                <option key={period} value={period}>{period} ngày gần nhất</option>
              ))}
            </select>
          </label>

          {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
          {notice && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => void saveCompetitors()}
              disabled={saving || running || loading || data.competitors.length === 0}
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {saving ? 'Đang lưu…' : 'Lưu cấu hình'}
            </button>
            <button
              type="button"
              onClick={() => void runAnalysis()}
              disabled={running || pendingCorrelationId !== '' || loading || data.competitors.length === 0}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-extrabold text-white shadow-md shadow-indigo-600/20 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50"
            >
              {running ? 'Đang gửi yêu cầu…' : pendingCorrelationId ? 'Đang chờ WF-11 hoàn tất…' : 'Chạy phân tích ngay'}
            </button>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-slate-900">Báo cáo chiến lược</h3>
              <p className="mt-1 text-sm text-slate-500">WF-11 tạo báo cáo và lưu cùng các nguồn tin dẫn chứng.</p>
            </div>
            {data.reports.length > 1 && (
              <select
                value={selectedReport?.id || ''}
                onChange={(event) => setSelectedReportId(event.target.value)}
                aria-label="Chọn báo cáo"
                className="max-w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
              >
                {data.reports.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.metadata?.title || item.file_name} · {formatDate(item.created_at)}
                  </option>
                ))}
              </select>
            )}
          </div>

          {loading ? (
            <p className="mt-6 animate-pulse text-sm text-slate-500">Đang tải báo cáo…</p>
          ) : !report ? (
            <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <span className="text-3xl">📰</span>
              <p className="mt-2 text-sm font-bold text-slate-700">Chưa có báo cáo chiến lược</p>
              <p className="mt-1 text-xs text-slate-500">Lưu danh sách đối thủ rồi chọn “Chạy phân tích ngay”.</p>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-3">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Kỳ báo cáo</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {formatDate(report.period?.from)} – {formatDate(report.period?.to)}
                    <span className="ml-2 text-xs font-medium text-slate-500">
                      · {selectedReport?.metadata?.articleCount ?? 0} tiêu đề
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Tạo lúc {formatDateTime(selectedReport?.created_at)} ·{' '}
                    {selectedReport?.metadata.trigger === 'schedule' ? 'Lịch tự động' : 'Chạy thủ công'}
                  </p>
                </div>
                <ThreatBadge level={report.overallThreat} />
              </div>

              {!!selectedReport?.metadata.competitors?.length && (
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-indigo-800">
                    Đối thủ được phân tích trong báo cáo này
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selectedReport.metadata.competitors.map((name) => (
                      <span key={name} className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-indigo-900 ring-1 ring-indigo-100">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Tóm tắt điều hành</h4>
                <p className="mt-2 text-sm leading-6 text-slate-700">{report.executiveSummary}</p>
              </div>

              <div className="space-y-3">
                {report.competitors?.map((competitor) => {
                  const articles =
                    selectedReport?.metadata.articles?.find((item) => item.name === competitor.name)?.articles ||
                    competitor.evidence ||
                    [];
                  return (
                    <article key={competitor.name} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="font-extrabold text-slate-900">{competitor.name}</h4>
                        <ThreatBadge level={competitor.threatLevel} />
                      </div>
                      <p className="mt-2 text-sm leading-5 text-slate-600">{competitor.headline}</p>
                      {!!competitor.keyMoves?.length && (
                        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-700">
                          {competitor.keyMoves.map((move, index) => <li key={`${index}-${move}`}>{move}</li>)}
                        </ul>
                      )}
                      {!!articles.length && (
                        <details className="mt-3">
                          <summary className="cursor-pointer text-xs font-bold text-indigo-700">
                            Xem {articles.length} tiêu đề đã thu thập · {competitor.evidence?.length || 0} nguồn được trích dẫn
                          </summary>
                          <ul className="mt-3 space-y-3 border-t border-slate-100 pt-3">
                            {articles.map((article) => <ArticleLink key={article.id} article={article} />)}
                          </ul>
                        </details>
                      )}
                    </article>
                  );
                })}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { title: 'Cơ hội', values: report.opportunities, style: 'bg-emerald-50 text-emerald-900' },
                  { title: 'Rủi ro', values: report.risks, style: 'bg-amber-50 text-amber-900' },
                  { title: 'Hành động đề xuất', values: report.recommendedActions, style: 'bg-indigo-50 text-indigo-900' },
                ].map((section) => (
                  <div key={section.title} className={`rounded-xl p-3 ${section.style}`}>
                    <h4 className="text-xs font-extrabold uppercase tracking-wide">{section.title}</h4>
                    <ul className="mt-2 space-y-1.5 text-xs leading-5">
                      {section.values?.length
                        ? section.values.map((item, index) => <li key={`${index}-${item}`}>• {item}</li>)
                        : <li>Chưa có đề xuất.</li>}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-slate-900">Lượt thu thập gần đây</h3>
            <p className="mt-1 text-xs text-slate-500">Theo dõi trạng thái các lần chạy thủ công và theo lịch.</p>
          </div>
          <button type="button" onClick={() => void loadData()} className="text-xs font-bold text-indigo-700 hover:text-indigo-900">
            Tải lại
          </button>
        </div>
        {!data.runs.length ? (
          <p className="mt-4 text-sm text-slate-500">Chưa có lượt chạy nào.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {data.runs.slice(0, 8).map((run) => (
              <li key={run.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {run.status === 'running' ? 'Đang thu thập' : run.status === 'success' ? 'Hoàn tất' : run.status === 'skipped' ? 'Đã bỏ qua' : run.status === 'failed' ? 'Thất bại' : run.status}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatDateTime(run.started_at)} · {run.input?.trigger === 'schedule' ? 'Lịch tự động' : 'Chạy thủ công'}
                  </p>
                  {Array.isArray(run.input?.competitors) && (
                    <p className="mt-1 text-xs text-slate-600">
                      Phân tích: {(run.input.competitors as string[]).join(', ')}
                    </p>
                  )}
                  {typeof run.output?.reason === 'string' && (
                    <p className="mt-1 text-xs text-slate-500">Kết quả: {run.output.reason}</p>
                  )}
                  {run.status === 'failed' && run.error && (
                    <p className="mt-1 text-xs text-rose-700">
                      {typeof run.error.message === 'string' ? run.error.message : 'WF-11 gặp lỗi trong quá trình chạy.'}
                    </p>
                  )}
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                  run.status === 'success' ? 'bg-emerald-50 text-emerald-700' :
                  run.status === 'running' ? 'bg-blue-50 text-blue-700' :
                  run.status === 'failed' ? 'bg-rose-50 text-rose-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {run.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
