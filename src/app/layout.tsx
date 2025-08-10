// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";
import Providers from "../../src/Providers"

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Volt - AI-Powered Electricity Tracking',
  description: 'Premium SaaS platform to help Pakistani households track electricity usage, forecast bills, and reduce costs.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.className} bg-background text-foreground antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
