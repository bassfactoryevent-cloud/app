"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { HeroSlide } from "@/types/hero";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Tag,
  Timer,
} from "lucide-react";
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
      ytId = url.split("youtu.be/")[1]?.split("?")[0];
    } else {
      ytId = url.split("v=")[1]?.split("&")[0];
    }
    url = `https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${ytId}&showinfo=0`;
  }

  return { url, isEmbed, isVideo };
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
      <Timer size={16} style={{ color: "#D90416", marginRight: "0.15rem" }} />
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

  return (
    <section
      className={styles.heroSection}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Media Layers for Smooth Crossfade */}
      {safeSlides.map((slide, idx) => {
        const isActive = idx === currentIndex;
        const media = resolveMediaConfig(slide);

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
                className={styles.mediaImage}
              />
            )}
          </div>
        );
      })}

      <div className={styles.heroVignette} />

      <div className={styles.heroContainer}>
        {/* Active Slide Foreground Content */}
        <div key={currentSlide.id || currentIndex} className={styles.slideContent}>
          {/* Top Contextual Badges */}
          <div className={styles.badgesRow}>
            {currentSlide.badge_label && (
              <span className={styles.categoryBadge}>
                <span className={styles.pulseDot} />
                <span>{currentSlide.badge_label}</span>
              </span>
            )}

            {(currentSlide.meta?.price_label || currentSlide.meta?.location) && (
              <span className={styles.metaPill}>
                {currentSlide.source_type === "merch" ? (
                  <Tag size={13} style={{ color: "#D90416" }} />
                ) : (
                  <MapPin size={13} style={{ color: "#D90416" }} />
                )}
                <span>
                  {currentSlide.meta?.price_label || currentSlide.meta?.location}
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

          {/* Main Headline */}
          <h1
            className={styles.heroTitle}
            dangerouslySetInnerHTML={{
              __html: currentSlide.title || "MÚSICA<br/>Cultura<br/>Movimiento",
            }}
          />

          {/* Subtitle */}
          {currentSlide.subtitle && (
            <p className={styles.heroSubtitle}>{currentSlide.subtitle}</p>
          )}

          {/* Optional Live Event Countdown */}
          {currentSlide.meta?.show_countdown &&
            currentSlide.meta?.event_date && (
              <div>
                <LiveCountdown targetDate={currentSlide.meta.event_date} />
              </div>
            )}

          {/* Side-by-Side Primary & Secondary CTAs */}
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

        {/* Interactive Multi-Slide Dock (Only rendered when > 1 slide is active) */}
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
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label="Siguiente slide"
                className={styles.arrowBtn}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
