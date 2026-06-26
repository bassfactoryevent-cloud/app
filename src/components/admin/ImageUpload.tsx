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
}

export default function ImageUpload({ bucket, defaultImage, onUploadSuccess, label = "Subir Imagen", name }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(defaultImage || null);
  const supabase = createClient();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // 1. Optimize Image
      const compressedFile = await optimizeImage(file);

      // 2. Prepare for Upload
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 3. Upload to Supabase
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, compressedFile);

      if (error) throw error;

      // 4. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      setPreviewUrl(publicUrl);
      if (onUploadSuccess) onUploadSuccess(publicUrl);
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Error al subir la imagen. Por favor, inténtalo de nuevo.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <label style={{ fontWeight: 600 }}>{label}</label>
      {name && <input type="hidden" name={name} value={previewUrl || ""} />}
      
      {previewUrl && (
        <div style={{ marginBottom: "0.5rem", borderRadius: "8px", overflow: "hidden", maxWidth: "300px", border: "1px solid var(--color-border)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="Preview" style={{ width: "100%", height: "auto", display: "block" }} />
        </div>
      )}

      <div style={{ position: "relative" }}>
        <input 
          type="file" 
          accept="image/*" 
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
