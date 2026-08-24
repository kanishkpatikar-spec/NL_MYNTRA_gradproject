import React from 'react';
import { Bookmark, ShoppingBag, X } from 'lucide-react';
import { Bookmark, ShoppingBag, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { logEvent } from '@/services/events';

export default function ActionButtons({ itemId }) {
  const router = useRouter();

  const handleDismiss = () => {
    router.push('/');
  };

  const handleSaveNote = () => {
    alert('Note saved to local storage! (Mock)');
  };

  const handlePurchase = () => {
    logEvent('item_purchased', { item_id: itemId });
    if (confirm('Proceed to Myntra cart?')) {
      alert('Mock redirecting to purchase flow...');
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 mt-6 pt-6 border-t border-gray-100">
      <button 
        onClick={handleDismiss}
        className="flex-1 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <X className="w-4 h-4" />
        Dismiss
      </button>
      
      <button 
        onClick={handleSaveNote}
        className="flex-1 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <Bookmark className="w-4 h-4" />
        Save Note
      </button>

      <button 
        onClick={handlePurchase}
        className="flex-[2] w-full flex items-center justify-center gap-2 px-6 py-3 rounded-md font-bold bg-primary text-white hover:bg-primary-hover shadow-md shadow-primary/20 transition-colors"
      >
        <ShoppingBag className="w-5 h-5" />
        Proceed to Purchase
      </button>
    </div>
  );
}
