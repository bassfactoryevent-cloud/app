import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/server";
import BlogFilters from "./BlogFilters";

export const revalidate = 60; // Revalidate every 60 seconds

export default async function BlogFeed({ searchParams }: { searchParams: Promise<{ q?: string, category?: string }> }) {
  const supabase = await createClient();
  const resolvedSearchParams = await searchParams;
  
  const q = resolvedSearchParams.q || "";
  const category = resolvedSearchParams.category || "";

  // Fetch categories for filters
  const { data: categories } = await supabase.from("categories").select("*").order("name");
  
  // Build query for posts
  let query = supabase
    .from("posts")
    .select(`
      *,
      categories!inner (
        name,
        slug
      )
    `)
    .eq("is_published", true);

  if (category) {
    query = query.eq("categories.slug", category);
  }
  if (q) {
    query = query.ilike("title", `%${q}%`);
  }

  const { data: allPosts, error } = await query.order("created_at", { ascending: false });


  if (error) {
    console.error("Error fetching blog posts:", error);
  }

  const principalPost = (!q && !category) ? allPosts?.find(post => post?.is_principal) : null;
  const posts = allPosts?.filter(post => post.id !== principalPost?.id) || [];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#050505', color: '#f5f5f5' }}>
      
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '6rem 2rem 2rem' }}>
        <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 0.5rem 0' }}>
          Noticias, <span style={{ color: 'var(--color-magenta)' }}>Cultura</span>
        </h1>
        <p style={{ fontSize: '1.25rem', opacity: 0.7, maxWidth: '600px', margin: '0 0 2rem 0' }}>
          Noticias, lanzamientos, cultura y la escena de la música electrónica en el Eje Cafetero y el mundo.
        </p>
      </section>

      {/* Blog Hero Section (Only shown if no filters are active) */}
      <section style={{ padding: '0 2rem 4rem' }}>
        {principalPost ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', width: '100%', maxWidth: '1200px', margin: '0 auto', backgroundColor: '#0a0a0a', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
            {/* Left: Image */}
            <div style={{ flex: '1 1 50%', minWidth: '320px', minHeight: '400px', position: 'relative', backgroundColor: '#111' }}>
              {principalPost.cover_image && (
                <Image 
                  src={principalPost.cover_image}
                  alt={principalPost.title}
                  fill
                  style={{ objectFit: 'cover' }}
                  priority
                />
              )}
            </div>
            {/* Right: Content */}
            <div style={{ flex: '1 1 50%', minWidth: '320px', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4rem 3rem' }}>
              <div style={{ maxWidth: '600px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'flex-start' }}>
                <span style={{ backgroundColor: 'var(--color-magenta)', color: 'white', padding: '0.25rem 1rem', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Noticias, Cultura
                </span>
                <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1, margin: 0 }}>
                  {principalPost.title}
                </h1>
                <p style={{ fontSize: '1.125rem', opacity: 0.8, lineHeight: 1.5, margin: 0 }}>
                  {principalPost.excerpt || (principalPost.content?.replace(/<[^>]+>/g, '').substring(0, 140) + '...')}
                </p>
                <div style={{ marginTop: '1rem' }}>
                  <Link href={`/blog/${principalPost.slug}`} style={{ display: 'inline-block', backgroundColor: 'white', color: 'black', padding: '0.875rem 2rem', borderRadius: '100px', fontWeight: 700, textDecoration: 'none', transition: 'opacity 0.2s' }}>
                    Seguir leyendo
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 2rem 0' }}>
        <BlogFilters categories={categories || []} />
      </section>

      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        
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
                  {post.excerpt && (
                    <p style={{ fontSize: '1rem', opacity: 0.8, margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {post.excerpt}
                    </p>
                  )}
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
