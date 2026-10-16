"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { HeroSlide } from "@/types/hero";
import { ChevronLeft, ChevronRight, MapPin, Tag, Timer } from "lucide-react";
import styles from "./HeroSpotlight.module.css";

interface HeroSpotlightProps {
  slides: HeroSlide[];
  autoplayMs: number;
}

function resolveMediaConfig(slide: HeroSlide) {
  let url =
    slide.media_url ||
    "https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?q=80&w=1600&auto=format&fit=crop";
  let isEmbed = false;
  let isVideo = slide.media_type === "video";

  if (url.includes("vimeo.com")) {
    isEmbed = true;
    isVideo = true;
    const vimeoId = url.split("vimeo.com/")[1]?.split("?")[0];
    url = `https://player.vimeo.com/video/${vimeoId}?background=1&autoplay=1&loop=1&byline=0&title=0`;
  } else if (url.includes("youtube.com") || url.includes("youtu.be")) {
    isEmbed = true;
    isVideo = true;
    let ytId = "";
    if (url.includes("youtu.be")) {
      ytId = bgExtractYt(url);
    } else {
      ytId = url.split("v=")[1]?.split("&")[0] || "";
    }
    url = `https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${ytId}&showinfo=0`;
  }

  return { url, isEmbed, isVideo };
}

function bgExtractYt(url: string) {
  return url.split("youtu.be/")[1]?.split("?")[0] || "";
}

/**
 * Interactive 60fps HTML5 Canvas layer rendering subtle rave dust particles + a bottom 128 BPM sonic wave.
 */
function HeroSonicCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let width = 0;
    let height = 0;

    const particles = Array.from({ length: 28 }, (_, i) => ({
      x: Math.random(),
      y: Math.random(),
      r: 1 + (i % 3) * 0.7,
      speedY: 0.0004 + (i % 5) * 0.00018,
      drift: (i % 2 === 0 ? 1 : -1) * 0.00025,
      isRed: i % 3 === 0,
    }));

    const resize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      width = rect.width || window.innerWidth;
      height = rect.height || 460;
      canvas.width = width;
      canvas.height = height;
    };

    resize();
    window.addEventListener("resize", resize);

    let t = 0;
    const render = () => {
      t += 0.035;
      ctx.clearRect(0, 0, width, height);

      // 1. Floating atmospheric rave particles
      for (const p of particles) {
        p.y -= p.speedY;
        p.x += Math.sin(t + p.y * 10) * p.drift;
        if (p.y < 0) p.y = 1;
        if (p.x < 0) p.x = 1;
        if (p.x > 1) p.x = 0;

        const px = p.x * width;
        const py = p.y * height;
        ctx.beginPath();
        ctx.arc(px, py, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.isRed
          ? "rgba(217, 4, 22, 0.55)"
          : "rgba(255, 255, 255, 0.25)";
        ctx.fill();
      }

      // 2. Subtle soundwave along the lower horizon
      ctx.beginPath();
      const baseY = height - 6;
      ctx.moveTo(0, baseY);
      const step = Math.max(12, Math.floor(width / 64));
      for (let x = 0; x <= width; x += step) {
        const norm = x / width;
        const envelope = Math.sin(norm * Math.PI);
        const wave =
          Math.sin(norm * 18 + t * 2.4) *
          Math.cos(norm * 9 - t * 1.6) *
          10 *
          envelope;
        ctx.lineTo(x, baseY - Math.abs(wave));
      }
      ctx.strokeStyle = "rgba(217, 4, 22, 0.32)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.sonicCanvas} />;
}

function LiveCountdown({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    const update = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (isNaN(diff) || diff <= 0) {
        setTimeLeft(null);
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) return null;

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className={styles.countdownStrip}>
      <Timer size={14} style={{ color: "#D90416", marginRight: "0.1rem" }} />
      <div className={styles.countdownUnit}>
        <span className={styles.countdownNumber}>{pad(timeLeft.days)}</span>
        <span className={styles.countdownLabel}>Días</span>
      </div>
      <span className={styles.countdownSep}>:</span>
      <div className={styles.countdownUnit}>
        <span className={styles.countdownNumber}>{pad(timeLeft.hours)}</span>
        <span className={styles.countdownLabel}>Hrs</span>
      </div>
      <span className={styles.countdownSep}>:</span>
      <div className={styles.countdownUnit}>
        <span className={styles.countdownNumber}>{pad(timeLeft.minutes)}</span>
        <span className={styles.countdownLabel}>Min</span>
      </div>
      <span className={styles.countdownSep}>:</span>
      <div className={styles.countdownUnit}>
        <span className={styles.countdownNumber}>{pad(timeLeft.seconds)}</span>
        <span className={styles.countdownLabel}>Seg</span>
      </div>
    </div>
  );
}

export default function HeroSpotlight({
  slides,
  autoplayMs,
}: HeroSpotlightProps) {
  const activeSlides = slides.filter((s) => s.active);
  const safeSlides = activeSlides.length > 0 ? activeSlides : slides;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const count = safeSlides.length;
  const currentSlide = safeSlides[currentIndex] || safeSlides[0];

  useEffect(() => {
    if (count <= 1 || !autoplayMs || autoplayMs <= 0 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % count);
    }, autoplayMs);

    return () => clearInterval(timer);
  }, [count, autoplayMs, isPaused, currentIndex]);

  const goPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + count) % count);
  };

  const goNext = () => {
    setCurrentIndex((prev) => (prev + 1) % count);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || count <= 1) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const deltaX = endX - touchStartX.current;
    if (Math.abs(deltaX) > 45) {
      if (deltaX < 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
  };

  if (!currentSlide) return null;

  const currentMedia = resolveMediaConfig(currentSlide);
  // Show the sharp uncropped poster/product showcase card on the right whenever the slide is an event, merch, post, or ad with an image!
  const showFramedArtwork =
    !currentMedia.isVideo && currentSlide.source_type !== "custom";

  return (
    <section
      className={styles.heroSection}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Media Layers */}
      {safeSlides.map((slide, idx) => {
        const isActive = idx === currentIndex;
        const media = resolveMediaConfig(slide);
        const isCatalogImage =
          !media.isVideo && slide.source_type !== "custom";

        return (
          <div
            key={slide.id || idx}
            className={`${styles.mediaLayer} ${
              isActive ? styles.mediaLayerActive : ""
            }`}
            aria-hidden={!isActive}
          >
            {media.isVideo ? (
              media.isEmbed ? (
                <iframe
                  src={media.url}
                  className={styles.mediaIframe}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={media.url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className={styles.mediaVideo}
                />
              )
            ) : (
              <img
                src={media.url}
                alt={(slide.title || "Bassfactory").replace(/<[^>]+>/g, " ")}
                className={
                  isCatalogImage
                    ? styles.mediaImageAmbient
                    : styles.mediaImage
                }
              />
            )}
          </div>
        );
      })}

      <div className={styles.heroVignette} />
      <HeroSonicCanvas />

      <div className={styles.heroContainer}>
        <div className={styles.stageGrid}>
          {/* Left: Refined Editorial Typography & Actions */}
          <div
            key={currentSlide.id || currentIndex}
            className={styles.slideContent}
          >
            <div className={styles.badgesRow}>
              {currentSlide.badge_label && (
                <span className={styles.categoryBadge}>
                  <span className={styles.pulseDot} />
                  <span>{currentSlide.badge_label}</span>
                </span>
              )}

              {(currentSlide.meta?.price_label ||
                currentSlide.meta?.location) && (
                <span className={styles.metaPill}>
                  {currentSlide.source_type === "merch" ? (
                    <Tag size={12} style={{ color: "#D90416" }} />
                  ) : (
                    <MapPin size={12} style={{ color: "#D90416" }} />
                  )}
                  <span>
                    {currentSlide.meta?.price_label ||
                      currentSlide.meta?.location}
                  </span>
                </span>
              )}

              {Array.isArray(currentSlide.tags) &&
                currentSlide.tags.map((tag, i) =>
                  tag.url ? (
                    <Link key={i} href={tag.url} className={styles.tagPill}>
                      {tag.text}
                    </Link>
                  ) : (
                    <span key={i} className={styles.tagPill}>
                      {tag.text}
                    </span>
                  )
                )}
            </div>

            <h1
              className={styles.heroTitle}
              dangerouslySetInnerHTML={{
                __html:
                  currentSlide.title || "MÚSICA<br/>Cultura<br/>Movimiento",
              }}
            />

            {currentSlide.subtitle && (
              <p className={styles.heroSubtitle}>{currentSlide.subtitle}</p>
            )}

            {currentSlide.meta?.show_countdown &&
              currentSlide.meta?.event_date && (
                <div>
                  <LiveCountdown targetDate={currentSlide.meta.event_date} />
                </div>
              )}

            <div className={styles.actionsRow}>
              {currentSlide.primary_button_text && (
                <Link
                  href={currentSlide.primary_button_url || "/events"}
                  className={styles.btnPrimary}
                >
                  {currentSlide.primary_button_text}
                </Link>
              )}

              {currentSlide.secondary_button_text && (
                <Link
                  href={currentSlide.secondary_button_url || "/register"}
                  className={styles.btnSecondary}
                >
                  {currentSlide.secondary_button_text}
                </Link>
              )}
            </div>
          </div>

          {/* Right: Sharp, Uncropped Framed Artwork for Events, Merch, Posts & Ads */}
          {showFramedArtwork && (
            <Link
              href={currentSlide.primary_button_url || "/events"}
              className={styles.artworkShowcase}
              title={currentSlide.title?.replace(/<[^>]+>/g, " ")}
            >
              <div className={styles.artworkInner}>
                <img
                  src={currentMedia.url}
                  alt={currentSlide.title?.replace(/<[^>]+>/g, " ")}
                  className={styles.artworkImg}
                />
                <span className={styles.artworkCornerTag}>
                  {currentSlide.source_type === "event"
                    ? "FLYER OFICIAL"
                    : currentSlide.source_type === "merch"
                    ? "DROP OFICIAL"
                    : "DESTACADO"}
                </span>
              </div>
            </Link>
          )}
        </div>

        {/* Interactive Multi-Slide Dock */}
        {count > 1 && (
          <div className={styles.spotlightDock}>
            <div className={styles.dockItems}>
              {safeSlides.map((slide, idx) => {
                const isActive = idx === currentIndex;
                const cleanTitle = (slide.title || `Slide ${idx + 1}`).replace(
                  /<br\s*\/?>/gi,
                  " "
                );

                return (
                  <button
                    key={slide.id || idx}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`${styles.dockCard} ${
                      isActive ? styles.dockCardActive : ""
                    }`}
                  >
                    <span className={styles.dockCardMeta}>
                      0{idx + 1} • {slide.badge_label || "DESTACADO"}
                    </span>
                    <span className={styles.dockCardTitle}>{cleanTitle}</span>

                    <div className={styles.dockProgressTrack}>
                      {isActive && autoplayMs > 0 && !isPaused && (
                        <div
                          key={`${currentIndex}-${isPaused}`}
                          className={styles.dockProgressBar}
                          style={{ animationDuration: `${autoplayMs}ms` }}
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className={styles.dockArrows}>
              <button
                type="button"
                onClick={goPrev}
                aria-label="Slide anterior"
                className={styles.arrowBtn}
              >
                <ChevronLeft size={15} />
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label="Siguiente slide"
                className={styles.arrowBtn}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
