import imageCompression from 'browser-image-compression';

export async function optimizeImage(file: File): Promise<File> {
  // If it's already an SVG or gif or video, don't compress with canvas
  if (file.type === 'image/svg+xml' || file.type === 'image/gif' || file.type.startsWith('video/')) {
    return file;
  }

  const options = {
    maxSizeMB: 1, // Max file size: 1MB (typically compresses to 100kb-350kb)
    maxWidthOrHeight: 1920, // Max dimension: Full HD
    useWebWorker: true,
    fileType: 'image/webp', // High efficiency WebP format
    initialQuality: 0.85, // Excellent visual fidelity
  };

  try {
    const compressedBlob = await imageCompression(file, options);
    
    // Clean base name and guarantee .webp extension
    const baseName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_");
    const webpFile = new File([compressedBlob], `${baseName || 'image'}.webp`, {
      type: 'image/webp',
      lastModified: Date.now(),
    });

    return webpFile;
  } catch (error) {
    console.error('Error compressing image, using original file fallback:', error);
    return file;
  }
}
