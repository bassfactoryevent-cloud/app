"use client";

import { useState } from "react";
import Image from "next/image";
import { Package, ChevronLeft, ChevronRight } from "lucide-react";

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
  const imageList =
    images.length > 0
      ? images.map((i) => i.image_url)
      : primaryImage
      ? [primaryImage]
      : [];

  const initialIndex = primaryImage
    ? Math.max(0, imageList.indexOf(primaryImage))
    : 0;
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  const displayImage = imageList[activeIndex] || null;

  const handlePrev = () => {
    if (imageList.length <= 1) return;
    setActiveIndex((i) => (i - 1 + imageList.length) % imageList.length);
  };

  const handleNext = () => {
    if (imageList.length <= 1) return;
    setActiveIndex((i) => (i + 1) % imageList.length);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "1/1",
          maxHeight: "460px",
          backgroundColor: "#09090b",
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
            sizes="(max-width: 768px) 100vw, 480px"
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

        {imageList.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Imagen anterior"
              style={{
                position: "absolute",
                left: "0.6rem",
                top: "50%",
                transform: "translateY(-50%)",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                backgroundColor: "rgba(0,0,0,0.68)",
                border: "1px solid rgba(255,255,255,0.16)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                zIndex: 2,
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Imagen siguiente"
              style={{
                position: "absolute",
                right: "0.6rem",
                top: "50%",
                transform: "translateY(-50%)",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                backgroundColor: "rgba(0,0,0,0.68)",
                border: "1px solid rgba(255,255,255,0.16)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                zIndex: 2,
              }}
            >
              <ChevronRight size={16} />
            </button>

            <span
              style={{
                position: "absolute",
                bottom: "0.6rem",
                right: "0.6rem",
                backgroundColor: "rgba(0,0,0,0.75)",
                color: "white",
                fontSize: "0.68rem",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              {activeIndex + 1} / {imageList.length}
            </span>
          </>
        )}
      </div>

      {imageList.length > 1 && (
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            overflowX: "auto",
            paddingBottom: "2px",
            scrollbarWidth: "none",
          }}
        >
          {imageList.map((imgUrl, idx) => {
            const isSelected = idx === activeIndex;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveIndex(idx)}
                aria-label={`Ver imagen ${idx + 1} de ${title}`}
                style={{
                  position: "relative",
                  width: "62px",
                  height: "62px",
                  flexShrink: 0,
                  borderRadius: "7px",
                  overflow: "hidden",
                  border: isSelected
                    ? "2px solid var(--color-magenta)"
                    : "1px solid rgba(255,255,255,0.1)",
                  opacity: isSelected ? 1 : 0.65,
                  cursor: "pointer",
                  padding: 0,
                  background: "#09090b",
                  transition: "all 0.15s ease",
                }}
              >
                <Image
                  src={imgUrl}
                  alt={`${title} miniatura ${idx + 1}`}
                  fill
                  sizes="62px"
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
