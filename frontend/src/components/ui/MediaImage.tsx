import React, { useState } from 'react';
import { cn } from '../../utils/cn';

interface MediaImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackType?: 'resort' | 'avatar' | 'document' | 'logo';
}

export function MediaImage({ src, alt, className, fallbackType = 'resort', ...props }: MediaImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const fallbacks = {
    resort: '/images/placeholders/resort.jpg',
    avatar: '/images/placeholders/avatar.jpg',
    document: '/images/placeholders/document.png',
    logo: '/images/placeholders/logo.png',
  };

  const getFallback = () => fallbacks[fallbackType];

  return (
    <div className={cn("relative overflow-hidden bg-sand-100", className)}>
      {/* Skeleton loader until loaded */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-sand-200 animate-pulse" />
      )}
      
      <img
        src={hasError || !src ? getFallback() : src}
        alt={alt || "Image"}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          !isLoaded ? "opacity-0" : "opacity-100"
        )}
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setHasError(true);
          setIsLoaded(true);
        }}
        loading="lazy"
        {...props}
      />
    </div>
  );
}
