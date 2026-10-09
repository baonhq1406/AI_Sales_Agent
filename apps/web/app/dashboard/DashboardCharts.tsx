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
  Legend,
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

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444'];

export default function DashboardCharts() {
  const [data, setData] = useState<ChartsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/dashboard/charts')
      .then(async (res) => {
        if (!res.ok) throw new Error('Không thể tải dữ liệu biểu đồ');
        return res.json();
      })
      .then((result) => setData(result.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Đang tải biểu đồ...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!data) return null;

  const leads = data.leads_by_status;
  const interactions = data.interactions_by_channel;

  const chartStyle = {
    background: 'white',
    padding: 24,
    borderRadius: 16,
    boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
    minWidth: 0,
  };

  return (
    <section style={{ marginTop: 36 }}>
      <h2 style={{ fontSize: 24, marginBottom: 20 }}>
        Phân tích dữ liệu kinh doanh
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 20,
      }}>
        <div style={chartStyle}>
          <h3>Trạng thái khách hàng</h3>

          {leads.length === 0 ? (
            <p>Chưa có dữ liệu</p>
          ) : (
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leads}
                    dataKey="total"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label
                  >
                    {leads.map((_, index) => (
                      <Cell
                        key={index}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div style={chartStyle}>
          <h3>Kênh tương tác khách hàng</h3>

          {interactions.length === 0 ? (
            <p>Chưa có dữ liệu</p>
          ) : (
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={interactions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="channel" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar
                    dataKey="total"
                    name="Lượt tương tác"
                    fill="#2563eb"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
