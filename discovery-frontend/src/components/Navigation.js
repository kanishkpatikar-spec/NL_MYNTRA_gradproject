"use client";

import Link from 'next/link';

export default function Navigation() {
  return (
    <nav className="w-full bg-[#05070A] border-b border-white/5 sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
        
        {/* Logo Area */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-7 h-7 rounded-md bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined text-white/80 text-[16px]">admin_panel_settings</span>
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-white font-bold text-sm tracking-wide leading-none" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
              MYNTRA DATA INTELLIGENCE
            </h1>
            <span className="text-[8px] uppercase tracking-[0.2em] text-primary font-bold mt-0.5">Internal AI Command Center</span>
          </div>
        </Link>

        {/* Right Side Controls */}
        <div className="flex items-center gap-5">
          <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/5 px-3 py-1 rounded-md">
            <span className="flex h-1.5 w-1.5 relative">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75"></span>
               <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-tertiary"></span>
            </span>
            <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">Postgres Sync: OK</span>
          </div>
          
          <div className="h-5 w-px bg-white/10 mx-2 hidden md:block"></div>
          
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-[10px] font-bold text-white uppercase tracking-wider">Admin User</div>
              <div className="text-[9px] text-white/40 uppercase tracking-widest">Level 4 Access</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-inner border border-white/20">
              <span className="text-[11px] font-bold text-white tracking-widest">AD</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
