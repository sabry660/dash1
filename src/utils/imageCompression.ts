import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  initialQuality?: number;
}

export interface CompressionProgress {
  progress: number;
  isCompressing: boolean;
  isUploading: boolean;
  error?: string;
}

const defaultOptions: CompressionOptions = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1280,
  useWebWorker: false,
  initialQuality: 0.7,
};

/**
 * Compress an image file before upload
 * @param file - The image file to compress
 * @param options - Compression options
 * @param onProgress - Optional callback for progress updates
 * @returns Promise<File> - The compressed image file
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {},
  onProgress?: (progress: CompressionProgress) => void
): Promise<File> {
  try {
    if (onProgress) {
      onProgress({ progress: 0, isCompressing: true, isUploading: false });
    }

    const mergedOptions = { ...defaultOptions, ...options };

    // Compress the image to WebP format with max 1MB
    const compressedFile = await imageCompression(file, {
      maxSizeMB: 1, // Max 1MB
      maxWidthOrHeight: 1920,
      useWebWorker: mergedOptions.useWebWorker,
      initialQuality: 0.8,
      fileType: 'image/webp', // Convert to WebP
    });

    if (onProgress) {
      onProgress({ progress: 100, isCompressing: false, isUploading: false });
    }

    return compressedFile;
  } catch (error) {
    if (onProgress) {
      onProgress({
        progress: 0,
        isCompressing: false,
        isUploading: false,
        error: error instanceof Error ? error.message : 'Compression failed',
      });
    }
    throw error;
  }
}

/**
 * Validate image file type
 * @param file - The file to validate
 * @returns boolean - Whether the file is a valid image
 */
export function isValidImageFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  return validTypes.includes(file.type);
}

/**
 * Get file extension from MIME type
 * @param mimeType - The MIME type
 * @returns string - The file extension
 */
export function getFileExtension(mimeType: string): string {
  const extensions: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
  };
  return extensions[mimeType] || '.jpg';
}
