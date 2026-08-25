import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { CartProvider } from '@/context/CartContext';
import CartDropdown from '@/components/CartDropdown';
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' });

export const metadata = {
  title: 'Myntra Aura | AI Wishlist',
  description: 'AI Confidence Assistant',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${spaceGrotesk.variable}`}>
      <head>
        <link 
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="bg-background text-on-background min-h-screen font-body-md overflow-x-hidden selection:bg-primary/30 antialiased">
        <CartProvider>

          {/* Main Content Canvas */}
          <main className="min-h-screen relative flex">
            {children}
          </main>
        </CartProvider>
      </body>
    </html>
  );
}
