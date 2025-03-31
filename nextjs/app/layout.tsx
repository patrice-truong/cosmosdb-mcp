import './globals.css';

import { Bot, Mountain, User } from 'lucide-react';

import AIAssistantDrawer from '@/components/AIAssistantDrawer';
import CartItemCount from '@/components/CartItemCount';
import { CartProvider } from '@/context/CartContext';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import type { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Northern Mountains',
  description: 'Your adventure gear destination',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CartProvider>
          <div className="flex flex-col min-h-screen">
            <header className="border-b">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between">
                  <Link href="/" className="flex items-center space-x-2">
                    <Mountain className="h-8 w-8" />
                    <span className="font-bold text-xl">Northern Mountains</span>
                    <span className="font-bold text-xl text-red-500 pl-2">(East US 2)</span>
                  </Link>
                  <div className="flex items-center space-x-4">
                    <AIAssistantDrawer />
                    <Link href="/account" className="p-2 hover:bg-gray-100 rounded-full">
                      <User className="h-6 w-6" />
                    </Link>
                    <CartItemCount />
                  </div>
                </div>
              </div>
            </header>
            <main className="flex-grow relative">{children}</main>
          </div>
        </CartProvider>
      </body>
    </html>
  );
}