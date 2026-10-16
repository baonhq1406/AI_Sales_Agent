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
  let currentUser: { id?: string; role?: string; displayName?: string; email?: string } | null = null;

  try {
    const apiUrl = getInternalApiUrl();
    const response = await fetch(`${apiUrl}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

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
    <main className="min-h-screen bg-slate-50/70 py-6 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SalesDashboard currentUser={currentUser} />
      </div>
    </main>
  );
}
