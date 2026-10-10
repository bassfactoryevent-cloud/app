"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;

    // Do not track internal admin panel or API paths
    if (pathname.startsWith("/admin") || pathname.startsWith("/api") || pathname.startsWith("/_next")) {
      return;
    }

    // Prevent duplicate firing on same URL
    const fullUrl = `${pathname}?${searchParams.toString()}`;
    if (lastTracked.current === fullUrl) return;
    lastTracked.current = fullUrl;

    // Get or initialize persistent session ID (resets after closing browser session)
    let sessionId = "";
    try {
      sessionId = sessionStorage.getItem("bf_session_id") || "";
      if (!sessionId) {
        sessionId = `bf_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`;
        sessionStorage.setItem("bf_session_id", sessionId);
      }
    } catch {
      sessionId = `anon_${Date.now()}`;
    }

    const payload = {
      pathname,
      referrer: typeof document !== "undefined" ? document.referrer : "",
      sessionId,
      utmSource: searchParams.get("utm_source") || null,
      utmMedium: searchParams.get("utm_medium") || null,
      utmCampaign: searchParams.get("utm_campaign") || null,
    };

    // Send asynchronously without blocking main thread
    try {
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
        navigator.sendBeacon("/api/analytics/track", blob);
      } else {
        fetch("/api/analytics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // Fail silently to never impact user experience
    }
  }, [pathname, searchParams]);

  return null;
}
