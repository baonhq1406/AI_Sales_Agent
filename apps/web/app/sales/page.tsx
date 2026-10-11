import LogoutButton from './LogoutButton';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import SalesDashboard from './SalesDashboard';
import { getInternalApiUrl } from '@/lib/config';

export default async function SalesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('sale_session')?.value;

  if (!token) {
    redirect('/login');
  }

  let authenticated = false;
  let currentUser: { id?: string; role?: string; displayName?: string } | null = null;

  try {
    const apiUrl = getInternalApiUrl();
    const response = await fetch(
      `${apiUrl}/auth/me`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      }
    );

    if (response.ok) {
      authenticated = true;
      const resJson = await response.json();
      currentUser = resJson.data || resJson;
    }
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

        <SalesDashboard currentUser={currentUser} />
      </div>
    </main>
  );
}
