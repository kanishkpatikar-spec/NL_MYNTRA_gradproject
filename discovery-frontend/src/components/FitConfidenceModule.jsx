import React from 'react';
import { Ruler } from 'lucide-react';

export default function FitConfidenceModule({ data }) {
  if (!data) return null;
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <Ruler className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-gray-900">{data.display_name}</h3>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed mb-4">{data.content}</p>
      
      {data.confidence && (
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">AI Confidence</span>
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-pink-400 to-primary" 
              style={{ width: `${data.confidence * 100}%` }}
            ></div>
          </div>
          <span className="text-xs font-bold text-gray-700">{Math.round(data.confidence * 100)}%</span>
        </div>
      )}
    </div>
  );
}
