import { createClient } from "@/utils/supabase/server";
import AdBanner from "./AdBanner";
import { Sparkles, Megaphone } from "lucide-react";

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
      <div className={className} style={{ position: 'sticky', top: '6rem', width: '100%' }}>
        <AdBanner placementName={placementName} />
      </div>
    );
  }

  // Elegant fallback placeholder that encourages brand sponsorship
  return (
    <div 
      className={className} 
      style={{ 
        position: 'sticky', 
        top: '6rem', 
        width: '100%', 
        minHeight: '480px', 
        backgroundColor: 'rgba(255,255,255,0.02)', 
        border: '1px dashed rgba(255,255,255,0.1)', 
        borderRadius: '1rem', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '2rem 1.25rem', 
        textAlign: 'center',
        backdropFilter: 'blur(8px)',
        transition: 'all 0.3s ease'
      }}
    >
      <div style={{ 
        width: '44px', 
        height: '44px', 
        borderRadius: '50%', 
        backgroundColor: 'rgba(229, 9, 20, 0.1)', 
        border: '1px solid rgba(229, 9, 20, 0.25)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        color: 'var(--color-magenta)',
        marginBottom: '1rem'
      }}>
        <Megaphone size={20} />
      </div>

      <span style={{ 
        fontSize: '0.7rem', 
        textTransform: 'uppercase', 
        letterSpacing: '0.1em', 
        color: 'rgba(255,255,255,0.4)', 
        fontWeight: 700 
      }}>
        Espacio Publicitario
      </span>

      <h4 style={{ 
        fontSize: '1rem', 
        fontWeight: 800, 
        color: 'white', 
        margin: '0.5rem 0',
        lineHeight: 1.2 
      }}>
        {label}
      </h4>

      <p style={{ 
        fontSize: '0.75rem', 
        color: 'rgba(255,255,255,0.5)', 
        lineHeight: 1.5, 
        marginBottom: '1.5rem',
        maxWidth: '180px'
      }}>
        Destaca tu festival, marca o lanzamiento frente a miles de ravers en Colombia.
      </p>

      <a 
        href="https://wa.me/573192543690?text=Hola,%20me%20gustar%C3%ADa%20pautar%20en%20Bassfactory" 
        target="_blank" 
        rel="noopener noreferrer" 
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.75rem',
          fontWeight: 700,
          color: 'white',
          backgroundColor: 'rgba(229, 9, 20, 0.15)',
          border: '1px solid rgba(229, 9, 20, 0.35)',
          padding: '0.6rem 1rem',
          borderRadius: '0.5rem',
          textDecoration: 'none',
          transition: 'all 0.2s ease'
        }}
      >
        <Sparkles size={13} style={{ color: 'var(--color-magenta)' }} />
        Pautar Aquí
      </a>
    </div>
  );
}
