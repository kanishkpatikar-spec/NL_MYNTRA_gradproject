'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { wishlistService, moduleService } from '@/services/api';
import ConfidencePanel from '@/components/ConfidencePanel';
import ActionButtons from '@/components/ActionButtons';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ItemDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [modulesData, setModulesData] = useState(null);
  const [loadingItem, setLoadingItem] = useState(true);
  const [loadingModules, setLoadingModules] = useState(true);

  useEffect(() => {
    const fetchItemAndModules = async () => {
      try {
        setLoadingItem(true);
        const itemData = await wishlistService.getItemDetails(id);
        setItem(itemData);
        setLoadingItem(false);
        
        // Fetch modules after item is loaded
        setLoadingModules(true);
        const modsData = await moduleService.getModules(id);
        setModulesData(modsData.modules || {});
      } catch (err) {
        console.error('Failed to fetch item or modules:', err);
      } finally {
        setLoadingItem(false);
        setLoadingModules(false);
      }
    };
    
    if (id) {
      fetchItemAndModules();
    }
  }, [id]);

  if (loadingItem) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-3xl mx-auto mt-12 p-6 text-center">
        <h2 className="text-xl font-bold mb-4">Item not found</h2>
        <Link href="/" className="text-primary hover:underline">Return to wishlist</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Wishlist
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-2/5 aspect-[3/4] md:aspect-auto md:min-h-[400px] bg-gray-100 relative">
            {item.image_url ? (
              <img src={item.image_url} alt={item.name} className="object-cover w-full h-full" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">No Image</div>
            )}
          </div>
          
          <div className="w-full md:w-3/5 p-6 md:p-8 flex flex-col">
            <h2 className="text-xl font-bold text-gray-900 mb-1">{item.brand}</h2>
            <h1 className="text-2xl text-gray-600 mb-4">{item.name}</h1>
            
            <div className="flex items-center gap-4 mb-6">
              <span className="text-3xl font-bold text-gray-900">₹{item.price}</span>
              <div className="flex items-center text-sm font-medium bg-gray-50 px-2 py-1 rounded text-gray-600 border border-gray-200">
                <span className="text-yellow-500 mr-1">★</span> {item.rating} <span className="ml-1 text-gray-400">({item.review_count})</span>
              </div>
            </div>

            {item.sizes && (
              <div className="mb-8">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Select Size</h3>
                <div className="flex flex-wrap gap-3">
                  {item.sizes.map(size => (
                    <button key={size} className="w-12 h-12 flex items-center justify-center rounded-full border border-gray-300 text-sm font-medium text-gray-700 hover:border-primary hover:text-primary transition-colors">
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="mt-auto">
              <ActionButtons itemId={item.id} />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <span className="bg-primary/10 text-primary p-1.5 rounded-md">✨</span>
          AI Confidence Insights
        </h2>
        <p className="text-sm text-gray-500 mt-1">Generated based on reviews, sizing data, and price history.</p>
      </div>

      <ConfidencePanel modulesData={modulesData} loading={loadingModules} />
    </div>
  );
}
