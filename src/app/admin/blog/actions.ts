"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createCategory(formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;

  const { error } = await supabase.from("categories").insert([{ name, slug }]);

  if (error) {
    console.error("Error creating category:", error);
    throw new Error(error.message);
  }

  revalidatePath("/admin/blog/categories");
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  
  if (error) {
    console.error("Error deleting category:", error);
    throw new Error(error.message);
  }

  revalidatePath("/admin/blog/categories");
}

export async function createBlogPost(formData: FormData) {
  const supabase = await createClient();

  const title = formData.get("title") as string;
  const slug = formData.get("slug") as string;
  const content = formData.get("content") as string;
  const cover_image = formData.get("cover_image") as string;
  const category_id = formData.get("category_id") as string;
  const is_published = formData.get("is_published") === "on";
  const is_principal = formData.get("is_principal") === "on";
  
  const excerpt = formData.get("excerpt") as string;
  const meta_title = formData.get("meta_title") as string;
  const meta_description = formData.get("meta_description") as string;
  
  const genre_ids = formData.getAll("genres[]") as string[];
  const tag_ids = formData.getAll("tags[]") as string[];

  const post_id = formData.get("post_id") as string | null;

  const postData = {
    title,
    slug,
    content,
    cover_image: cover_image || null,
    category_id: category_id || null,
    is_published,
    is_principal,
    excerpt: excerpt || null,
    meta_title: meta_title || null,
    meta_description: meta_description || null,
  };

  if (is_principal) {
    let query = supabase.from("posts").select("id").eq("is_principal", true);
    if (post_id) {
      query = query.neq("id", post_id);
    }
    const { data: existingPrincipal } = await query.limit(1);
    if (existingPrincipal && existingPrincipal.length > 0) {
      throw new Error("Ya existe un artículo principal activo. Debes desactivarlo primero antes de marcar uno nuevo como principal.");
    }
  }

  let post: any;

  if (post_id) {
    const { data: updatedPost, error } = await supabase.from("posts").update(postData).eq("id", post_id).select("id").single();
    if (error) {
      console.error("Error updating post:", error);
      throw new Error(error.message);
    }
    post = updatedPost;
    await supabase.from("post_genres").delete().eq("post_id", post.id);
    await supabase.from("post_tags").delete().eq("post_id", post.id);
  } else {
    const { data: newPost, error } = await supabase.from("posts").insert([postData]).select("id").single();
    if (error) {
      console.error("Error creating post:", error);
      throw new Error(error.message);
    }
    post = newPost;
  }

  // Insert relations if any
  if (post && genre_ids.length > 0) {
    const genreInserts = genre_ids.map(genre_id => ({ post_id: post.id, genre_id }));
    await supabase.from("post_genres").insert(genreInserts);
  }

  if (post && tag_ids.length > 0) {
    const tagInserts = tag_ids.map(tag_id => ({ post_id: post.id, tag_id }));
    await supabase.from("post_tags").insert(tagInserts);
  }

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  redirect("/admin/blog");
}

export async function deleteBlogPost(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("posts").delete().eq("id", id);
  
  if (error) {
    console.error("Error deleting post:", error);
    throw new Error(error.message);
  }

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
}

export async function createGenre(formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;

  const { error } = await supabase.from("genres").insert([{ name, slug }]);

  if (error) {
    console.error("Error creating genre:", error);
    throw new Error(error.message);
  }

  revalidatePath("/admin/blog/genres");
}

export async function createTag(formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;

  const { error } = await supabase.from("tags").insert([{ name, slug }]);

  if (error) {
    console.error("Error creating tag:", error);
    throw new Error(error.message);
  }

  revalidatePath("/admin/blog/tags");
}
