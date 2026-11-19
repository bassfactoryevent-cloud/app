"use client";

import { useState } from "react";
import Image from "next/image";
import { Package } from "lucide-react";

interface ProductGalleryClientProps {
  title: string;
  images: { image_url: string; is_primary?: boolean }[];
  primaryImage: string | null;
}

export default function ProductGalleryClient({
  title,
  images,
  primaryImage,
}: ProductGalleryClientProps) {
  const [activeImage, setActiveImage] = useState<string | null>(primaryImage);

  const displayImage = activeImage || primaryImage;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "1/1",
          backgroundColor: "var(--color-surface)",
          borderRadius: "10px",
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {displayImage ? (
          <Image
            src={displayImage}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 520px"
            style={{ objectFit: "cover" }}
            priority
          />
        ) : (
          <div
            style={{
              display: "flex",
              height: "100%",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0.25,
            }}
          >
            <Package size={48} />
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div
          style={{
            display: "flex",
            gap: "0.55rem",
            overflowX: "auto",
            paddingBottom: "2px",
            scrollbarWidth: "none",
          }}
        >
          {images.map((img, idx) => {
            const isSelected = img.image_url === displayImage;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImage(img.image_url)}
                aria-label={`Ver imagen ${idx + 1} de ${title}`}
                style={{
                  position: "relative",
                  width: "68px",
                  height: "68px",
                  flexShrink: 0,
                  borderRadius: "8px",
                  overflow: "hidden",
                  border: isSelected
                    ? "2px solid var(--color-magenta)"
                    : "1px solid rgba(255,255,255,0.1)",
                  cursor: "pointer",
                  padding: 0,
                  background: "var(--color-surface)",
                  transition: "border-color 0.15s ease",
                }}
              >
                <Image
                  src={img.image_url}
                  alt={`${title} miniatura ${idx + 1}`}
                  fill
                  sizes="68px"
                  style={{ objectFit: "cover" }}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
