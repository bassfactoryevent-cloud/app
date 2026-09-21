"use client";

import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

import styles from './HorizontalScroll.module.css';

interface HorizontalScrollProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  viewAllLink?: string;
}

export default function HorizontalScroll({ title, subtitle, children, viewAllLink }: HorizontalScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth + 100 : scrollLeft + clientWidth - 100;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <section className={styles.scrollContainer}>
      <div className={styles.scrollHeader}>
        <div className={styles.textGroup}>
          <h2 className={styles.title}>{title}</h2>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        
        <div className={styles.controls}>
          {viewAllLink && (
            <Link href={viewAllLink} className={styles.viewAllLink}>
              Ver Más
            </Link>
          )}
          <button 
            onClick={() => scroll('left')}
            className={styles.arrowButton}
            aria-label="Scroll left"
          >
            <ChevronLeft size={18} />
          </button>
          <button 
            onClick={() => scroll('right')}
            className={styles.arrowButton}
            aria-label="Scroll right"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className={styles.scrollTrack}
      >
        {children}
      </div>
    </section>
  );
}
