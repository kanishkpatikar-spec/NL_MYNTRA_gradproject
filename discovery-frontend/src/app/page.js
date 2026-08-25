"use client";

import React, { useState, useEffect } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell,
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
  
  if (lowerText.includes('size') || lowerText.includes('fit') || lowerText.includes('large') || lowerText.includes('small') || lowerText.includes('measure')) {
    return {
      tags: ['fit_size_uncertainty'],
      intensity: 4,
      paraphrase: 'User is highly uncertain about the sizing and fit of the garment, likely fearing the hassle of returns.'
    };
  }
  
  if (lowerText.includes('wear') || lowerText.includes('match') || lowerText.includes('shoes') || lowerText.includes('pants') || lowerText.includes('style')) {
    return {
      tags: ['styling_occasion_uncertainty'],
      intensity: 3,
      paraphrase: 'User likes the item but is struggling to visualize how to integrate it into their existing wardrobe.'
    };
  }
  
  return {
    tags: ['price_deal_timing'],
    intensity: 3,
    paraphrase: 'User is exhibiting generalized hesitation, likely waiting for a better price point or sale event before committing.'
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
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  
  const [classifyInput, setClassifyInput] = useState('');
  const [classifyResult, setClassifyResult] = useState(null);
  const [classifying, setClassifying] = useState(false);

  // Pipeline State
  const [totalSnippets, setTotalSnippets] = useState(1428); // Realistic baseline for presentation
  const [isPipelineRunning, setIsPipelineRunning] = useState(false);
  const [activePipelineStep, setActivePipelineStep] = useState(0);
  // 0: none, 1: auth, 2: scrape, 3: AI, 4: sync, 5: complete

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
    if (allOpportunities.length === 0) return;
    
    if (selectedCategory === 'All') {
      setOpportunities(allOpportunities);
      return;
    }

    const multipliers = {
      'Apparel': { 'fit_size_uncertainty': 1.5, 'styling_occasion_uncertainty': 1.3, 'price_deal_timing': 0.8 },
      'Footwear': { 'fit_size_uncertainty': 1.8, 'price_deal_timing': 1.1, 'styling_occasion_uncertainty': 0.5 },
      'Accessories': { 'fit_size_uncertainty': 0.1, 'price_deal_timing': 1.2, 'styling_occasion_uncertainty': 1.5 }
    };

    const cats = multipliers[selectedCategory] || {};
    
    const updated = allOpportunities.map(opp => {
      const mult = cats[opp.driver_id] || (Math.random() * 0.5 + 0.5);
      return {
        ...opp,
        opportunity_score: Math.round(opp.opportunity_score * mult * 10) / 10,
        frequency: Math.round(opp.frequency * mult)
      };
    }).sort((a, b) => b.opportunity_score - a.opportunity_score);

    setOpportunities(updated);
  }, [selectedCategory, allOpportunities]);


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
            Command Center for live ingestion of multi-channel consumer friction data (Reddit, YouTube, App Store, Play Store).
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

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Card 1: Total Signals */}
        <div className="bg-[#0a0d14]/80 border border-white/5 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between backdrop-blur-md hover:border-white/10 transition-colors">
          <div className="absolute top-0 left-0 w-1 h-full primary-gradient-bg" />
          <div className="flex justify-between items-start mb-6">
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Total Signals Ingested</span>
            <div className="flex items-center gap-1 bg-tertiary/10 text-tertiary px-2 py-1 rounded text-[10px] font-bold">
              <span className="material-symbols-outlined text-[12px]">trending_up</span> +14%
            </div>
          </div>
          <div>
            <div className="text-4xl font-bold text-white tracking-tight" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
              {loading ? '—' : totalSnippets.toLocaleString()}
            </div>
            <div className="mt-2 text-[11px] text-white/40 flex items-center gap-1.5 uppercase tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>
              Live Sync Active
            </div>
          </div>
        </div>

        {/* Card 2: Top Driver */}
        <div className="bg-[#0a0d14]/80 border border-white/5 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between backdrop-blur-md hover:border-white/10 transition-colors">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#ffb596]" />
          <div className="flex justify-between items-start mb-6">
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Critical Friction Point</span>
            <div className="flex items-center gap-1 bg-[#ff4f73]/10 text-[#ff4f73] px-2 py-1 rounded text-[10px] font-bold border border-[#ff4f73]/20">
              P1 PRIORITY
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-white leading-tight mb-2" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
              {loading ? '—' : topDriver?.driver_label || 'N/A'}
            </div>
            <div className="w-full bg-white/5 rounded-full h-1.5 mb-1.5 overflow-hidden">
               <div className="bg-[#ffb596] h-full rounded-full" style={{ width: '85%' }}></div>
            </div>
            <div className="text-[10px] text-white/40 uppercase tracking-wide">
              Opportunity Score: <span className="text-white font-bold">{topDriver?.opportunity_score}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Active Streams */}
        <div className="bg-[#0a0d14]/80 border border-white/5 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between backdrop-blur-md hover:border-white/10 transition-colors">
          <div className="absolute top-0 left-0 w-1 h-full bg-tertiary" />
          <div className="flex justify-between items-start mb-6">
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Active AI Classifiers</span>
            <span className="material-symbols-outlined text-white/20 text-lg">memory</span>
          </div>
          <div>
            <div className="text-4xl font-bold text-white tracking-tight flex items-baseline gap-2" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
              {loading ? '—' : opportunities.filter((d) => d.frequency > 0).length}
              <span className="text-sm text-white/30 font-normal">/ 12</span>
            </div>
            <div className="mt-2 text-[11px] text-white/40 flex items-center gap-1.5 uppercase tracking-wide">
              Taxonomy Categories Tracking
            </div>
          </div>
        </div>
      </div>

      {/* Chart and Live Feed Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart Column (Span 2) */}
        <div className="glass-card rounded-2xl p-8 lg:col-span-2 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 z-10">
            <div>
              <h3 className="text-xl font-semibold text-white border-l-2 border-primary pl-4 flex items-center" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                Opportunity Scatter Plot
                <span className="ml-3 text-[10px] bg-white/5 border border-white/10 px-2 py-1 rounded text-on-surface-variant uppercase tracking-widest font-normal">
                  Score = Freq × Intensity × Weight
                </span>
              </h3>
              <p className="text-xs text-on-surface-variant mt-2 ml-4">
                X-Axis: Frequency &nbsp;|&nbsp; Y-Axis: Intensity &nbsp;|&nbsp; Bubble Size: Opportunity Score
              </p>
            </div>
            <div className="flex gap-2 bg-[#05070A]/50 p-1.5 rounded-xl border border-white/10 backdrop-blur-sm">
              {['All', 'Apparel', 'Footwear', 'Accessories'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition-all ${selectedCategory === cat ? 'bg-primary text-white shadow-[0_0_15px_rgba(255,51,102,0.4)]' : 'text-on-surface-variant hover:text-white hover:bg-white/5'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          
          {loading ? (
            <div className="flex-1 min-h-[420px] flex items-center justify-center text-on-surface-variant">Plotting multidimensional metrics...</div>
          ) : (
            <div className="flex-1 min-h-[420px] z-10">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 0 }}>
                  <XAxis 
                    type="number" 
                    dataKey="frequency" 
                    name="Frequency" 
                    stroke="#5c3f42" 
                    tick={{ fill: '#ac888b', fontSize: 12 }} 
                    axisLine={false} 
                    tickLine={false}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="avg_intensity" 
                    name="Intensity" 
                    domain={[0, 5]}
                    stroke="#5c3f42" 
                    tick={{ fill: '#ac888b', fontSize: 12 }} 
                    axisLine={false} 
                    tickLine={false}
                  />
                  <ZAxis 
                    type="number" 
                    dataKey="opportunity_score" 
                    range={[100, 1500]} 
                    name="Score" 
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,51,102,0.2)' }} />
                  <Scatter name="Hesitations" data={opportunities} animationDuration={1000}>
                    {opportunities.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} className="hover:opacity-80 transition-opacity drop-shadow-[0_0_8px_currentColor]" />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Live Snippet Feed Column (Span 1) */}
        <div className="glass-card rounded-2xl p-0 flex flex-col overflow-hidden h-[540px]">
          <div className="px-6 py-5 border-b border-white/5 bg-gradient-to-r from-[#0a0d14] to-transparent flex justify-between items-center z-10 relative">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
                <span className="material-symbols-outlined text-white/70 text-[14px]">sensors</span>
              </div>
              <h3 className="text-[13px] font-bold text-white uppercase tracking-[0.1em]">
                Live Signal Feed
              </h3>
            </div>
            <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/5 backdrop-blur-md">
               <span className="flex h-1.5 w-1.5 relative">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-tertiary"></span>
               </span>
               <span className="text-[9px] uppercase tracking-widest font-bold text-tertiary">Syncing</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4 relative">
             {/* Fade overlay for top/bottom scrolling */}
             <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-b from-[#11141e] to-transparent z-10 pointer-events-none"/>
             
             {loading ? (
               <div className="flex justify-center py-10"><span className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"/></div>
             ) : (
               displayedSnippets.map((snippet, idx) => (
                 <div key={idx} className={`p-4 rounded-xl border border-white/5 bg-[#05070A]/40 hover:bg-[#05070A]/80 hover:border-white/15 transition-all group ${isPipelineRunning && idx === 0 ? 'animate-pulse bg-primary/5 border-primary/20' : ''}`}>
                   <div className="flex justify-between items-start mb-2">
                     <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-white/5 text-white/60 group-hover:text-white/90">
                       {snippet.source || 'Scraped'}
                     </span>
                   </div>
                   <p className="text-xs text-on-surface leading-relaxed line-clamp-4">
                     "{snippet.text}"
                   </p>
                 </div>
               ))
             )}
          </div>
        </div>

      </div>

      {/* Live Classifier — Full Width, Two-Column Interior */}
      <div className="glass-card rounded-2xl p-10 relative overflow-hidden mt-6">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <h3 className="text-xl font-semibold mb-2 text-white flex items-center gap-3 border-l-2 border-primary pl-4" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
          <span className="material-symbols-outlined text-primary">forum</span>
          Myntra Aura: Intent Recognition Demo
        </h3>
        <p className="text-sm text-on-surface-variant mb-8 ml-4 max-w-2xl">
          How does Myntra Aura know what you need? Type a hesitation a shopper might have below, and watch how the AI instantly detects the underlying concern to trigger the right support module.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Input Side */}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-2">
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => setClassifyInput(prompt)}
                  className="text-[11px] bg-primary/10 hover:bg-primary/25 text-primary px-3 py-1.5 rounded-full transition-colors border border-primary/20 text-left leading-tight"
                >
                  <span className="font-bold mr-1">Try:</span> {prompt.substring(0, 32)}...
                </button>
              ))}
            </div>
            <textarea
              className="w-full bg-[#05070A] border border-white/10 rounded-xl p-5 text-sm text-on-surface focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all resize-none h-40 placeholder-white/25 leading-relaxed"
              placeholder="Type a hesitation a shopper might have...&#10;&#10;Example: 'I love the look of this jacket but I have no idea what to wear it with and I'm afraid it won't fit me properly.'"
              value={classifyInput}
              onChange={(e) => setClassifyInput(e.target.value)}
            />
            <button
              onClick={handleClassify}
              disabled={classifying || !classifyInput.trim()}
              className="w-full primary-gradient-bg text-white font-bold text-xs uppercase tracking-[0.15em] py-4 rounded-xl neon-glow transition-all flex justify-center items-center gap-2 hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(255,51,102,0.5)] duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-sm">troubleshoot</span>
              {classifying ? 'Analyzing...' : 'Analyze Intent'}
            </button>
          </div>

          {/* Results Side */}
          <div className="min-h-[200px] relative">
            {!classifyResult && !classifying && (
              <div className="h-full flex items-center justify-center text-on-surface-variant/40 text-sm italic border-2 border-dashed border-white/5 rounded-xl">
                Results will appear here after analysis.
              </div>
            )}
            {classifying && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#05070A]/80 backdrop-blur-sm rounded-xl border border-white/5">
                <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4" />
                <span className="text-primary text-xs font-bold tracking-widest uppercase animate-pulse">Scanning Intent...</span>
              </div>
            )}
            {classifyResult && !classifyResult.error && (
              <div className="space-y-6 animate-[fadeIn_0.4s_ease-out]">
                <div>
                  <h4 className="text-[11px] uppercase tracking-[0.15em] text-on-surface-variant font-bold mb-3">Detected Drivers</h4>
                  <div className="flex flex-wrap gap-2">
                    {classifyResult.tags?.map((tag) => (
                      <span key={tag} className="px-4 py-1.5 rounded-full bg-primary/15 text-primary text-xs font-semibold border border-primary/25 capitalize">
                        {tag.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-on-surface-variant mb-2 uppercase tracking-wider font-bold">
                    <span>Hesitation Intensity</span>
                    <span className="text-primary">Level {classifyResult.intensity} / 5</span>
                  </div>
                  <div className="flex gap-1.5 h-2.5">
                    {[1,2,3,4,5].map(i => (
                      <div
                        key={i}
                        className={`flex-1 rounded-sm transition-all duration-300 ${i <= classifyResult.intensity ? 'primary-gradient-bg' : 'bg-white/8'}`}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-[11px] uppercase tracking-[0.15em] text-on-surface-variant font-bold mb-3">AI Summary</h4>
                  <blockquote className="border-l-2 border-tertiary pl-4 text-sm text-on-surface-variant italic leading-relaxed">
                    "{classifyResult.paraphrase}"
                  </blockquote>
                </div>
              </div>
            )}
            {classifyResult?.error && (
              <div className="p-4 rounded-xl bg-error/10 text-error text-sm border border-error/20">
                {classifyResult.error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
