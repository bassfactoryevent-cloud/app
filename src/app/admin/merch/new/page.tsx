import { createClient } from "@/utils/supabase/server";
import MerchFormClient from "./MerchFormClient";

export default async function NewMerchPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase.from("merch_categories").select("*").order("name");

  return (
    <div>
      <MerchFormClient categories={categories || []} />
    </div>
  );
}
