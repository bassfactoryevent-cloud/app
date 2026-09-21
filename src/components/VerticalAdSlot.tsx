import { createClient } from "@/utils/supabase/server";
import AdBanner from "./AdBanner";
import { Sparkles, Megaphone } from "lucide-react";

import styles from "./VerticalAdSlot.module.css";

interface VerticalAdSlotProps {
  placementName: string;
  label?: string;
  className?: string;
}

export default async function VerticalAdSlot({ placementName, label = "Pauta Publicitaria", className = "" }: VerticalAdSlotProps) {
  const supabase = await createClient();

  // Check if placement is active and has valid ads
  const { data: ads } = await supabase
    .from("ads")
    .select(`
      id,
      ad_placements!inner(name, is_active),
      ad_campaigns!inner(is_active, end_date)
    `)
    .eq("is_active", true)
    .eq("ad_campaigns.is_active", true)
    .eq("ad_placements.name", placementName)
    .eq("ad_placements.is_active", true)
    .limit(1);

  const firstAd = ads?.[0] as any;
  const campaign = Array.isArray(firstAd?.ad_campaigns) ? firstAd.ad_campaigns[0] : firstAd?.ad_campaigns;
  const hasActiveAd = ads && ads.length > 0 && (!campaign?.end_date || new Date() <= new Date(campaign.end_date));

  if (hasActiveAd) {
    return (
      <div className={`${styles.slotContainer} ${className}`}>
        <AdBanner placementName={placementName} />
      </div>
    );
  }

  // Elegant fallback placeholder that encourages brand sponsorship
  return (
    <div className={`${styles.fallbackContainer} ${className}`}>
      <div className={styles.iconWrap}>
        <Megaphone size={20} />
      </div>

      <div className={styles.contentGroup}>
        <span className={styles.eyebrow}>
          Espacio Publicitario
        </span>

        <h4 className={styles.title}>
          {label}
        </h4>

        <p className={styles.desc}>
          Destaca tu festival, marca o lanzamiento frente a miles de ravers en Colombia.
        </p>
      </div>

      <a 
        href="https://wa.me/573192543690?text=Hola,%20me%20gustar%C3%ADa%20pautar%20en%20Bassfactory" 
        target="_blank" 
        rel="noopener noreferrer" 
        className={styles.ctaBtn}
      >
        <Sparkles size={13} style={{ color: 'var(--color-magenta)' }} />
        Pautar Aquí
      </a>
    </div>
  );
}
