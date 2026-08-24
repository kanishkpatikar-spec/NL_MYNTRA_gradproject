import React from 'react';
import { HelpCircle } from 'lucide-react';
import Link from 'next/link';

export default function ConfidenceBadge({ itemId }) {
  return (
    <Link href={`/item/${itemId}`} className="absolute top-2 right-2 group" onClick={(e) => e.stopPropagation()}>
      <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-md border border-gray-100 hover:border-primary transition-colors z-10 cursor-pointer">
        <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-20 animate-ping"></span>
        <HelpCircle className="w-5 h-5 text-primary" />
      </div>
      <div className="absolute right-10 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-xs font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        AI Insights
      </div>
    </Link>
  );
}
