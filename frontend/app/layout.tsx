import type { Metadata } from 'next';
import { Sora, JetBrains_Mono, Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/layout/providers';

export const metadata: Metadata = {
  title: 'PixelPilot',
  description: 'AI-Powered Image Enhancement',
};

const display = Sora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

const body = Inter({
  subsets: ['latin'],
  variable: '--font-body',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${mono.variable} ${body.variable}`}
    >
      <body className="font-body">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}