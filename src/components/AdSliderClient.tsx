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
}

export default function AdSliderClient({ ads, className = "", intervalSecs = 15 }: AdSliderClientProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (ads.length <= 1) return;

    const intervalId = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % ads.length);
    }, intervalSecs * 1000);

    return () => clearInterval(intervalId);
  }, [ads.length, intervalSecs]);

  if (!ads || ads.length === 0) return null;

  const currentAd = ads[currentIndex];
  const isVideo = currentAd.image_url.toLowerCase().endsWith('.mp4') || currentAd.image_url.toLowerCase().endsWith('.webm');

  const content = (
    <div className={className} style={{ position: 'relative', width: '100%', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem', overflow: 'hidden', display: 'flex', justifyContent: 'center', transition: 'opacity 0.5s ease-in-out' }}>
      {isVideo ? (
        <video 
          key={currentAd.id} 
          src={currentAd.image_url} 
          autoPlay 
          loop 
          muted 
          playsInline 
          style={{ width: '100%', height: 'auto', maxHeight: '250px', objectFit: 'contain' }} 
        />
      ) : (
        <img 
          key={currentAd.id}
          src={currentAd.image_url} 
          alt="Ad Banner" 
          style={{ width: '100%', height: 'auto', maxHeight: '250px', objectFit: 'contain' }} 
        />
      )}
      <span style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '0.65rem', padding: '0.2rem 0.4rem', borderRadius: '0.25rem', textTransform: 'uppercase' }}>
        Ad
      </span>
    </div>
  );

  if (currentAd.target_url) {
    return (
      <a href={currentAd.target_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '100%' }}>
        {content}
      </a>
    );
  }

  return content;
}
