import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { PlusCircle, Edit, Trash2 } from "lucide-react";

export default async function AdminBlogList() {
  let posts: any[] | null = [];
  let errorMsg = null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });
    
    posts = data;
    if (error) errorMsg = error.message;
  } catch (err: any) {
    errorMsg = `System Error: ${err.message} | URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? "Exists" : "Missing"} | KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Exists" : "Missing"}`;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Gestión de Blog</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link 
            href="/admin/blog/categories" 
            style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', textDecoration: 'none', color: 'inherit' }}
          >
            Categorías
          </Link>
          <Link 
            href="/admin/blog/genres" 
            style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', textDecoration: 'none', color: 'inherit' }}
          >
            Géneros
          </Link>
          <Link 
            href="/admin/blog/tags" 
            style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', textDecoration: 'none', color: 'inherit' }}
          >
            Etiquetas
          </Link>
          <Link 
            href="/admin/blog/new" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              backgroundColor: 'var(--color-magenta)', 
              color: 'white', 
              padding: '0.5rem 1rem', 
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              fontWeight: 500
            }}
          >
            <PlusCircle size={18} />
            Nuevo Artículo
          </Link>
        </div>
      </div>

      {errorMsg && (
        <div style={{ backgroundColor: 'rgba(255,0,0,0.1)', color: 'red', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
          <strong>Error cargando artículos:</strong> {errorMsg}
        </div>
      )}

      <div style={{ backgroundColor: 'var(--color-white)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(128,128,128,0.2)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: 'rgba(128,128,128,0.05)', borderBottom: '1px solid rgba(128,128,128,0.2)' }}>
            <tr>
              <th style={{ padding: '1rem' }}>Título</th>
              <th style={{ padding: '1rem' }}>Estado</th>
              <th style={{ padding: '1rem' }}>Fecha de Creación</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {!posts || posts.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>
                  No hay artículos todavía. Crea el primero.
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr key={post.id} style={{ borderBottom: '1px solid rgba(128,128,128,0.1)' }}>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{post.title}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '99px', 
                      fontSize: '0.75rem',
                      backgroundColor: post.is_published ? 'rgba(0,200,100,0.1)' : 'rgba(128,128,128,0.1)',
                      color: post.is_published ? '#00A050' : 'inherit'
                    }}>
                      {post.is_published ? "Publicado" : "Borrador"}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', opacity: 0.7 }}>
                    {new Date(post.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <Link href={`/admin/blog/edit/${post.id}`} style={{ color: 'inherit', opacity: 0.7 }}>
                      <Edit size={18} />
                    </Link>
                    {/* Delete functionality will be added later or as a Server Action */}
                    <button style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', opacity: 0.7 }}>
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
