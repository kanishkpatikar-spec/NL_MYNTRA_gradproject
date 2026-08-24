"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  const isDiscovery = pathname === '/discovery-engine';
  const isWishlist = pathname === '/' || pathname.startsWith('/item') || pathname.startsWith('/compare');

  return (
    <nav className="flex items-center gap-4">
      <Link 
        href="/discovery-engine" 
        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 font-body-md text-sm ${
          isDiscovery 
            ? 'text-primary font-bold bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(216,180,254,0.2)]' 
            : 'text-on-surface-variant font-medium hover:text-on-surface hover:bg-white/5'
        }`}
      >
        <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: isDiscovery ? "'FILL' 1" : "'FILL' 0" }}>analytics</span>
        <span>Discovery Engine</span>
      </Link>
      
      <Link 
        href="/" 
        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 font-body-md text-sm ${
          isWishlist 
            ? 'text-primary font-bold bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(216,180,254,0.2)]' 
            : 'text-on-surface-variant font-medium hover:text-on-surface hover:bg-white/5'
        }`}
      >
        <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: isWishlist ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
        <span>Wishlist Assistant</span>
      </Link>
    </nav>
  );
}
