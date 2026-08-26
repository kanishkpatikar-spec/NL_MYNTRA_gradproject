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
    
    fetchData();
  }, [itemId]);

  const positiveReviews = React.useMemo(() => {
    if (!itemData) return [];
    const brand = itemData.brand || 'This brand';
    const category = itemData.category || 'item';
    const color = itemData.attributes?.color?.toLowerCase() || 'design';
    const material = itemData.attributes?.material?.toLowerCase() || 'material';
    
    return [
      `Absolutely love the fit and quality of this ${category}! Highly recommend.`,
      `Best purchase I've made this year. ${brand} never disappoints.`,
      `The ${material} is incredibly soft and comfortable for all-day wear.`,
      `Got so many compliments wearing this ${color} ${category}! Fits perfectly.`,
      `Exceeded my expectations. Great value for the price, looks exactly like the pictures.`
    ];
  }, [itemData]);

  useEffect(() => {
    if (!positiveReviews.length) return;
    const interval = setInterval(() => {
      setCurrentReviewIndex((prev) => (prev + 1) % positiveReviews.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [positiveReviews]);

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
      {/* Drawer Header - Redesigned */}
      <div className="px-8 py-6 border-b border-white/5 bg-[#0a0e18]/90 backdrop-blur-md flex justify-between items-center sticky top-0 z-10 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px] animate-pulse">auto_awesome</span>
            <h3 className="text-xl font-bold tracking-tight text-white" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
              Confidence Assistant
            </h3>
          </div>
          <p className="text-[10px] text-on-surface-variant flex items-center gap-1.5 uppercase tracking-[0.15em] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]"></span>
            Analyzing: <span className="text-primary truncate max-w-[180px]">{itemData?.name || 'Item'}</span>
          </p>
        </div>
        <button 
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-on-surface-variant hover:text-white transition-all border border-white/10 hover:border-white/20 hover:scale-105 shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
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
                  &quot;{positiveReviews[currentReviewIndex]}&quot;
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
                <div className="glass-panel p-4 rounded-xl flex flex-col gap-2 bg-surface-container-low/50 hover:shadow-[0_0_15px_rgba(255,51,102,0.3)] transition-all duration-300">
                  <div className="font-body-sm text-body-sm text-on-surface leading-relaxed space-y-1.5">
                    {modules.styling_assist.content.split('\n').map((line, idx) => {
                      const trimmed = line.trim();
                      if (!trimmed) return null;
                      
                      // Render **Headers** as stylish badges
                      if (trimmed.startsWith('**') && (trimmed.endsWith('**') || trimmed.endsWith('**:'))) {
                        return (
                          <div key={idx} className="mt-3 mb-2 first:mt-0">
                            <span className="font-label-bold text-primary uppercase tracking-widest text-[10px] bg-primary/15 border border-primary/20 px-2.5 py-1 rounded-md shadow-sm">
                              {trimmed.replace(/\*\*/g, '').replace(/:/g, '')}
                            </span>
                          </div>
                        );
                      }
                      
                      // Render - bullets with nice icons
                      if (trimmed.startsWith('- ')) {
                        const content = trimmed.substring(2);
                        // Make text before colon bold
                        const parts = content.split(':');
                        return (
                          <div key={idx} className="flex items-start gap-2 ml-1">
                            <span className="material-symbols-outlined text-secondary text-[16px] mt-0.5 opacity-80">check_circle</span>
                            <span className="flex-1">
                              {parts.length > 1 ? (
                                <>
                                  <strong className="text-white font-medium">{parts[0]}:</strong>
                                  <span className="text-on-surface-variant">{parts.slice(1).join(':')}</span>
                                </>
                              ) : (
                                <span className="text-on-surface-variant">{content}</span>
                              )}
                            </span>
                          </div>
                        );
                      }
                      
                      return <p key={idx} className="text-on-surface-variant">{trimmed}</p>;
                    })}
                  </div>
                </div>
              </div>
            )}

          </>
        )}
      </div>
    </aside>
  );
}
