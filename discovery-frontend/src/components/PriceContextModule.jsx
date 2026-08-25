import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function PriceContextModule({ data }) {
  if (!data) return null;

  // Simple heuristic to determine trend icon from content if metadata doesn't have it
  const text = data.content.toLowerCase();
  let TrendIcon = Minus;
  let trendColor = "text-gray-400";
  
  if (text.includes('drop') || text.includes('decrease') || text.includes('lower')) {
    TrendIcon = TrendingDown;
    trendColor = "text-success"; // Greenish for price drop
  } else if (text.includes('increase') || text.includes('higher') || text.includes('rise')) {
    TrendIcon = TrendingUp;
    trendColor = "text-red-500";
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <div className={`p-1.5 rounded-md bg-gray-50 border border-gray-100 ${trendColor}`}>
          <TrendIcon className="w-4 h-4" />
        </div>
        <h3 className="font-bold text-gray-900">{data.display_name}</h3>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed">{data.content}</p>
      <div className="mt-4 pt-3 border-t border-gray-50 text-xs text-gray-400">
        Based on 90-day historical pricing.
      </div>
    </div>
  );
}
