'use client';

import { useState } from 'react';

export default function AIInsights() {
  const [insights, setInsights] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function analyze() {
    if (loading) return;

    setLoading(true);
    setError('');
    setInsights('');

    try {
      const response = await fetch('/api/dashboard/insights', {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof result.error === 'string'
            ? result.error
            : 'Không thể phân tích dữ liệu'
        );
      }

      const content = result.data?.insights ?? result.insights;

      if (typeof content !== 'string' || !content.trim()) {
        throw new Error('AI không trả về nội dung');
      }

      setInsights(content);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Có lỗi xảy ra'
      );
    } finally {
      setLoading(false);
    }
  }

  function cleanText(text: string) {
    return text
      .replace(/\*\*/g, '')
      .replace(/\s+- (?=\S)/g, '\n- ')
      .replace(/\s+\*(?=[^\s*])/g, '\n- ');
  }

  return (
    <section style={{
      marginTop: 32,
      background: 'white',
      borderRadius: 16,
      padding: 28,
      boxShadow: '0 4px 16px rgba(0,0,0,0.05)'
    }}>
      <h2 style={{
        fontSize: 24,
        fontWeight: 700,
        marginBottom: 12
      }}>
        ✨ AI Business Insights
      </h2>

      <p style={{ color: '#64748b', marginBottom: 20 }}>
        Phân tích dữ liệu kinh doanh bằng Groq AI
        và đề xuất hành động phù hợp.
      </p>

      <button
        type="button"
        onClick={analyze}
        disabled={loading}
        style={{
          background: loading ? '#94a3b8' : '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: 10,
          padding: '12px 24px',
          fontSize: 15,
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? '⏳ AI đang phân tích...' : '✨ Phân tích bằng AI'}
      </button>

      {error && (
        <p role="alert" style={{ color: '#dc2626', marginTop: 16 }}>
          {error}
        </p>
      )}

      {insights && (
        <div style={{
          marginTop: 24,
          background: '#f8fafc',
          borderRadius: 12,
          padding: 24,
          borderLeft: '4px solid #2563eb'
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
            Kết quả phân tích
          </h3>

          <div style={{
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
            lineHeight: 1.9,
            fontSize: 15,
            color: '#334155'
          }}>
            {cleanText(insights)}
          </div>
        </div>
      )}
    </section>
  );
}
