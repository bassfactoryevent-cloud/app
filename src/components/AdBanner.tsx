import { createClient } from "@/utils/supabase/server";
import Image from "next/image";

interface AdBannerProps {
  placementName: string;
  className?: string;
}

export default async function AdBanner({ placementName, className = "" }: AdBannerProps) {
  const supabase = await createClient();

  // Buscar un banner activo para este placement
  const { data: ads } = await supabase
    .from("ads")
    .select(`
      id,
      image_url,
      target_url,
      ad_placements!inner(name),
      ad_campaigns!inner(is_active, start_date, end_date)
    `)
    .eq("is_active", true)
    .eq("ad_campaigns.is_active", true)
    .eq("ad_placements.name", placementName)
    .limit(1);

  if (!ads || ads.length === 0) return null;
  const ad = ads[0] as any;

  // If there's an end date, make sure campaign is still active date-wise
  if (ad.ad_campaigns.end_date) {
    if (new Date() > new Date(ad.ad_campaigns.end_date)) {
      return null;
    }
  }

  const content = (
    <div className={className} style={{ position: 'relative', width: '100%', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem', overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
      <img src={ad.image_url} alt="Ad Banner" style={{ width: '100%', height: 'auto', maxHeight: '250px', objectFit: 'contain' }} />
      <span style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '0.65rem', padding: '0.2rem 0.4rem', borderRadius: '0.25rem', textTransform: 'uppercase' }}>
        Ad
      </span>
    </div>
  );

  if (ad.target_url) {
    return (
      <a href={ad.target_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '100%' }}>
        {content}
      </a>
    );
  }

  return content;
}
