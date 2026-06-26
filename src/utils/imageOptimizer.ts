import imageCompression from 'browser-image-compression';

export async function optimizeImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 1, // Max file size in MB
    maxWidthOrHeight: 1920, // Max width/height
    useWebWorker: true,
    fileType: 'image/webp', // Convert to webp for better compression, optional but recommended
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    return file; // If compression fails, return the original file to avoid breaking uploads
  }
}
