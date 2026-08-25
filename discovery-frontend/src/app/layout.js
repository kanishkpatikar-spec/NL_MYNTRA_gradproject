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
          {/* Shared Component: TopAppBar */}
          <header className="fixed top-0 right-0 left-0 h-20 bg-surface/10 backdrop-blur-md border-b border-white/10 flex justify-between items-center px-4 md:px-margin-desktop w-full z-30">
            
            {/* Brand / Mobile Left */}
            <div className="flex items-center gap-4">
              <button className="md:hidden text-on-surface hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[24px]">menu</span>
              </button>
              <Link href="/" className="flex items-center gap-3 group">
                <div className="hidden md:flex w-9 h-9 bg-gradient-to-br from-primary to-secondary rounded-xl items-center justify-center shadow-[0_0_15px_rgba(255,178,186,0.4)] group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-white text-[20px]">auto_awesome</span>
                </div>
                <div className="flex flex-col">
                  <h1 className="font-headline-sm text-lg md:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary leading-none mb-0.5">Myntra Aura</h1>
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-label-bold hidden md:block leading-none">Confidence Assistant</p>
                </div>
              </Link>
            </div>
            
            {/* Trailing Actions */}
            <div className="flex items-center gap-6 ml-auto">
              <div className="hidden md:block">
                <Navigation />
              </div>
              <div className="flex items-center gap-2">
                <CartDropdown />
                <button className="p-2 rounded-full text-on-surface-variant hover:text-primary transition-colors hover:bg-white/5">
                  <span className="material-symbols-outlined">account_circle</span>
                </button>
              </div>
            </div>
          </header>

          {/* Main Content Canvas */}
          <main className="pt-20 min-h-screen relative flex">
            {children}
          </main>
        </CartProvider>
      </body>
    </html>
  );
}
