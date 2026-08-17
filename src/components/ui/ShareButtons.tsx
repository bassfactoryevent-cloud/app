"use client";

import { useState, useEffect } from "react";
import { Facebook, Twitter, MessageCircle, Link as LinkIcon, Check } from "lucide-react";
import { toast } from "sonner";

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
  };

  const openShareWindow = (url: string) => {
    window.open(url, "_blank", "width=600,height=400");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      toast.success("Enlace copiado al portapapeles");
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
          <Facebook size={18} />
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
          <Twitter size={18} />
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
          onClick={handleCopyLink}
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
