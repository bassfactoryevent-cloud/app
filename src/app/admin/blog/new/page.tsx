import { createBlogPost } from "../actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import BlogEditorClient from "./BlogEditorClient";

export default async function NewBlogPost() {
  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("*").order("name");

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
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Nuevo Artículo Premium</h1>
          <p style={{ opacity: 0.7, marginTop: '0.25rem' }}>Escribe, sube imágenes y publica contenido espectacular.</p>
        </div>
      </div>

      <BlogEditorClient categories={categories || []} action={createBlogPost} />
    </div>
  );
}
