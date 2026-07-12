"use client";

import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
    <section style={{ margin: '0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--space-2)' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.03em' }}>{title}</h2>
          {subtitle && <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', opacity: 0.6 }}>{subtitle}</p>}
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {viewAllLink && (
            <a href={viewAllLink} style={{ fontSize: '0.875rem', fontWeight: 600, opacity: 0.8, marginRight: '1rem', color: 'var(--color-magenta)' }}>
              Ver todo
            </a>
          )}
          <button 
            onClick={() => scroll('left')}
            style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-surface-hover)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            aria-label="Scroll left"
          >
            <ChevronLeft size={18} />
          </button>
          <button 
            onClick={() => scroll('right')}
            style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-surface-hover)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            aria-label="Scroll right"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        style={{ 
          display: 'flex', 
          gap: 'var(--space-2)', 
          overflowX: 'auto', 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          paddingBottom: '1rem',
        }}
        className="hide-scrollbar"
      >
        <style dangerouslySetInnerHTML={{__html: `
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}} />
        {children}
      </div>
    </section>
  );
}
