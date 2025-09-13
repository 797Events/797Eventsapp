// Image upload service using ImgBB API
// ImgBB provides free image hosting with API access

export interface UploadResponse {
  success: boolean;
  url?: string;
  error?: string;
}

const IMGBB_API_KEY = 'b1f6e5c8e7a9b4c2d3f8e6b1a4d5c7f2'; // Free demo key - replace with your own
const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';

export async function uploadImage(file: File): Promise<UploadResponse> {
  try {
    // Validate file
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'Please select a valid image file' };
    }

    if (file.size > 32 * 1024 * 1024) { // 32MB ImgBB limit
      return { success: false, error: 'Image size must be less than 32MB' };
    }

    // Convert file to base64
    const base64 = await fileToBase64(file);
    const base64Data = base64.split(',')[1]; // Remove data:image/jpeg;base64, prefix

    // Create form data
    const formData = new FormData();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', base64Data);
    formData.append('expiration', '15552000'); // 6 months expiration

    // Upload to ImgBB
    const response = await fetch(IMGBB_API_URL, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        url: result.data.url
      };
    } else {
      return {
        success: false,
        error: result.error?.message || 'Upload failed'
      };
    }
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: 'Network error. Please try again.'
    };
  }
}

// Fallback: If ImgBB fails, use local base64 storage
export async function uploadImageFallback(file: File): Promise<UploadResponse> {
  try {
    const base64 = await fileToBase64(file);
    return {
      success: true,
      url: base64
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to process image'
    };
  }
}

// Helper function to convert file to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Alternative free image hosting services (backup options)
export const alternativeServices = {
  imgur: 'https://api.imgur.com/3/image', // Requires client ID
  postimg: 'https://postimg.cc/json/', // No API key needed but less reliable
  freeimage: 'https://freeimage.host/api/1/upload' // Requires API key
};

// Compress image before upload (optional)
export function compressImage(file: File, maxWidth = 1920, quality = 0.8): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          const compressedFile = new File([blob!], file.name, {
            type: file.type,
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        },
        file.type,
        quality
      );
    };

    img.src = URL.createObjectURL(file);
  });
}