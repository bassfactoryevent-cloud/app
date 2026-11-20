import { cache } from "react";
import { createClient } from "@/utils/supabase/server";
import AdSliderClient from "./AdSliderClient";
import AdSingleClient from "./AdSingleClient";

import styles from "./AdBanner.module.css";

interface AdBannerProps {
  placementName: string;
  className?: string;
}

const getAdsForPlacement = cache(async (placementName: string) => {
  const supabase = await createClient();

  const { data: adsRaw } = await supabase
    .from("ads")
    .select(`
      id,
      image_url,
      target_url,
      ad_placements!inner(name, is_vip, is_active),
      ad_campaigns!inner(is_active, start_date, end_date)
    `)
    .eq("is_active", true)
    .eq("ad_campaigns.is_active", true)
    .eq("ad_placements.is_active", true)
    .eq("ad_placements.name", placementName)
    .order("order_index", { ascending: true });

  return adsRaw || [];
});

export default async function AdBanner({ placementName, className = "" }: AdBannerProps) {
  const adsRaw = await getAdsForPlacement(placementName);

  if (!adsRaw || adsRaw.length === 0) return null;

  const firstPlacement = Array.isArray((adsRaw[0] as any)?.ad_placements)
    ? (adsRaw[0] as any).ad_placements[0]
    : (adsRaw[0] as any)?.ad_placements;

  if (firstPlacement && firstPlacement.is_active === false) {
    return null;
  }

  const isVip = Boolean(firstPlacement?.is_vip);

  // Filter out any where the campaign end_date is in the past
  const now = new Date();
  const validAds = adsRaw.filter((ad: any) => {
    const campaign = Array.isArray(ad.ad_campaigns) ? ad.ad_campaigns[0] : ad.ad_campaigns;
    if (campaign?.end_date) {
      if (now > new Date(campaign.end_date)) {
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
