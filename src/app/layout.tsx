import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { PageReveal } from '@/components/page-reveal';
import { DialogProvider } from '@/components/dialog-provider';
import { NavigationTransitionProvider } from '@/components/navigation-transition';
import { ImeInputSupport } from '@/components/ime-input-support';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '600'],
  style: ['normal', 'italic'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CLB Robotics & IoT - Trường Đại Học Khoa Học Tự Nhiên, ĐHQG-HCM',
  description: 'Trưng bày công trình nghiên cứu khoa học, dự án công nghệ và sản phẩm Robotics & IoT',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className={`${inter.className} min-h-screen text-slate-900 font-sans antialiased selection:bg-blue-100 selection:text-blue-900`}>
        <NavigationTransitionProvider>
          <DialogProvider>
            <ImeInputSupport />
            <PageReveal />
            {children}
          </DialogProvider>
        </NavigationTransitionProvider>
      </body>
    </html>
  );
}
