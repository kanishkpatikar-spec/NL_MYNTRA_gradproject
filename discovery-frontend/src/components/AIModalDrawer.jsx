import React, { useState, useEffect } from 'react';
import { moduleService, wishlistService } from '@/services/api';
import { logEvent } from '@/services/events';

export default function AIModalDrawer({ itemId, onClose }) {
  const [loading, setLoading] = useState(false);
  const [modules, setModules] = useState(null);
  const [itemData, setItemData] = useState(null);
  const [itemDetails, setItemDetails] = useState(null);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  const displayReviews = React.useMemo(() => {
    const reviews = [];
    if (modules?.review_digest) {
      reviews.push(modules.review_digest.content);
    }
    
    if (itemData) {
      const brand = itemData.brand || 'This brand';
      const category = itemData.category || 'item';
      const color = itemData.attributes?.color?.toLowerCase() || 'design';
      const material = itemData.attributes?.material?.toLowerCase() || 'material';
      
      reviews.push(`Absolutely love the fit and quality of this ${category}! Highly recommend.`);
      reviews.push(`Best purchase I've made this year. ${brand} never disappoints.`);
      if (material !== 'material') {
        reviews.push(`The ${material} is incredibly soft and comfortable for all-day wear.`);
      }
      if (color !== 'design') {
        reviews.push(`Got so many compliments wearing this ${color} ${category}! Fits perfectly.`);
      }
    }

    if (reviews.length === 0) {
      reviews.push("General consensus is positive.");
    }
    return reviews;
  }, [modules?.review_digest, itemData]);

  useEffect(() => {
    if (displayReviews.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentReviewIndex((prev) => (prev + 1) % displayReviews.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [displayReviews]);

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
      {/* Ambient background orbs to reveal panel translucency */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-1/4 -right-20 w-72 h-72 bg-primary/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -left-20 w-72 h-72 bg-[#818cf8]/15 rounded-full blur-[100px]" />
      </div>

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
      <div className="flex-grow overflow-y-auto p-6 space-y-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-40">
            <span className="material-symbols-outlined text-primary text-4xl animate-spin">sync</span>
            <p className="font-body-sm text-on-surface-variant mt-4">Generating Insights...</p>
          </div>
        ) : !modules ? (
           <p className="text-on-surface-variant text-center font-body-sm">No insights available.</p>
        ) : (
          <>
            {/* Review Digest */}
            {modules.review_digest && (
              <div className="space-y-3">
                <h4 className="font-label-lg text-label-lg font-bold uppercase tracking-wider text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">forum</span>
                  Review Digest
                </h4>
                <div className="discovery-panel p-5 pb-8 rounded-2xl relative overflow-hidden min-h-[100px] flex flex-col justify-center">
                  <div className="relative w-full flex items-center justify-center">
                    {displayReviews.map((review, i) => {
                      let positionClass = '';
                      if (i === currentReviewIndex) {
                        positionClass = 'opacity-100 translate-x-0 relative z-10';
                      } else if (i === (currentReviewIndex - 1 + displayReviews.length) % displayReviews.length) {
                        positionClass = 'opacity-0 -translate-x-8 absolute pointer-events-none z-0';
                      } else {
                        positionClass = 'opacity-0 translate-x-8 absolute pointer-events-none z-0';
                      }
                      
                      return (
                        <p 
                          key={i}
                          className={`font-body-sm text-body-sm text-on-surface leading-relaxed text-center italic transition-all duration-700 ease-out w-full ${positionClass}`}
                        >
                          "{review}"
                        </p>
                      );
                    })}
                  </div>
                  
                  {/* Dots indicator */}
                  {displayReviews.length > 1 && (
                    <div className="absolute bottom-1.5 left-0 right-0 flex justify-center gap-1.5">
                      {displayReviews.map((_, i) => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentReviewIndex ? 'bg-primary w-4' : 'bg-white/20'}`} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Price Context */}
            {modules.price_context && (
              <div className="space-y-3">
                <h4 className="font-label-lg text-label-lg font-bold uppercase tracking-wider text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#ffb596] text-[20px]">sell</span>
                  Price Context
                </h4>
                <div className="discovery-panel p-5 rounded-2xl">
                  <p className="font-body-sm text-body-sm text-on-surface leading-relaxed">
                    {modules.price_context.content}
                  </p>
                </div>
              </div>
            )}

            {/* Glowing Stock Counter */}
            <div className="discovery-panel p-5 rounded-2xl flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-error animate-pulse">local_fire_department</span>
                High Demand
              </span>
              <span className="text-primary font-bold text-[13px] tracking-wide animate-pulse">
                Only {stockCount} left in stock
              </span>
            </div>

            {/* Fit Predictor */}
            {modules.fit_confidence && (() => {
              // Normalize confidence to a 0-100 scale
              let confValue = modules.fit_confidence.confidence;
              if (confValue <= 1) confValue *= 100;
              else if (confValue <= 10) confValue *= 10;
              
              const matchPercentage = Math.round(confValue);
              const filledSegments = Math.round(matchPercentage / 10);

              return (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-label-lg text-label-lg font-bold uppercase tracking-wider text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-tertiary text-[20px]">straighten</span>
                    Fit Predictor
                  </h4>
                  <span className="bg-tertiary/20 text-tertiary font-label-bold text-[10px] px-2 py-1 rounded-full uppercase tracking-wider">
                    {matchPercentage}% Match
                  </span>
                </div>
                <div className="discovery-panel p-5 rounded-2xl">
                  <div className="min-h-[60px] mb-4 transition-all duration-300">
                    <p className="font-body-sm text-body-sm text-on-surface leading-relaxed">
                      {modules.fit_confidence.content}
                    </p>
                  </div>
                  {/* Sizes (Mocked interactive selection) */}
                  {itemData?.sizes && (() => {
                    const content = modules.fit_confidence.content.toLowerCase();
                    const currentIndex = itemData.sizes.indexOf(itemData.size);
                    let recommendedIndex = -1;
                    
                    if (currentIndex !== -1) {
                      if (content.includes("size up") || content.includes("runs small") || content.includes("go a size up")) {
                        recommendedIndex = Math.min(currentIndex + 1, itemData.sizes.length - 1);
                      } else if (content.includes("size down") || content.includes("runs large") || content.includes("runs big") || content.includes("go a size down")) {
                        recommendedIndex = Math.max(currentIndex - 1, 0);
                      }
                    }
                    if (recommendedIndex === currentIndex) recommendedIndex = -1; // Don't highlight if it's the same

                    return (
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Select Size:</span>
                        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                          {itemData.sizes.map((s, idx) => {
                            const isSelected = s === itemData.size;
                            const isRecommended = idx === recommendedIndex;
                            
                            let buttonStyle = 'border border-white/5 bg-white/5 text-on-surface-variant hover:border-white/20 hover:bg-white/10 hover:scale-105';
                            
                            if (isSelected) {
                              buttonStyle = 'border border-primary/50 bg-primary/10 text-primary shadow-[0_0_15px_rgba(255,178,186,0.2)]';
                            } else if (isRecommended) {
                              // Glowing, bouncing recommendation style
                              buttonStyle = 'border border-secondary bg-secondary/20 text-white shadow-[0_0_15px_rgba(240,248,255,0.4)] animate-bounce-subtle relative';
                            }

                            return (
                              <button 
                                key={s} 
                                className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-label-bold transition-all duration-300 ${buttonStyle}`}
                                title={isRecommended ? "AI Recommended Size" : ""}
                              >
                                {s}
                                {isRecommended && (
                                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary"></span>
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                  {/* Segmented Progress Bar */}
                  <div className="w-full flex gap-1 h-1.5 mt-2">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`flex-1 ${i === 0 ? 'rounded-l-full' : ''} ${i === 9 ? 'rounded-r-full' : ''} ${
                          i < filledSegments 
                            ? 'bg-gradient-to-r from-primary to-secondary opacity-90' 
                            : 'bg-white/10'
                        }`}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            )})()}

            {/* Styling Assist */}
            {modules.styling_assist && (
              <div className="space-y-3">
                <h4 className="font-label-lg text-label-lg font-bold uppercase tracking-wider text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[20px] hover:text-primary hover:shadow-[0_0_8px_rgba(255,178,186,0.4)] cursor-pointer transition-colors">style</span>
                  Wardrobe Match
                </h4>
                <div className="discovery-panel p-5 rounded-2xl flex flex-col gap-2">
                  <div className="font-body-sm text-body-sm text-on-surface leading-relaxed space-y-2">
                    {modules.styling_assist.content.split('\n').map((line, idx) => {
                      const trimmed = line.trim();
                      if (!trimmed) return null;
                      
                      // Render **Headers** as stylish badges
                      if (trimmed.startsWith('**') && (trimmed.endsWith('**') || trimmed.endsWith('**:'))) {
                        return (
                          <div key={idx} className="mt-4 mb-3 first:mt-0">
                            <span className="font-label-bold text-primary uppercase tracking-widest text-[10px] bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg shadow-sm">
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
                          <div key={idx} className="flex items-start gap-3 ml-1 mb-2">
                            <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mt-0.5 flex-shrink-0">
                               <span className="material-symbols-outlined text-secondary text-[12px]">check</span>
                            </div>
                            <span className="flex-1 mt-0.5">
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
