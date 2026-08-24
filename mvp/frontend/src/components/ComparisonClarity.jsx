import React from 'react';
import { Scale, Check } from 'lucide-react';

export default function ComparisonClarity({ data }) {
  if (!data) return null;

  // Assume data.content contains structured markdown or bullet points
  // For the MVP, we just render the raw content with some styling
  const contentParts = data.content.split('\n\n');

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-2xl shadow-sm border border-indigo-100 mt-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-indigo-100 p-2 rounded-lg">
          <Scale className="w-6 h-6 text-indigo-600" />
        </div>
        <h2 className="text-xl font-bold text-indigo-900">{data.display_name}</h2>
      </div>

      <div className="space-y-4">
        {contentParts.map((part, idx) => (
          <div key={idx} className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-white/60">
            {part.startsWith('-') ? (
              <ul className="space-y-2">
                {part.split('\n').map((li, i) => {
                  const line = li.replace(/^[-\*]\s*/, '').trim();
                  if (!line) return null;
                  return (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-success mt-0.5 shrink-0" />
                      <span className="text-gray-700">{line}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-gray-800 leading-relaxed font-medium">
                {part}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
