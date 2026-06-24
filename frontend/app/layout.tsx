import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Athar | Digital Twin',
  description: 'A conversation with Mian Muhammad Athar’s digital twin.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
