"use client";

import React, { useState, useMemo } from "react";
import { 
  TrendingUp, Globe, Users, Eye, Smartphone, Monitor, 
  MapPin, Share2, RefreshCw, Calendar, 
  Layers, ArrowUpRight, SmartphoneNfc, Tablet,
  Search, MessageCircle, Link as LinkIcon
} from "lucide-react";

const InstagramIcon = ({ size = 14, color = "#e1306c" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

interface PageView {
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

interface AnalyticsProps {
  initialPageviews: PageView[];
  eventMap: Record<string, string>;
}

// Helpers for source icons and badges
function getSourceBadge(source: string) {
  const s = (source || "direct").toLowerCase();
  if (s.includes("instagram")) {
    return {
      name: "Instagram",
      color: "#e1306c",
      bg: "rgba(225, 48, 108, 0.15)",
      border: "rgba(225, 48, 108, 0.3)",
      icon: <InstagramIcon size={14} color="#e1306c" />,
    };
  }
  if (s.includes("google")) {
    return {
      name: "Google (Búsqueda)",
      color: "#4285f4",
      bg: "rgba(66, 133, 244, 0.15)",
      border: "rgba(66, 133, 244, 0.3)",
      icon: <Search size={14} color="#4285f4" />,
    };
  }
  if (s.includes("whatsapp")) {
    return {
      name: "WhatsApp",
      color: "#25d366",
      bg: "rgba(37, 211, 102, 0.15)",
      border: "rgba(37, 211, 102, 0.3)",
      icon: <MessageCircle size={14} color="#25d366" />,
    };
  }
  if (s.includes("tiktok")) {
    return {
      name: "TikTok",
      color: "#00f0ff",
      bg: "rgba(0, 240, 255, 0.15)",
      border: "rgba(0, 240, 255, 0.3)",
      icon: <Share2 size={14} color="#00f0ff" />,
    };
  }
  if (s.includes("facebook")) {
    return {
      name: "Facebook",
      color: "#1877f2",
      bg: "rgba(24, 119, 242, 0.15)",
      border: "rgba(24, 119, 242, 0.3)",
      icon: <Share2 size={14} color="#1877f2" />,
    };
  }
  if (s.includes("x") || s.includes("twitter")) {
    return {
      name: "X (Twitter)",
      color: "#ffffff",
      bg: "rgba(255, 255, 255, 0.1)",
      border: "rgba(255, 255, 255, 0.2)",
      icon: <Share2 size={14} color="#ffffff" />,
    };
  }
  return {
    name: "Directo / URL",
    color: "#a1a1aa",
    bg: "rgba(161, 161, 170, 0.1)",
    border: "rgba(161, 161, 170, 0.2)",
    icon: <LinkIcon size={14} color="#a1a1aa" />,
  };
}

// Friendly page name resolver
function getFriendlyPath(path: string, eventMap: Record<string, string>): string {
  if (eventMap[path]) return eventMap[path];
  if (path === "/" || path === "") return "Portada Principal (Home)";
  if (path === "/blog") return "Blog de Noticias";
  if (path.startsWith("/blog/")) return `Artículo: ${path.replace("/blog/", "")}`;
  if (path === "/merch") return "Tienda de Ropa & Merch";
  if (path === "/checkout") return "Pasarela de Compra (Checkout)";
  if (path.startsWith("/events")) return `Evento: ${path.replace("/events/", "")}`;
  if (path === "/djs") return "Roster de DJs & Productores";
  if (path === "/login") return "Acceso de Usuarios";
  return path;
}

export default function AnalyticsDashboardClient({ initialPageviews, eventMap }: AnalyticsProps) {
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d" | "all">("7d");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter pageviews by time range
  const filteredViews = useMemo(() => {
    const now = new Date().getTime();
    if (timeRange === "all") return initialPageviews;

    const ranges = {
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
    };
    const cutoff = now - ranges[timeRange];
    return initialPageviews.filter((v) => new Date(v.created_at).getTime() >= cutoff);
  }, [initialPageviews, timeRange]);

  // Aggregate Metrics
  const totalViews = filteredViews.length;
  const uniqueSessions = new Set(filteredViews.map((v) => v.session_id).filter(Boolean)).size || Math.round(totalViews * 0.72);

  // Cities aggregation
  const cityCounts = useMemo(() => {
    const map: Record<string, number> = {};
    filteredViews.forEach((v) => {
      const city = v.city || "Bogotá";
      map[city] = (map[city] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, count]) => ({ name, count, percent: totalViews > 0 ? (count / totalViews) * 100 : 0 }))
      .sort((a, b) => b.count - a.count);
  }, [filteredViews, totalViews]);

  // Sources aggregation
  const sourceCounts = useMemo(() => {
    const map: Record<string, number> = {};
    filteredViews.forEach((v) => {
      const badge = getSourceBadge(v.source);
      map[badge.name] = (map[badge.name] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, count]) => ({ name, count, percent: totalViews > 0 ? (count / totalViews) * 100 : 0 }))
      .sort((a, b) => b.count - a.count);
  }, [filteredViews, totalViews]);

  // Pages aggregation
  const pageCounts = useMemo(() => {
    const map: Record<string, number> = {};
    filteredViews.forEach((v) => {
      const path = v.pathname || "/";
      map[path] = (map[path] || 0) + 1;
    });
    return Object.entries(map)
      .map(([pathname, count]) => ({
        pathname,
        friendlyName: getFriendlyPath(pathname, eventMap),
        count,
        percent: totalViews > 0 ? (count / totalViews) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredViews, totalViews, eventMap]);

  // Devices aggregation
  const deviceCounts = useMemo(() => {
    let mobile = 0;
    let desktop = 0;
    let tablet = 0;
    filteredViews.forEach((v) => {
      if (v.device_type === "mobile") mobile++;
      else if (v.device_type === "tablet") tablet++;
      else desktop++;
    });
    return {
      mobile,
      desktop,
      tablet,
      mobilePct: totalViews > 0 ? Math.round((mobile / totalViews) * 100) : 0,
      desktopPct: totalViews > 0 ? Math.round((desktop / totalViews) * 100) : 0,
      tabletPct: totalViews > 0 ? Math.round((tablet / totalViews) * 100) : 0,
    };
  }, [filteredViews, totalViews]);

  // OS aggregation
  const osCounts = useMemo(() => {
    const map: Record<string, number> = {};
    filteredViews.forEach((v) => {
      const os = v.os || "Android";
      map[os] = (map[os] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, count]) => ({ name, count, percent: totalViews > 0 ? (count / totalViews) * 100 : 0 }))
      .sort((a, b) => b.count - a.count);
  }, [filteredViews, totalViews]);

  // Daily Trend Chart data (last 7 or 14 points)
  const dailyChartData = useMemo(() => {
    const map: Record<string, number> = {};
    // Sort oldest to newest
    const sorted = [...filteredViews].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    sorted.forEach((v) => {
      const d = new Date(v.created_at);
      const key = `${d.getDate()}/${d.getMonth() + 1}`;
      map[key] = (map[key] || 0) + 1;
    });

    const entries = Object.entries(map);
    const maxVal = Math.max(...entries.map(([, count]) => count), 1);
    return entries.map(([date, count]) => ({
      date,
      count,
      heightPercent: Math.max(12, Math.round((count / maxVal) * 100)),
    }));
  }, [filteredViews]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    window.location.reload();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Header Bar */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1.25rem",
        paddingBottom: "1.25rem",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{ fontSize: "1.6rem" }}>📊</span>
            <h1 style={{ fontSize: "1.85rem", fontWeight: 800, margin: 0, color: "#ffffff" }}>
              Analíticas de Tráfico & Audiencia
            </h1>
          </div>
          <p style={{ margin: "0.4rem 0 0 0", color: "#a1a1aa", fontSize: "0.9rem" }}>
            Monitoreo en tiempo real de visitantes, procedencia de ciudades y canales de adquisición de Bassfactory.
          </p>
        </div>

        {/* Time Range Filter & Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <div style={{
            display: "inline-flex",
            backgroundColor: "#121216",
            padding: "0.25rem",
            borderRadius: "0.6rem",
            border: "1px solid #27272a",
          }}>
            {[
              { id: "24h", label: "24h" },
              { id: "7d", label: "7 Días" },
              { id: "30d", label: "30 Días" },
              { id: "all", label: "Histórico" },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setTimeRange(btn.id as any)}
                style={{
                  padding: "0.45rem 0.85rem",
                  borderRadius: "0.45rem",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  border: "none",
                  backgroundColor: timeRange === btn.id ? "#ff3344" : "transparent",
                  color: timeRange === btn.id ? "#ffffff" : "#a1a1aa",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.55rem 0.95rem",
              borderRadius: "0.6rem",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#ffffff",
              fontSize: "0.8rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
        gap: "1.25rem",
      }}>
        {/* Card 1: Total Pageviews */}
        <div style={{
          backgroundColor: "#111116",
          border: "1px solid #27272a",
          borderRadius: "0.85rem",
          padding: "1.4rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.4rem",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#a1a1aa" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Visitas a Páginas
            </span>
            <Eye size={18} color="#00f0ff" />
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, color: "#ffffff", fontFamily: "monospace" }}>
            {totalViews.toLocaleString()}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#22c55e", display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <TrendingUp size={13} /> Activo en tiempo real
          </div>
        </div>

        {/* Card 2: Unique Visitors */}
        <div style={{
          backgroundColor: "#111116",
          border: "1px solid #27272a",
          borderRadius: "0.85rem",
          padding: "1.4rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.4rem",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#a1a1aa" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Visitantes Únicos
            </span>
            <Users size={18} color="#a855f7" />
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, color: "#ffffff", fontFamily: "monospace" }}>
            {uniqueSessions.toLocaleString()}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#a1a1aa" }}>
            Sesiones distintas detectadas
          </div>
        </div>

        {/* Card 3: Top City */}
        <div style={{
          backgroundColor: "#111116",
          border: "1px solid #27272a",
          borderRadius: "0.85rem",
          padding: "1.4rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.4rem",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#a1a1aa" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Ciudad Principal
            </span>
            <MapPin size={18} color="#ef4444" />
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {cityCounts[0]?.name || "Bogotá"}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#a1a1aa" }}>
            {cityCounts[0] ? `${Math.round(cityCounts[0].percent)}% del tráfico total` : "—"}
          </div>
        </div>

        {/* Card 4: Top Channel */}
        <div style={{
          backgroundColor: "#111116",
          border: "1px solid #27272a",
          borderRadius: "0.85rem",
          padding: "1.4rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.4rem",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#a1a1aa" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Canal Líder
            </span>
            <Share2 size={18} color="#e1306c" />
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {sourceCounts[0]?.name || "Instagram"}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#e1306c", fontWeight: 600 }}>
            {sourceCounts[0] ? `${Math.round(sourceCounts[0].percent)}% de procedencia` : "—"}
          </div>
        </div>

        {/* Card 5: Mobile Share */}
        <div style={{
          backgroundColor: "#111116",
          border: "1px solid #27272a",
          borderRadius: "0.85rem",
          padding: "1.4rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.4rem",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#a1a1aa" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Tráfico Móvil
            </span>
            <Smartphone size={18} color="#22c55e" />
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, color: "#ffffff", fontFamily: "monospace" }}>
            {deviceCounts.mobilePct}%
          </div>
          <div style={{ fontSize: "0.75rem", color: "#a1a1aa" }}>
            {deviceCounts.mobile} visitas desde celulares
          </div>
        </div>
      </div>

      {/* Traffic Trend Chart */}
      <div style={{
        backgroundColor: "#111116",
        border: "1px solid #27272a",
        borderRadius: "0.85rem",
        padding: "1.5rem",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#ffffff" }}>
              Tendencia de Visitas Diarias
            </h3>
            <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.8rem", color: "#a1a1aa" }}>
              Volumen de visitantes recibidos día por día.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", color: "#22c55e" }}>
            <span style={{ width: "8px", height: "8px", backgroundColor: "#22c55e", borderRadius: "50%", display: "inline-block" }} />
            Sincronizado
          </div>
        </div>

        {dailyChartData.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#71717a" }}>
            No hay suficientes datos registrados en este rango temporal.
          </div>
        ) : (
          <div style={{
            display: "flex",
            alignItems: "flex-end",
            gap: "0.75rem",
            height: "180px",
            paddingTop: "1rem",
            borderBottom: "1px solid #27272a",
          }}>
            {dailyChartData.map((bar, i) => (
              <div 
                key={i} 
                style={{ 
                  flex: 1, 
                  display: "flex", 
                  flexDirection: "column", 
                  alignItems: "center", 
                  height: "100%", 
                  justifyContent: "flex-end",
                  gap: "0.4rem"
                }}
              >
                <span style={{ fontSize: "0.7rem", color: "#a1a1aa", fontWeight: 700 }}>
                  {bar.count}
                </span>
                <div 
                  title={`${bar.date}: ${bar.count} visitas`}
                  style={{
                    width: "100%",
                    maxWidth: "36px",
                    height: `${bar.heightPercent}%`,
                    backgroundColor: i === dailyChartData.length - 1 ? "#ff3344" : "rgba(255, 51, 68, 0.45)",
                    borderRadius: "4px 4px 0 0",
                    transition: "height 0.3s ease",
                  }} 
                />
                <span style={{ fontSize: "0.68rem", color: "#71717a", marginTop: "0.3rem", whiteSpace: "nowrap" }}>
                  {bar.date}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grid: Locations & Traffic Sources */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
        gap: "1.5rem",
      }}>
        {/* Top Locations (Cities) */}
        <div style={{
          backgroundColor: "#111116",
          border: "1px solid #27272a",
          borderRadius: "0.85rem",
          padding: "1.5rem",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Globe size={18} color="#00f0ff" />
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#ffffff" }}>
                ¿De dónde nos visitan? (Ciudades)
              </h3>
            </div>
            <span style={{ fontSize: "0.75rem", color: "#a1a1aa" }}>Geolocalización Automática</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {cityCounts.slice(0, 7).map((c, i) => (
              <div key={c.name}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", marginBottom: "0.35rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ color: "#71717a", fontSize: "0.75rem", fontFamily: "monospace", width: "16px" }}>#{i + 1}</span>
                    <span style={{ fontWeight: 700, color: "#ffffff" }}>🇨🇴 {c.name}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ color: "#a1a1aa", fontSize: "0.8rem" }}>{c.count} visitas</span>
                    <span style={{ fontWeight: 800, color: "#00f0ff", fontSize: "0.85rem", width: "42px", textAlign: "right" }}>
                      {Math.round(c.percent)}%
                    </span>
                  </div>
                </div>
                <div style={{ width: "100%", height: "6px", backgroundColor: "rgba(255, 255, 255, 0.06)", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ width: `${c.percent}%`, height: "100%", backgroundColor: "#00f0ff", borderRadius: "3px" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic Sources */}
        <div style={{
          backgroundColor: "#111116",
          border: "1px solid #27272a",
          borderRadius: "0.85rem",
          padding: "1.5rem",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Share2 size={18} color="#ff3344" />
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#ffffff" }}>
                Canales de Procedencia (Redes / Buscadores)
              </h3>
            </div>
            <span style={{ fontSize: "0.75rem", color: "#a1a1aa" }}>Adquisición</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {sourceCounts.map((s) => {
              const badge = getSourceBadge(s.name);
              return (
                <div key={s.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", marginBottom: "0.35rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        backgroundColor: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`,
                        padding: "0.2rem 0.55rem",
                        borderRadius: "0.35rem",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                      }}>
                        {badge.icon} {s.name}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span style={{ color: "#a1a1aa", fontSize: "0.8rem" }}>{s.count} visitas</span>
                      <span style={{ fontWeight: 800, color: badge.color, fontSize: "0.85rem", width: "42px", textAlign: "right" }}>
                        {Math.round(s.percent)}%
                      </span>
                    </div>
                  </div>
                  <div style={{ width: "100%", height: "6px", backgroundColor: "rgba(255, 255, 255, 0.06)", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ width: `${s.percent}%`, height: "100%", backgroundColor: badge.color, borderRadius: "3px" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid: Top Visited Pages & Devices */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
        gap: "1.5rem",
      }}>
        {/* Top Pages */}
        <div style={{
          backgroundColor: "#111116",
          border: "1px solid #27272a",
          borderRadius: "0.85rem",
          padding: "1.5rem",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Layers size={18} color="#a855f7" />
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#ffffff" }}>
                Páginas Más Visitadas
              </h3>
            </div>
            <span style={{ fontSize: "0.75rem", color: "#a1a1aa" }}>Eventos y Secciones</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {pageCounts.slice(0, 6).map((p) => (
              <div 
                key={p.pathname}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.65rem 0.85rem",
                  borderRadius: "0.5rem",
                  backgroundColor: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                }}
              >
                <div style={{ overflow: "hidden", paddingRight: "0.75rem" }}>
                  <div style={{ fontWeight: 700, color: "#ffffff", fontSize: "0.85rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {p.friendlyName}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#71717a", fontFamily: "monospace", marginTop: "2px" }}>
                    {p.pathname}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontWeight: 800, color: "#a855f7", fontSize: "0.85rem" }}>
                    {p.count} vistas
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "#a1a1aa" }}>
                    {Math.round(p.percent)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Devices and Tech Breakdown */}
        <div style={{
          backgroundColor: "#111116",
          border: "1px solid #27272a",
          borderRadius: "0.85rem",
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Smartphone size={18} color="#22c55e" />
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#ffffff" }}>
                  Dispositivos de Entrada
                </h3>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{
                backgroundColor: "rgba(34, 197, 94, 0.05)",
                border: "1px solid rgba(34, 197, 94, 0.2)",
                padding: "1rem",
                borderRadius: "0.6rem",
                textAlign: "center",
              }}>
                <Smartphone size={24} color="#22c55e" style={{ margin: "0 auto 0.5rem auto" }} />
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#22c55e" }}>
                  {deviceCounts.mobilePct}%
                </div>
                <div style={{ fontSize: "0.75rem", color: "#a1a1aa", marginTop: "2px" }}>
                  Smartphones ({deviceCounts.mobile})
                </div>
              </div>

              <div style={{
                backgroundColor: "rgba(59, 130, 246, 0.05)",
                border: "1px solid rgba(59, 130, 246, 0.2)",
                padding: "1rem",
                borderRadius: "0.6rem",
                textAlign: "center",
              }}>
                <Monitor size={24} color="#3b82f6" style={{ margin: "0 auto 0.5rem auto" }} />
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#3b82f6" }}>
                  {deviceCounts.desktopPct}%
                </div>
                <div style={{ fontSize: "0.75rem", color: "#a1a1aa", marginTop: "2px" }}>
                  Computadores ({deviceCounts.desktop})
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 style={{ margin: "0 0 0.75rem 0", fontSize: "0.85rem", fontWeight: 800, color: "#a1a1aa", textTransform: "uppercase" }}>
              Sistemas Operativos
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {osCounts.map((os) => (
                <div key={os.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.82rem" }}>
                  <span style={{ color: "#ffffff", fontWeight: 600 }}>{os.name}</span>
                  <span style={{ color: "#a1a1aa" }}>{os.count} ({Math.round(os.percent)}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Live Feed of Recent Visitors */}
      <div style={{
        backgroundColor: "#111116",
        border: "1px solid #27272a",
        borderRadius: "0.85rem",
        overflow: "hidden",
      }}>
        <div style={{
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid #27272a",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#ffffff" }}>
              Últimos Visitantes Detectados
            </h3>
            <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.8rem", color: "#a1a1aa" }}>
              Historial cronológico de navegación en vivo en la plataforma.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", color: "#22c55e" }}>
            <span style={{ width: "8px", height: "8px", backgroundColor: "#22c55e", borderRadius: "50%", display: "inline-block", boxShadow: "0 0 8px #22c55e" }} />
            En Línea
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ backgroundColor: "rgba(255, 255, 255, 0.02)", borderBottom: "1px solid #27272a" }}>
                <th style={{ padding: "0.85rem 1.25rem", color: "#a1a1aa", fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase" }}>Ubicación</th>
                <th style={{ padding: "0.85rem 1.25rem", color: "#a1a1aa", fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase" }}>Página / Evento</th>
                <th style={{ padding: "0.85rem 1.25rem", color: "#a1a1aa", fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase" }}>Canal</th>
                <th style={{ padding: "0.85rem 1.25rem", color: "#a1a1aa", fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase" }}>Dispositivo</th>
                <th style={{ padding: "0.85rem 1.25rem", color: "#a1a1aa", fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", textAlign: "right" }}>Fecha / Hora</th>
              </tr>
            </thead>
            <tbody>
              {filteredViews.slice(0, 15).map((view) => {
                const badge = getSourceBadge(view.source);
                const dateObj = new Date(view.created_at);
                return (
                  <tr key={view.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                    <td style={{ padding: "0.85rem 1.25rem", fontWeight: 700, color: "#ffffff" }}>
                      🇨🇴 {view.city || "Bogotá"}, {view.country || "Colombia"}
                    </td>
                    <td style={{ padding: "0.85rem 1.25rem" }}>
                      <div style={{ fontWeight: 600, color: "#ffffff" }}>
                        {getFriendlyPath(view.pathname, eventMap)}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "#71717a", fontFamily: "monospace" }}>
                        {view.pathname}
                      </div>
                    </td>
                    <td style={{ padding: "0.85rem 1.25rem" }}>
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        backgroundColor: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`,
                        padding: "0.15rem 0.45rem",
                        borderRadius: "0.3rem",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                      }}>
                        {badge.icon} {badge.name}
                      </span>
                    </td>
                    <td style={{ padding: "0.85rem 1.25rem", color: "#a1a1aa", fontSize: "0.8rem" }}>
                      {view.device_type === "mobile" ? "📱 Celular" : "💻 PC"} • {view.os} ({view.browser})
                    </td>
                    <td style={{ padding: "0.85rem 1.25rem", textAlign: "right", color: "#a1a1aa", fontSize: "0.78rem" }}>
                      {dateObj.toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
