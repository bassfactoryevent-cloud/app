"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createMerchCategory(formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const description = formData.get("description") as string;

  const { error } = await supabase.from("merch_categories").insert([{ name, slug, description }]);

  if (error) {
    console.error("Error creating Merch Category:", error);
    throw new Error(error.message);
  }

  revalidatePath("/admin/merch/categories");
}

export async function deleteMerchCategory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("merch_categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/merch/categories");
}

export async function saveMerchProduct(formData: FormData) {
  const supabase = await createClient();
  
  const product_id = formData.get("product_id") as string | null;
  const title = formData.get("title") as string;
  const slug = formData.get("slug") as string;
  const description = formData.get("description") as string;
  const category_id = formData.get("category_id") as string || null;
  const base_price = parseFloat(formData.get("base_price") as string);
  const status = formData.get("status") as string || "draft";

  const productData = {
    title,
    slug,
    description,
    category_id,
    base_price,
    status,
    updated_at: new Date().toISOString()
  };

  let product: any;

  if (product_id) {
    const { data: updatedProduct, error } = await supabase.from("merch_products").update(productData).eq("id", product_id).select("id").single();
    if (error) throw new Error(error.message);
    product = updatedProduct;
    
    // Eliminar variantes e imágenes previas para reemplazarlas
    await supabase.from("merch_product_variants").delete().eq("product_id", product.id);
    await supabase.from("merch_product_images").delete().eq("product_id", product.id);
  } else {
    const { data: newProduct, error } = await supabase.from("merch_products").insert([productData]).select("id").single();
    if (error) throw new Error(error.message);
    product = newProduct;
  }

  // Insertar Variantes
  const variantsJson = formData.get("variants_json") as string;
  if (variantsJson && product) {
    try {
      const variants = JSON.parse(variantsJson);
      if (variants.length > 0) {
        const variantInserts = variants.map((v: any) => ({
          product_id: product.id,
          name: v.name,
          stock_quantity: parseInt(v.quantity, 10),
          price_override: v.price_override ? parseFloat(v.price_override) : null,
        }));
        await supabase.from("merch_product_variants").insert(variantInserts);
      }
    } catch (e) {
      console.error("Error parsing variants JSON", e);
    }
  }

  // Insertar Imágenes
  const imagesJson = formData.get("images_json") as string;
  if (imagesJson && product) {
    try {
      const images = JSON.parse(imagesJson);
      if (images.length > 0) {
        const imageInserts = images.map((img: string, idx: number) => ({
          product_id: product.id,
          image_url: img,
          sort_order: idx,
          is_primary: idx === 0
        }));
        await supabase.from("merch_product_images").insert(imageInserts);
      }
    } catch (e) {
      console.error("Error parsing images JSON", e);
    }
  }

  revalidatePath("/admin/merch");
  revalidatePath(`/merch/${slug}`);
  redirect("/admin/merch");
}
