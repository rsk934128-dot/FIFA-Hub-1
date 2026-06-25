import React, { useState, useEffect } from "react";
import { NewsArticle, TickerItem } from "../types";
import { Newspaper, Calendar, ArrowRight, RefreshCw, AlertCircle, Sparkles, Activity, Zap } from "lucide-react";

export default function NewsFeed() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [tickerItems, setTickerItems] = useState<TickerItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [tickerLoading, setTickerLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/football-news");
      if (!response.ok) {
        throw new Error("Failed to fetch articles.");
      }
      const data = await response.json();
      setArticles(data);
    } catch (err: any) {
      setError("Unable to connect to the news feed. Showing archive.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTicker = async () => {
    try {
      setTickerLoading(true);
      const response = await fetch("/api/news-ticker");
      if (response.ok) {
        const data = await response.json();
        setTickerItems(data);
      }
    } catch (err) {
      console.error("Failed to fetch ticker:", err);
    } finally {
      setTickerLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    fetchTicker();
  }, []);

  const categories = ["All", ...Array.from(new Set(articles.map((a) => a.category)))];

  const filteredArticles = selectedCategory === "All"
    ? articles
    : articles.filter((a) => a.category === selectedCategory);

  // Return a beautiful dynamic landscape background icon/card
  const getImagePlaceholder = (seed: string) => {
    const gradients: Record<string, string> = {
      stadium: "from-emerald-900/60 to-slate-950",
      football: "from-teal-900/60 to-slate-950",
      jersey: "from-sky-900/60 to-slate-950",
      boots: "from-indigo-900/60 to-slate-950",
      goalie: "from-cyan-900/60 to-slate-950",
    };
    return gradients[seed.toLowerCase()] || "from-zinc-900 to-slate-950";
  };

  return (
    <div id="news-feed-module" className="space-y-6">
      {/* Module Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-2xl font-black font-sans tracking-tighter text-white flex items-center gap-2 uppercase italic">
            <Newspaper className="text-amber-500 w-6 h-6" />
            News Room
          </h2>
          <p className="text-xs text-slate-400">
            Real-time updates, tactical editorials, and major transfer bulletins.
          </p>
        </div>
        <button
          onClick={fetchNews}
          disabled={loading}
          className="bg-white hover:bg-amber-400 text-black font-bold text-[10px] font-mono py-2 px-5 rounded-full tracking-wider transition-all cursor-pointer flex items-center gap-1.5 uppercase shadow-md shadow-white/5 self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          {loading ? "FETCHING..." : "REFRESH NEWS"}
        </button>
      </div>

      {/* News Ticker */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden py-2 relative backdrop-blur-sm shadow-lg">
        <div className="absolute left-0 top-0 bottom-0 px-3 bg-amber-500 text-black flex items-center z-10 skew-x-[-15deg] -ml-2">
          <div className="skew-x-[15deg] flex items-center gap-1.5 font-black text-[10px] tracking-tighter uppercase">
            <Zap className="w-3 h-3" />
            Live Feed
          </div>
        </div>
        <div className="flex items-center whitespace-nowrap animate-marquee hover:pause overflow-hidden">
          {tickerLoading ? (
            <div className="flex gap-10 px-10">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 w-48 bg-white/5 animate-pulse rounded" />
              ))}
            </div>
          ) : (
            <div className="flex gap-10 px-10 items-center">
              {[...tickerItems, ...tickerItems].map((item, i) => (
                <div key={`${item.id}-${i}`} className="flex items-center gap-3 text-xs font-medium text-slate-300">
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    item.type === 'BREAKING' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                    item.type === 'TRANSFER' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                  }`}>
                    {item.type}
                  </span>
                  <span>{item.text}</span>
                  <span className="text-slate-600">•</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center gap-3 text-amber-400 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-xs font-mono text-amber-400 font-bold tracking-widest uppercase">UNROLLING NEWS SHEETS...</p>
        </div>
      ) : selectedArticle ? (
        /* Full Article Detail View */
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden max-w-4xl mx-auto backdrop-blur-sm">
          {/* Header Graphic */}
          <div className={`h-48 md:h-64 bg-gradient-to-br ${getImagePlaceholder(selectedArticle.imageSeed)} p-6 flex flex-col justify-end border-b border-white/5 relative`}>
            <div className="absolute top-4 right-4 bg-white/5 text-slate-400 text-[10px] font-mono uppercase px-2.5 py-1 rounded border border-white/10 flex items-center gap-1 font-bold">
              {selectedArticle.engine === 'gemini' ? (
                <>
                  <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
                  Gemini Crafted
                </>
              ) : (
                <>
                  <Activity className="w-3 h-3 text-slate-500" />
                  Archived Feed
                </>
              )}
            </div>
            <div className="space-y-2 max-w-2xl">
              <span className="text-[10px] font-mono uppercase tracking-widest bg-amber-500/20 text-amber-300 py-1 px-2.5 rounded border border-amber-500/30 font-bold">
                {selectedArticle.category}
              </span>
              <h1 className="text-xl md:text-3xl font-black text-white tracking-tight leading-tight uppercase italic">
                {selectedArticle.title}
              </h1>
            </div>
          </div>

          {/* Article Meta */}
          <div className="bg-black/20 p-4 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 font-mono font-bold">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                {selectedArticle.date}
              </span>
              <span>•</span>
              <span>Source: <strong className="text-slate-300">{selectedArticle.source}</strong></span>
            </div>
            <button
              onClick={() => setSelectedArticle(null)}
              className="text-amber-400 hover:text-white transition-colors cursor-pointer text-xs"
            >
              ← BACK TO ARTICLES
            </button>
          </div>

          {/* Article Body */}
          <div className="p-6 md:p-8 space-y-4 text-slate-300 leading-relaxed text-sm md:text-base">
            <p className="font-semibold text-slate-200 border-l-2 border-amber-500 pl-4 py-1.5 bg-amber-500/[0.02]">
              {selectedArticle.summary}
            </p>
            <div className="space-y-4 whitespace-pre-line">
              {selectedArticle.content}
            </div>
          </div>

          <div className="p-6 bg-black/20 border-t border-white/5 flex justify-end">
            <button
              onClick={() => setSelectedArticle(null)}
              className="bg-white/10 border border-white/20 text-white hover:bg-white/15 text-[10px] font-mono uppercase font-bold py-2 px-5 rounded-full transition-all cursor-pointer"
            >
              RETURN TO DECK
            </button>
          </div>
        </div>
      ) : (
        /* Grid list of articles */
        <div className="space-y-6">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 items-center">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`py-1 px-3.5 rounded-full text-xs font-mono uppercase tracking-wider font-bold border transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-white text-black font-bold border-white"
                    : "bg-white/5 text-slate-400 border-white/5 hover:text-white hover:border-white/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Feed Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredArticles.map((article) => (
              <div
                key={article.id}
                className="group bg-white/5 hover:bg-white/[0.08] border border-white/10 hover:border-amber-500/30 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between backdrop-blur-sm"
              >
                {/* Simulated Thumbnail */}
                <div className={`h-28 bg-gradient-to-br ${getImagePlaceholder(article.imageSeed)} p-4 flex flex-col justify-between border-b border-white/5`}>
                  <span className="text-[10px] font-mono bg-black/80 text-amber-300 py-0.5 px-2 rounded border border-white/10 self-start font-bold uppercase tracking-wider">
                    {article.category}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{article.date}</span>
                </div>

                {/* Article Info */}
                <div className="p-4 space-y-2 flex-grow">
                  <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-2 uppercase">
                    {article.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {article.summary}
                  </p>
                </div>

                {/* Card footer */}
                <div className="p-4 pt-0 border-t border-white/5 flex items-center justify-between text-xs font-mono font-bold text-slate-500 group-hover:text-slate-400">
                  <span>{article.source}</span>
                  <button
                    onClick={() => setSelectedArticle(article)}
                    className="flex items-center gap-1 text-amber-400 group-hover:text-amber-300 font-sans font-semibold transition-colors cursor-pointer"
                  >
                    READ ARTICLE
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
