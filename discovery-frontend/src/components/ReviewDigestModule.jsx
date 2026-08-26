import React from 'react';
import { MessageSquareQuote } from 'lucide-react';

export default function ReviewDigestModule({ data }) {
  if (!data) return null;

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquareQuote className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-gray-900">{data.display_name}</h3>
      </div>
      <div className="bg-gray-50 p-4 rounded border border-gray-100 italic text-sm text-gray-700 leading-relaxed border-l-4 border-l-primary/40">
        &quot;{data.content}&quot;
      </div>
    </div>
  );
}
