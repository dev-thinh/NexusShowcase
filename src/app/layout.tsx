import { DialogProvider } from '@/shared/dialogs/dialog-provider';
import { NavigationTransitionProvider } from '@/shared/navigation/navigation-transition';
import { ImeInputSupport } from '@/shared/ui/ime-input-support';
import { PageReveal } from '@/shared/ui/page-reveal';
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

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
      <body className={`${inter.className} min-h-screen text-[#1F2937] font-sans antialiased`}>
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
