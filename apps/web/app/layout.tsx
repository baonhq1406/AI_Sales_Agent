import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Sales Agent',
  description: 'AI Sales Agent & Customer 360 Capstone',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body style={{ margin: 0, fontFamily: 'Arial, sans-serif', background: '#f5f7fb', color: '#111827' }}>{children}</body></html>;
}
