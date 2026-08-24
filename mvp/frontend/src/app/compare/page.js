'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { wishlistService, moduleService } from '@/services/api';
import { Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import ComparisonClarity from '@/components/ComparisonClarity';

export default function ComparePage() {
  const searchParams = useSearchParams();
  const idsParam = searchParams.get('ids');
  
  const [items, setItems] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCompareData = async () => {
      if (!idsParam) {
        setError('No items selected for comparison.');
        setLoading(false);
        return;
      }

      const ids = idsParam.split(',');
      if (ids.length < 2) {
        setError('Please select at least 2 items to compare.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Fetch all item details
        const itemsPromises = ids.map(id => wishlistService.getItemDetails(id));
        const itemsData = await Promise.all(itemsPromises);
        setItems(itemsData);

        // Fetch comparison module
        const compareResult = await moduleService.compareItems(ids);
        if (compareResult.modules && compareResult.modules.comparison_clarity) {
          setComparisonData(compareResult.modules.comparison_clarity);
        }
      } catch (err) {
        console.error('Failed to load comparison data:', err);
        setError('Failed to generate comparison. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCompareData();
  }, [idsParam]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-gray-500 font-medium text-lg">AI is analyzing your selected items...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto mt-12 p-6 bg-red-50 border border-red-100 rounded-lg flex flex-col items-center text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-red-600 font-medium mb-6">{error}</p>
        <Link href="/" className="px-4 py-2 bg-primary text-white rounded font-medium hover:bg-primary-hover transition-colors">
          Return to Wishlist
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Wishlist
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-8">Compare Items</h1>

      {/* Side-by-side product cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <div className="w-full aspect-[3/4] bg-gray-100 relative">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="object-cover w-full h-full" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">No Image</div>
              )}
            </div>
            <div className="p-4 flex flex-col flex-1">
              <h3 className="text-sm font-bold text-gray-900 truncate">{item.brand}</h3>
              <p className="text-xs text-gray-500 line-clamp-2 mb-2 h-8">{item.name}</p>
              <div className="mt-auto flex justify-between items-center">
                <span className="font-bold text-gray-900">₹{item.price}</span>
                <span className="text-xs font-medium text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">★ {item.rating}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Comparison Clarity Module */}
      {comparisonData && (
        <ComparisonClarity data={comparisonData} />
      )}
    </div>
  );
}
