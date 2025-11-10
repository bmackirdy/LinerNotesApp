import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Liner Notes',
  description: 'A vinyl collection and wishlist manager',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="bg-gray-800 text-white p-4">
          <div className="container mx-auto flex justify-between items-center">
            <Link href="/" className="text-xl font-bold">Liner Notes</Link>
            <div className="space-x-4">
              <Link href="/collection" className="hover:underline">Collection</Link>
              <Link href="/wishlist" className="hover:underline">Wishlist</Link>
              <Link href="/artists" className="hover:underline">Artists</Link>
              <Link href="/labels" className="hover:underline">Labels</Link>
              <Link href="/profile" className="hover:underline">Profile</Link>
            </div>
          </div>
        </nav>
        <main className="container mx-auto p-4">
          {children}
        </main>
      </body>
    </html>
  );
}
