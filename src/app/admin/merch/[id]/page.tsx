import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import MerchFormClient from "../new/MerchFormClient";

export default async function EditMerchPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("merch_products")
    .select(`
      *,
      merch_product_variants(*),
      merch_product_images(*)
    `)
    .eq("id", (await params).id)
    .single();

  if (!product) {
    notFound();
  }

  // Ordenar imágenes por sort_order
  if (product.merch_product_images) {
    product.merch_product_images.sort((a: any, b: any) => a.sort_order - b.sort_order);
  }

  const { data: categories } = await supabase.from("merch_categories").select("*").order("name");

  return (
    <div>
      <MerchFormClient categories={categories || []} initialData={product} />
    </div>
  );
}
