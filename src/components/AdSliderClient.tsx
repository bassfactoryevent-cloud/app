"use client";

import { useState, useEffect } from "react";

interface Ad {
  id: string;
  image_url: string;
  target_url?: string | null;
}

interface AdSliderClientProps {
  ads: Ad[];
  className?: string;
  intervalSecs?: number;
  placementName?: string;
}

export default function AdSliderClient({ ads, className = "", intervalSecs = 7, placementName = "" }: AdSliderClientProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (ads.length <= 1) return;

    const intervalId = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % ads.length);
    }, intervalSecs * 1000);

    return () => clearInterval(intervalId);
  }, [ads.length, intervalSecs]);

  if (!ads || ads.length === 0) return null;

  const isThin = placementName.includes("thin");
  const containerHeight = isThin ? 'auto' : '250px';

  return (
    <div className={className} style={{ position: 'relative', width: '100%', height: containerHeight, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem', overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr', gridTemplateRows: '1fr' }}>
      {ads.map((ad, index) => {
        const isActive = index === currentIndex;
        const isVideo = ad.image_url.toLowerCase().endsWith('.mp4') || ad.image_url.toLowerCase().endsWith('.webm');

        const InnerContent = isVideo ? (
          <video src={ad.image_url} autoPlay loop muted playsInline style={{ width: '100%', height: isThin ? 'auto' : '100%', objectFit: 'contain', display: 'block' }} />
        ) : (
          <img src={ad.image_url} alt="Ad Banner" style={{ width: '100%', height: isThin ? 'auto' : '100%', objectFit: 'contain', display: 'block' }} />
        );

        return (
          <div 
            key={ad.id} 
            style={{ 
              gridRow: 1,
              gridColumn: 1,
              display: 'flex', 
              justifyContent: 'center', 
              opacity: isActive ? 1 : 0, 
              transition: 'opacity 0.8s ease-in-out',
              pointerEvents: isActive ? 'auto' : 'none',
              zIndex: isActive ? 10 : 0
            }}
          >
            {ad.target_url ? (
              <a href={ad.target_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '100%', height: '100%' }}>
                {InnerContent}
              </a>
            ) : (
              <div style={{ width: '100%', height: '100%' }}>
                {InnerContent}
              </div>
            )}
          </div>
        );
      })}
      
      <span style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '0.65rem', padding: '0.2rem 0.4rem', borderRadius: '0.25rem', textTransform: 'uppercase', zIndex: 20 }}>
        Ad
      </span>
    </div>
  );
}
