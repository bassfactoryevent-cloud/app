import AdBanner from "./AdBanner";

interface VerticalAdSlotProps {
  placementName: string;
  label?: string;
  className?: string;
}

export default async function VerticalAdSlot({ placementName, className = "" }: VerticalAdSlotProps) {
  // Renders the banner if active, or returns null (hides cleanly) if there is no active ad
  return <AdBanner placementName={placementName} className={className} />;
}
