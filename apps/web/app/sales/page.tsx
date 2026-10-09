import LogoutButton from './LogoutButton';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ApprovalList from './ApprovalList';
import CustomerList from './CustomerList';
export default async function SalesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('sale_session')?.value;

  if (!token) {
    redirect('/login');
  }

  let authenticated = false;

  try {
    const response = await fetch(
      'http://api:3000/api/v1/auth/me',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      }
    );

    authenticated = response.ok;
  } catch {
    authenticated = false;
  }

  if (!authenticated) {
    redirect('/login');
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
          <p className="font-semibold text-indigo-600">
            AI SALES AGENT
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Sales Workspace
          </h1>
          <p className="mt-2 text-slate-500">
            Quản lý khách hàng, xem đề xuất AI và phê duyệt báo giá.
          </p>
        </div>
          <LogoutButton />
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {[
            ["Khách hàng", "Đang tải dữ liệu"],
            ["Báo giá chờ duyệt", "Chưa có dữ liệu"],
            ["AI Next Best Action", "Chưa có đề xuất"],
          ].map(([title, description]) => (
            <div
              key={title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-slate-900">
                {title}
              </h2>
              <p className="mt-3 text-sm text-slate-500">
                {description}
              </p>
            </div>
          ))}
        </div>
        <CustomerList />
        <ApprovalList />
      </div>
    </main>
  );
}
