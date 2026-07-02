import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Image as ImageIcon } from 'lucide-react';

interface NewsImageProps {
  query?: string;
  src?: string;
  alt: string;
  className?: string;
  aspectRatio?: string; // Tailwind aspect class like "aspect-video"
}

export const NewsImage: React.FC<NewsImageProps> = ({ 
  query,
  src, 
  alt, 
  className = "", 
  aspectRatio = "aspect-video" 
}) => {
  const [imageSrc, setImageSrc] = useState<string | undefined>(src);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [isFetching, setIsFetching] = useState(!!query && !src);

  // Handle fetching if query is provided
  useEffect(() => {
    if (!query) {
      setImageSrc(src);
      setIsFetching(false);
      return;
    }

    const fetchImage = async () => {
      setIsFetching(true);
      setError(false);
      try {
        const response = await fetch(`/api/unsplash-search?query=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          setImageSrc(data.url);
        } else {
          // If query fails, use src as fallback
          setImageSrc(src);
          if (!src) setError(true);
        }
      } catch (err) {
        setImageSrc(src);
        if (!src) setError(true);
      } finally {
        setIsFetching(false);
      }
    };

    fetchImage();
  }, [query, src]);

  // Reset loading state when imageSrc changes
  useEffect(() => {
    setIsLoaded(false);
    setError(false);
  }, [imageSrc]);

  return (
    <div className={`relative overflow-hidden ${aspectRatio} bg-white/5 ${className}`}>
      {/* Skeleton / Placeholder */}
      <AnimatePresence mode="wait">
        {(!isLoaded || isFetching) && !error && (
          <motion.div 
            key="skeleton"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-zinc-900/40 flex flex-col items-center justify-center gap-3"
          >
            <div className="absolute inset-0 overflow-hidden">
              <motion.div 
                className="w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
            </div>
            
            <div className="relative flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center bg-white/5 backdrop-blur-sm">
                <ImageIcon className="w-4 h-4 text-amber-500/50 animate-pulse" />
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <div className="h-0.5 w-20 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-amber-500/40"
                    animate={{ width: ["0%", "100%"] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </div>
                <span className="text-[7px] font-mono uppercase tracking-[0.3em] text-white/30 animate-pulse">Synchronizing</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <motion.div 
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-zinc-900/80 flex items-center justify-center p-4 text-center backdrop-blur-sm"
          >
            <div className="flex flex-col items-center gap-2">
              <ImageIcon className="w-5 h-5 text-rose-500/30" />
              <div className="text-zinc-500 text-[8px] font-mono uppercase tracking-[0.2em]">
                Feed Interrupted
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actual Image */}
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          className={`w-full h-full object-cover transition-all duration-1000 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110 blur-sm'}`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setError(true)}
          referrerPolicy="no-referrer"
        />
      )}
    </div>
  );
};
