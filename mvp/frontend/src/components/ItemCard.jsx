/* eslint-disable @next/next/no-img-element */
import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';

export default function ItemCard({ item, onClick, isSelected, draggable, onDragStart, onAddToSandbox, isInSandbox }) {
  // Fix the mapping: data is inside item.product if it's the wrapper format
  const product = item.product || item;
  const { addToCart } = useCart();
  const [showToast, setShowToast] = useState(false);

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(product);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };
  
  return (
    <div 
      draggable={draggable}
      onDragStart={onDragStart}
      className={`discovery-panel rounded-3xl overflow-hidden group relative flex flex-col h-[420px] cursor-pointer ${isSelected ? 'ring-1 ring-primary shadow-[0_0_30px_rgba(216,180,254,0.3)] z-10' : ''}`}
      onClick={() => onClick(item.id || product.id)}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent z-10"></div>
      
      {/* Toast Notification */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-surface-container-highest/90 backdrop-blur-md px-4 py-2 rounded-lg border border-primary/20 shadow-xl transition-all duration-300 ${showToast ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
        <span className="text-on-surface font-label-sm flex items-center gap-2 whitespace-nowrap">
          <span className="material-symbols-outlined text-primary text-[16px]">check_circle</span>
          Added to cart
        </span>
      </div>
      
      {/* Image */}
      <div className="h-[280px] w-full relative overflow-hidden bg-black/20 flex items-center justify-center">
        {product.image_url ? (
          <>
            {/* Premium ambient blurred background to seamlessly fill gaps */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
              <img 
                src={product.image_url} 
                alt="" 
                className="w-full h-full object-cover opacity-60 blur-2xl scale-125 saturate-150" 
              />
              <div className="absolute inset-0 bg-[#05070A]/30 backdrop-blur-[2px]"></div>
            </div>
            
            {/* Scaled down un-cropped main image */}
            <img 
              src={product.image_url} 
              alt={product.name} 
              className="relative z-10 w-full h-full object-contain transition-transform duration-700 group-hover:scale-110 drop-shadow-2xl" 
            />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-on-surface-variant font-label-bold text-label-bold uppercase">No Image</div>
        )}
        
        {/* Badges */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
          <span className="bg-surface-container-highest/60 backdrop-blur-md text-on-surface font-label-bold text-label-bold px-3 py-1.5 rounded-full border border-white/10 uppercase tracking-wider flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">sell</span> ₹{product.price}
          </span>
        </div>
        
        {/* Add to Sandbox Button */}
        {onAddToSandbox && (
          <button 
            onClick={(e) => { e.stopPropagation(); if (!isInSandbox) onAddToSandbox(item); }}
            className={`absolute top-4 right-4 z-20 backdrop-blur-md p-2 rounded-full border border-white/10 transition-colors shadow-lg ${
              isInSandbox 
                ? 'bg-primary text-on-primary-fixed' 
                : 'bg-surface-container-highest/60 text-on-surface hover:text-primary hover:bg-white/10'
            }`}
            title={isInSandbox ? "Added to Style Sandbox" : "Add to Style Sandbox"}
          >
            <span className="material-symbols-outlined">
              {isInSandbox ? 'check_circle' : 'add_circle'}
            </span>
          </button>
        )}
      </div>

      {/* Details */}
      <div className="p-5 relative z-20 flex-grow flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start gap-2 mb-1.5">
            <p className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-widest truncate">{product.brand}</p>
            {product.size && (
              <span className="bg-white/5 backdrop-blur-md text-white/80 border border-white/10 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest whitespace-nowrap shadow-sm">
                Size: <span className="text-white">{product.size}</span>
              </span>
            )}
          </div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface line-clamp-2 leading-tight">{product.name}</h3>
        </div>
        
        <div className="flex items-center justify-between mt-4 gap-2">
          <span className="text-on-surface-variant font-body-sm text-body-sm min-w-max">
            ★ {product.rating}
          </span>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleAddToCart}
              className="bg-primary/20 text-primary border border-primary/30 px-3 py-1.5 rounded-lg font-label-bold text-[10px] uppercase tracking-wider hover:bg-primary hover:text-white transition-all flex items-center gap-1 shadow-sm"
            >
              <span className="material-symbols-outlined text-[14px]">shopping_cart_checkout</span>
              Buy Now
            </button>
            <button className="text-primary font-label-bold text-label-bold flex items-center gap-1 hover:text-secondary transition-colors">
              {isSelected ? 'Close' : 'Analyze'} <span className="material-symbols-outlined text-[16px]">{isSelected ? 'close' : 'arrow_forward'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
