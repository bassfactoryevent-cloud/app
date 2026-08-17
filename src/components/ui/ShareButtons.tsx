"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Link as LinkIcon, Check } from "lucide-react";
import { toast } from "sonner";

// Custom SVGs for missing Lucide icons or specific brand shapes
const FacebookIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);

const TwitterIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
  </svg>
);
const InstagramIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const PinterestIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.951-7.252 4.173 0 7.41 2.967 7.41 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.367 18.592 0 12.017 0z"/>
  </svg>
);

const TikTokIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path>
    <path d="M15 4v12.5a5.5 5.5 0 1 1-5.5-5.5"></path>
    <path d="M15 8a5 5 0 0 0 5 5"></path>
  </svg>
);

interface ShareButtonsProps {
  title: string;
  text?: string;
  url?: string;
}

export function ShareButtons({ title, text = "", url }: ShareButtonsProps) {
  const [currentUrl, setCurrentUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCurrentUrl(url || window.location.href);
  }, [url]);

  const encodedUrl = encodeURIComponent(currentUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedText = encodeURIComponent(text);

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
    pinterest: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedTitle}`,
  };

  const openShareWindow = (url: string) => {
    window.open(url, "_blank", "width=600,height=400");
  };

  const handleNativeShare = async (platform: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url: currentUrl,
        });
      } catch (err) {
        // user cancelled or error
      }
    } else {
      handleCopyLink(`Enlace copiado. ¡Compártelo en ${platform}!`);
    }
  };

  const handleCopyLink = async (customMessage?: string) => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      toast.success(customMessage || "Enlace copiado al portapapeles");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Error al copiar el enlace");
    }
  };

  if (!currentUrl) return null; // Don't render until client side is hydrated

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "1rem",
      flexWrap: "wrap",
      marginTop: "2rem",
      paddingTop: "1.5rem",
      borderTop: "1px solid var(--color-border, #333)"
    }}>
      <span style={{ 
        fontSize: "0.875rem", 
        color: "var(--color-text-secondary, #a1a1aa)",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.05em"
      }}>
        Compartir:
      </span>
      
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button
          onClick={() => openShareWindow(shareLinks.facebook)}
          aria-label="Compartir en Facebook"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: "40px", height: "40px", borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
            color: "#1877F2", cursor: "pointer", transition: "all 0.2s ease"
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = "rgba(24,119,242,0.1)"}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"}
        >
          <FacebookIcon size={18} />
        </button>

        <button
          onClick={() => openShareWindow(shareLinks.twitter)}
          aria-label="Compartir en X (Twitter)"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: "40px", height: "40px", borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
            color: "#FFFFFF", cursor: "pointer", transition: "all 0.2s ease"
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.15)"}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"}
        >
          <TwitterIcon size={18} />
        </button>

        <button
          onClick={() => openShareWindow(shareLinks.whatsapp)}
          aria-label="Compartir en WhatsApp"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: "40px", height: "40px", borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
            color: "#25D366", cursor: "pointer", transition: "all 0.2s ease"
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = "rgba(37,211,102,0.1)"}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"}
        >
          <MessageCircle size={18} />
        </button>

        <button
          onClick={() => openShareWindow(shareLinks.pinterest)}
          aria-label="Compartir en Pinterest"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: "40px", height: "40px", borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
            color: "#E60023", cursor: "pointer", transition: "all 0.2s ease"
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = "rgba(230,0,35,0.1)"}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"}
        >
          <PinterestIcon size={18} />
        </button>

        <button
          onClick={() => handleNativeShare("Instagram")}
          aria-label="Compartir en Instagram"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: "40px", height: "40px", borderRadius: "50%",
            background: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
            color: "#FFFFFF", cursor: "pointer", transition: "all 0.2s ease",
            opacity: 0.9
          }}
          onMouseOver={(e) => e.currentTarget.style.opacity = "1"}
          onMouseOut={(e) => e.currentTarget.style.opacity = "0.9"}
        >
          <InstagramIcon size={18} />
        </button>

        <button
          onClick={() => handleNativeShare("TikTok")}
          aria-label="Compartir en TikTok"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: "40px", height: "40px", borderRadius: "50%",
            backgroundColor: "#000000", border: "1px solid rgba(255,255,255,0.2)",
            color: "#FFFFFF", cursor: "pointer", transition: "all 0.2s ease",
            boxShadow: "-1px -1px 0px #00f2fe, 1px 1px 0px #fe0979"
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
          onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
        >
          <TikTokIcon size={18} />
        </button>

        <button
          onClick={() => handleCopyLink()}
          aria-label="Copiar Enlace"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: "40px", height: "40px", borderRadius: "50%",
            backgroundColor: copied ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.05)", 
            border: `1px solid ${copied ? "rgba(34,197,94,0.5)" : "rgba(255,255,255,0.1)"}`,
            color: copied ? "#22c55e" : "var(--color-text-secondary, #a1a1aa)", 
            cursor: "pointer", transition: "all 0.2s ease"
          }}
          onMouseOver={(e) => {
            if (!copied) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)";
          }}
          onMouseOut={(e) => {
            if (!copied) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
          }}
        >
          {copied ? <Check size={18} /> : <LinkIcon size={18} />}
        </button>
      </div>
    </div>
  );
}
