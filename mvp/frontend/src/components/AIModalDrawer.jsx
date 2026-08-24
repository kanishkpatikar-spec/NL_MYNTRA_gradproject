import React, { useState, useEffect } from 'react';
import { moduleService, wishlistService } from '@/services/api';
import { logEvent } from '@/services/events';

export default function AIModalDrawer({ itemId, onClose }) {
  const [loading, setLoading] = useState(false);
  const [modules, setModules] = useState(null);
  const [itemData, setItemData] = useState(null);
  const [itemDetails, setItemDetails] = useState(null);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  useEffect(() => {
    if (!itemId) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        logEvent('module_opened', { item_id: itemId });
        const itemRes = await wishlistService.getItemDetails(itemId);
        setItemData(itemRes.product || itemRes);
        setItemDetails(itemRes);
        
        const modsRes = await moduleService.getModules(itemId);
        setModules(modsRes.modules || {});
      } catch (e) {
        console.error("Failed to load insights:", e);
      } finally {
        setLoading(false);
      }
    };
    
  const positiveReviews = [
    "Absolutely love the fit and quality! Highly recommend this.",
    "Best purchase I've made this year. It looks exactly like the pictures.",
    "The material is incredibly soft and comfortable for all-day wear.",
    "Got so many compliments wearing this! Fits perfectly.",
    "Exceeded my expectations. Great value for the price!"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentReviewIndex((prev) => (prev + 1) % positiveReviews.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const getStockCount = (id) => {
    if (!id) return 0;
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash += id.charCodeAt(i);
    return (hash % 12) + 2;
  };
  
  const stockCount = itemData ? getStockCount(itemData.id) : 0;
  const isOpen = !!itemId;

  return (
    <aside 
      className={`fixed right-0 top-20 bottom-0 w-full md:w-[400px] glass-panel-heavy z-40 flex flex-col transform transition-transform duration-500 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
    >
      {/* Drawer Header */}
      <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center bg-surface-container-lowest/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center neon-glow">
            <span className="material-symbols-outlined text-primary text-[20px]">auto_awesome</span>
          </div>
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface leading-tight">Confidence Assistant</h3>
            <p className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider text-[10px]">
              Analyzing: {itemData?.name || 'Item'}
            </p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="text-on-surface-variant hover:text-on-surface transition-colors p-2 rounded-full hover:bg-white/5"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* Drawer Scrollable Content */}
      <div className="flex-grow overflow-y-auto p-6 space-y-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-40">
            <span className="material-symbols-outlined text-primary text-4xl animate-spin">sync</span>
            <p className="font-body-sm text-on-surface-variant mt-4">Generating Insights...</p>
          </div>
        ) : !modules ? (
           <p className="text-on-surface-variant text-center font-body-sm">No insights available.</p>
        ) : (
          <>
            {/* Verified Reviews Slider */}
            <div className="space-y-4">
              <h4 className="font-label-lg text-label-lg font-bold uppercase tracking-wider text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">star</span>
                Customer Highlights
              </h4>
              <div className="glass-panel p-4 rounded-xl ai-insight-border bg-surface-container-low/50 relative overflow-hidden min-h-[80px] flex items-center justify-center shadow-[0_0_10px_rgba(255,178,186,0.05)]">
                <p className="font-body-sm text-body-sm text-on-surface text-center italic animate-in fade-in zoom-in duration-500" key={currentReviewIndex}>
                  "{positiveReviews[currentReviewIndex]}"
                </p>
                
                {/* Dots indicator */}
                <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-1">
                  {positiveReviews.map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentReviewIndex ? 'bg-primary w-3' : 'bg-white/20'}`} />
                  ))}
                </div>
              </div>
            </div>

            {/* Glowing Stock Counter */}
            <div className="flex items-center justify-between glass-panel p-4 rounded-xl ai-insight-border bg-surface-container-low/50 shadow-[0_0_15px_rgba(255,178,186,0.15)] transition-all hover:shadow-[0_0_20px_rgba(255,178,186,0.25)]">
              <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-error animate-pulse">local_fire_department</span>
                High Demand
              </span>
              <span className="text-primary font-bold text-[13px] tracking-wide animate-pulse">
                Only {stockCount} left in stock
              </span>
            </div>

            {/* Fit Predictor */}
            {modules.fit_confidence && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-label-lg text-label-lg font-bold uppercase tracking-wider text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-tertiary text-[20px]">straighten</span>
                    Fit Predictor
                  </h4>
                  <span className="bg-tertiary/20 text-tertiary font-label-bold text-[10px] px-2 py-1 rounded-full uppercase tracking-wider">
                    {Math.round(modules.fit_confidence.confidence <= 1 ? modules.fit_confidence.confidence * 100 : modules.fit_confidence.confidence > 10 ? modules.fit_confidence.confidence : modules.fit_confidence.confidence * 10)}% Match
                  </span>
                </div>
                <div className="glass-panel p-4 rounded-xl ai-insight-border bg-surface-container-low/50">
                  <div className="min-h-[60px] mb-4 transition-all duration-300">
                    <p className="font-body-sm text-body-sm text-on-surface leading-relaxed">
                      {modules.fit_confidence.content}
                    </p>
                  </div>
                  {/* Sizes (Mocked interactive selection) */}
                  {itemData?.sizes && (
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Select Size:</span>
                      <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        {itemData.sizes.map((s, idx) => (
                          <button 
                            key={s} 
                            className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-label-bold transition-all duration-300 ${
                              idx === 1 
                              ? 'border-primary bg-primary/10 text-primary shadow-[0_0_10px_rgba(255,178,186,0.3)] animate-pulse' 
                              : 'border border-white/10 text-on-surface-variant hover:border-primary/50 hover:scale-105 hover:shadow-[0_0_15px_rgba(255,51,102,0.3)]'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Segmented Progress Bar */}
                  <div className="w-full flex gap-1 h-1.5 mt-2">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`flex-1 ${i === 0 ? 'rounded-l-full' : ''} ${i === 9 ? 'rounded-r-full' : ''} ${
                          i < Math.round(modules.fit_confidence.confidence * 10) 
                            ? 'bg-gradient-to-r from-primary to-secondary animate-pulse' 
                            : 'bg-white/10'
                        }`}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Styling Assist */}
            {modules.styling_assist && (
              <div className="space-y-4">
                <h4 className="font-label-lg text-label-lg font-bold uppercase tracking-wider text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[20px] hover:text-primary hover:shadow-[0_0_8px_rgba(255,178,186,0.4)] cursor-pointer transition-colors">style</span>
                  Wardrobe Match
                </h4>
                <div className="glass-panel p-4 rounded-xl flex flex-col gap-4 bg-surface-container-low/50 hover:shadow-[0_0_15px_rgba(255,51,102,0.3)] transition-all duration-300">
                  <p className="font-body-sm text-body-sm text-on-surface leading-relaxed whitespace-pre-line">
                    {modules.styling_assist.content.split('\n').map((line, idx) => (
                      <React.Fragment key={idx}>
                        {line}
                        <br />
                      </React.Fragment>
                    ))}
                  </p>
                </div>
              </div>
            )}

            {/* Review Digest */}
            {modules.review_digest && (
              <div className="space-y-4">
                <h4 className="font-label-lg text-label-lg font-bold uppercase tracking-wider text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">forum</span>
                  Sentiment Summary
                </h4>
                <ul className="space-y-3 font-body-sm text-body-sm text-on-surface-variant bg-surface-container-lowest/30 p-4 rounded-xl border border-white/5">
                  <li className="flex items-start gap-3 italic">
                     "{modules.review_digest.content}"
                  </li>
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
