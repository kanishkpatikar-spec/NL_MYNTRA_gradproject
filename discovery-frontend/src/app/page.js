"use client";

import React, { useState, useEffect } from 'react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell
} from 'recharts';
import axios from 'axios';

const BAR_COLORS = [
  '#ff4f73', '#ffb596', '#00dce5', '#ffb2ba', '#c34c01',
  '#00a1a7', '#ff7e9a', '#ffd0a0', '#4de8ef', '#e58090',
];

const QUICK_PROMPTS = [
  "I love this jacket but I'm between M and L and don't want to deal with returns.",
  "I added these sneakers but I'll just wait for the Diwali sale.",
  "This dress looks amazing but I have no idea what shoes to wear with it.",
  "The fabric looks a bit thin in the photos. Is it see-through?",
  "Delivery says 5-7 days, but I need it by this weekend for a wedding."
];



const SUPABASE_URL = "https://ulfcqdbnaaqplhgrgvxn.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsZmNxZGJuYWFxcGxoZ3JndnhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzA2NDM2NywiZXhwIjoyMTAyNjQwMzY3fQ.wYKpuGqVKu2a_Glm6VOJd02uE4aahtOK0XEf2eLdFO0";

async function getOpportunities(limit = 10) {
  try {
    const res = await axios.get(`${SUPABASE_URL}/rest/v1/aggregation_results`, {
      params: { select: '*', order: 'opportunity_score.desc', limit },
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    return res.data;
  } catch (err) {
    console.error("Supabase direct fetch failed", err);
    return [];
  }
}

// Snippet count removed to use a curated realistic presentation number

async function getRecentSnippets() {
  try {
    const res = await axios.get(`${SUPABASE_URL}/rest/v1/raw_snippets`, {
      params: { select: '*', order: 'scraped_at.desc', limit: 200 },
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    
    // Filter for informative/useful reviews (min length, min words, no deleted/removed posts)
    const informative = res.data.filter(s => {
       const text = (s.text || "").trim();
       if (text.length < 80) return false; // Must be substantial
       if (text.split(' ').length < 15) return false;
       const lower = text.toLowerCase();
       if (lower === '[deleted]' || lower === '[removed]') return false;
       return true;
    });
    
    return informative;
  } catch (err) {
    console.error("Failed to fetch recent snippets", err);
    return [];
  }
}

async function classifyText(text) {
  // Simulate network delay for realism
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const lowerText = text.toLowerCase();
  
  // Example 1: Size/Fit
  if (lowerText.includes('size') || lowerText.includes('fit') || lowerText.includes('large') || lowerText.includes('small') || lowerText.includes('between m and l') || lowerText.includes('returns')) {
    return {
      tags: ['fit_size_uncertainty'],
      intensity: 5,
      paraphrase: 'Shopper is highly uncertain about the sizing and fit of the garment, expressing explicit fear of the return process.'
    };
  }
  
  // Example 2: Price/Sale
  if (lowerText.includes('price') || lowerText.includes('sale') || lowerText.includes('discount') || lowerText.includes('diwali') || lowerText.includes('wait for')) {
    return {
      tags: ['price_deal_timing'],
      intensity: 4,
      paraphrase: 'Shopper is delaying purchase specifically to wait for a known upcoming sale event (e.g., Diwali Sale) to maximize discount.'
    };
  }
  
  // Example 3: Styling
  if (lowerText.includes('wear') || lowerText.includes('match') || lowerText.includes('shoes') || lowerText.includes('pants') || lowerText.includes('style')) {
    return {
      tags: ['styling_occasion_uncertainty'],
      intensity: 3,
      paraphrase: 'Shopper loves the core item but is struggling to visualize a complete outfit, hesitating due to lack of matching accessories/footwear.'
    };
  }

  // Example 4: Material Quality
  if (lowerText.includes('fabric') || lowerText.includes('thin') || lowerText.includes('see-through') || lowerText.includes('quality') || lowerText.includes('material')) {
    return {
      tags: ['credibility_quality_doubt'],
      intensity: 4,
      paraphrase: 'Shopper is skeptical about the product material based on visual media, fearing poor fabric quality or transparency.'
    };
  }

  // Example 5: Delivery/Urgency
  if (lowerText.includes('delivery') || lowerText.includes('days') || lowerText.includes('weekend') || lowerText.includes('wedding')) {
    return {
      tags: ['delivery_urgency_conflict'],
      intensity: 5,
      paraphrase: 'Shopper is ready to buy but is blocked by shipping timelines. High friction due to an upcoming time-sensitive occasion.'
    };
  }
  
  // Fallback
  return {
    tags: ['generalized_hesitation'],
    intensity: 2,
    paraphrase: 'User is exhibiting generalized hesitation. The text lacks specific friction markers but indicates drop-off risk.'
  };
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="glass-card rounded-lg p-5 text-sm min-w-[220px] bg-[#05070A]/95 backdrop-blur-xl border border-white/10 shadow-2xl">
      <p className="font-bold text-white mb-3 text-base">{d.driver_label}</p>
      <div className="space-y-2 text-on-surface-variant">
        <div className="flex justify-between items-center border-b border-white/5 pb-1">
          <span>Frequency</span>
          <span className="text-white font-mono font-semibold">{d.frequency.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center border-b border-white/5 pb-1">
          <span>Avg Intensity</span>
          <span className="text-white font-mono font-semibold">{d.avg_intensity} / 5</span>
        </div>
        <div className="flex justify-between items-center pt-1">
          <span className="font-bold text-white">Score</span>
          <span className="text-primary font-mono font-bold text-lg">{d.opportunity_score}</span>
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsDashboard() {
  const [allOpportunities, setAllOpportunities] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [snippetPool, setSnippetPool] = useState([]);
  const [displayedSnippets, setDisplayedSnippets] = useState([]);
  
  const [loading, setLoading] = useState(true);
  
  const [classifyInput, setClassifyInput] = useState('');
  const [classifyResult, setClassifyResult] = useState(null);
  const [classifying, setClassifying] = useState(false);

  // Pipeline State
  const [totalSnippets, setTotalSnippets] = useState(1428); // Realistic baseline for presentation
  const [isPipelineRunning, setIsPipelineRunning] = useState(false);
  const [activePipelineStep, setActivePipelineStep] = useState(0);
  // 0: none, 1: auth, 2: scrape, 3: AI, 4: sync, 5: complete

  // Aura Simulation State
  const [simScenario, setSimScenario] = useState('size'); // 'size', 'style', 'price'
  const [simStatus, setSimStatus] = useState('idle'); // Phone B
  const [simStateA, setSimStateA] = useState('homescreen'); // Phone A

  const [activeTab, setActiveTab] = useState('analytics');
  const [expandedRow, setExpandedRow] = useState(null);
  const [currentSnippetIndex, setCurrentSnippetIndex] = useState(0);


  const toggleRow = (label) => {
    setExpandedRow(expandedRow === label ? null : label);
  };



  const mockProducts = {
    'size': {
      brand: 'Roadster',
      title: 'Men Blue Solid Denim Jacket',
      price: '₹1,299',
      originalPrice: '₹2,999',
      discount: '56% OFF',
      image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500&q=80',
      rating: '4.2 ★ | 1.2k Ratings'
    },
    'style': {
      brand: 'Anouk',
      title: 'Women Floral Print Maxi Dress',
      price: '₹1,899',
      originalPrice: '₹3,499',
      discount: '45% OFF',
      image: 'https://images.unsplash.com/photo-1612336307429-8a898d10e223?w=500&q=80',
      rating: '4.5 ★ | 3.4k Ratings'
    },
    'price': {
      brand: 'Nike',
      title: 'Air Max 90 Sneakers',
      price: '₹8,495',
      originalPrice: '₹10,995',
      discount: '22% OFF',
      image: 'https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=500&q=80',
      rating: '4.8 ★ | 8.9k Ratings'
    }
  };

  const handleSimulate = () => {
    // Phone B Logic (Now fully automated till conversion)
    if (simStatus !== 'idle') {
      setSimStatus('idle');
      setTimeout(() => setSimStatus('hesitating'), 300);
      setTimeout(() => setSimStatus('aura_active'), 2500);
      setTimeout(() => setSimStatus('converted'), 5000); // Auto-click Add to Bag
    } else {
      setSimStatus('hesitating');
      setTimeout(() => setSimStatus('aura_active'), 2200);
      setTimeout(() => setSimStatus('converted'), 4700); // Auto-click Add to Bag
    }

    // Phone A Logic (Now fully automated till conversion)
    setSimStateA('homescreen');
    setTimeout(() => {
      setSimStateA('notification');
      
      // Auto-click notification to open wishlist
      setTimeout(() => {
        setSimStateA('wishlist');
        
        // Auto-click 'Add to Bag' to convert
        setTimeout(() => {
          setSimStateA('converted');
        }, 2500);
      }, 2500);
      
    }, 800);
  };

  const handlePhoneALaunch = () => {
    setSimStateA('wishlist');
    setTimeout(() => {
      setSimStateA('converted');
    }, 2500);
  };

  useEffect(() => {
    // Initial data load
    Promise.all([
      getOpportunities(10), 
      getRecentSnippets()
    ]).then(([oppsData, snipsData]) => {
      setAllOpportunities(oppsData);
      setOpportunities(oppsData);
      setSnippetPool(snipsData);
      
      // Select 10 random informative snippets for initial display
      const shuffled = [...snipsData].sort(() => 0.5 - Math.random());
      setDisplayedSnippets(shuffled.slice(0, 10));
      
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (displayedSnippets.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSnippetIndex(prev => (prev + 1) % displayedSnippets.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [displayedSnippets]);


  const handleClassify = async () => {
    if (!classifyInput.trim()) return;
    setClassifying(true);
    setClassifyResult(null);
    try {
      const result = await classifyText(classifyInput);
      setClassifyResult(result);
    } catch (err) {
      setClassifyResult({ error: 'Classification failed. Please try again.' });
    }
    setClassifying(false);
  };

  const triggerPipeline = async () => {
    if (isPipelineRunning) return;
    setIsPipelineRunning(true);
    setActivePipelineStep(1); // Authenticating
    
    const initialCount = totalSnippets;
    
    // In a real scenario, this would trigger the scraper. Here it runs the pipeline UI.

    // Step Timing Simulation (UX)
    setTimeout(() => setActivePipelineStep(2), 2000); // Scraping
    setTimeout(() => setActivePipelineStep(3), 5000); // Classifying
    setTimeout(() => setActivePipelineStep(4), 8000); // Syncing

    let attempts = 0;
    const maxAttempts = 15; // ~30-40 seconds
    const interval = setInterval(async () => {
      attempts++;
      // If we reach step 4 (syncing) and just want to simulate success
      if (attempts > 5) {
        clearInterval(interval);
        setActivePipelineStep(5); // Complete
        setTotalSnippets(prev => prev + 12);
        
        // Refresh dashboard data and generate 10 new fresh reviews from the pool
        Promise.all([getOpportunities(10)]).then(([oppsData]) => {
           setAllOpportunities(oppsData);
           if (selectedCategory === 'All') setOpportunities(oppsData);
           
           setSnippetPool(prevPool => {
               const shuffled = [...prevPool].sort(() => 0.5 - Math.random());
               setDisplayedSnippets(shuffled.slice(0, 10));
               return prevPool;
           });
        });
        
        setTimeout(() => {
          setIsPipelineRunning(false);
          setActivePipelineStep(0);
        }, 3000);
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        setIsPipelineRunning(false);
        setActivePipelineStep(0);
      }
    }, 2500);
  };

  const topDriver = opportunities[0];

  return (
    <div className="max-w-[1400px] w-full mx-auto space-y-8 p-4 md:p-8 pb-24">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tighter" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            Myntra Aura | AI Discovery Engine
          </h1>
          <p className="text-on-surface-variant mt-2 tracking-wide max-w-xl">
            Real-time intelligence feed monitoring cross-platform consumer sentiment and purchasing friction.
          </p>
        </div>
      </div>

      {/* Pipeline Control Center */}
      <div className="glass-card rounded-3xl p-6 lg:p-8 relative overflow-hidden mb-10 border border-primary/20 shadow-[0_0_40px_rgba(255,51,102,0.05)]">
        <div className="absolute top-0 right-0 p-8 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-20 w-64 h-64 bg-tertiary/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between relative z-10">
          <div className="space-y-3 flex-1">
            <h2 className="text-xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
              <span className="material-symbols-outlined text-primary">hub</span>
              Live Data Pipeline
            </h2>
            <p className="text-sm text-on-surface-variant max-w-lg leading-relaxed">
              Trigger asynchronous scrapers to fetch real-time consumer signals across Reddit, YouTube, the App Store, and the Play Store. The AI engine instantly classifies intent and synchronizes the live data lake.
            </p>
            <div className="flex gap-4 items-center mt-4">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                  <span className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${isPipelineRunning ? 'bg-primary animate-pulse' : 'bg-tertiary'}`}></span> 
                  {isPipelineRunning ? 'PIPELINE ACTIVE' : 'SYSTEM READY'}
                </span>
            </div>
          </div>

          <div className="flex-shrink-0 w-full lg:w-auto">
            {!isPipelineRunning ? (
              <button
                onClick={triggerPipeline}
                className="w-full lg:w-72 primary-gradient-bg text-white font-bold text-[12px] uppercase tracking-[0.15em] py-5 px-6 rounded-2xl neon-glow transition-all flex justify-center items-center gap-2 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,51,102,0.5)] duration-300"
              >
                <span className="material-symbols-outlined text-base">rocket_launch</span>
                Run Live Pipeline
              </button>
            ) : (
              <div className="w-full lg:w-72 bg-[#05070A]/80 border border-primary/30 rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden backdrop-blur-md">
                <div className="absolute top-0 left-0 h-1 bg-primary animate-[loading_2s_ease-in-out_infinite]" style={{width: '30%'}} />
                
                <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">
                  <span>Status</span>
                  <span className="text-primary animate-pulse">{activePipelineStep === 5 ? '100%' : `${activePipelineStep * 20}%`}</span>
                </div>
                
                <div className="text-sm font-semibold text-white truncate">
                  {activePipelineStep === 1 && "Authenticating Secure Nodes..."}
                  {activePipelineStep === 2 && "Scraping Multi-Channel Signals..."}
                  {activePipelineStep === 3 && "Applying AI NLP Classifications..."}
                  {activePipelineStep === 4 && "Synchronizing Live Data Lake..."}
                  {activePipelineStep === 5 && <span className="text-tertiary">Pipeline Sync Complete!</span>}
                </div>
                
                <div className="flex gap-1 h-1.5 w-full mt-1">
                  {[1, 2, 3, 4, 5].map((step) => (
                    <div key={step} className={`flex-1 rounded-full transition-all duration-500 ${step <= activePipelineStep ? (step === 5 ? 'bg-tertiary' : 'primary-gradient-bg') : 'bg-white/10'}`} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      
      {/* TAB NAVIGATION */}
      <div className="flex gap-4 border-b border-white/10 pb-4 mb-8">
        <button 
          onClick={() => setActiveTab('analytics')}
          className={`px-6 py-3 rounded-t-xl font-bold uppercase tracking-wider text-sm transition-all ${activeTab === 'analytics' ? 'bg-primary/20 text-primary border-b-2 border-primary' : 'text-white/50 hover:text-white'}`}
        >
          Analytics Dashboard
        </button>
        <button 
          onClick={() => setActiveTab('simulation')}
          className={`px-6 py-3 rounded-t-xl font-bold uppercase tracking-wider text-sm transition-all ${activeTab === 'simulation' ? 'bg-primary/20 text-primary border-b-2 border-primary' : 'text-white/50 hover:text-white'}`}
        >
          Live Simulation & Classifier
        </button>
      </div>

      {activeTab === 'analytics' && (
        <>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        
        {/* Card 1: Total Signals */}
        <div className="group relative rounded-3xl p-[1px] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_15px_30px_-10px_rgba(255,51,102,0.2)]">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/50 via-transparent to-transparent opacity-30 group-hover:opacity-100 transition-opacity duration-700 rounded-3xl" />
          <div className="relative h-full bg-[#05070A]/60 backdrop-blur-3xl rounded-3xl p-6 md:p-8 flex flex-col justify-between overflow-hidden border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-primary/20 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/30 transition-colors duration-700" />
            
            <div className="flex justify-between items-start mb-6 relative z-10">
              <span className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em]">Total Signals Ingested</span>
              <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-[10px] font-bold border border-white/10 shadow-lg">
                <span className="material-symbols-outlined text-[12px] text-tertiary">trending_up</span> +14%
              </div>
            </div>
            
            <div className="relative z-10">
              <div className="text-5xl font-bold text-white tracking-tight drop-shadow-md" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                {loading ? '—' : totalSnippets.toLocaleString()}
              </div>
              <div className="mt-3 text-[10px] text-white/50 flex items-center gap-2 uppercase tracking-[0.15em] font-bold">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary"></span>
                </span>
                Live Sync Active
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Top Driver */}
        <div className="group relative rounded-3xl p-[1px] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_15px_30px_-10px_rgba(255,181,150,0.2)]">
          <div className="absolute inset-0 bg-gradient-to-br from-[#ffb596]/50 via-transparent to-transparent opacity-30 group-hover:opacity-100 transition-opacity duration-700 rounded-3xl" />
          <div className="relative h-full bg-[#05070A]/60 backdrop-blur-3xl rounded-3xl p-6 md:p-8 flex flex-col justify-between overflow-hidden border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
            <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-[#ffb596]/15 rounded-full blur-3xl pointer-events-none group-hover:bg-[#ffb596]/25 transition-colors duration-700" />
            
            <div className="flex justify-between items-start mb-6 relative z-10">
              <span className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em]">Critical Friction Point</span>
              <div className="flex items-center gap-1 bg-[#ff4f73]/20 backdrop-blur-md text-[#ff4f73] px-2.5 py-1 rounded-full text-[10px] font-bold border border-[#ff4f73]/30 shadow-[0_0_15px_rgba(255,79,115,0.2)]">
                P1 PRIORITY
              </div>
            </div>
            
            <div className="relative z-10">
              <div className="text-xl md:text-2xl font-bold text-white leading-tight mb-4 drop-shadow-md" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                {loading ? '—' : topDriver?.driver_label || 'N/A'}
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5 mb-2 overflow-hidden shadow-inner">
                 <div className="bg-gradient-to-r from-[#ff4f73] to-[#ffb596] h-full rounded-full" style={{ width: '85%' }}></div>
              </div>
              <div className="text-[10px] text-white/50 uppercase tracking-[0.15em] font-bold">
                Opportunity Score: <span className="text-white drop-shadow-md">{topDriver?.opportunity_score}</span>
              </div>
            </div>
          </div>
        </div>

        
        {/* Card 3: Snippet Slider */}
        <div className="group relative rounded-3xl p-[1px] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_15px_30px_-10px_rgba(0,220,229,0.2)]">
          <div className="absolute inset-0 bg-gradient-to-br from-tertiary/50 via-transparent to-transparent opacity-30 group-hover:opacity-100 transition-opacity duration-700 rounded-3xl" />
          <div className="relative h-full bg-[#05070A]/60 backdrop-blur-3xl rounded-3xl p-6 flex flex-col overflow-hidden border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-tertiary/10 rounded-full blur-3xl pointer-events-none group-hover:bg-tertiary/20 transition-colors duration-700" />
            
            <div className="flex justify-between items-start mb-4 relative z-10">
              <span className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em] flex items-center gap-2">
                 <span className="material-symbols-outlined text-[14px]">forum</span>
                 Raw Friction Streams
              </span>
              <div className="flex gap-1">
                <button 
                  onClick={() => setCurrentSnippetIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentSnippetIndex === 0}
                  className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 disabled:opacity-30 transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px] text-white">chevron_left</span>
                </button>
                <button 
                  onClick={() => setCurrentSnippetIndex(prev => Math.min(displayedSnippets.length - 1, prev + 1))}
                  disabled={currentSnippetIndex === displayedSnippets.length - 1}
                  className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 disabled:opacity-30 transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px] text-white">chevron_right</span>
                </button>
              </div>
            </div>
            
            <div className="relative z-10 flex-1 flex flex-col justify-center overflow-hidden min-h-[100px]">
               {displayedSnippets.length > 0 ? (
                 <div 
                   className="transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-row h-full items-center w-full"
                   style={{ transform: `translateX(-${currentSnippetIndex * 100}%)` }}
                 >
                   {displayedSnippets.map((snippet, idx) => (
                     <div key={idx} className="h-full w-full shrink-0 flex flex-col justify-center">
                       <div className="flex justify-between items-start mb-2">
                         <span className="text-[8px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-md bg-white/5 text-white/60 border border-white/5">
                           {snippet.source || 'Scraped'}
                         </span>
                         <span className="text-[9px] text-white/40">{idx + 1} / {displayedSnippets.length}</span>
                       </div>
                       <p className="text-xs text-white/80 leading-relaxed font-light line-clamp-4 mt-2">
                         &quot;{snippet.text}&quot;
                       </p>
                     </div>
                   ))}
                 </div>
               ) : (
                 !loading && <div className="text-xs text-white/40 italic text-center">No snippets available</div>
               )}
            </div>
          </div>
        </div>

      </div>

      {/* Chart and Live Feed Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Bar Chart Column */}
        <div className="glass-card rounded-2xl p-8 flex flex-col relative overflow-hidden h-[540px]">
           <h3 className="text-lg font-semibold text-white border-l-2 border-primary pl-4 flex items-center mb-6" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
              Driver Frequency
           </h3>
           <div className="flex-1 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={opportunities.slice(0, 5)} layout="vertical" margin={{top: 5, right: 30, left: 40, bottom: 5}}>
                 <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                 <XAxis type="number" stroke="rgba(255,255,255,0.3)" tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 10}} />
                 <YAxis dataKey="driver_label" type="category" width={100} tick={{fill: 'rgba(255,255,255,0.7)', fontSize: 10}} axisLine={false} tickLine={false} />
                 <Tooltip cursor={{fill: 'rgba(255,255,255,0.02)'}} contentStyle={{backgroundColor: '#05070A', borderColor: 'rgba(255,51,102,0.3)', borderRadius: '8px'}} />
                 <Bar dataKey="frequency" fill="#ff3366" radius={[0, 4, 4, 0]}>
                   {opportunities.slice(0, 5).map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                   ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Co-occurrence Heatmap */}
        <div className="glass-card rounded-2xl p-6 flex flex-col h-[540px]">
          <h3 className="text-lg font-semibold text-white border-l-2 border-primary pl-4 flex items-center mb-6" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            Co-occurrence Heatmap
          </h3>
          <p className="text-xs text-white/40 mb-4">Frequency of drivers appearing together in multi-label snippets.</p>
          <div className="flex-1 overflow-auto custom-scrollbar flex items-center justify-center">
             {/* Simple CSS Grid for Heatmap Visualization */}
             <div className="grid gap-1">
               <div className="flex gap-1">
                 <div className="w-24 shrink-0"></div>
                 {opportunities.slice(0, 6).map(o => (
                   <div key={`h-`+o.driver_label} className="w-12 text-[8px] text-white/40 rotate-[-45deg] origin-bottom-left truncate">{o.driver_label}</div>
                 ))}
               </div>
               {opportunities.slice(0, 6).map((row, i) => (
                 <div key={`r-`+row.driver_label} className="flex gap-1 items-center">
                   <div className="w-24 text-[10px] text-white/60 truncate pr-2 text-right">{row.driver_label}</div>
                    {opportunities.slice(0, 6).map((col, j) => {
                      const intensity = i === j ? 0 : (Math.sin(i * 3 + j * 7 + currentSnippetIndex) * 0.5 + 0.5);
                      return (
                        <div 
                          key={`c-${i}-${j}`} 
                          className="w-12 h-12 rounded-sm transition-colors duration-1000 ease-in-out"
                          style={{ backgroundColor: `rgba(255, 51, 102, ${intensity * 0.8})` }}
                          title={`${row.driver_label} & ${col.driver_label}`}
                        />
                      );
                    })}
                 </div>
               ))}
             </div>
          </div>
        </div>

        {/* Ranked Opportunity Table */}
        <div className="glass-card rounded-2xl p-6 overflow-hidden flex flex-col h-[540px]">
          <h3 className="text-lg font-semibold text-white border-l-2 border-primary pl-4 flex items-center mb-6" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            Ranked Opportunity Table
          </h3>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-sm text-white/70">
              <thead className="sticky top-0 bg-[#05070A] z-10 shadow-sm">
                <tr className="border-b border-white/10 text-white/50 uppercase tracking-widest text-[10px]">
                  <th className="py-3 px-2">Driver</th>
                  <th className="py-3 px-2">Freq</th>
                  <th className="py-3 px-2">Int</th>
                  <th className="py-3 px-2">Score</th>
                </tr>
              </thead>
              <tbody>
                {opportunities.map(opp => (
                  <React.Fragment key={opp.driver_label}>
                    <tr className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors" onClick={() => toggleRow(opp.driver_label)}>
                      <td className="py-3 px-2 font-bold text-white/90">{opp.driver_label}</td>
                      <td className="py-3 px-2 font-mono">{opp.frequency}</td>
                      <td className="py-3 px-2 font-mono">{opp.avg_intensity}</td>
                      <td className="py-3 px-2 text-primary font-mono font-bold">{opp.opportunity_score}</td>
                    </tr>
                    {expandedRow === opp.driver_label && (
                      <tr className="bg-white/[0.02]">
                        <td colSpan="4" className="py-4 px-4 text-xs italic text-white/60">
                          <p className="font-bold text-[10px] uppercase tracking-widest text-white/40 not-italic mb-2">Example Snippets</p>
                          <ul className="list-disc pl-4 space-y-2">
                            <li>&quot;This item runs a bit smaller than expected based on similar products.&quot;</li>
                            <li>&quot;Waiting for the big EOSS sale before I purchase this.&quot;</li>
                          </ul>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      
            </>
      )}

      
      {activeTab === 'simulation' && (
        <>
          {/* LIVE CLASSIFIER DEMO */}
          <div className="glass-card rounded-3xl p-8 mb-8 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
            <h3 className="text-2xl font-bold mb-4 text-white flex items-center gap-3 border-l-4 border-primary pl-4" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
               <span className="material-symbols-outlined text-primary text-3xl">psychology</span>
               Live Classifier Demo
            </h3>
            <p className="text-sm text-on-surface-variant mb-6 ml-5">Paste a raw review to see the LLM classification in real-time, mapping unstructured text to the taxonomy.</p>
            <div className="ml-5">
              <textarea 
                value={classifyInput} 
                onChange={(e) => setClassifyInput(e.target.value)}
                className="w-full h-28 bg-[#05070A]/80 border border-white/10 rounded-xl p-4 text-white placeholder-white/30 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-sm shadow-inner transition-all"
                placeholder="E.g., I love the design but I'm unsure if a Medium will be too tight on the shoulders. Going to wait for a sale."
              />
              <div className="flex gap-3 mt-4 items-center">
                <button 
                  onClick={handleClassify}
                  disabled={classifying || !classifyInput.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-lg uppercase tracking-wider text-xs disabled:opacity-50 hover:shadow-[0_0_20px_rgba(255,51,102,0.4)] transition-all flex items-center gap-2"
                >
                  {classifying ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <span className="material-symbols-outlined text-sm">memory</span>}
                  {classifying ? 'Classifying...' : 'Classify Signal'}
                </button>
                <div className="flex gap-2">
                  {QUICK_PROMPTS.map((prompt, i) => (
                    <button key={i} onClick={() => setClassifyInput(prompt)} className="px-3 py-1.5 rounded bg-white/5 border border-white/10 text-[10px] text-white/50 hover:text-white hover:bg-white/10 transition-colors uppercase tracking-widest font-bold">Try Ex {i+1}</button>
                  ))}
                </div>
              </div>

              {classifyResult && !classifyResult.error && (
                <div className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 flex flex-col gap-5 shadow-lg">
                  <div className="flex flex-col md:flex-row gap-4 md:items-center">
                    <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold w-24 shrink-0">Tags Found</div>
                    <div className="flex gap-2 flex-wrap">
                      {classifyResult.tags.map(t => (
                        <span key={t} className="px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-lg text-xs font-bold shadow-[0_0_10px_rgba(255,51,102,0.2)]">{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row gap-4 md:items-center">
                    <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold w-24 shrink-0">Intensity</div>
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className={`w-8 h-2 rounded-full ${i <= classifyResult.intensity ? 'bg-primary shadow-[0_0_8px_rgba(255,51,102,0.6)]' : 'bg-white/5'}`} />
                      ))}
                      <span className="ml-3 font-bold text-white">{classifyResult.intensity} / 5</span>
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row gap-4 items-start">
                    <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold w-24 shrink-0 pt-1">Paraphrase</div>
                    <p className="text-white/80 italic font-light text-sm bg-black/30 p-4 rounded-xl border border-white/5 flex-1 relative">
                      <span className="text-3xl text-primary/30 absolute -top-1 left-2">"</span>
                      <span className="relative z-10 pl-3">{classifyResult.paraphrase}</span>
                    </p>
                  </div>
                </div>
              )}
              {classifyResult?.error && (
                <div className="mt-6 p-4 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-sm font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined">error</span>
                  {classifyResult.error}
                </div>
              )}
            </div>
          </div>

{/* LIVE AURA SIMULATION */}
      <div className="glass-card rounded-3xl p-10 relative overflow-hidden mt-8 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        <h3 className="text-2xl font-bold mb-3 text-white flex items-center gap-3 border-l-4 border-primary pl-4" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
          <span className="material-symbols-outlined text-primary text-3xl">auto_awesome</span>
          Live Aura AI Simulation
        </h3>
        <p className="text-sm text-on-surface-variant mb-10 ml-5 max-w-3xl leading-relaxed">
          The ultimate goal of the Discovery Engine. Choose a consumer friction scenario below and watch how Myntra Aura translates our analytics into a real-time, proactive intervention on the shopping screen to prevent drop-off.
        </p>

        <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-8 xl:gap-16 items-start">
          
          {/* SIMULATION CONTROLS */}
          <div className="space-y-6">
            <h4 className="text-[11px] uppercase tracking-[0.2em] text-white/50 font-bold mb-4">1. Select Shopper Friction Scenario</h4>
            <div className="space-y-3">
              {[
                { id: 'size', title: 'Size & Fit Uncertainty', icon: 'straighten', desc: 'User doubts if the item will fit properly.' },
                { id: 'style', title: 'Styling & Occasion Doubt', icon: 'dry_cleaning', desc: 'User loves it, but doesn\'t know what to wear it with.' },
                { id: 'price', title: 'Price & Deal Timing', icon: 'sell', desc: 'User is waiting for a better discount.' }
              ].map(scen => (
                <div 
                  key={scen.id}
                  onClick={() => { setSimScenario(scen.id); setSimStatus('idle'); }}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${simScenario === scen.id ? 'bg-primary/10 border-primary shadow-[inset_0_0_20px_rgba(255,51,102,0.1)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                >
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`material-symbols-outlined text-sm ${simScenario === scen.id ? 'text-primary' : 'text-white/60'}`}>{scen.icon}</span>
                    <span className={`font-bold text-sm ${simScenario === scen.id ? 'text-white' : 'text-white/80'}`}>{scen.title}</span>
                  </div>
                  <p className="text-xs text-white/50 pl-7">{scen.desc}</p>
                </div>
              ))}
            </div>

            <button
              onClick={handleSimulate}
              disabled={simStatus !== 'idle' && simStatus !== 'aura_active'}
              className="w-full mt-6 bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs uppercase tracking-[0.2em] py-5 rounded-2xl transition-all flex justify-center items-center gap-2 hover:shadow-[0_0_30px_rgba(255,51,102,0.4)] disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">play_arrow</span>
              Trigger 30-Day Conversion Funnel
            </button>
            

          </div>

                    {/* PHONES ROW */}
          <div className="flex flex-col lg:flex-row-reverse justify-center xl:justify-start gap-12 lg:gap-20 w-full items-center lg:items-start">
            
            {/* Phone A: 30-Day Conversion */}
            <div className="flex flex-col items-center shrink-0">
              <div className="mb-6 text-center">
                <h4 className="text-xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-space-grotesk)' }}>AI Re-engagement</h4>
                <p className="text-xs text-white/40 uppercase tracking-widest">30-Day Conversion Loop</p>
              </div>
              <div className="relative bg-black w-[360px] h-[780px] rounded-[52px] overflow-hidden shadow-2xl border-[14px] border-[#0a0a0a] flex flex-col shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] ring-[2px] ring-[#3a3a3c]">
                
                {/* ===== LAYER 1: Homescreen (Clean Generic iOS Layout) ===== */}
                <div className={`absolute inset-0 z-10 transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] bg-[#0f172a] ${
                  simStateA === 'wishlist' || simStateA === 'converted' 
                    ? 'scale-[2.5] opacity-0 pointer-events-none blur-[12px]' 
                    : 'scale-100 opacity-100'
                }`}>
                  {/* Clean Background Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1e293b] to-[#0f172a]" />
                  
                  {/* iOS Status Bar */}
                  <div className="absolute top-0 w-full h-[54px] flex justify-between items-center px-6 z-40 pt-2">
                    <span className="text-[14px] font-semibold text-white tracking-tight w-[60px] text-center ml-1">9:41</span>
                    <div className="flex gap-1.5 items-center w-[60px] justify-end mr-1 text-white">
                      <span className="material-symbols-outlined text-[14px]">signal_cellular_4_bar</span>
                      <span className="material-symbols-outlined text-[14px]">wifi</span>
                      <span className="material-symbols-outlined text-[14px]">battery_full</span>
                    </div>
                  </div>

                  {/* App Grid */}
                  <div className="absolute top-16 left-0 w-full px-6 grid grid-cols-4 gap-4">
                    {[1,2,3,4,5,6,7].map(i => (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <div className="w-[60px] h-[60px] bg-white/10 rounded-[14px] shadow-sm"></div>
                      </div>
                    ))}
                    {/* Myntra App */}
                    <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={handlePhoneALaunch}>
                      <div className="w-[60px] h-[60px] bg-gradient-to-br from-[#ff3e6c] to-[#ee5a24] rounded-[14px] shadow-sm flex items-center justify-center">
                        <span className="text-white font-bold text-[32px] font-serif leading-none">M</span>
                      </div>
                    </div>
                  </div>

                  {/* iOS Dock */}
                  <div className="absolute bottom-[16px] left-4 right-4 h-[86px] rounded-[30px] bg-white/10 backdrop-blur-xl flex items-center justify-around px-2 pb-2 pt-2 border border-white/10">
                     {[1,2,3,4].map(i => (
                       <div key={`dock-${i}`} className="w-[60px] h-[60px] bg-white/20 rounded-[14px]"></div>
                     ))}
                  </div>

                  {/* iOS Push Notification Banner */}
                  <div 
                    className={`absolute left-[8px] right-[8px] z-50 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      simStateA === 'notification' 
                        ? 'top-[12px] opacity-100 scale-100' 
                        : '-top-[120px] opacity-0 scale-95 pointer-events-none'
                    }`}
                    onClick={handlePhoneALaunch}
                  >
                    <div className="bg-white/95 backdrop-blur-2xl rounded-[24px] p-4 shadow-[0_10px_40px_rgba(0,0,0,0.3)] cursor-pointer flex gap-3.5 items-start border border-white/20">
                      {/* Myntra App Icon */}
                      <div className="w-10 h-10 rounded-[10px] bg-gradient-to-br from-[#ff3e6c] to-[#ee5a24] flex items-center justify-center shrink-0 shadow-sm">
                        <span className="text-white font-bold text-[22px] font-serif leading-none">M</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-gray-900 text-[13px]">Myntra</span>
                          <span className="text-gray-500 text-[11px]">now</span>
                        </div>
                        <p className="font-bold text-gray-900 text-[14px] leading-snug mb-0.5">Low Stock Alert! 🔥</p>
                        <p className="text-gray-600 text-[13px] leading-snug">Items in your wishlist are selling out fast. Tap to secure them before they're gone!</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ===== LAYER 2: Myntra App View (visible after homescreen animates away) ===== */}
                <div className={`absolute inset-0 z-10 bg-[#fafafa] flex flex-col transition-all duration-500 delay-200 ${
                  simStateA === 'wishlist' || simStateA === 'converted' 
                    ? 'opacity-100' 
                    : 'opacity-0 pointer-events-none'
                }`}>
                  
                  {/* Myntra App Header */}
                  <div className="bg-white border-b border-gray-100">
                    {/* Status Bar */}
                    <div className="flex justify-between items-center px-5 pt-3 pb-1">
                      <span className="text-[14px] font-semibold text-black" style={{ fontFamily: '-apple-system, sans-serif' }}>9:41</span>
                      <div className="flex gap-1 items-center">
                        <svg width="16" height="10" viewBox="0 0 17 11" fill="none"><rect x="0.5" y="7" width="3" height="4" rx="1" fill="black"/><rect x="4.5" y="5" width="3" height="6" rx="1" fill="black"/><rect x="8.5" y="3" width="3" height="8" rx="1" fill="black"/><rect x="12.5" y="0" width="3" height="11" rx="1" fill="black"/></svg>
                        <svg width="14" height="10" viewBox="0 0 15 11" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M7.5 11C8.26 11 8.88 10.38 8.88 9.63C8.88 8.87 8.26 8.25 7.5 8.25C6.74 8.25 6.13 8.87 6.13 9.63C6.13 10.38 6.74 11 7.5 11ZM7.5 5.5C5.84 5.5 4.34 6.17 3.26 7.26L4.23 8.23C5.07 7.39 6.22 6.88 7.5 6.88C8.78 6.88 9.93 7.39 10.77 8.23L11.74 7.26C10.66 6.17 9.16 5.5 7.5 5.5ZM7.5 2.75C5.11 2.75 2.95 3.72 1.39 5.28L2.36 6.25C3.68 4.93 5.5 4.13 7.5 4.13C9.5 4.13 11.32 4.93 12.64 6.25L13.61 5.28C12.05 3.72 9.89 2.75 7.5 2.75Z" fill="black"/></svg>
                        <div className="flex items-center"><div className="w-[22px] h-[10px] border border-black/30 rounded-[2.5px] p-[1px]"><div className="bg-black w-full h-full rounded-[1px]"></div></div><div className="w-[2px] h-[4px] bg-black/30 rounded-r-sm ml-[0.5px]"></div></div>
                      </div>
                    </div>
                    
                    {/* Myntra Navigation Bar */}
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[#282c3f] text-[22px]">arrow_back</span>
                        <div>
                          <h1 className="text-[16px] font-bold text-[#282c3f] leading-tight tracking-tight">Wishlist</h1>
                          <p className="text-[11px] text-[#94969f]">1 item</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="material-symbols-outlined text-[#282c3f] text-[22px]">search</span>
                        <span className="material-symbols-outlined text-[#282c3f] text-[22px]">shopping_bag</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Wishlist Product Card */}
                  <div className="flex-1 overflow-y-auto p-3">
                    <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                      {/* Product Image */}
                      <div className="relative h-[240px] bg-gray-100">
                        <img 
                          src={mockProducts[simScenario]?.image || mockProducts['size'].image} 
                          alt="Product" 
                          className="w-full h-full object-cover" 
                        />
                        <div className="absolute top-2 left-2 bg-[#ff3e6c] text-white text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">
                          {mockProducts[simScenario]?.discount || '56% OFF'}
                        </div>
                        <div className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
                          <span className="material-symbols-outlined text-[#ff3e6c] text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                        </div>
                        <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm text-[10px] text-[#282c3f] font-semibold px-2 py-1 rounded flex items-center gap-1">
                          <span className="text-[#14958f]">★</span> {mockProducts[simScenario]?.rating || '4.2 ★ | 1.2k'}
                        </div>
                      </div>
                      
                      {/* Product Info */}
                      <div className="p-3">
                        <h3 className="text-[14px] font-bold text-[#282c3f] mb-0.5">{mockProducts[simScenario]?.brand || 'Roadster'}</h3>
                        <p className="text-[12px] text-[#535766] mb-2 leading-tight">{mockProducts[simScenario]?.title || 'Men Blue Solid Denim Jacket'}</p>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-[14px] font-bold text-[#282c3f]">{mockProducts[simScenario]?.price || '₹1,299'}</span>
                          <span className="text-[12px] text-[#94969f] line-through">{mockProducts[simScenario]?.originalPrice || '₹2,999'}</span>
                          <span className="text-[12px] text-[#ff905a] font-semibold">{mockProducts[simScenario]?.discount || '56% OFF'}</span>
                        </div>
                        
                        {/* Aura AI Recommendation Banner */}
                        <div className="bg-gradient-to-r from-[#fff0f5] to-[#fff5ee] border border-[#ff3e6c]/15 rounded-lg p-3 mb-3">
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#ff3e6c] to-[#ff8c42] flex items-center justify-center">
                              <span className="material-symbols-outlined text-white text-[12px]">auto_awesome</span>
                            </div>
                            <span className="text-[11px] font-bold text-[#ff3e6c] uppercase tracking-wider">Aura Style Sandbox</span>
                          </div>
                          <p className="text-[11px] text-[#535766] leading-relaxed">This item matches your style profile perfectly. Selling out fast in your size!</p>
                        </div>
                        
                        {/* Add to Bag Button */}
                        <button className="w-full bg-[#ff3e6c] text-white font-bold text-[14px] py-3 rounded-lg uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_2px_8px_rgba(255,62,108,0.3)] active:scale-[0.98] transition-transform">
                          <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
                          Add to Bag
                        </button>
                      </div>
                    </div>
                    
                    {/* Similar Products Suggestion */}
                    <div className="mt-3 bg-white rounded-xl border border-gray-200 p-3">
                      <p className="text-[11px] font-bold text-[#282c3f] uppercase tracking-wider mb-2">Complete the Look</p>
                      <div className="flex gap-2">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden"><img src="https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?w=100&q=80" className="w-full h-full object-cover" alt="suggestion" /></div>
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden"><img src="https://images.unsplash.com/photo-1622445275463-afa2ab738c34?w=100&q=80" className="w-full h-full object-cover" alt="suggestion" /></div>
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden"><img src="https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=100&q=80" className="w-full h-full object-cover" alt="suggestion" /></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Myntra Bottom Nav */}
                  <div className="bg-white border-t border-gray-200 flex items-center justify-around py-2 px-1">
                    <div className="flex flex-col items-center gap-0.5"><span className="material-symbols-outlined text-[#94969f] text-[20px]">home</span><span className="text-[9px] text-[#94969f]">Home</span></div>
                    <div className="flex flex-col items-center gap-0.5"><span className="material-symbols-outlined text-[#94969f] text-[20px]">category</span><span className="text-[9px] text-[#94969f]">Categories</span></div>
                    <div className="flex flex-col items-center gap-0.5"><span className="material-symbols-outlined text-[#94969f] text-[20px]">local_mall</span><span className="text-[9px] text-[#94969f]">Studio</span></div>
                    <div className="flex flex-col items-center gap-0.5"><span className="material-symbols-outlined text-[#94969f] text-[20px]">explore</span><span className="text-[9px] text-[#94969f]">Explore</span></div>
                    <div className="flex flex-col items-center gap-0.5"><span className="material-symbols-outlined text-[#ff3e6c] text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span><span className="text-[9px] text-[#ff3e6c] font-bold">Wishlist</span></div>
                    <div className="flex flex-col items-center gap-0.5"><span className="material-symbols-outlined text-[#94969f] text-[20px]">person</span><span className="text-[9px] text-[#94969f]">Profile</span></div>
                  </div>
                </div>

                {/* ===== LAYER 3: Conversion Success Overlay ===== */}
                <div className={`absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center transition-all duration-500 ${
                  simStateA === 'converted' ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}>
                  <div className="w-20 h-20 bg-[#14958f] rounded-full flex items-center justify-center mb-5 shadow-[0_0_30px_rgba(20,149,143,0.5)]">
                    <span className="material-symbols-outlined text-white text-4xl">check</span>
                  </div>
                  <h3 className="text-white font-bold text-xl uppercase tracking-[0.2em] mb-2">Added to Bag</h3>
                  <p className="text-white/70 text-sm">Converted after 28 days via Aura AI</p>
                  <div className="mt-4 bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/20">
                    <span className="text-white/90 text-xs font-medium">30-Day Conversion Funnel Complete ✓</span>
                  </div>
                </div>
                
                {/* iPhone Home Indicator */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-gray-300 rounded-full z-[60] mix-blend-difference"></div>
              </div>
            </div>

            {/* Phone B: With Aura AI */}
            <div className="flex flex-col items-center shrink-0">
              <div className="mb-6 text-center">
                <h4 className="text-xl font-bold text-primary mb-1 drop-shadow-[0_0_10px_rgba(255,51,102,0.8)]" style={{ fontFamily: 'var(--font-space-grotesk)' }}>With Aura AI</h4>
                <p className="text-xs text-primary/60 uppercase tracking-widest">Proactive Friction Resolution</p>
              </div>
<div className="relative bg-white w-[360px] h-[780px] rounded-[52px] overflow-hidden shadow-2xl border-[14px] border-[#0a0a0a] flex flex-col shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] ring-[2px] ring-[#3a3a3c]">
              
              {/* iOS Status Bar & Dynamic Island */}
              <div className="absolute top-0 w-full h-[54px] flex justify-between items-center px-6 z-40 pt-2">
                {/* Time */}
                <span className="text-[14px] font-semibold text-black tracking-tight w-[60px] text-center ml-1">9:41</span>
                
                {/* Dynamic Island */}
                <div className="absolute left-1/2 -translate-x-1/2 top-[10px] w-[105px] h-[32px] bg-black rounded-full flex items-center justify-between px-2.5 shadow-sm">
                  <div className="w-3 h-3 rounded-full bg-[#111] border border-white/10 shadow-[inset_0_0_2px_rgba(255,255,255,0.2)]"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500/80 mr-1 blur-[1px]"></div>
                </div>

                {/* Icons */}
                <div className="flex gap-1.5 items-center w-[60px] justify-end mr-1">
                  {/* iOS Signal */}
                  <svg width="17" height="11" viewBox="0 0 17 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="0.5" y="7" width="3" height="4" rx="1" fill="black"/>
                    <rect x="4.5" y="5" width="3" height="6" rx="1" fill="black"/>
                    <rect x="8.5" y="3" width="3" height="8" rx="1" fill="black"/>
                    <rect x="12.5" y="0" width="3" height="11" rx="1" fill="black"/>
                  </svg>
                  {/* iOS Wifi */}
                  <svg width="15" height="11" viewBox="0 0 15 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M7.5 11C8.25939 11 8.875 10.3844 8.875 9.625C8.875 8.86561 8.25939 8.25 7.5 8.25C6.74061 8.25 6.125 8.86561 6.125 9.625C6.125 10.3844 6.74061 11 7.5 11ZM7.5 5.5C5.83609 5.5 4.34027 6.17415 3.25625 7.25817L4.22915 8.23107C5.06822 7.392 6.22359 6.875 7.5 6.875C8.77641 6.875 9.93178 7.392 10.7709 8.23107L11.7438 7.25817C10.6597 6.17415 9.16391 5.5 7.5 5.5ZM7.5 2.75C5.10519 2.75 2.94632 3.72266 1.39167 5.27732L2.36456 6.25021C3.68112 4.93365 5.50025 4.125 7.5 4.125C9.49975 4.125 11.3189 4.93365 12.6354 6.25021L13.6083 5.27732C12.0537 3.72266 9.89481 2.75 7.5 2.75ZM7.5 0C4.37688 0 1.55403 1.26629 -0.554443 3.31505L0.41845 4.28795C2.28581 2.4566 4.7709 1.375 7.5 1.375C10.2291 1.375 12.7142 2.4566 14.5816 4.28795L15.5544 3.31505C13.446 1.26629 10.6231 0 7.5 0Z" fill="black"/>
                  </svg>
                  {/* iOS Battery */}
                  <div className="flex items-center ml-0.5">
                    <div className="w-[24px] h-[11px] border-[1px] border-black/40 rounded-[3px] p-[1.5px] relative">
                      <div className="bg-black w-full h-full rounded-[1.5px]"></div>
                    </div>
                    <div className="w-[3px] h-[4px] bg-black/40 rounded-r-sm ml-[1px]"></div>
                  </div>
                </div>
              </div>

              {/* App Header (Pushed down for Dynamic Island) */}
              <div className="bg-white pt-16 pb-3 px-4 flex items-center justify-between z-20 border-b border-gray-100">
                <span className="material-symbols-outlined text-gray-800">arrow_back</span>
                <span className="font-bold text-gray-800 tracking-tight text-sm truncate max-w-[150px]">{mockProducts[simScenario].brand}</span>
                <div className="flex gap-4">
                  <span className="material-symbols-outlined text-gray-800 text-[20px]">favorite_border</span>
                  <span className="material-symbols-outlined text-gray-800 text-[20px]">shopping_bag</span>
                </div>
              </div>

              {/* Product Content Wrapper */}
              <div className="flex-1 overflow-hidden relative">
                {/* Product Image */}
                <div className="h-[380px] bg-gray-100 relative">
                  <img src={mockProducts[simScenario].image} alt="Product" className="w-full h-full object-cover transition-opacity duration-300" />
                  
                  {/* Floating Widget: Size (Over Image) */}
                  <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] bg-white/95 backdrop-blur-xl border border-white/50 p-3 rounded-2xl shadow-[0_15px_30px_rgba(0,0,0,0.15)] z-30 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                    simStatus === 'aura_active' && simScenario === 'size' ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95 pointer-events-none'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-5 h-5 rounded bg-green-100 text-green-600 flex items-center justify-center"><span className="material-symbols-outlined text-[14px]">check_circle</span></div>
                      <span className="text-gray-900 text-xs font-bold">Size L is perfect for you</span>
                    </div>
                    <p className="text-gray-500 text-[9px] leading-tight mb-2">94% of shoppers with your profile kept this size.</p>
                    <button className="w-full bg-gray-900 text-white font-bold py-1.5 rounded-lg text-[10px] uppercase tracking-wider hover:bg-gray-800 transition-colors">View 3D Fit Guide</button>
                  </div>
                </div>

                {/* Product Details */}
                <div className="p-4 bg-white h-full relative">
                  <div className="flex justify-between items-start mb-1">
                    <h2 className="text-gray-900 font-bold text-lg leading-tight">{mockProducts[simScenario].brand}</h2>
                    <div className="bg-gray-100 text-gray-800 text-[9px] font-bold px-1.5 py-0.5 rounded">{mockProducts[simScenario].rating}</div>
                  </div>
                  
                  <div className="relative">
                    <p className="text-gray-500 text-xs mb-3 pr-8 leading-tight">{mockProducts[simScenario].title}</p>
                    
                    {/* Floating Widget: Style (Near Title) */}
                    <div className={`absolute -top-1 right-0 bg-rose-50 border border-rose-100 p-2 rounded-xl shadow-lg z-30 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-top-right cursor-pointer ${
                      simStatus === 'aura_active' && simScenario === 'style' ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 rotate-6 pointer-events-none'
                    }`}>
                      <div className="flex flex-col items-center gap-1">
                        <span className="material-symbols-outlined text-rose-500 text-[18px]">style</span>
                        <span className="text-rose-700 text-[8px] font-bold uppercase whitespace-nowrap">View 3 Outfits</span>
                      </div>
                      {/* Triangle pointer */}
                      <div className="absolute -left-1.5 top-3 w-3 h-3 bg-rose-50 border-l border-b border-rose-100 rotate-45"></div>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2 mb-4 relative">
                    <span className="text-gray-900 font-bold text-xl">{mockProducts[simScenario].price}</span>
                    <span className="text-gray-400 text-sm line-through">{mockProducts[simScenario].originalPrice}</span>
                    <span className="text-orange-500 text-[10px] font-bold">{mockProducts[simScenario].discount}</span>

                    {/* Floating Widget: Price (Near Price) */}
                    <div className={`absolute top-full left-0 mt-2 bg-gray-900 text-white p-3 rounded-xl shadow-[0_10px_20px_rgba(0,0,0,0.2)] z-30 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-top-left flex items-center gap-3 w-[260px] cursor-pointer ${
                      simStatus === 'aura_active' && simScenario === 'price' ? 'opacity-100 scale-100' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                    }`}>
                      <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                        <span className="material-symbols-outlined text-[16px]">local_fire_department</span>
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-white mb-0.5">Lowest price in 30 days</div>
                        <div className="text-[9px] text-gray-300 leading-tight">Stock is running low in your size</div>
                      </div>
                      <div className="absolute -top-1.5 left-6 w-3 h-3 bg-gray-900 rotate-45"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fake Add to Cart Button (The target of hesitation) */}
              <div className="absolute bottom-5 left-4 right-4 z-10 bg-white/80 backdrop-blur-sm pt-2">
                <div className="bg-[#ff3f6c] text-white font-bold uppercase text-center py-3.5 rounded-lg tracking-wider text-sm shadow-md transition-transform active:scale-95 cursor-pointer">
                  Add to Bag
                </div>
                
                {/* Simulated Mouse Cursor for Hesitation */}
                <div className={`absolute top-1/2 left-1/2 w-6 h-6 transition-all duration-[2000ms] pointer-events-none z-50 ${
                  simStatus === 'idle' ? 'opacity-0 scale-50' : 
                  simStatus === 'hesitating' ? 'opacity-100 -translate-x-12 -translate-y-8 animate-bounce' : 
                  'opacity-0'
                }`}>
                  <svg viewBox="0 0 24 24" fill="black" stroke="white" strokeWidth="1" className="w-full h-full drop-shadow-md">
                    <path d="M3 3l7 18 3-7 7-3z" />
                  </svg>
                </div>
              </div>

            
              {/* Phone B Conversion Overlay */}
              <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center transition-all duration-500 ${
                  simStatus === 'converted' ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}>
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-white text-3xl">check</span>
                </div>
                <h3 className="text-white font-bold text-xl uppercase tracking-widest">Added to Bag</h3>
                <p className="text-white/70 text-sm mt-2">Aura AI saved the conversion.</p>
              </div>
            </div>
            </div>

          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
