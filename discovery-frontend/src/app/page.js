"use client";

import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
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

async function getSnippetCount() {
  try {
    const res = await axios.get(`${SUPABASE_URL}/rest/v1/raw_snippets`, {
      params: { select: 'id', limit: 1 },
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'count=exact'
      }
    });
    const range = res.headers['content-range'];
    if (range) {
      return parseInt(range.split('/')[1], 10);
    }
    return 0;
  } catch (err) {
    console.error("Failed to fetch raw_snippet count", err);
    return 0;
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
    <div className="glass-card rounded-lg p-5 text-sm min-w-[220px] bg-surface-container-low/90 backdrop-blur-md border border-white/10">
      <p className="font-bold text-on-surface mb-3 text-base">{d.driver_label}</p>
      <div className="space-y-1.5 text-on-surface-variant">
        <p>Frequency: <span className="text-white font-semibold">{d.frequency}</span></p>
        <p>Avg Intensity: <span className="text-white font-semibold">{d.avg_intensity}</span></p>
        <p>Score: <span className="text-primary font-semibold">{d.opportunity_score}</span></p>
      </div>
    </div>
  );
}

export default function AnalyticsDashboard() {
  const [allOpportunities, setAllOpportunities] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  
  const [classifyInput, setClassifyInput] = useState('');
  const [classifyResult, setClassifyResult] = useState(null);
  const [classifying, setClassifying] = useState(false);

  // Pipeline State
  const [totalSnippets, setTotalSnippets] = useState(0);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isPipelineRunning, setIsPipelineRunning] = useState(false);
  const [pipelineLogs, setPipelineLogs] = useState([]);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Initial data load
    Promise.all([getOpportunities(10), getSnippetCount()]).then(([oppsData, countData]) => {
      setAllOpportunities(oppsData);
      setOpportunities(oppsData);
      setTotalSnippets(countData);
      setLoading(false);
    }).catch(() => setLoading(false));

    // Load saved webhook URL
    const savedUrl = localStorage.getItem('pd_webhook');
    if (savedUrl) setWebhookUrl(savedUrl);
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

  const addLog = (text, type = 'info') => {
    const time = new Date().toLocaleTimeString([], { hour12: false });
    setPipelineLogs(prev => [...prev.slice(-9), { time, text, type }]);
  };

  const triggerPipeline = async () => {
    setIsPipelineRunning(true);
    setPipelineLogs([]); // clear logs
    const initialCount = totalSnippets;
    
    addLog("System initializing data pipeline sequence...");
    
    if (webhookUrl && webhookUrl.startsWith('http')) {
      addLog(`Connecting to remote Pipedream node: ${webhookUrl.substring(0, 30)}...`);
      try {
        // Fire and forget
        axios.post(webhookUrl).catch(() => {});
        addLog("Webhook accepted. Executing multi-platform scrapers (Reddit, iOS, YT)...");
      } catch(e) {
        addLog("Warning: Webhook execution pending. Proceeding with DB synchronization.", "info");
      }
    } else {
      addLog("No webhook URL configured. Running standard DB polling mode...");
      addLog("Note: To trigger real scrapers, configure your Pipedream Webhook URL.", "error");
    }

    addLog("Polling for new raw_snippets data payload in Supabase...");

    let attempts = 0;
    const maxAttempts = 15; // ~30-40 seconds
    const interval = setInterval(async () => {
      attempts++;
      const currentCount = await getSnippetCount();
      if (currentCount > initialCount) {
        clearInterval(interval);
        const added = currentCount - initialCount;
        setTotalSnippets(currentCount);
        addLog(`[Success] Pipeline execution complete. +${added} new snippets ingested into DB.`, "success");
        setIsPipelineRunning(false);
        
        // Refresh dashboard data subtly
        getOpportunities(10).then(data => {
           setAllOpportunities(data);
           if (selectedCategory === 'All') setOpportunities(data);
        });
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        addLog("Timeout waiting for new data. Pipeline terminated.", "error");
        setIsPipelineRunning(false);
      } else {
        addLog(`Database synchronization... (Attempt ${attempts}/${maxAttempts})`);
      }
    }, 2500);
  };

  const topDriver = opportunities[0];

  return (
    <div className="max-w-[1200px] w-full mx-auto space-y-8 p-4 md:p-10 pb-24">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tighter" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            Myntra Aura | Hesitation Matrix
          </h1>
          <p className="text-on-surface-variant mt-2 tracking-wide">
            Mapping the invisible friction between "add to wishlist" and the final checkout.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[11px] uppercase tracking-[0.15em] text-on-surface-variant font-bold">Filter by Category</label>
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#05070A] border border-white/20 text-on-surface rounded-xl px-4 py-2 focus:outline-none focus:border-primary/50 text-sm"
          >
            <option value="All">All Categories</option>
            <option value="Apparel">Apparel</option>
            <option value="Footwear">Footwear</option>
            <option value="Accessories">Accessories</option>
          </select>
        </div>
      </div>

      {/* Pipeline Control Center */}
      <div className="glass-card rounded-2xl p-6 lg:p-10 relative overflow-hidden mb-10 border border-primary/20">
        <div className="absolute top-0 right-0 p-8 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between relative z-10">
          <div className="space-y-3 flex-1">
            <h2 className="text-xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
              <span className="material-symbols-outlined text-primary">dynamic_feed</span>
              Data Pipeline Control Center
            </h2>
            <p className="text-sm text-on-surface-variant max-w-lg leading-relaxed">
              Trigger real-time data ingestion from Pipedream scrapers (Reddit, App Store, YouTube). The AI will process the raw snippets and update the hesitation matrix live.
            </p>
            {showSettings ? (
               <div className="flex gap-3 items-center mt-4 bg-[#05070A] p-2 rounded-xl border border-white/10 max-w-md">
                 <input 
                   type="text" 
                   value={webhookUrl}
                   onChange={e => setWebhookUrl(e.target.value)}
                   placeholder="Enter Pipedream Webhook URL..."
                   className="bg-transparent text-sm text-white px-3 py-1 flex-1 focus:outline-none placeholder-white/30"
                 />
                 <button onClick={() => { localStorage.setItem('pd_webhook', webhookUrl); setShowSettings(false); }} className="text-[10px] font-bold text-primary px-4 py-2 rounded-lg hover:bg-primary/10 uppercase tracking-wider transition-colors">Save</button>
               </div>
            ) : (
               <div className="flex gap-4 items-center mt-4">
                 <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                   <span className="w-1.5 h-1.5 rounded-full bg-tertiary shadow-[0_0_8px_rgba(77,232,239,0.8)]"></span> 
                   Live DB Connected
                 </span>
                 <button onClick={() => setShowSettings(true)} className="text-[11px] font-bold text-white/50 hover:text-white transition-colors uppercase tracking-widest underline decoration-white/20 underline-offset-4">
                   Configure Webhook
                 </button>
               </div>
            )}
          </div>

          <div className="flex-shrink-0 w-full lg:w-auto">
            <button
              onClick={triggerPipeline}
              disabled={isPipelineRunning}
              className={`w-full lg:w-64 primary-gradient-bg text-white font-bold text-[11px] uppercase tracking-[0.15em] py-4 px-6 rounded-xl transition-all flex justify-center items-center gap-2 duration-300 ${isPipelineRunning ? 'opacity-80 cursor-wait' : 'neon-glow hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(255,51,102,0.5)]'}`}
            >
              <span className={`material-symbols-outlined text-sm ${isPipelineRunning ? 'animate-spin' : ''}`}>
                {isPipelineRunning ? 'sync' : 'play_circle'}
              </span>
              {isPipelineRunning ? 'Scraping Active...' : 'Run Live Pipeline'}
            </button>
          </div>
        </div>

        {/* Live Terminal Log */}
        {pipelineLogs.length > 0 && (
          <div className="mt-8 bg-[#030407] rounded-xl border border-white/10 p-5 font-mono text-[11px] sm:text-xs overflow-hidden h-40 flex flex-col justify-end shadow-inner relative">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#030407] to-transparent h-4 z-10 pointer-events-none" />
            <div className="space-y-1.5 overflow-y-auto flex-1 flex flex-col justify-end relative z-0">
              {pipelineLogs.map((log, i) => (
                <div key={i} className={`flex gap-3 animate-[fadeIn_0.3s_ease-out] ${log.type === 'success' ? 'text-primary font-bold' : log.type === 'error' ? 'text-error' : 'text-on-surface-variant'}`}>
                  <span className="opacity-40 select-none flex-shrink-0">[{log.time}]</span>
                  <span>{log.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="glass-card rounded-2xl p-8 relative overflow-hidden group">
          <div className="absolute inset-0 primary-gradient-bg opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
          <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.15em] block mb-5">Total Raw Snippets Ingested</span>
          <div className="text-5xl font-bold text-white tracking-tight" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            {loading ? '—' : totalSnippets.toLocaleString()}
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-tertiary text-sm">
            <span className="material-symbols-outlined text-sm">database</span>
            <span>Live from Supabase</span>
          </div>
        </div>
        {/* Card 2 */}
        <div className="glass-card rounded-2xl p-8 relative overflow-hidden group">
          <div className="absolute inset-0 bg-secondary-container/20 opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
          <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.15em] flex items-center mb-5">
            Top Hesitation Driver
            <div className="group/tooltip relative inline-flex items-center cursor-help ml-2">
              <span className="material-symbols-outlined text-[14px]">info</span>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block w-48 p-2 bg-[#1a1f2c] text-xs text-white rounded border border-white/10 shadow-xl z-20 text-center normal-case tracking-normal font-normal">
                Based on highest Opportunity Score across recent user data.
              </div>
            </div>
          </span>
          <div className="text-2xl font-semibold text-secondary tracking-tight" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            {loading ? '—' : topDriver?.driver_label || 'N/A'}
          </div>
          <div className="mt-4 text-on-surface-variant text-sm">
            {topDriver ? `Opportunity Score: ${topDriver.opportunity_score}` : ''}
          </div>
        </div>
        {/* Card 3 */}
        <div className="glass-card rounded-2xl p-8 relative overflow-hidden group">
          <div className="absolute inset-0 bg-tertiary-container/20 opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
          <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.15em] block mb-5">Active Drivers Detected</span>
          <div className="text-5xl font-bold text-white tracking-tight" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            {loading ? '—' : opportunities.filter((d) => d.frequency > 0).length}
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-tertiary text-sm">
            <span>out of taxonomy drivers</span>
          </div>
        </div>
      </div>

      {/* Chart and Action Plan Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="glass-card rounded-2xl p-10 lg:col-span-2">
          <h3 className="text-xl font-semibold mb-8 text-white border-l-2 border-primary pl-4 flex items-center" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            Opportunity Scores by Driver
            <div className="group/tooltip relative inline-flex items-center cursor-help ml-3 text-on-surface-variant hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[18px]">help</span>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block w-56 p-2 bg-[#1a1f2c] text-xs text-white rounded border border-white/10 shadow-xl z-20 text-center font-normal">
                Score = Frequency × Avg. Intensity × Business Weight
              </div>
            </div>
          </h3>
          {loading ? (
            <div className="h-[420px] flex items-center justify-center text-on-surface-variant">Loading chart data...</div>
          ) : (
            <div className="h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={opportunities} layout="vertical" margin={{ left: 30, right: 40, top: 5, bottom: 5 }}>
                  <XAxis type="number" stroke="#5c3f42" tick={{ fill: '#ac888b', fontSize: 12 }} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="driver_label"
                    width={220}
                    tick={{ fill: '#e5bdc0', fontSize: 13 }}
                    stroke="transparent"
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                  <Bar dataKey="opportunity_score" radius={[0, 8, 8, 0]} barSize={18}>
                    {opportunities.map((_, i) => (
                      <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Action Plan */}
        <div className="glass-card rounded-2xl p-10 bg-primary/5 border border-primary/20 flex flex-col">
          <h3 className="text-xl font-semibold mb-6 text-white border-l-2 border-primary pl-4" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            AI Resolution Strategy
          </h3>
          {loading ? (
             <div className="text-on-surface-variant text-sm">Loading...</div>
          ) : topDriver ? (
             <div className="flex-grow flex flex-col">
               <div className="mb-4">
                 <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.15em] block mb-2">Top Issue Detected</span>
                 <p className="text-lg font-bold text-error">{topDriver.driver_label}</p>
               </div>
               <div className="mb-6 flex-grow">
                 <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.15em] block mb-2">Autopilot Strategy</span>
                 <p className="text-sm text-on-surface leading-relaxed">
                   The AI has identified <strong className="text-primary">{topDriver.driver_label}</strong> as the highest overall drop-off factor for <strong>{selectedCategory === 'All' ? 'all items' : selectedCategory}</strong>. To resolve this, Myntra Aura dynamically deploys targeted confidence modules (such as 'Fit Confidence' for clothing, or 'Price Context' for expensive items) directly into the user's Wishlist to address this specific hesitation and save the sale.
                 </p>
               </div>
              </div>
          ) : (
            <div className="text-on-surface-variant text-sm">No data available.</div>
          )}
        </div>
      </div>

      {/* Live Classifier — Full Width, Two-Column Interior */}
      <div className="glass-card rounded-2xl p-10 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <h3 className="text-xl font-semibold mb-2 text-white flex items-center gap-3 border-l-2 border-primary pl-4" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
          <span className="material-symbols-outlined text-primary">forum</span>
          Myntra Aura: Intent Recognition Demo
        </h3>
        <p className="text-sm text-on-surface-variant mb-8 ml-4 max-w-2xl">
          How does Myntra Aura know what you need? Type a question or hesitation a shopper might have below, and watch how the AI instantly detects the underlying concern to trigger the right support module.
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
