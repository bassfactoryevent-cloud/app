"use client";

import dynamic from "next/dynamic";
import "@uiw/react-markdown-preview/markdown.css";

// Dynamic import to avoid SSR issues with react-markdown-preview
const MarkdownPreview = dynamic(() => import("@uiw/react-markdown-preview"), { ssr: false });

export default function BlogRendererClient({ source }: { source: string }) {
  return (
    <div data-color-mode="dark" style={{ backgroundColor: 'transparent' }}>
      <MarkdownPreview 
        source={source} 
        style={{ 
          backgroundColor: 'transparent',
          color: 'var(--color-black)',
          fontSize: '1.125rem',
          lineHeight: '1.8',
          fontFamily: 'var(--font-geist-sans), sans-serif'
        }} 
      />
    </div>
  );
}
