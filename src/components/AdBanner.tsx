import { createClient } from "@/utils/supabase/server";
import AdSliderClient from "./AdSliderClient";
import AdSingleClient from "./AdSingleClient";

import styles from "./AdBanner.module.css";

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

  // Si no es VIP o solo hay 1 banner activo, renderizamos con AdSingleClient que previene imágenes rotas
  const ad = validAds[0];
  const isVideo = ad.image_url.toLowerCase().endsWith('.mp4') || ad.image_url.toLowerCase().endsWith('.webm');

  // Determine if it's thin or vertical placement
  const isThin = placementName.includes("thin");
  const isVertical = placementName.includes("vertical") || placementName.includes("skyscraper");
  const heightClass = isThin ? styles.thin : isVertical ? styles.vertical : styles.standard;
  const fitClass = isThin ? styles.autoHeight : isVertical ? styles.cover : styles.contain;

  return (
    <AdSingleClient
      ad={ad}
      heightClass={heightClass}
      fitClass={fitClass}
      className={className}
      isVideo={isVideo}
    />
  );
}
