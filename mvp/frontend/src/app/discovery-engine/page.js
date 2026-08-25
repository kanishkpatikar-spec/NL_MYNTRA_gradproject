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

const DISCOVERY_API_BASE = process.env.NEXT_PUBLIC_DISCOVERY_API_URL || 'http://127.0.0.1:8001';

async function getOpportunities(limit = 10) {
  const res = await axios.get(`${DISCOVERY_API_BASE}/api/dashboard/opportunities`, { params: { limit } });
  return res.data;
}

async function classifyText(text) {
  const res = await axios.post(`${DISCOVERY_API_BASE}/api/classify`, { text });
  return res.data;
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
  const [moduleEnabled, setModuleEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [classifyInput, setClassifyInput] = useState('');
  const [classifyResult, setClassifyResult] = useState(null);
  const [classifying, setClassifying] = useState(false);

  useEffect(() => {
    getOpportunities(10).then(data => {
      setAllOpportunities(data);
      setOpportunities(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (allOpportunities.length === 0) return;
    
    if (selectedCategory === 'All') {
      setOpportunities(allOpportunities);
      return;
    }

    // Mock category multipliers for MVP demo purposes
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
    setModuleEnabled(false);
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

  const topDriver = opportunities[0];
  const totalAnalyzed = opportunities.reduce((sum, d) => sum + d.frequency, 0);

  return (
    <div className="max-w-[1200px] w-full mx-auto space-y-8 p-4 md:p-10 pb-24">
      {/* Page Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
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

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="glass-card rounded-2xl p-8 relative overflow-hidden group">
          <div className="absolute inset-0 primary-gradient-bg opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
          <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.15em] block mb-5">Total Snippets Classified</span>
          <div className="text-5xl font-bold text-white tracking-tight" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            {loading ? '—' : totalAnalyzed.toLocaleString()}
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-tertiary text-sm">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            <span>Live from Supabase</span>
          </div>
        </div>
        {/* Card 2 */}
        <div className="glass-card rounded-2xl p-8 relative overflow-hidden group">
          <div className="absolute inset-0 bg-secondary-container/20 opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
          <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.15em] block mb-5">Top Hesitation Driver</span>
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
          <h3 className="text-xl font-semibold mb-8 text-white border-l-2 border-primary pl-4" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            Opportunity Scores by Driver
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
                   The AI has identified <strong className="text-primary">{topDriver.driver_label}</strong> as the highest overall drop-off factor. By activating the <strong>Resolution Engine</strong>, the AI will automatically inject the optimal confidence module into the Wishlist for high-risk items (e.g., 'Fit Confidence' for clothing, or 'Price Context' for expensive items) to dynamically solve this customer hesitation and save the sale.
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
          <div className="space-y-5">
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
          <div className="min-h-[200px]">
            {!classifyResult && !classifying && (
              <div className="h-full flex items-center justify-center text-on-surface-variant/40 text-sm italic">
                Results will appear here after analysis.
              </div>
            )}
            {classifying && (
              <div className="h-full flex items-center justify-center text-primary text-sm">
                <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                Querying AI model...
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
