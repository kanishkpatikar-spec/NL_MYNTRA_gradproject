import React from 'react';
import { Sparkles } from 'lucide-react';

export default function StylingAssistModule({ data }) {
  if (!data) return null;

  // Assume the content might have bullet points or line breaks for occasions
  const suggestions = data.content.split('\n').filter(s => s.trim().length > 0);

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-lg shadow-sm border border-indigo-100">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-indigo-500" />
        <h3 className="font-bold text-indigo-900">{data.display_name}</h3>
      </div>
      
      <div className="space-y-3">
        {suggestions.length > 1 ? (
          suggestions.map((suggestion, idx) => (
            <div key={idx} className="bg-white/60 backdrop-blur-sm p-3 rounded border border-white/40 text-sm text-indigo-900">
              {suggestion.replace(/^[-\*]\s*/, '')}
            </div>
          ))
        ) : (
          <p className="text-sm text-indigo-900 leading-relaxed">{data.content}</p>
        )}
      </div>
    </div>
  );
}
