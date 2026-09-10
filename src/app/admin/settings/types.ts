export interface PlatformSettingsData {
  company_name: string;
  company_nit: string;
  company_email: string;
  support_email: string;
  support_phone: string;
  address: string;
  invoice_prefix: string;
  shipping_cost: number;
  free_shipping_threshold: number;
  delivery_time_text: string;
  is_merch_enabled: boolean;
  ticket_activation_hours: number;
  transfer_limit_hours: number;
  max_tickets_per_order: number;
  is_tickets_enabled: boolean;
  social_instagram: string;
  social_tiktok: string;
  social_youtube: string;
  social_twitter: string;
  social_whatsapp: string;
  site_title: string;
  site_description: string;
  site_keywords: string;
}

export const defaultSettings: PlatformSettingsData = {
  company_name: "BASSFACTORY ENTERTAINMENT S.A.S.",
  company_nit: "901.654.321-0",
  company_email: "ventas@bassfactory.co",
  support_email: "soporte@bassfactory.co",
  support_phone: "+57 319 254 3690",
  address: "Bogotá D.C., Colombia",
  invoice_prefix: "BF-FAC",
  shipping_cost: 15000,
  free_shipping_threshold: 0,
  delivery_time_text: "3 a 5 días hábiles a nivel nacional",
  is_merch_enabled: true,
  ticket_activation_hours: 24,
  transfer_limit_hours: 48,
  max_tickets_per_order: 6,
  is_tickets_enabled: true,
  social_instagram: "https://instagram.com/bassfactory",
  social_tiktok: "https://tiktok.com/@bassfactory",
  social_youtube: "https://youtube.com/bassfactory",
  social_twitter: "https://twitter.com/bassfactory",
  social_whatsapp: "+573192543690",
  site_title: "Bassfactory | Plataforma Oficial de Música Electrónica, Eventos y Merch",
  site_description: "El ecosistema definitivo B2B y B2C para la cultura de la música electrónica en Colombia.",
  site_keywords: "Techno, Drum and Bass, Eventos Bogotá, Boletas, Raves Colombia, Merch Oficial"
};
