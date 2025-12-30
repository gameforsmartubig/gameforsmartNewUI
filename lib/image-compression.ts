/**
 * Image compression utility functions
 * Provides client-side image compression and optimization
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1, for JPEG
  format?: 'jpeg' | 'png' | 'webp';
  maxFileSize?: number; // in bytes
}

export const DEFAULT_COMPRESSION_OPTIONS: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8,
  format: 'jpeg',
  maxFileSize: 2 * 1024 * 1024, // 2MB
};

/**
 * Compress an image file
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_COMPRESSION_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        // Calculate new dimensions
        const { width, height } = calculateDimensions(
          img.width,
          img.height,
          opts.maxWidth!,
          opts.maxHeight!
        );

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx!.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            // Create new file
            const compressedFile = new File(
              [blob],
              generateFileName(file.name, opts.format!),
              {
                type: `image/${opts.format}`,
                lastModified: Date.now(),
              }
            );

            // Check if compression was effective
            if (compressedFile.size < file.size || file.size > opts.maxFileSize!) {
              resolve(compressedFile);
            } else {
              // If compression didn't help or original is smaller, return original
              resolve(file);
            }
          },
          `image/${opts.format}`,
          opts.quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));

    // Create object URL for the image
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Calculate optimal dimensions while maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let { width, height } = { width: originalWidth, height: originalHeight };

  // Check if resizing is needed
  if (width <= maxWidth && height <= maxHeight) {
    return { width, height };
  }

  // Calculate scaling ratios
  const widthRatio = maxWidth / width;
  const heightRatio = maxHeight / height;
  const ratio = Math.min(widthRatio, heightRatio);

  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

/**
 * Generate filename with new extension
 */
function generateFileName(originalName: string, format: string): string {
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
  return `${nameWithoutExt}.${format}`;
}

/**
 * Create preview URL with compression for immediate display
 */
export function createCompressedPreview(
  file: File,
  options: CompressionOptions = {}
): Promise<string> {
  const opts = { 
    ...DEFAULT_COMPRESSION_OPTIONS, 
    ...options,
    maxWidth: 400, // Smaller for preview
    maxHeight: 300,
    quality: 0.7
  };

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        const { width, height } = calculateDimensions(
          img.width,
          img.height,
          opts.maxWidth!,
          opts.maxHeight!
        );

        canvas.width = width;
        canvas.height = height;
        ctx!.drawImage(img, 0, 0, width, height);

        // Get data URL for preview
        const dataUrl = canvas.toDataURL(`image/${opts.format}`, opts.quality);
        resolve(dataUrl);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.',
    };
  }

  // Check file size (10MB max for raw upload)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size too large. Please upload an image smaller than 10MB.',
    };
  }

  return { valid: true };
}
