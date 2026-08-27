'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { wishlistService, moduleService } from '@/services/api';
import ItemCard from '@/components/ItemCard';
import AIModalDrawer from '@/components/AIModalDrawer';
import { logEvent } from '@/services/events';
import { useCart } from '@/context/CartContext';

export default function WishlistHome() {
  const router = useRouter();
  const { addToCart, isCartOpen, setIsCartOpen } = useCart();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeItemId, setActiveItemId] = useState(null);
  
  // Style Sandbox State
  const [sandboxItems, setSandboxItems] = useState([]);
  const [sandboxResult, setSandboxResult] = useState(null);
  const [analyzingSandbox, setAnalyzingSandbox] = useState(false);

  // Close Confidence Assistant when Cart opens
  useEffect(() => {
    if (isCartOpen) {
      setActiveItemId(null);
    }
  }, [isCartOpen]);

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

  const handleAddAllToCart = () => {
    sandboxItems.forEach(item => {
      addToCart(item.product || item);
    });
    logEvent('sandbox_added_to_cart', { item_ids: sandboxItems.map(i => (i.product?.id || i.id)) });
    setIsCartOpen(true);
    setActiveItemId(null);
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

        {/* Hybrid Style Sandbox */}
        
        {/* 1. Static Onboarding Drop Zone */}
        {/* We use grid transition to smoothly collapse the height when it becomes active, preventing a harsh layout jump */}
        <div 
          className={`grid transition-all duration-700 ease-in-out ${sandboxItems.length === 0 ? 'grid-rows-[1fr] mb-10 opacity-100' : 'grid-rows-[0fr] opacity-0 mb-0'}`}
        >
          <div className="overflow-hidden">
            <div 
              className="relative rounded-3xl border border-white/10 bg-gradient-to-r from-surface-container-low to-surface-container-lowest p-8 overflow-hidden group hover:border-primary/30 transition-all duration-500 shadow-lg"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {/* Decorative background glow */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/10 transition-colors duration-700" />
              <div className="absolute bottom-0 left-20 w-64 h-64 bg-secondary/5 rounded-full blur-3xl pointer-events-none group-hover:bg-secondary/10 transition-colors duration-700" />
              
              <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
                <div className="flex flex-col md:flex-row items-center text-center md:text-left gap-6 lg:w-1/2">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-primary/20 to-secondary/20 p-[1px] shrink-0">
                    <div className="w-full h-full bg-[#0a0a0c] rounded-2xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">style</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">AI Style Sandbox</h3>
                    <p className="text-sm text-on-surface-variant leading-relaxed">
                      Build your perfect outfit before you buy. <strong className="text-white">Click the (+) button</strong> on any product below, or drag and drop up to 3 items. Our AI will analyze their compatibility, color harmony, and occasion fit.
                    </p>
                  </div>
                </div>

                <div className="lg:w-1/2 flex justify-center lg:justify-end gap-3 w-full">
                  {/* Visual Hint Slots */}
                  <div className="flex items-center gap-2 w-full max-w-[28rem]">
                    <div className="flex-1 aspect-[3/4] rounded-xl border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center gap-1.5 group-hover:border-primary/30 group-hover:bg-primary/5 transition-all">
                      <span className="material-symbols-outlined text-white/30 text-xl">checkroom</span>
                      <span className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Item 1</span>
                    </div>
                    <span className="material-symbols-outlined text-white/20 text-sm">add</span>
                    <div className="flex-1 aspect-[3/4] rounded-xl border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center gap-1.5 group-hover:border-primary/30 group-hover:bg-primary/5 transition-all" style={{ transitionDelay: '75ms' }}>
                      <span className="material-symbols-outlined text-white/30 text-xl">checkroom</span>
                      <span className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Item 2</span>
                    </div>
                    <span className="material-symbols-outlined text-white/20 text-sm">add</span>
                    <div className="flex-1 aspect-[3/4] rounded-xl border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center gap-1.5 group-hover:border-primary/30 group-hover:bg-primary/5 transition-all" style={{ transitionDelay: '150ms' }}>
                      <span className="material-symbols-outlined text-white/30 text-xl">checkroom</span>
                      <span className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Item 3</span>
                    </div>
                    <span className="material-symbols-outlined text-white/20 text-sm">equal</span>
                    <div className="flex-1 aspect-[3/4] rounded-xl border border-white/10 bg-white/5 flex flex-col items-center justify-center gap-1.5 group-hover:bg-gradient-to-br group-hover:from-primary/10 group-hover:to-secondary/10 transition-all shadow-inner" style={{ transitionDelay: '225ms' }}>
                      <span className="material-symbols-outlined text-primary/50 text-xl group-hover:text-primary transition-colors">auto_awesome</span>
                      <span className="text-[9px] uppercase tracking-widest text-white/50 font-bold">Verdict</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Floating Action Dock (Slides up when active) */}
        <div 
          className={`fixed bottom-0 left-0 w-full z-50 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${sandboxItems.length > 0 ? 'translate-y-0' : 'translate-y-[120%]'}`}
        >
          {/* Gradient shadow for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none -z-10 h-[150%] -top-[50%]" />
          
          <div className="max-w-[1400px] mx-auto px-4 md:px-margin-desktop pb-6">
            <div 
              className="discovery-panel border border-white/10 backdrop-blur-2xl bg-[#0a0a0c]/80 rounded-2xl p-4 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/5"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                
                {/* Header & Status */}
                <div className="flex items-center gap-4 lg:w-1/4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-secondary p-[1px] shrink-0 shadow-[0_0_15px_rgba(255,51,102,0.3)]">
                    <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-xl">auto_awesome</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-white font-bold tracking-wide">Style Sandbox</h3>
                    <p className="text-xs text-on-surface-variant font-medium uppercase tracking-widest mt-0.5">
                      {sandboxItems.length} / 3 Items Added
                    </p>
                  </div>
                </div>

                {/* Horizontal Item Slots */}
                <div className="flex-grow flex justify-center gap-4">
                  {[0, 1, 2].map((index) => {
                    const item = sandboxItems[index];
                    if (item) {
                      const product = item.product || item;
                      return (
                        <div key={product.id} className="relative w-16 h-20 md:w-20 md:h-24 rounded-xl overflow-hidden bg-black/50 border border-white/10 shadow-inner group">
                          {/* Ambient background trick */}
                          <div 
                            className="absolute inset-0 bg-cover bg-center blur-md opacity-40 scale-150 saturate-150"
                            style={{ backgroundImage: `url(${product.image_url})` }}
                          />
                          <img src={product.image_url} alt={product.name} className="relative w-full h-full object-contain z-10" />
                          <button 
                            onClick={() => handleRemoveFromSandbox(product.id)}
                            className="absolute -top-2 -right-2 bg-black/80 backdrop-blur text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all z-20 hover:text-primary"
                          >
                            <span className="material-symbols-outlined text-[14px]">close</span>
                          </button>
                        </div>
                      );
                    } else {
                      return (
                        <div key={`empty-${index}`} className="w-16 h-20 md:w-20 md:h-24 rounded-xl border border-dashed border-white/20 flex flex-col items-center justify-center text-on-surface-variant/40 bg-white/5 transition-colors hover:bg-white/10">
                          <span className="material-symbols-outlined text-xl mb-1">add</span>
                        </div>
                      );
                    }
                  })}
                </div>

                {/* Action Buttons */}
                <div className="lg:w-1/4 flex justify-end shrink-0">
                  {sandboxItems.length >= 2 && !sandboxResult && !analyzingSandbox && (
                    <button 
                      onClick={handleAnalyzeSandbox}
                      className="px-6 py-3.5 bg-gradient-to-r from-primary to-secondary text-white font-bold text-sm uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(255,51,102,0.4)] flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">psychology</span>
                      Analyze Outfit
                    </button>
                  )}
                  
                  {analyzingSandbox && (
                    <div className="px-6 py-3.5 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3 text-primary font-bold text-sm tracking-widest uppercase shadow-inner">
                      <span className="material-symbols-outlined animate-spin text-[18px]">sync</span> 
                      Computing...
                    </div>
                  )}

                  {/* Sandbox Results Popover (Appears directly above the dock) */}
                  {sandboxResult && !sandboxResult.error && (
                    <div className="absolute bottom-[calc(100%+16px)] right-4 md:right-margin-desktop w-[400px] max-w-[calc(100vw-32px)] discovery-panel border border-primary/30 rounded-2xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom-4 fade-in duration-300">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-white font-bold text-lg tracking-tight">Style Verdict</h4>
                        <div className="text-black font-bold bg-gradient-to-r from-primary to-secondary px-3 py-1 rounded-full text-xs uppercase tracking-widest shadow-[0_0_15px_rgba(255,51,102,0.5)]">
                          {sandboxResult.compatibility_score}% Match
                        </div>
                      </div>
                      <p className="text-on-surface-variant leading-relaxed text-sm mb-6 bg-black/20 p-4 rounded-xl border border-white/5">
                        {sandboxResult.analysis}
                      </p>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => { setSandboxResult(null); setSandboxItems([]); }}
                          className="flex-1 py-2.5 rounded-xl border border-white/10 text-white text-sm font-bold hover:bg-white/5 transition-colors"
                        >
                          Clear
                        </button>
                        <button 
                          onClick={handleAddAllToCart}
                          className="flex-1 py-2.5 bg-white text-black font-bold rounded-xl text-sm shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:bg-gray-200 transition-colors flex justify-center items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-[18px]">shopping_cart_checkout</span>
                          Buy Look
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {sandboxResult?.error && (
                    <div className="absolute bottom-[calc(100%+16px)] right-4 md:right-margin-desktop w-[400px] bg-error/10 border border-error/30 text-error p-4 rounded-xl backdrop-blur-md shadow-2xl">
                      {sandboxResult.error}
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
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
