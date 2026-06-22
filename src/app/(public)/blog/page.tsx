import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/server";

export const revalidate = 60; // Revalidate every 60 seconds

export default async function BlogFeed() {
  const supabase = await createClient();
  const { data: posts, error } = await supabase
    .from("posts")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem var(--space-4)', width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.02em' }}>
          Cultura & Noticias
        </h1>
        <p style={{ fontSize: '1.125rem', opacity: 0.7, maxWidth: '600px', margin: '0 auto' }}>
          Descubre las últimas tendencias, entrevistas exclusivas y todo lo que sucede en la escena de la música electrónica.
        </p>
      </div>

      {error && <div style={{ color: 'red' }}>Error cargando artículos: {error.message}</div>}

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
        gap: '2rem' 
      }}>
        {!posts || posts.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', opacity: 0.5 }}>
            No hay artículos publicados en este momento. Vuelve más tarde.
          </div>
        ) : (
          posts.map((post) => (
            <Link 
              href={`/blog/${post.slug}`} 
              key={post.id}
              style={{ 
                textDecoration: 'none', 
                color: 'inherit',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.05)',
                transition: 'transform 0.2s ease, border-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'var(--color-magenta)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
              }}
            >
              <div style={{ width: '100%', height: '200px', position: 'relative', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                {post.cover_image ? (
                  <Image 
                    src={post.cover_image} 
                    alt={post.title}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.3 }}>
                    Sin Imagen
                  </div>
                )}
              </div>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1.3 }}>
                  {post.title}
                </h2>
                <p style={{ opacity: 0.7, fontSize: '0.875rem', marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {post.content.substring(0, 150)}...
                </p>
                <div style={{ marginTop: 'auto', fontSize: '0.75rem', opacity: 0.5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {new Date(post.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
