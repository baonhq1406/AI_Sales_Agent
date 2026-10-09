'use client';

import { useEffect, useState } from 'react';

type Customer = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  score: number | null;
};

export default function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/sales/leads')
      .then(async (res) => {
        if (!res.ok) throw new Error('Không thể tải khách hàng');
        return res.json();
      })
      .then((result) => setCustomers(result.data ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter((customer) => {
    const value = [
      customer.first_name,
      customer.last_name,
      customer.company_name,
      customer.email,
    ].join(' ').toLowerCase();

    return value.includes(search.toLowerCase());
  });

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Danh sách khách hàng
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Tổng cộng: {customers.length} khách hàng
          </p>
        </div>

        <input
          type="text"
          placeholder="Tìm tên, công ty, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-indigo-500 sm:w-72"
        />
      </div>

      {loading && <p>Đang tải danh sách khách hàng...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="p-3">Khách hàng</th>
                <th className="p-3">Công ty</th>
                <th className="p-3">Email</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3">Điểm Lead</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((customer) => (
                <tr key={customer.id} className="border-b border-slate-100">
                  <td className="p-3 font-medium">
                    {[customer.first_name, customer.last_name]
                      .filter(Boolean).join(' ') || 'Chưa có tên'}
                  </td>
                  <td className="p-3">{customer.company_name || '—'}</td>
                  <td className="p-3">{customer.email || '—'}</td>
                  <td className="p-3">{customer.status}</td>
                  <td className="p-3">{customer.score ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <p className="py-6 text-center text-slate-500">
              Không tìm thấy khách hàng phù hợp.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
