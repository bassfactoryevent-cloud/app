import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ArrowLeft } from "lucide-react";
import BlogRendererClient from "./BlogRendererClient";

export const revalidate = 60;

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: post, error } = await supabase
    .from("posts")
    .select(`
      *,
      categories (
        name
      )
    `)
    .eq("slug", slug)
    .single();

  if (error || !post || !post.is_published) {
    notFound();
  }

  return (
    <article style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
      
      {/* Cover Image Section */}
      <div style={{ position: 'relative', width: '100%', height: '60vh', minHeight: '400px', backgroundColor: '#050505' }}>
        {post.cover_image && (
          <Image 
            src={post.cover_image}
            alt={post.title}
            fill
            style={{ objectFit: 'cover', opacity: 0.6 }}
            priority
          />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--color-bg) 0%, transparent 100%)' }} />
        
        {/* Navigation back */}
        <div style={{ position: 'absolute', top: '2rem', left: '2rem', zIndex: 10 }}>
          <Link href="/blog" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', textDecoration: 'none', fontWeight: 600, backgroundColor: 'rgba(0,0,0,0.5)', padding: '0.5rem 1rem', borderRadius: '100px', backdropFilter: 'blur(10px)' }}>
            <ArrowLeft size={18} /> Volver al Journal
          </Link>
        </div>
      </div>

      {/* Content Container */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 2rem 6rem', position: 'relative', zIndex: 10, marginTop: '-15vh' }}>
        
        <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
          {post.categories && (
            <div style={{ display: 'inline-block', backgroundColor: 'var(--color-magenta)', color: 'white', padding: '0.25rem 1rem', borderRadius: '100px', fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.5rem' }}>
              {post.categories.name}
            </div>
          )}
          
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: '1.5rem', color: 'var(--color-black)' }}>
            {post.title}
          </h1>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', opacity: 0.6, fontSize: '1rem', color: 'var(--color-black)' }}>
            <time>
              {new Date(post.created_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
            </time>
          </div>
        </header>

        {/* Rich Text Markdown Renderizado */}
        <div className="blog-content">
          <BlogRendererClient source={post.content} />
        </div>

      </div>

      {/* Basic overrides to make markdown images responsive */}
      <style>{`
        .blog-content img {
          max-width: 100%;
          border-radius: 8px;
          margin: 2rem auto;
          display: block;
        }
      `}</style>
    </article>
  );
}
