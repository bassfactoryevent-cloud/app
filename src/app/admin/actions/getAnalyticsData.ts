"use server";

import { getAdminClient } from "@/utils/supabase/admin";

export interface PageViewItem {
  id: string;
  created_at: string;
  pathname: string;
  referrer: string | null;
  source: string;
  country: string;
  country_code: string;
  city: string;
  region: string | null;
  device_type: string;
  browser: string;
  os: string;
  session_id: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
}

export async function getLiveAnalyticsPageviews(): Promise<PageViewItem[]> {
  try {
    const adminDb = getAdminClient();
    const { data, error } = await adminDb
      .from("page_views")
      .select("id, created_at, pathname, referrer, source, country, country_code, city, region, device_type, browser, os, session_id, utm_source, utm_medium, utm_campaign")
      .order("created_at", { ascending: false })
      .limit(3000);

    if (error) {
      console.error("Error fetching live pageviews:", error);
      return [];
    }

    return (data as PageViewItem[]) || [];
  } catch (err) {
    console.error("Unexpected error fetching pageviews:", err);
    return [];
  }
}
