import React, { useState, useEffect } from 'react';
import { moduleService, wishlistService } from '@/services/api';
import { logEvent } from '@/services/events';

export default function AIModalDrawer({ itemId, onClose }) {
  const [loading, setLoading] = useState(false);
  const [modules, setModules] = useState(null);
  const [itemData, setItemData] = useState(null);

  useEffect(() => {
    if (!itemId) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        logEvent('module_opened', { item_id: itemId });
        const itemRes = await wishlistService.getItemDetails(itemId);
        setItemData(itemRes.product || itemRes);
        
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
            {/* Fit Predictor */}
            {modules.fit_confidence && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-tertiary text-[20px]">straighten</span>
                    Fit Predictor
                    <span className="material-symbols-outlined text-on-surface-variant/40 text-[16px] cursor-help hover:text-primary transition-colors">info</span>
                  </h4>
                  <span className="bg-tertiary/20 text-tertiary font-label-bold text-[10px] px-2 py-1 rounded-full uppercase tracking-wider">
                    {Math.round(modules.fit_confidence.confidence * 100)}% Match
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
                <h4 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
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
                <h4 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
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

      {/* Footer Area */}
      <div className="p-5 border-t border-white/10 bg-surface-container-lowest/80 backdrop-blur-md flex flex-col items-center justify-center gap-2">
        <div className="flex items-center gap-2 text-primary/80">
          <span className="material-symbols-outlined text-[18px]">verified</span>
          <span className="font-label-bold text-[11px] uppercase tracking-widest">Analysis Complete</span>
        </div>
        <p className="text-center font-label-bold text-[10px] text-on-surface-variant/40 uppercase tracking-widest">
          Powered by Myntra Aura Gen-3
        </p>
      </div>
    </aside>
  );
}
