import { createClient } from "@/utils/supabase/server";
import { unstable_noStore as noStore } from "next/cache";
import AdBanner from "@/components/AdBanner";
import styles from "./Djs.module.css";
import DjsGridClient from "./DjsGridClient";

export const metadata = {
  title: "Artistas & DJs | Bassfactory",
  description: "Roster oficial y booking de Bassfactory.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PublicDjsPage() {
  noStore();
  const supabase = await createClient();

  const { data: djs } = await supabase
    .from("djs")
    .select("*")
    .eq("type", "colectivo")
    .order("name", { ascending: true });

  return (
    <div className={styles.djsContainer}>
      <DjsGridClient djs={djs || []} />

      <div className={styles.adWrap}>
        <AdBanner placementName="djs_banner" />
      </div>
    </div>
  );
}
