import { createClient } from "@/utils/supabase/server";
import AdSliderClient from "./AdSliderClient";

interface AdBannerProps {
  placementName: string;
  className?: string;
}

export default async function AdBanner({ placementName, className = "" }: AdBannerProps) {
  const supabase = await createClient();

  // Check if placement is VIP and active
  const { data: placement } = await supabase.from("ad_placements").select("is_vip, is_active").eq("name", placementName).single();
  
  if (placement && placement.is_active === false) {
    return null; // The placement has been globally turned off
  }

  const isVip = placement?.is_vip;

  // Buscar banners activos para este placement
  let query = supabase
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
    .order("order_index", { ascending: true });
    
  // Si no es VIP, limitamos a 1
  if (!isVip) {
    query = query.limit(1);
  }

  const { data: adsRaw } = await query;

  if (!adsRaw || adsRaw.length === 0) return null;

  // Filter out any where the campaign end_date is in the past
  const validAds = adsRaw.filter((ad: any) => {
    if (ad.ad_campaigns.end_date) {
      if (new Date() > new Date(ad.ad_campaigns.end_date)) {
        return false;
      }
    }
    return true;
  });

  if (validAds.length === 0) return null;

  // Si es VIP, delegamos en el componente cliente (Slider)
  if (isVip && validAds.length > 1) {
    return <AdSliderClient ads={validAds} className={className} intervalSecs={7} placementName={placementName} />;
  }

  // Si no es VIP o solo hay 1 banner activo, renderizamos estático como antes
  const ad = validAds[0];
  const isVideo = ad.image_url.toLowerCase().endsWith('.mp4') || ad.image_url.toLowerCase().endsWith('.webm');

  // Determine if it's the thin placement
  const isThin = placementName.includes("thin");
  const containerHeight = isThin ? 'auto' : '250px';

  const content = (
    <div className={className} style={{ position: 'relative', width: '100%', height: containerHeight, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem', overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
      {isVideo ? (
        <video src={ad.image_url} autoPlay loop muted playsInline style={{ width: '100%', height: isThin ? 'auto' : '100%', objectFit: 'contain', display: 'block' }} />
      ) : (
        <img src={ad.image_url} alt="Ad Banner" style={{ width: '100%', height: isThin ? 'auto' : '100%', objectFit: 'contain', display: 'block' }} />
      )}
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
