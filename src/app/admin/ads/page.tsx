import { createClient } from "@/utils/supabase/server";
import { Megaphone, PlusCircle, Building2, Calendar as CalendarIcon } from "lucide-react";
import Link from "next/link";
import { deleteCampaign } from "./actions";
import AdsDashboardClient from "./AdsDashboardClient";

export default async function AdminAdsPage() {
  try {
    const supabase = await createClient();

    const { data: campaigns } = await supabase
      .from("ad_campaigns")
      .select(`
        *,
        ads (count)
      `)
      .order("created_at", { ascending: false });

    // Fetch active ads for the placements overview
    const { data: activeAds } = await supabase
      .from("ads")
      .select(`
        id,
        ad_placements!inner(name),
        ad_campaigns!inner(name, is_active, end_date)
      `)
      .eq("is_active", true)
      .eq("ad_campaigns.is_active", true);

    // Filter out expired campaigns for the overview
    const validActiveAds: any[] = (activeAds || []).filter((ad: any) => {
      // Handle both object and array responses from Supabase joins
      const campaign = Array.isArray(ad?.ad_campaigns) ? ad.ad_campaigns[0] : ad?.ad_campaigns;
      if (campaign && campaign.end_date) {
        if (new Date() > new Date(campaign.end_date)) {
          return false;
        }
      }
      return true;
    });

    const { data: dbPlacements } = await supabase.from("ad_placements").select("id, name, is_vip");

    return <AdsDashboardClient campaigns={campaigns || []} validActiveAds={validActiveAds} dbPlacements={dbPlacements || []} />;
  } catch (error: any) {
    return (
      <div style={{ padding: '2rem', backgroundColor: 'rgba(255,0,0,0.1)', color: 'red', borderRadius: '1rem', border: '1px solid red' }}>
        <h2>Error Crítico en el Renderizado</h2>
        <p>{error.message}</p>
        <pre style={{ overflowX: 'auto', marginTop: '1rem', fontSize: '0.875rem' }}>{error.stack}</pre>
      </div>
    );
  }
}
