import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/server";

export const revalidate = 60; // Revalidate every 60 seconds

export default async function BlogFeed() {
  const supabase = await createClient();
  
  // Fetch posts with their categories
  const { data: posts, error } = await supabase
    .from("posts")
    .select(`
      *,
      categories (
        name,
        slug
      )
    `)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching blog posts:", error);
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#050505', color: '#f5f5f5' }}>
      
      {/* Blog Hero Section */}
      <section style={{ padding: '8rem 2rem 4rem', textAlign: 'center', backgroundColor: '#0a0a0a', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 1rem 0' }}>
          Bassfactory <span style={{ color: 'var(--color-magenta)' }}>Journal</span>
        </h1>
        <p style={{ fontSize: '1.25rem', opacity: 0.7, maxWidth: '600px', margin: '0 auto' }}>
          Noticias, lanzamientos, cultura y la escena de la música electrónica en Bogotá y el mundo.
        </p>
      </section>

      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem' }}>
        
        {(!posts || posts.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.5 }}>
            <h2>Aún no hay artículos publicados.</h2>
            <p>Vuelve más tarde para descubrir nuevo contenido.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '3rem' }}>
            {posts.map((post) => (
              <Link 
                key={post.id} 
                href={`/blog/${post.slug}`}
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  textDecoration: 'none',
                  color: 'inherit',
                  group: 'article'
                }}
                className="blog-card"
              >
                <div style={{ position: 'relative', width: '100%', aspectRatio: '16/10', borderRadius: '12px', overflow: 'hidden', marginBottom: '1.5rem', backgroundColor: '#111' }}>
                  {post.cover_image ? (
                    <Image 
                      src={post.cover_image}
                      alt={post.title}
                      fill
                      style={{ objectFit: 'cover', transition: 'transform 0.5s ease' }}
                      className="blog-cover"
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
                      <span>Bassfactory</span>
                    </div>
                  )}
                  {/* Category Pill */}
                  {post.categories && (
                    <div style={{ position: 'absolute', top: '1rem', left: '1rem', backgroundColor: 'var(--color-magenta)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {post.categories.name}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.3 }}>
                    {post.title}
                  </h2>
                  <div style={{ opacity: 0.6, fontSize: '0.875rem' }}>
                    {new Date(post.created_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

      </section>

      {/* Basic hover effect via a style block */}
      <style>{`
        .blog-card:hover .blog-cover {
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
}
