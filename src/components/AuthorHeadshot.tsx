import React, { useState, useEffect } from "react";
import { User, CheckCircle2 } from "lucide-react";

interface AuthorHeadshotProps {
  authorName: string;
  seed?: string;
  avatarUrl?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  showBadge?: boolean;
  borderAccent?: boolean;
}

// In-memory cache across component mounts to avoid redundant network queries
const portraitMemoryCache: Record<string, string> = {};

// Reliable curated fallback pool of Unsplash portrait headshots
const CURATED_PORTRAITS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&crop=face,faces&q=80&w=256&h=256",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&crop=face,faces&q=80&w=256&h=256",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&crop=face,faces&q=80&w=256&h=256",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&crop=face,faces&q=80&w=256&h=256",
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&crop=face,faces&q=80&w=256&h=256",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&crop=face,faces&q=80&w=256&h=256",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&crop=face,faces&q=80&w=256&h=256",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&crop=face,faces&q=80&w=256&h=256",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&crop=face,faces&q=80&w=256&h=256",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&crop=face,faces&q=80&w=256&h=256",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&crop=face,faces&q=80&w=256&h=256",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&crop=face,faces&q=80&w=256&h=256",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&crop=face,faces&q=80&w=256&h=256",
  "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&crop=face,faces&q=80&w=256&h=256"
];

function getDeterministicPortrait(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % CURATED_PORTRAITS.length;
  return CURATED_PORTRAITS[idx];
}

export const AuthorHeadshot: React.FC<AuthorHeadshotProps> = ({
  authorName,
  seed = "",
  avatarUrl,
  size = "md",
  className = "",
  showBadge = false,
  borderAccent = true
}) => {
  const cacheKey = (seed || authorName || "author").toLowerCase().trim();
  const [imageUrl, setImageUrl] = useState<string>(() => {
    if (avatarUrl) return avatarUrl;
    if (portraitMemoryCache[cacheKey]) return portraitMemoryCache[cacheKey];
    return getDeterministicPortrait(cacheKey);
  });
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    if (avatarUrl) {
      setImageUrl(avatarUrl);
      return;
    }

    if (portraitMemoryCache[cacheKey]) {
      setImageUrl(portraitMemoryCache[cacheKey]);
      return;
    }

    let isMounted = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const fetchAuthorPortrait = async () => {
      try {
        const res = await fetch(
          `/api/unsplash-portrait?seed=${encodeURIComponent(cacheKey)}&name=${encodeURIComponent(authorName)}`,
          { signal: controller.signal }
        );
        if (res.ok) {
          const data = await res.json();
          if (data?.url && isMounted) {
            portraitMemoryCache[cacheKey] = data.url;
            setImageUrl(data.url);
          }
        }
      } catch (err) {
        // Fallback to deterministic portrait on timeout or network error
        if (isMounted) {
          const fallback = getDeterministicPortrait(cacheKey);
          portraitMemoryCache[cacheKey] = fallback;
          setImageUrl(fallback);
        }
      } finally {
        clearTimeout(timeout);
      }
    };

    fetchAuthorPortrait();

    return () => {
      isMounted = false;
      controller.abort();
      clearTimeout(timeout);
    };
  }, [cacheKey, authorName, avatarUrl]);

  const sizeClasses = {
    xs: "w-5 h-5",
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-12 h-12",
    xl: "w-16 h-16"
  }[size];

  const badgeSizeClasses = {
    xs: "w-1.5 h-1.5",
    sm: "w-2 h-2",
    md: "w-2.5 h-2.5",
    lg: "w-3.5 h-3.5",
    xl: "w-4 h-4"
  }[size];

  const initials = authorName
    ? authorName
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "AU";

  return (
    <div className={`relative inline-flex flex-shrink-0 group/headshot ${sizeClasses} ${className}`}>
      {/* Container with rounded circle & optional border accent */}
      <div
        className={`w-full h-full rounded-full overflow-hidden relative bg-slate-800 ${
          borderAccent
            ? "ring-1.5 ring-amber-500/40 group-hover/headshot:ring-amber-400 transition-all shadow-sm shadow-amber-500/10"
            : "ring-1 ring-white/10"
        }`}
      >
        {/* Shimmer Placeholder while loading */}
        {!isLoaded && !hasError && (
          <div className="absolute inset-0 bg-slate-800 animate-pulse flex items-center justify-center">
            <User className="w-1/2 h-1/2 text-slate-500" />
          </div>
        )}

        {/* Fallback Monogram if image failed completely */}
        {hasError ? (
          <div className="w-full h-full bg-gradient-to-br from-amber-600 to-slate-900 flex items-center justify-center text-[10px] font-mono font-black text-white">
            {initials}
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={authorName ? `${authorName} profile headshot` : "Article author portrait"}
            loading="lazy"
            decoding="async"
            onLoad={() => setIsLoaded(true)}
            onError={() => {
              // Try next fallback if the fetched URL fails
              const nextFallback = getDeterministicPortrait(cacheKey + "-retry");
              if (imageUrl !== nextFallback) {
                setImageUrl(nextFallback);
              } else {
                setHasError(true);
              }
            }}
            className={`w-full h-full object-cover object-center transition-all duration-500 ${
              isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-110 blur-xs"
            }`}
          />
        )}
      </div>

      {/* Verified Reporter / Columnist Badge */}
      {showBadge && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 ${badgeSizeClasses} bg-emerald-500 ring-2 ring-slate-950 rounded-full flex items-center justify-center shadow-xs`}
          title={`Verified Sports Columnist: ${authorName}`}
        >
          {size === "lg" || size === "xl" ? (
            <CheckCircle2 className="w-full h-full text-slate-950 p-0.5" />
          ) : null}
        </span>
      )}
    </div>
  );
};
