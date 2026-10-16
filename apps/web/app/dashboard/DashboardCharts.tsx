'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

type ChartItem = {
  total: number;
  status?: string;
  channel?: string;
};

type ChartsData = {
  leads_by_status: ChartItem[];
  interactions_by_channel: ChartItem[];
};

const PIE_COLORS = ['#4f46e5', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4', '#f43f5e'];

const STATUS_LABELS: Record<string, string> = {
  new: 'Mới tiếp nhận',
  contacted: 'Đã liên hệ',
  qualified: 'Đủ điều kiện',
  proposal_sent: 'Đã gửi báo giá',
  won: 'Chốt thành công',
  lost: 'Tạm dừng',
};

const CHANNEL_LABELS: Record<string, string> = {
  voice: 'Voice AI (Twilio)',
  web: 'Web Form (WF-07)',
  form: 'Web Form (WF-07)',
  email: 'Email Triage',
  chat: 'Live Chat AI',
};

export default function DashboardCharts({ refreshKey = 0 }: { refreshKey?: number }) {
  const [data, setData] = useState<ChartsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch('/api/dashboard/charts')
      .then(async (res) => {
        if (!res.ok) throw new Error('Không thể tải dữ liệu biểu đồ');
        return res.json();
      })
      .then((result) => {
        setData(result.data);
        setError('');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        {[1, 2].map((n) => (
          <div
            key={n}
            className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs"
          >
            <div className="h-5 w-48 rounded-md animate-shimmer mb-2" />
            <div className="h-3 w-64 rounded-md animate-shimmer mb-6" />
            <div className="h-64 w-full rounded-2xl animate-shimmer" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const rawLeads = data.leads_by_status || [];
  const rawInteractions = data.interactions_by_channel || [];

  const totalLeads = rawLeads.reduce((acc, curr) => acc + Number(curr.total || 0), 0);
  const totalInteractions = rawInteractions.reduce((acc, curr) => acc + Number(curr.total || 0), 0);

  const formattedLeads = rawLeads.map((item) => {
    const key = (item.status || '').toLowerCase();
    return {
      ...item,
      total: Number(item.total || 0),
      displayName: STATUS_LABELS[key] || item.status || 'Khác',
    };
  });

  const formattedInteractions = rawInteractions.map((item) => {
    const key = (item.channel || '').toLowerCase();
    return {
      ...item,
      total: Number(item.total || 0),
      displayName: CHANNEL_LABELS[key] || item.channel || 'Kênh khác',
    };
  });

  return (
    <section className="space-y-4">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Lead Status Donut Chart + Breakdown Table */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                  Conversion Funnel
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  Phân Bố Trạng Thái Khách Hàng (Leads)
                </h3>
              </div>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 border border-indigo-200/60">
                {totalLeads} tổng số
              </span>
            </div>

            {formattedLeads.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center rounded-2xl bg-slate-50/70 text-slate-400">
                <p className="text-sm font-medium">Chưa có dữ liệu phân bố Lead</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-12 items-center">
                <div className="h-60 sm:col-span-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={formattedLeads}
                        dataKey="total"
                        nameKey="displayName"
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={82}
                        paddingAngle={3}
                      >
                        {formattedLeads.map((_, index) => (
                          <Cell
                            key={index}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.98)',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px',
                          boxShadow: '0 8px 20px rgba(15,23,42,0.08)',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Custom Legend & Percentage Breakdown */}
                <div className="sm:col-span-6 space-y-2">
                  {formattedLeads.map((item, idx) => {
                    const pct = totalLeads > 0 ? Math.round((item.total / totalLeads) * 100) : 0;
                    return (
                      <div
                        key={item.displayName}
                        className="flex items-center justify-between rounded-xl bg-slate-50/80 px-3 py-2 text-xs border border-slate-100"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                          />
                          <span className="font-semibold text-slate-700 truncate">
                            {item.displayName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-extrabold text-slate-900">{item.total}</span>
                          <span className="w-9 text-right text-[11px] font-medium text-slate-400">
                            ({pct}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Tự động cập nhật theo tiến trình xử lý CRM</span>
            <span>Real-time SQL</span>
          </div>
        </div>

        {/* Channel Interactions Bar Chart */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-violet-600">
                  Omnichannel Traffic
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  Lưu Lượng Tương Tác Theo Kênh Tiếp Nhận
                </h3>
              </div>
              <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700 border border-violet-200/60">
                {totalInteractions} lượt tương tác
              </span>
            </div>

            {formattedInteractions.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center rounded-2xl bg-slate-50/70 text-slate-400">
                <p className="text-sm font-medium">Chưa có dữ liệu lượt tương tác</p>
              </div>
            ) : (
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={formattedInteractions}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="displayName"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.98)',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                        boxShadow: '0 8px 20px rgba(15,23,42,0.08)',
                      }}
                    />
                    <Bar
                      dataKey="total"
                      name="Số lượt tương tác"
                      fill="#4f46e5"
                      radius={[8, 8, 0, 0]}
                      maxBarSize={48}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Đồng bộ từ Voice AI (WF-01/02) &amp; Omnichannel Webhook (WF-07)</span>
            <span>Multi-Channel</span>
          </div>
        </div>
      </div>
    </section>
  );
}
