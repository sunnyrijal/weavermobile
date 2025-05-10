
import type { Metadata } from 'next';
// Removed Geist font imports as 'geist' package is not a dependency
import './globals.css';
import { cn } from '@/lib/utils';
import { AppProviders } from '@/components/providers/AppProviders';

export const metadata: Metadata = {
  title: 'NetworkNest',
  description: 'Your Personal Relationship Manager',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased'
          // Removed GeistSans.variable and GeistMono.variable
        )}
        suppressHydrationWarning={true} 
      >
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
