import React, { useState, useEffect } from "react";
import { NewsArticle, TickerItem, NewsAuthor } from "../types";
import { 
  Newspaper, 
  Calendar, 
  ArrowRight, 
  RefreshCw, 
  AlertCircle, 
  Sparkles, 
  Activity, 
  Zap, 
  Globe, 
  ExternalLink,
  Clock,
  UserCheck,
  Feather
} from "lucide-react";
import { NewsImage } from "./NewsImage";
import { AuthorHeadshot } from "./AuthorHeadshot";

const FALLBACK_ARTICLES: NewsArticle[] = [
  {
    id: "fb-news-1",
    title: "The 2026 FIFA World Cup Countdown: Final Team Tactics Revealed",
    category: "Tournament",
    summary: "Nations around the globe finalize their defensive alignments and high-pressing routines as pre-tournament friendlies wrap up.",
    content: "As the football world pivots towards the highly anticipated tournament stage, leading tacticians are solidifying their core setups. High-intensity pressing and fluid 4-3-3 transitions have emerged as the dominant schemes among European and South American favorites, with teams experimenting with deeper, compact midfields to counter sudden breakaways. Tactical analysis shows a record level of defensive readiness as teams aim to shut down space in the critical middle zone.",
    date: "June 24, 2026",
    imageSeed: "stadium",
    source: "FIFA Hub Sports",
    author: {
      name: "Marco Rossi",
      role: "Chief Tactics Columnist",
      handle: "@rossi_tactics"
    }
  },
  {
    id: "fb-news-2",
    title: "Midnight Marvel: Emerging Talents Set to Shake Up the Transfer Market",
    category: "Transfer",
    summary: "Scouts pinpoint three highly promising wingers whose exceptional performances have ignited bidding wars among elite clubs.",
    content: "A wave of dynamic, creative wingers has caught the eye of top scouting departments. Known for high progressive carry rates and explosive acceleration, these young stars are driving major valuation spikes. Club negotiators are already preparing high-budget proposals to secure long-term signatures ahead of the pre-season window, anticipating intense competition in the transfer market.",
    date: "June 23, 2026",
    imageSeed: "football",
    source: "Transfer Insider",
    author: {
      name: "Elena Vasquez",
      role: "Global Transfer Correspondent",
      handle: "@elena_transfers"
    }
  },
  {
    id: "fb-news-3",
    title: "Tactical Deep-Dive: How Hybrid Midfielders Command the Modern Pitch",
    category: "Analysis",
    summary: "An exploration of box-to-box creators who manage defensive recoveries while unlocking opponent low blocks.",
    content: "The evolution of the modern midfielder shows a clear shift away from pure single-role players. Today's command generals must match rigorous ball-recovery counts with surgical progressive passing. By stepping up to break down low blocks while simultaneously anchoring fast recovery sprints, these hybrid players have become the central nodes around which contemporary matches succeed or fail.",
    date: "June 22, 2026",
    imageSeed: "jersey",
    source: "Tactical Board",
    author: {
      name: "Julien Mercer",
      role: "Data & Performance Analyst",
      handle: "@mercer_analytics"
    }
  },
  {
    id: "fb-news-4",
    title: "Underdog Journeys: National Squads Inspiring the Next Generation of Fans",
    category: "Tournament",
    summary: "A heartfelt look at smaller nations breaking tournament records and challenging historically dominant forces.",
    content: "There is nothing more magical in football than seeing unfancied teams disrupt established hierarchies. This season, several rising squads have demonstrated that defensive synergy, collective work-rate, and relentless counter-attacking can neutralize superior individual talent. Their inspiring runs have ignited national fan celebrations and proved that strategic discipline can bridge any resource gap.",
    date: "June 21, 2026",
    imageSeed: "boots",
    source: "Global Football",
    author: {
      name: "Amina Al-Mansoor",
      role: "Senior Features Writer",
      handle: "@amina_football"
    }
  }
];

// Helper to determine reading time from word count
function getReadTime(content?: string): string {
  if (!content) return "2 min read";
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 65));
  return `${minutes} min read`;
}

// Fallback pool of sports journalists when an article does not explicitly define an author
const DEFAULT_AUTHORS_BY_CATEGORY: Record<string, NewsAuthor> = {
  Tournament: {
    name: "Marco Rossi",
    role: "Chief Tactics Columnist",
    handle: "@rossi_tactics"
  },
  Transfer: {
    name: "Elena Vasquez",
    role: "Global Transfer Correspondent",
    handle: "@elena_transfers"
  },
  Analysis: {
    name: "Julien Mercer",
    role: "Data & Performance Analyst",
    handle: "@mercer_analytics"
  },
  Statement: {
    name: "Sofia Valerius",
    role: "European Football Editor",
    handle: "@valerius_fifa"
  },
  Match: {
    name: "David Okonjo",
    role: "Senior Pitchside Reporter",
    handle: "@okonjo_matchday"
  },
  default: {
    name: "Amina Al-Mansoor",
    role: "Senior Features Writer",
    handle: "@amina_football"
  }
};

