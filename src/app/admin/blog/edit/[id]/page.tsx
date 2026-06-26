import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import BlogEditorClient from "../../new/BlogEditorClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select(`
      *,
      post_genres(genre_id),
      post_tags(tag_id)
    `)
    .eq("id", (await params).id)
    .single();

  if (!post) {
    notFound();
  }

  const { data: categories } = await supabase.from("categories").select("*").order("name");
  const { data: genres } = await supabase.from("genres").select("*").order("name");
  const { data: tags } = await supabase.from("tags").select("*").order("name");

  // Map relations into arrays of IDs for the initial state
  const initialData = {
    ...post,
    genres: post.post_genres?.map((pg: any) => pg.genre_id) || [],
    tags: post.post_tags?.map((pt: any) => pt.tag_id) || []
  };

  return (
    <div style={{ maxWidth: '1000px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link 
          href="/admin/blog"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white' }}
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Editar Artículo</h1>
          <p style={{ opacity: 0.7, marginTop: '0.25rem' }}>Actualiza el contenido de tu publicación.</p>
        </div>
      </div>

      <BlogEditorClient 
        categories={categories || []} 
        genres={genres || []}
        tags={tags || []}
        initialData={initialData}
        action={async (formData) => {
          "use server";
          const { createBlogPost } = await import("../../actions");
          formData.append("post_id", (await params).id);
          await createBlogPost(formData);
        }} 
      />
    </div>
  );
}
