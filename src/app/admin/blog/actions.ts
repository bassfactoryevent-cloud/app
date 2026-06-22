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

  const { data, error } = await supabase.from("posts").insert([
    {
      title,
      slug,
      content,
      cover_image: cover_image || null,
      category_id: category_id || null,
      is_published,
    },
  ]);

  if (error) {
    console.error("Error creating post:", error);
    throw new Error(error.message);
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
