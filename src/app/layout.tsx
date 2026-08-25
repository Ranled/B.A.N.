import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#0a0f1e',
};

export const metadata: Metadata = {
  title: 'B.A.N. — Brilliant Artificial Navigator',
  description:
    'Your AI-powered monitoring assistant. Stay on top of tasks, projects, and deadlines with real-time insights.',
  keywords: ['AI assistant', 'task monitor', 'productivity', 'Supabase', 'B.A.N.'],
  authors: [{ name: 'B.A.N.' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased bg-navy-950 text-slate-100 min-h-screen overflow-x-hidden">
        {children}
        <Toaster
          position="top-right"
          theme="dark"
          toastOptions={{
            style: {
              background: 'rgba(13,21,38,0.95)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#f1f5f9',
              backdropFilter: 'blur(20px)',
            },
          }}
        />
      </body>
    </html>
  );
}
