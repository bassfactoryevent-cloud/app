import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

// Map country codes to friendly names
const COUNTRY_MAP: Record<string, string> = {
  CO: "Colombia",
  US: "Estados Unidos",
  MX: "México",
  ES: "España",
  AR: "Argentina",
  CL: "Chile",
  PE: "Perú",
  EC: "Ecuador",
  PA: "Panamá",
  CR: "Costa Rica",
  VE: "Venezuela",
  BR: "Brasil",
  GB: "Reino Unido",
  DE: "Alemania",
  FR: "Francia",
};

// Clean city names (handling percent encoding if present)
function cleanCity(rawCity?: string | null): string {
  if (!rawCity) return "Bogotá";
  try {
    const decoded = decodeURIComponent(rawCity);
    if (decoded.toLowerCase() === "bogota") return "Bogotá";
    if (decoded.toLowerCase() === "medellin") return "Medellín";
    return decoded;
  } catch {
    return rawCity;
  }
}

// Detect device, OS and Browser from User Agent
function parseUserAgent(ua: string) {
  let device_type = "desktop";
  let os = "other";
  let browser = "other";

  const lowerUa = ua.toLowerCase();

  // Device
  if (/ipad|tablet|(android(?!.*mobile))/i.test(lowerUa)) {
    device_type = "tablet";
  } else if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(lowerUa)) {
    device_type = "mobile";
  }

  // OS
  if (/iphone|ipad|ipod/i.test(lowerUa)) {
    os = "iOS";
  } else if (/android/i.test(lowerUa)) {
    os = "Android";
  } else if (/macintosh|mac os x/i.test(lowerUa)) {
    os = "macOS";
  } else if (/windows/i.test(lowerUa)) {
    os = "Windows";
  } else if (/linux/i.test(lowerUa)) {
    os = "Linux";
  }

  // Browser (detect in-app webviews too)
  if (/instagram/i.test(lowerUa)) {
    browser = "Instagram App";
  } else if (/tiktok|bytedance/i.test(lowerUa)) {
    browser = "TikTok App";
  } else if (/fbav|fban|facebook/i.test(lowerUa)) {
    browser = "Facebook App";
  } else if (/edg/i.test(lowerUa)) {
    browser = "Edge";
  } else if (/chrome|crios/i.test(lowerUa)) {
    browser = "Chrome";
  } else if (/safari/i.test(lowerUa) && !/chrome|crios/i.test(lowerUa)) {
    browser = "Safari";
  } else if (/firefox|fxios/i.test(lowerUa)) {
    browser = "Firefox";
  }

  return { device_type, os, browser };
}

// Detect traffic source from referrer and query params
function detectSource(referrer?: string, utmSource?: string | null): string {
  if (utmSource && utmSource.trim()) {
    return utmSource.trim().toLowerCase();
  }

  if (!referrer || referrer.trim() === "") {
    return "direct";
  }

  const lowerRef = referrer.toLowerCase();

  if (lowerRef.includes("instagram.com") || lowerRef.includes("l.instagram.com")) {
    return "instagram";
  }
  if (lowerRef.includes("tiktok.com")) {
    return "tiktok";
  }
  if (lowerRef.includes("facebook.com") || lowerRef.includes("l.facebook.com") || lowerRef.includes("fb.me")) {
    return "facebook";
  }
  if (lowerRef.includes("google.com") || lowerRef.includes("google.")) {
    return "google";
  }
  if (lowerRef.includes("whatsapp.com") || lowerRef.includes("wa.me")) {
    return "whatsapp";
  }
  if (lowerRef.includes("t.co") || lowerRef.includes("twitter.com") || lowerRef.includes("x.com")) {
    return "x";
  }
  if (lowerRef.includes("youtube.com")) {
    return "youtube";
  }
  if (lowerRef.includes("bassfactory.co") || lowerRef.includes("localhost")) {
    return "internal";
  }

  try {
    const url = new URL(referrer);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return "referral";
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { pathname, referrer, sessionId, utmSource, utmMedium, utmCampaign } = body;

    // Ignore admin panel or API visits from polluting analytics
    if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/api") || pathname.startsWith("/_next")) {
      return NextResponse.json({ ignored: true });
    }

    // Geolocation headers provided automatically by Vercel Edge Network
    const countryCode = (req.headers.get("x-vercel-ip-country") || "CO").toUpperCase();
    const rawCity = req.headers.get("x-vercel-ip-city");
    const region = req.headers.get("x-vercel-ip-country-region") || null;
    const countryName = COUNTRY_MAP[countryCode] || countryCode;
    const city = cleanCity(rawCity);

    // User agent parsing
    const userAgent = req.headers.get("user-agent") || "";
    const { device_type, os, browser } = parseUserAgent(userAgent);

    // Source detection
    const source = detectSource(referrer, utmSource);

    // Insert into Supabase page_views via Admin Client
    const adminDb = getAdminClient();
    const { error } = await adminDb.from("page_views").insert([
      {
        pathname,
        referrer: referrer || null,
        source: source === "internal" ? "direct" : source,
        country: countryName,
        country_code: countryCode,
        city,
        region,
        device_type,
        browser,
        os,
        session_id: sessionId || null,
        utm_source: utmSource || null,
        utm_medium: utmMedium || null,
        utm_campaign: utmCampaign || null,
      },
    ]);

    if (error) {
      console.error("Error inserting pageview:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error in analytics track API:", err);
    return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500 });
  }
}
