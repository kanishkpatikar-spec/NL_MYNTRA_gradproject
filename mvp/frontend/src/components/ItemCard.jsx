import React from 'react';

export default function ItemCard({ item, onClick, isSelected, draggable, onDragStart, onAddToSandbox, isInSandbox }) {
  // Fix the mapping: data is inside item.product if it's the wrapper format
  const product = item.product || item;
  
  return (
    <div 
      draggable={draggable}
      onDragStart={onDragStart}
      className={`glass-panel rounded-xl overflow-hidden group relative flex flex-col h-[420px] cursor-pointer transition-all duration-300 ${isSelected ? 'ring-2 ring-primary shadow-[0_0_20px_rgba(255,178,186,0.2)]' : 'hover:ring-1 hover:ring-primary/50'}`}
      onClick={() => onClick(item.id || product.id)}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent z-10"></div>
      
      {/* Image */}
      <div className="h-[280px] w-full relative overflow-hidden bg-surface-container-low">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name} 
            className="w-full h-full object-contain object-center transition-transform duration-700 group-hover:scale-105 p-2" 
          />
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
          <p className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-widest mb-1 truncate">{product.brand}</p>
          <h3 className="font-headline-sm text-headline-sm text-on-surface line-clamp-2">{product.name}</h3>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <span className="text-on-surface-variant font-body-sm text-body-sm">
            ★ {product.rating}
          </span>
          <button className="text-primary font-label-bold text-label-bold flex items-center gap-1 hover:text-secondary transition-colors">
            {isSelected ? 'Close' : 'Analyze'} <span className="material-symbols-outlined text-[16px]">{isSelected ? 'close' : 'arrow_forward'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
