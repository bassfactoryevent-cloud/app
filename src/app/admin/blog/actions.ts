"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createBlogPost(formData: FormData) {
  const supabase = await createClient();

  const title = formData.get("title") as string;
  const slug = formData.get("slug") as string;
  const content = formData.get("content") as string;
  const cover_image = formData.get("cover_image") as string;
  const is_published = formData.get("is_published") === "on";

  // En producción, el autor debe ser el usuario autenticado:
  // const { data: { user } } = await supabase.auth.getUser()
  // if (!user) throw new Error("Unauthorized")

  const { data, error } = await supabase.from("posts").insert([
    {
      title,
      slug,
      content,
      cover_image,
      is_published,
      // author_id: user.id (Omitido temporalmente por la migración dev)
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