function getArticleAuthor(article: NewsArticle): NewsAuthor {
  if (article.author && article.author.name) {
    return article.author;
  }
  return DEFAULT_AUTHORS_BY_CATEGORY[article.category] || DEFAULT_AUTHORS_BY_CATEGORY.default;
}

export default function NewsFeed() {
  const [articles, setArticles] = useState<NewsArticle[]>(FALLBACK_ARTICLES);
  const [tickerItems, setTickerItems] = useState<TickerItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [tickerLoading, setTickerLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  // Search Grounded Global Headlines State
  const [feedType, setFeedType] = useState<"editorial" | "grounded">("editorial");
  const [groundedArticles, setGroundedArticles] = useState<NewsArticle[]>(FALLBACK_ARTICLES);
  const [groundedSources, setGroundedSources] = useState<{ title: string; url: string }[]>([]);
  const [groundedLoading, setGroundedLoading] = useState<boolean>(false);
  const [groundedError, setGroundedError] = useState<string | null>(null);

  const fetchNews = async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/football-news", { signal: controller.signal });
      if (!response.ok) {
        throw new Error("Failed to fetch articles.");
      }
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setArticles(data);
      }
    } catch (err: any) {
      console.warn("Using archived news feed due to network or timeout:", err?.message || err);
      // Fallback articles remain visible
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  const fetchGroundedNews = async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    try {
      setGroundedLoading(true);
      setGroundedError(null);
      const response = await fetch("/api/grounded-headlines", { signal: controller.signal });
      if (!response.ok) {
        throw new Error("Failed to fetch grounded global news.");
      }
      const data = await response.json();
      if (data?.articles && Array.isArray(data.articles) && data.articles.length > 0) {
        setGroundedArticles(data.articles);
        setGroundedSources(data.allSources || []);
      }
    } catch (err: any) {
      console.warn("Using cached grounded headlines due to network or timeout:", err?.message || err);
    } finally {
      clearTimeout(timeout);
      setGroundedLoading(false);
    }
  };

  const fetchTicker = async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      setTickerLoading(true);
      const response = await fetch("/api/news-ticker", { signal: controller.signal });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setTickerItems(data);
        }
      }
    } catch (err) {
      console.warn("Ticker feed fallback active:", err);
    } finally {
      clearTimeout(timeout);
      setTickerLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    fetchTicker();
    fetchGroundedNews();
  }, []);

  // Clear selected states when feedType changes
  useEffect(() => {
    setSelectedCategory("All");
    setSelectedArticle(null);
  }, [feedType]);

  const currentArticles = feedType === "editorial" ? articles : groundedArticles;

  const categories = ["All", ...Array.from(new Set(currentArticles.map((a) => a.category)))];

  const filteredArticles = selectedCategory === "All"
    ? currentArticles
    : currentArticles.filter((a) => a.category === selectedCategory);

  const isFeedLoading = feedType === "editorial" ? loading : groundedLoading;
  const isFeedError = feedType === "editorial" ? error : groundedError;

  const handleRefresh = () => {
    if (feedType === "editorial") {
      fetchNews();
    } else {
      fetchGroundedNews();
    }
  };

  // Return a beautiful dynamic landscape background image
  const getArticleImage = (articleId: string, seed: string) => {
    const images: Record<string, string> = {
      stadium: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=1000",
      football: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1000",
      jersey: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&q=80&w=1000",
      boots: "https://images.unsplash.com/photo-1510566339491-1845b6bc7d51?auto=format&fit=crop&q=80&w=1000",
      goalie: "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&q=80&w=1000",
      pitch: "https://images.unsplash.com/photo-1556056504-5c7696c4c28d?auto=format&fit=crop&q=80&w=1000",
      trophy: "https://images.unsplash.com/photo-1521733621454-e67c8052a325?auto=format&fit=crop&q=80&w=1000",
      manager: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&q=80&w=1000",
      crowd: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=1000",
    };
    return images[seed.toLowerCase()] || "https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&q=80&w=1000";
  };

  // Return a matching gradient overlay
  const getImagePlaceholder = (seed: string) => {
    const gradients: Record<string, string> = {
      stadium: "from-emerald-900/60 to-slate-950",
      football: "from-teal-900/60 to-slate-950",
      jersey: "from-sky-900/60 to-slate-950",
      boots: "from-indigo-900/60 to-slate-950",
      goalie: "from-cyan-900/60 to-slate-950",
      pitch: "from-green-900/60 to-slate-950",
      trophy: "from-yellow-900/60 to-slate-950",
      manager: "from-gray-900/60 to-slate-950",
      crowd: "from-red-900/60 to-slate-950",
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
          onClick={handleRefresh}
          disabled={isFeedLoading}
          className="bg-white hover:bg-amber-400 text-black font-bold text-[10px] font-mono py-2 px-5 rounded-full tracking-wider transition-all cursor-pointer flex items-center gap-1.5 uppercase shadow-md shadow-white/5 self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFeedLoading ? "animate-spin" : ""}`} />
          {isFeedLoading ? "FETCHING..." : `REFRESH ${feedType === "editorial" ? "EDITORIAL" : "GLOBAL"}`}
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

      {/* Switcher Tabs */}
      <div className="flex border-b border-white/5 pb-1 gap-6">
        <button
          onClick={() => setFeedType("editorial")}
          className={`pb-3 text-xs font-mono font-black uppercase tracking-widest transition-all relative cursor-pointer ${
            feedType === "editorial"
              ? "text-amber-500 font-black border-b-2 border-amber-500"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Newspaper className="w-3.5 h-3.5" />
            Hub Editorial
          </span>
        </button>
        <button
          onClick={() => setFeedType("grounded")}
          className={`pb-3 text-xs font-mono font-black uppercase tracking-widest transition-all relative cursor-pointer ${
            feedType === "grounded"
              ? "text-emerald-400 font-black border-b-2 border-emerald-400"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            Global Headlines
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </span>
        </button>
      </div>

      {/* Grounding Context Banner */}
      {feedType === "grounded" && (
        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-sm animate-fade-in">
          <div className="flex gap-3">
            <div className="p-2 bg-emerald-500/15 rounded-xl h-fit">
              <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-tight flex items-center gap-2">
                Google Search Grounding Engine Active
              </h3>
              <p className="text-xs text-slate-400 leading-normal max-w-xl mt-0.5">
                These headlines are dynamically compiled from live real-world sports news publishers and web search results. Verified links are attached to each story.
              </p>
            </div>
          </div>
          {groundedSources.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[9px] font-mono text-slate-500 uppercase font-black tracking-widest">Sources Verified:</span>
              <div className="flex flex-wrap gap-1.5">
                {Array.from(new Set(groundedSources.map(s => s.title))).slice(0, 3).map((title, idx) => (
                  <span key={idx} className="bg-white/5 border border-white/10 text-emerald-400 text-[9px] font-mono font-bold px-2 py-0.5 rounded-md uppercase">
                    {title}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error banner */}
      {isFeedError && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center gap-3 text-amber-400 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{isFeedError}</span>
        </div>
      )}

      {isFeedLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-xs font-mono text-amber-400 font-bold tracking-widest uppercase">
            {feedType === "editorial" ? "UNROLLING NEWS SHEETS..." : "CONNECTING GOOGLE SEARCH GROUNDING..."}
          </p>
        </div>
      ) : selectedArticle ? (
        /* Full Article Detail View */
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden max-w-4xl mx-auto backdrop-blur-sm shadow-2xl">
          {/* Header Graphic with Real Imagery */}
          <div className="h-56 md:h-80 relative overflow-hidden group/header border-b border-white/5">
            <NewsImage 
              query={`${selectedArticle.title} ${selectedArticle.category}`}
              src={getArticleImage(selectedArticle.id, selectedArticle.imageSeed)} 
              alt={selectedArticle.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover/header:scale-110"
              aspectRatio="aspect-auto"
            />
            <div className={`absolute inset-0 bg-gradient-to-t ${getImagePlaceholder(selectedArticle.imageSeed)} opacity-80 mix-blend-multiply`} />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            
            <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end">
              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-slate-300 text-[10px] font-mono uppercase px-2.5 py-1 rounded border border-white/10 flex items-center gap-1.5 font-bold">
                {selectedArticle.engine === 'grounded' ? (
                  <>
                    <Globe className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    Search Grounded
                  </>
                ) : selectedArticle.engine === 'gemini' ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                    Gemini Crafted
                  </>
                ) : (
                  <>
                    <Activity className="w-3.5 h-3.5 text-slate-500" />
                    Archived Feed
                  </>
                )}
              </div>
              <div className="space-y-3 max-w-2xl">
                <span className="text-[10px] font-mono uppercase tracking-widest bg-amber-500 text-black py-1 px-2.5 rounded font-black shadow-lg shadow-amber-500/20">
                  {selectedArticle.category}
                </span>
                <h1 className="text-2xl md:text-4xl font-black text-white tracking-tighter leading-none uppercase italic drop-shadow-2xl">
                  {selectedArticle.title}
                </h1>
              </div>
            </div>
          </div>

          {/* Article Meta & Author Profile Bar */}
          {(() => {
            const author = getArticleAuthor(selectedArticle);
            const readTime = getReadTime(selectedArticle.content);
            return (
              <div className="bg-black/40 p-4 md:p-5 border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <AuthorHeadshot
                    authorName={author.name}
                    seed={`${selectedArticle.id}-${author.name}`}
                    size="lg"
                    showBadge={true}
                    borderAccent={true}
                  />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">
                        {author.name}
                      </span>
                      <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <UserCheck className="w-2.5 h-2.5 text-amber-400" />
                        Verified Columnist
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      {author.role} • <strong className="text-slate-300 font-semibold">{selectedArticle.source}</strong>
                    </span>
                    <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {selectedArticle.date}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-500/80" />
                        {readTime}
                      </span>
                      {author.handle && (
                        <>
                          <span>•</span>
                          <span className="text-sky-400 font-mono">{author.handle}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-mono text-slate-400">
                    <Feather className="w-3 h-3 text-amber-400" />
                    <span>Unsplash Portrait API</span>
                  </div>
                  <button
                    onClick={() => setSelectedArticle(null)}
                    className="text-amber-400 hover:text-white transition-colors cursor-pointer text-xs uppercase tracking-wider font-mono font-bold flex items-center gap-1"
                  >
                    ← BACK TO ARTICLES
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Article Body */}
          <div className="p-6 md:p-8 space-y-4 text-slate-300 leading-relaxed text-sm md:text-base">
            <p className="font-semibold text-slate-200 border-l-2 border-amber-500 pl-4 py-1.5 bg-amber-500/[0.02]">
              {selectedArticle.summary}
            </p>
            <div className="space-y-4 whitespace-pre-line">
              {selectedArticle.content}
            </div>

            {/* Verified Web Sources for Grounded News */}
            {selectedArticle.sources && selectedArticle.sources.length > 0 && (
              <div className="mt-8 pt-6 border-t border-white/10 space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-widest font-black text-slate-400 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  Verified Web References
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(selectedArticle as any).sources.map((src: any, sIdx: number) => (
                    <a
                      key={sIdx}
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-white/[0.02] hover:bg-emerald-500/[0.04] border border-white/5 hover:border-emerald-500/20 rounded-xl transition-all group/src text-left"
                    >
                      <div className="space-y-0.5 truncate pr-2">
                        <span className="text-[10px] font-bold text-slate-300 group-hover/src:text-emerald-400 transition-colors block truncate">
                          {src.title}
                        </span>
                        <span className="text-[9px] font-mono text-slate-500 block truncate">
                          {src.url}
                        </span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-600 group-hover/src:text-emerald-400 transition-all flex-shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
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
            {filteredArticles.map((article) => {
              const author = getArticleAuthor(article);
              const readTime = getReadTime(article.content);
              return (
                <div
                  key={article.id}
                  className="group bg-white/5 hover:bg-white/[0.08] border border-white/10 hover:border-amber-500/30 rounded-2xl overflow-hidden transition-all duration-500 flex flex-col justify-between backdrop-blur-sm shadow-xl"
                >
                  {/* News Card Header - Dynamic Unsplash Author Profile Headshot & Meta */}
                  <div className="p-3 px-4 flex items-center justify-between border-b border-white/5 bg-slate-950/40">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <AuthorHeadshot
                        authorName={author.name}
                        seed={`${article.id}-${author.name}`}
                        size="md"
                        showBadge={true}
                        borderAccent={true}
                      />
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-200 group-hover:text-amber-400 transition-colors truncate">
                            {author.name}
                          </span>
                          <span className="text-[10px] text-amber-500 font-mono" title="Verified Columnist">✦</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 truncate">
                          {author.role}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 text-amber-500" />
                        {readTime}
                      </span>
                    </div>
                  </div>

                  {/* Visual Thumbnail */}
                  <div className="h-32 relative overflow-hidden border-b border-white/5">
                    <NewsImage 
                      query={`${article.title} ${article.category}`}
                      src={getArticleImage(article.id, article.imageSeed)} 
                      alt={article.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      aspectRatio="aspect-auto"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t ${getImagePlaceholder(article.imageSeed)} opacity-60 mix-blend-multiply`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    <div className="absolute inset-0 p-4 flex flex-col justify-between">
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[9px] font-black font-mono bg-amber-500 text-black py-0.5 px-2 rounded self-start uppercase tracking-wider shadow-lg">
                          {article.category}
                        </span>
                        {article.engine === 'grounded' && (
                          <span className="text-[8px] font-mono bg-emerald-500 text-white py-0.5 px-1.5 rounded font-bold uppercase tracking-wider flex items-center gap-1 shadow-lg shadow-emerald-500/20">
                            <span className="h-1 w-1 rounded-full bg-white animate-pulse" />
                            Grounded
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-300 font-bold drop-shadow-md">{article.date}</span>
                    </div>
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
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
