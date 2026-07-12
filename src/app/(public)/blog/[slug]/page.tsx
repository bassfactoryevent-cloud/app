import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ArrowLeft, Calendar } from "lucide-react";
import { Metadata, ResolvingMetadata } from "next";
import AdBanner from "@/components/AdBanner";
import styles from "../../../admin/components/TiptapEditor.module.css"; // Reuse tiptap styles for public render

export const revalidate = 60;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select("meta_title, meta_description, title, excerpt, cover_image")
    .eq("slug", slug)
    .single();

  if (!post) {
    return { title: "Artículo no encontrado" };
  }

  return {
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt || "Lee más en Bassfactory Journal",
    openGraph: {
      images: post.cover_image ? [post.cover_image] : [],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: post, error } = await supabase
    .from("posts")
    .select(`
      *,
      categories (
        name
      ),
      post_genres (
        genres (
          name
        )
      ),
      post_tags (
        tags (
          name
        )
      )
    `)
    .eq("slug", slug)
    .single();

  if (error || !post || !post.is_published) {
    notFound();
  }

  const genres = post.post_genres?.map((pg: any) => pg.genres?.name).filter(Boolean) || [];
  const tags = post.post_tags?.map((pt: any) => pt.tags?.name).filter(Boolean) || [];

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
          
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: '1.5rem', color: 'var(--color-text-primary)' }}>
            {post.title}
          </h1>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '1rem', opacity: 0.6, fontSize: '1rem', color: 'var(--color-text-primary)', marginBottom: '1rem' }}>
            <time style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={16} />
              {new Date(post.created_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
            </time>
          </div>

          {/* Taxonomies display */}
          {(genres.length > 0 || tags.length > 0) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
              {genres.map((g: string) => (
                <span key={g} style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)', padding: '0.25rem 0.75rem', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 600 }}>
                  🎵 {g}
                </span>
              ))}
              {tags.map((t: string) => (
                <span key={t} style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)', padding: '0.25rem 0.75rem', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 600 }}>
                  # {t}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Rich Text HTML Renderizado */}
        <div 
          className={styles.prose} 
          style={{ padding: 0, minHeight: 'auto', color: 'var(--color-text-primary)' }}
          dangerouslySetInnerHTML={{ __html: post.content }} 
        />

        <div style={{ marginTop: '4rem' }}>
          <AdBanner placementName="blog_horizontal" />
        </div>
      </div>
    </article>
  );
}
