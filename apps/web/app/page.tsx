const services = [
  ['NestJS API', 'http://localhost:3000/api/v1/health', 'Core API Gateway'],
  ['PostgreSQL', 'localhost:5432', 'Shared state + pgvector'],
  ['n8n', 'http://localhost:5678', 'Automation / Orchestration'],
  ['Next.js', 'http://localhost:3001', 'Dashboard / Human approval'],
];

export default function HomePage() {
  return <main style={{ maxWidth: 1100, margin: '0 auto', padding: 48 }}>
    <p style={{ fontWeight: 700, color: '#4f46e5' }}>AI SALES AGENT & CUSTOMER 360</p>
    <h1 style={{ fontSize: 42 }}>Foundation Dashboard</h1>
    <p style={{ color: '#6b7280', maxWidth: 720 }}>Sprint 1 baseline: NestJS + Next.js + n8n + PostgreSQL/pgvector. Các workflow AI sẽ được tích hợp theo Product Backlog.</p>
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16, marginTop: 32 }}>
      {services.map(([name, endpoint, purpose]) => <article key={name} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 20 }}>
        <h2>{name}</h2><p style={{ color: '#6b7280' }}>{purpose}</p><code>{endpoint}</code>
      </article>)}
    </section>
  </main>;
}
