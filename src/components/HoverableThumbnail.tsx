import { useState, useEffect } from "react";
import { ImageFallback, fixAssetUrl } from "./ImageFallback";

interface HoverableThumbnailProps {
  thumbnail: string;
  title: string;
  category: string;
  hoverGif?: string;
  hoverVideo?: string;
  gifMode?: boolean;
  priority?: boolean;
  className?: string;
}

export function HoverableThumbnail({
  thumbnail,
  title,
  category,
  hoverGif,
  hoverVideo,
  gifMode = false,
  priority = false,
  className = "",
}: HoverableThumbnailProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [gifError, setGifError] = useState(false);

  const resolvedHoverGif = fixAssetUrl(hoverGif);
  const resolvedHoverVideo = fixAssetUrl(hoverVideo);

  // Reset error state whenever hoverGif or hoverVideo prop changes
  useEffect(() => {
    setGifError(false);
  }, [hoverGif, hoverVideo]);

  return (
    <div
      className={`relative w-full overflow-hidden bg-brand-card transform-gpu ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Primary Thumbnail */}
      <ImageFallback
        src={thumbnail}
        alt={title}
        category={category}
        gifMode={gifMode}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-104"
      />

      {/* Hover Preview (GIF, MP4 Video, WebM, YouTube, Vimeo) - Only load on hover */}
      {isHovered && (resolvedHoverVideo || resolvedHoverGif) && !gifError && (
        <div className="absolute inset-0 w-full h-full z-10 pointer-events-none animate-fadeIn">
          <ImageFallback
            src={resolvedHoverVideo || resolvedHoverGif}
            alt={`${title} Preview`}
            gifMode={true}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Subtle overlay */}
      <div className="absolute inset-0 bg-brand-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 pointer-events-none" />
    </div>
  );
}
