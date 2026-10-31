import { ComplaintAttachment } from '../types/complaint';

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates file type and size before processing
 */
export function validateImageFile(file: File): ImageValidationResult {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Please upload an image file (JPEG, PNG, or WebP).',
    };
  }

  // 3MB size limit
  const maxBytes = 3 * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: 'Image must be smaller than 3MB.',
    };
  }

  return { valid: true };
}

/**
 * Resizes and compresses an image file to a safe thumbnail (<30KB)
 * using HTML5 Canvas so it fits safely in browser localStorage.
 */
export async function createThumbnailAttachment(file: File): Promise<ComplaintAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve({
            name: file.name,
            size: file.size,
            type: file.type,
          });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Compress as JPEG at 0.6 quality (typically <20KB)
        const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.6);

        resolve({
          name: file.name,
          size: file.size,
          type: file.type,
          thumbnailDataUrl,
        });
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for compression.'));
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file.'));
    };

    reader.readAsDataURL(file);
  });
}
