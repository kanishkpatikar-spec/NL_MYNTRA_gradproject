import React, { useState } from 'react';
import FitConfidenceModule from './FitConfidenceModule';
import PriceContextModule from './PriceContextModule';
import StylingAssistModule from './StylingAssistModule';
import ReviewDigestModule from './ReviewDigestModule';
import { Loader2 } from 'lucide-react';

export default function ConfidencePanel({ modulesData, loading }) {
  const [activeTab, setActiveTab] = useState(0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl shadow-sm border border-pink-100">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-gray-500 font-medium">Generating AI Insights...</p>
      </div>
    );
  }

  if (!modulesData || Object.keys(modulesData).length === 0) {
    return (
      <div className="p-6 bg-gray-50 rounded-xl text-center text-gray-500 border border-gray-100">
        No insights available for this item.
      </div>
    );
  }

  const availableModules = Object.values(modulesData);
  
  if (availableModules.length === 0) return null;

  const activeModule = availableModules[activeTab];

  const renderModuleContent = (module) => {
    switch (module.module_id) {
      case 'fit_confidence':
        return <FitConfidenceModule data={module} />;
      case 'price_context':
        return <PriceContextModule data={module} />;
      case 'styling_assist':
        return <StylingAssistModule data={module} />;
      case 'review_digest':
        return <ReviewDigestModule data={module} />;
      default:
        return (
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-2">{module.display_name}</h3>
            <p className="text-sm text-gray-700">{module.content}</p>
          </div>
        );
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-lg border border-pink-100 overflow-hidden transition-all duration-300">
      <div className="flex overflow-x-auto border-b border-gray-100 no-scrollbar">
        {availableModules.map((mod, idx) => (
          <button
            key={mod.module_id}
            onClick={() => setActiveTab(idx)}
            className={`whitespace-nowrap px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === idx 
                ? 'text-primary border-b-2 border-primary bg-pink-50/50' 
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {mod.display_name}
          </button>
        ))}
      </div>
      
      <div className="p-6 min-h-[200px]">
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {renderModuleContent(activeModule)}
        </div>
      </div>
    </div>
  );
}
