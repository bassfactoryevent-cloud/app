"use client";

import { useState } from "react";
import styles from "./AdBanner.module.css";

interface AdSingleClientProps {
  ad: {
    id: string;
    image_url: string;
    target_url?: string | null;
  };
  heightClass: string;
  fitClass: string;
  className?: string;
  isVideo: boolean;
}

export default function AdSingleClient({
  ad,
  heightClass,
  fitClass,
  className = "",
  isVideo,
}: AdSingleClientProps) {
  const [hasError, setHasError] = useState(false);

  // If the image or video failed to load (e.g. 403 or expired URL), hide cleanly
  if (hasError) {
    return null;
  }

  const content = (
    <div className={`${styles.adWrapper} ${heightClass} ${className}`}>
      {isVideo ? (
        <video
          src={ad.image_url}
          autoPlay
          loop
          muted
          playsInline
          onError={() => setHasError(true)}
          className={`${styles.media} ${fitClass}`}
        />
      ) : (
        <img
          src={ad.image_url}
          alt="Ad Banner"
          onError={() => setHasError(true)}
          className={`${styles.media} ${fitClass}`}
        />
      )}
      <span className={styles.adBadge}>Ad</span>
    </div>
  );

  if (ad.target_url) {
    return (
      <a
        href={ad.target_url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: "block", width: "100%" }}
      >
        {content}
      </a>
    );
  }

  return content;
}
