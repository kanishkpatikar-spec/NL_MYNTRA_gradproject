'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { wishlistService, moduleService } from '@/services/api';
import ItemCard from '@/components/ItemCard';
import AIModalDrawer from '@/components/AIModalDrawer';
import { logEvent } from '@/services/events';

export default function WishlistHome() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeItemId, setActiveItemId] = useState(null);
  
  // Style Sandbox State
  const [sandboxItems, setSandboxItems] = useState([]);
  const [sandboxResult, setSandboxResult] = useState(null);
  const [analyzingSandbox, setAnalyzingSandbox] = useState(false);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const data = await wishlistService.getWishlist();
        setItems(data.items || []);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch wishlist:', err);
        setError('Could not load your wishlist.');
      } finally {
        setLoading(false);
      }
    };
    fetchWishlist();
  }, []);

  const handleCardClick = (id) => {
    if (activeItemId === id) {
      setActiveItemId(null);
    } else {
      setActiveItemId(id);
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e, item) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleAddToSandbox = (item) => {
    const itemId = item.product?.id || item.id;
    if (sandboxItems.length < 3 && !sandboxItems.find(i => (i.product?.id || i.id) === itemId)) {
      setSandboxItems(prev => [...prev, item]);
      setSandboxResult(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const itemData = e.dataTransfer.getData('application/json');
    if (itemData) {
      handleAddToSandbox(JSON.parse(itemData));
    }
  };

  const handleRemoveFromSandbox = (id) => {
    logEvent('item_removed', { item_id: id });
    setSandboxItems(prev => prev.filter(i => (i.product?.id || i.id) !== id));
    setSandboxResult(null);
  };

  const handleAnalyzeSandbox = async () => {
    if (sandboxItems.length < 2) return;
    setAnalyzingSandbox(true);
    try {
      const itemIds = sandboxItems.map(i => i.product?.id || i.id);
      logEvent('comparison_opened', { item_ids: itemIds });
      const res = await moduleService.analyzeSandbox(itemIds);
      setSandboxResult(res);
    } catch (err) {
      console.error(err);
      setSandboxResult({ error: "Failed to analyze compatibility. Please try again." });
    } finally {
      setAnalyzingSandbox(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] w-full">
        <span className="material-symbols-outlined text-primary text-4xl animate-spin">sync</span>
        <p className="text-on-surface-variant font-medium mt-4">Syncing Wishlist...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto mt-12 p-6 glass-panel-heavy rounded-lg flex flex-col items-center text-center">
        <span className="material-symbols-outlined text-error text-5xl mb-4">error</span>
        <h2 className="text-lg font-bold text-error mb-2">Sync Failed</h2>
        <p className="text-on-surface-variant mb-6">{error}</p>
        <button onClick={() => window.location.reload()} className="px-6 py-2 bg-gradient-to-r from-primary to-secondary text-on-primary-fixed rounded-full font-label-bold text-label-bold tracking-wider uppercase shadow-[0_0_15px_rgba(255,178,186,0.3)] hover:scale-105 transition-transform duration-300">
          Try Again
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4 w-full">
        <div className="w-24 h-24 glass-panel rounded-full flex items-center justify-center mb-6 neon-glow">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant">favorite</span>
        </div>
        <h2 className="text-display-lg text-on-surface mb-2">Void</h2>
        <p className="text-body-lg text-on-surface-variant max-w-md">Your wishlist is empty. Begin curating your style profile to activate Myntra Aura intelligence.</p>
      </div>
    );
  }

  return (
    <>
      <div className={`flex-grow p-margin-mobile md:p-margin-desktop pb-32 md:pb-margin-desktop w-full transition-all duration-500 ease-in-out ${activeItemId ? 'lg:pr-[424px]' : 'lg:pr-margin-desktop'}`}>
        
        <div className="mb-8 flex justify-between items-end">
          <div className="animate-slide-up-fade">
            <h2 className="font-display-lg text-display-lg text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Wishlist</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mt-2 tracking-wide">
              Curate your wardrobe. Let AI unlock its potential.
            </p>
          </div>
        </div>

        {/* Style Sandbox Drop Zone */}
        <div 
          className={`mb-10 rounded-2xl border-2 border-dashed transition-all duration-300 p-6 ${sandboxItems.length > 0 ? 'border-primary/50 bg-primary/5' : 'border-white/20 bg-surface-container-low/50'}`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="flex flex-col md:flex-row items-center gap-6">
            
            <div className="w-full md:w-1/3 text-center md:text-left">
              <h3 className="text-xl text-primary font-bold mb-2 flex items-center justify-center md:justify-start gap-2">
                <span className="material-symbols-outlined">style</span> Style Sandbox
              </h3>
              <p className="text-sm text-on-surface-variant">
                Drag and drop 2 or 3 items here, or click the + button on items, to see if they work together.
              </p>
            </div>

            <div className="flex-grow flex items-center justify-center gap-4">
              {/* Item Slots */}
              {[0, 1, 2].map((index) => {
                const item = sandboxItems[index];
                if (item) {
                  const product = item.product || item;
                  return (
                    <div key={product.id} className="relative w-24 h-24 rounded-lg overflow-hidden border border-white/20 shadow-lg group">
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => handleRemoveFromSandbox(product.id)}
                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </div>
                  );
                } else {
                  return (
                    <div key={`empty-${index}`} className="w-24 h-24 rounded-lg border border-dashed border-white/20 flex items-center justify-center text-on-surface-variant/50">
                      <span className="material-symbols-outlined text-3xl">add_box</span>
                    </div>
                  );
                }
              })}
            </div>

            <div className="w-full md:w-1/3 flex flex-col items-center md:items-end justify-center">
              {sandboxItems.length >= 2 && !sandboxResult && !analyzingSandbox && (
                <button 
                  onClick={handleAnalyzeSandbox}
                  className="px-6 py-2 bg-gradient-to-r from-primary to-secondary text-on-primary-fixed font-bold rounded-full hover:scale-105 transition-transform shadow-[0_0_15px_rgba(255,178,186,0.3)] neon-glow animate-pulse"
                >
                  Analyze Compatibility
                </button>
              )}
              {analyzingSandbox && (
                <div className="flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined animate-spin">sync</span> Analyzing...
                </div>
              )}
            </div>
          </div>

          {/* Sandbox Results */}
          {sandboxResult && !sandboxResult.error && (
            <div className="mt-6 p-4 rounded-xl border border-primary/30 bg-primary/10 animate-[fadeIn_0.4s_ease-out]">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-primary font-bold text-lg uppercase tracking-wide">AI Style Verdict</h4>
                <div className="text-secondary font-bold bg-secondary/20 px-3 py-1 rounded-full text-sm">
                  {sandboxResult.compatibility_score}% Match
                </div>
              </div>
              <p className="text-on-surface leading-relaxed whitespace-pre-line text-sm">
                {sandboxResult.analysis}
              </p>
            </div>
          )}
          {sandboxResult?.error && (
            <div className="mt-6 p-4 rounded-xl border border-error/30 bg-error/10 text-error text-sm">
              {sandboxResult.error}
            </div>
          )}

        </div>

        {/* Bento Grid of Products */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-gutter">
          {items.map((item, index) => (
            <div key={item.product?.id || item.id} className="animate-slide-up-fade" style={{ animationDelay: `${index * 0.05}s`, opacity: 0, animationFillMode: 'forwards' }}>
              <ItemCard 
                item={item} 
                onClick={handleCardClick}
                isSelected={activeItemId === (item.product?.id || item.id)}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, item)}
                onAddToSandbox={handleAddToSandbox}
                isInSandbox={sandboxItems.some(i => (i.product?.id || i.id) === (item.product?.id || item.id))}
              />
            </div>
          ))}
        </div>
      </div>

      <AIModalDrawer itemId={activeItemId} onClose={() => setActiveItemId(null)} />
    </>
  );
}
