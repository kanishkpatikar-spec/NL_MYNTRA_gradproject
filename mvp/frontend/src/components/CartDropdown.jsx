/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useCart } from '@/context/CartContext';

export default function CartDropdown() {
  const { cartItems, cartTotal, removeFromCart, clearCart, isCartOpen, setIsCartOpen } = useCart();
  const dropdownRef = useRef(null);

  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsCartOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCheckout = () => {
    alert(`Checking out ${itemCount} items for ₹${cartTotal}!`);
    clearCart();
    setIsCartOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsCartOpen(!isCartOpen)}
        className="relative p-2 rounded-full text-on-surface-variant hover:text-white transition-colors hover:bg-white/10"
      >
        <span className="material-symbols-outlined text-[24px]">shopping_cart</span>
        {itemCount > 0 && (
          <span className="absolute top-0 right-0 bg-gradient-to-tr from-[#ffb596] to-[#f4859a] text-black text-[10px] font-extrabold w-4 h-4 flex items-center justify-center rounded-full animate-in zoom-in shadow-lg shadow-[#ffb596]/30">
            {itemCount}
          </span>
        )}
      </button>

      {isCartOpen && (
        <div className="absolute right-0 mt-3 w-[400px] discovery-panel border border-white/5 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-top-2 fade-in duration-200 overflow-hidden">
          <div className="p-6 border-b border-white/5 flex justify-between items-end">
            <div>
              <h3 className="font-headline-md text-white tracking-tight">Your Cart</h3>
              <p className="text-on-surface-variant text-body-sm mt-1">Ready for checkout</p>
            </div>
            <span className="bg-white/10 text-white px-3 py-1 rounded-full text-label-sm font-medium backdrop-blur-md">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </span>
          </div>
          
          <div className="max-h-[400px] overflow-y-auto p-4 custom-scrollbar">
            {cartItems.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined text-4xl text-white/20 mb-3">shopping_bag</span>
                <p className="text-on-surface-variant text-body-md">Your cart is empty.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {cartItems.map((item) => (
                  <li key={item.id} className="flex gap-4 p-3 hover:bg-white/5 rounded-xl transition-all duration-300 group border border-transparent hover:border-white/5">
                    <div className="relative w-20 h-24 rounded-lg overflow-hidden bg-[#0a0a0c] flex-shrink-0 shadow-inner">
                      {item.image_url ? (
                        <>
                          {/* Ambient background for edge-to-edge feel */}
                          <div 
                            className="absolute inset-0 bg-cover bg-center blur-md opacity-40 scale-150 saturate-150"
                            style={{ backgroundImage: `url(${item.image_url})` }}
                          />
                          {/* Main contained image */}
                          <img src={item.image_url} alt={item.name} className="relative w-full h-full object-contain z-10" />
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-on-surface-variant text-[24px]">image</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 py-1 flex flex-col justify-between">
                      <div>
                        <p className="font-label-lg text-white truncate group-hover:text-[#ffb596] transition-colors">{item.name}</p>
                        <p className="text-body-sm text-on-surface-variant mt-1 line-clamp-2 leading-relaxed opacity-80">{item.brand || "Myntra"}</p>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <p className="font-headline-sm text-white">₹{item.price}</p>
                        <span className="text-label-sm text-on-surface-variant bg-white/5 px-2 py-0.5 rounded">Qty: {item.quantity}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-on-surface-variant hover:text-[#ffb596] hover:bg-[#ffb596]/10 opacity-0 group-hover:opacity-100 transition-all p-2 rounded-full h-fit flex-shrink-0"
                      title="Remove item"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {cartItems.length > 0 && (
            <div className="p-6 border-t border-white/5 bg-gradient-to-b from-transparent to-black/40">
              <div className="flex justify-between items-center mb-5">
                <span className="text-on-surface-variant font-label-lg uppercase tracking-wider">Total</span>
                <span className="text-white font-headline-md tracking-tight">₹{cartTotal}</span>
              </div>
              <button 
                onClick={handleCheckout}
                className="w-full bg-gradient-to-r from-[#ffb596] to-[#f4859a] text-black py-3.5 rounded-xl font-label-lg font-bold uppercase tracking-widest hover:opacity-90 hover:shadow-[0_0_20px_rgba(255,181,150,0.3)] transition-all flex justify-center items-center gap-2 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[20px]">lock</span>
                Secure Checkout
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
