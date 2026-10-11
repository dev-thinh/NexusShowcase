import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NexusShowcase - Academic Club Portfolio',
  description: 'Trưng bày bài báo khoa học, dự án công nghệ và thành tích CLB',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
