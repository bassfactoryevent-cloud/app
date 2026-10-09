"use client";

import { useState } from "react";
import { optimizeImage } from "@/utils/imageOptimizer";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

interface ImageUploadProps {
  bucket: string;
  defaultImage?: string;
  onUploadSuccess?: (url: string) => void;
  label?: string;
  name?: string; // If provided, renders a hidden input with this name
  accept?: string;
}

export default function ImageUpload({ 
  bucket, 
  defaultImage, 
  onUploadSuccess, 
  label = "Subir Imagen", 
  name,
  accept
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(defaultImage || null);

  const resolvedAccept = accept || (bucket === "ads" ? "image/*,video/mp4,video/webm" : "image/*");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // 1. Optimize Image (solo para imágenes, videos se suben directos)
      const isVideo = file.type.startsWith("video/") || file.name.endsWith(".mp4") || file.name.endsWith(".webm");
      const uploadFile = isVideo ? file : await optimizeImage(file);

      // 2. Subir a través de la API segura del servidor (evita restricciones de RLS anónimo)
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("bucket", bucket);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Error del servidor (${res.status})`);
      }

      const { url } = await res.json();
      setPreviewUrl(url);
      if (onUploadSuccess) onUploadSuccess(url);
      toast.success("Recurso subido exitosamente.");
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast.error(error?.message || "Error al subir la imagen. Por favor, inténtalo de nuevo.");
    } finally {
      setIsUploading(false);
    }
  };

  const isVideoPreview = previewUrl?.toLowerCase().endsWith(".mp4") || previewUrl?.toLowerCase().endsWith(".webm");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <label style={{ fontWeight: 600 }}>{label}</label>
      {name && <input type="hidden" name={name} value={previewUrl || ""} />}
      
      {previewUrl && (
        <div style={{ marginBottom: "0.5rem", borderRadius: "8px", overflow: "hidden", maxWidth: "300px", border: "1px solid var(--color-border)" }}>
          {isVideoPreview ? (
            <video src={previewUrl} autoPlay loop muted playsInline style={{ width: "100%", height: "auto", display: "block" }} />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={previewUrl} alt="Preview" style={{ width: "100%", height: "auto", display: "block" }} />
          )}
        </div>
      )}

      <div style={{ position: "relative" }}>
        <input 
          type="file" 
          accept={resolvedAccept} 
          onChange={handleFileChange} 
          disabled={isUploading}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            opacity: 0,
            cursor: "pointer"
          }}
        />
        <button 
          type="button"
          disabled={isUploading}
          style={{
            width: "100%",
            padding: "0.75rem",
            backgroundColor: "var(--color-surface)",
            border: "1px dashed var(--color-border)",
            borderRadius: "var(--radius-md)",
            color: "var(--color-text-secondary)",
            cursor: "pointer",
            textAlign: "center",
            pointerEvents: "none" // Let the input overlay handle clicks
          }}
        >
          {isUploading ? "Optimizando y subiendo..." : "Haz clic o arrastra una imagen aquí"}
        </button>
      </div>
      <p style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", opacity: 0.7 }}>
        La imagen se comprimirá automáticamente para cargar rápido en la web.
      </p>
    </div>
  );
}
