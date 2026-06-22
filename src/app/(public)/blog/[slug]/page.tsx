import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ArrowLeft } from "lucide-react";

export const revalidate = 60;

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const supabase = await createClient();
  const { data: post, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", params.slug)
    .eq("is_published", true)
    .single();

  if (error || !post) {
    notFound();
  }

  return (
    <article style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem var(--space-4)', width: '100%' }}>
      <Link 
        href="/blog" 
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'inherit', opacity: 0.7, textDecoration: 'none', marginBottom: '2rem', fontWeight: 500 }}
      >
        <ArrowLeft size={18} />
        Volver al Blog
      </Link>

      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: '1.5rem' }}>
          {post.title}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', opacity: 0.7, fontSize: '0.875rem' }}>
          <time dateTime={post.created_at}>
            {new Date(post.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
          </time>
          <span>•</span>
          <span>Redacción Bassfactory</span>
        </div>
      </header>

      {post.cover_image && (
        <div style={{ width: '100%', height: '400px', position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '3rem' }}>
          <Image 
            src={post.cover_image} 
            alt={post.title}
            fill
            style={{ objectFit: 'cover' }}
            priority
          />
        </div>
      )}

      {/* 
        Nota: Esto renderiza el contenido como texto plano o markdown muy básico. 
        En una iteración futura, aquí integraríamos 'react-markdown' o similar.
      */}
      <div 
        style={{ 
          fontSize: '1.125rem', 
          lineHeight: 1.8, 
          opacity: 0.9,
          whiteSpace: 'pre-wrap' // Permite saltos de línea básicos de un textarea
        }}
      >
        {post.content}
      </div>
    </article>
  );
}
