"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useCart } from '@/context/CartContext';

export default function CartDropdown() {
  const { cartItems, cartTotal, removeFromCart, clearCart } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCheckout = () => {
    alert(`Checking out ${itemCount} items for ₹${cartTotal}!`);
    clearCart();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-on-surface-variant hover:text-primary transition-colors hover:bg-white/5"
      >
        <span className="material-symbols-outlined">shopping_cart</span>
        {itemCount > 0 && (
          <span className="absolute top-0 right-0 bg-primary text-on-primary text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full animate-in zoom-in">
            {itemCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 glass-panel-heavy rounded-xl shadow-2xl z-50 animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <h3 className="font-headline-sm text-on-surface">Your Cart</h3>
            <span className="text-on-surface-variant text-body-sm">{itemCount} items</span>
          </div>
          
          <div className="max-h-80 overflow-y-auto p-2">
            {cartItems.length === 0 ? (
              <div className="p-6 text-center text-on-surface-variant text-body-sm">
                Your cart is empty.
              </div>
            ) : (
              <ul className="space-y-2">
                {cartItems.map((item) => (
                  <li key={item.id} className="flex gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors group">
                    <div className="w-12 h-12 rounded bg-surface-container-low flex items-center justify-center overflow-hidden flex-shrink-0">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-on-surface-variant text-[20px]">image</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-label-sm text-on-surface truncate">{item.name}</p>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">₹{item.price} x {item.quantity}</p>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-on-surface-variant hover:text-error opacity-0 group-hover:opacity-100 transition-all p-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {cartItems.length > 0 && (
            <div className="p-4 border-t border-white/10 bg-surface-container-lowest/50 rounded-b-xl">
              <div className="flex justify-between items-center mb-4">
                <span className="text-on-surface-variant font-body-sm">Total</span>
                <span className="text-on-surface font-headline-sm">₹{cartTotal}</span>
              </div>
              <button 
                onClick={handleCheckout}
                className="w-full bg-primary text-on-primary py-2.5 rounded-lg font-label-bold uppercase tracking-wider hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 flex justify-center items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">lock</span>
                Secure Checkout
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
