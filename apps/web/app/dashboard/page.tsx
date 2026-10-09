'use client';

import { useEffect, useState } from 'react';
import DashboardCharts from './DashboardCharts';
import AIInsights from './AIInsights';

type DashboardData = {
  total_leads: number;
  total_interactions: number;
  avg_lead_score: string | null;
  avg_health_score: string | null;
  high_churn_customers: number;
  pending_tasks: number;
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/dashboard/overview')
      .then(async (res) => {
        if (!res.ok) throw new Error('Không thể tải dữ liệu');
        return res.json();
      })
      .then((result) => setData(result.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { title: 'Khách hàng tiềm năng', value: data?.total_leads },
    { title: 'Tổng lượt tương tác', value: data?.total_interactions },
    { title: 'Điểm Lead trung bình', value: data?.avg_lead_score },
    { title: 'Sức khỏe khách hàng', value: data?.avg_health_score },
    { title: 'Nguy cơ rời bỏ cao', value: data?.high_churn_customers },
    { title: 'Tác vụ đang chờ', value: data?.pending_tasks },
  ];

  return (
    <main style={{ maxWidth: 1200, margin: 'auto', padding: 32 }}>
      <h1 style={{ fontSize: 32, marginBottom: 8 }}>
        AI Sales Analytics
      </h1>

      <p style={{ color: '#64748b', marginBottom: 32 }}>
        Tổng quan hiệu suất kinh doanh và khách hàng
      </p>

      {loading && <p>Đang tải dữ liệu...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && data && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 20
        }}>
          {cards.map((card) => (
            <div key={card.title} style={{
              background: 'white',
              borderRadius: 16,
              padding: 24,
              boxShadow: '0 4px 16px rgba(0,0,0,0.05)'
            }}>
              <p style={{ color: '#64748b', fontSize: 14 }}>
                {card.title}
              </p>
              <h2 style={{ fontSize: 30, marginTop: 12 }}>
                {card.value ?? 'Chưa có dữ liệu'}
              </h2>
            </div>
          ))}
        </div>
      )}
      <DashboardCharts />
      <AIInsights />
    </main>
  );
}
