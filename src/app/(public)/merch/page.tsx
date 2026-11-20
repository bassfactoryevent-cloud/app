import { Suspense } from "react";
import { createClient } from "@/utils/supabase/server";
import { ShieldCheck, Truck, CreditCard } from "lucide-react";
import styles from "./Merch.module.css";
import MerchStoreClient from "./MerchStoreClient";

export const metadata = {
  title: "Merch Oficial | Bassfactory",
  description: "Prendas y accesorios oficiales Bassfactory.",
};

export const dynamic = "force-dynamic";

export default async function MerchStorefront() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("merch_products")
    .select(`
      *,
      merch_categories(name),
      merch_product_images(image_url, is_primary, sort_order)
    `)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  products?.forEach((p) => {
    if (p.merch_product_images) {
      p.merch_product_images.sort((a: any, b: any) => a.sort_order - b.sort_order);
    }
  });

  return (
    <div className={styles.merchContainer}>
      <header className={styles.heroSection}>
        <div>
          <h1 className={styles.heroTitle}>Merch Oficial</h1>
          <p className={styles.heroSubtitle}>
            Prendas, accesorios y drops oficiales Bassfactory.
          </p>
        </div>

        <div className={styles.guaranteesBar}>
          <div className={styles.guaranteeItem}>
            <ShieldCheck size={14} className={styles.guaranteeIcon} />
            <span>Edición oficial</span>
          </div>
          <div className={styles.guaranteeItem}>
            <Truck size={14} className={styles.guaranteeIcon} />
            <span>Envíos a todo el país</span>
          </div>
          <div className={styles.guaranteeItem}>
            <CreditCard size={14} className={styles.guaranteeIcon} />
            <span>Pagos con Bold</span>
          </div>
        </div>
      </header>

      <Suspense fallback={null}>
        <MerchStoreClient products={products || []} />
      </Suspense>
    </div>
  );
}
