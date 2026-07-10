export const compressImage = (
  file: File,
  maxSizeMB: number = 5,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        const MAX_DIMENSION = 1200;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        let quality = 0.9;
        let compressed = canvas.toDataURL("image/jpeg", quality);

        while (compressed.length > maxSizeMB * 1024 * 1024 && quality > 0.1) {
          quality -= 0.1;
          compressed = canvas.toDataURL("image/jpeg", quality);
        }

        resolve(compressed);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

export const validateImageFile = (
  file: File,
): { valid: boolean; message?: string } => {
  const MAX_SIZE = 10 * 1024 * 1024;
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "image/gif",
    "image/webp",
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      message: "Please upload a valid image file (JPEG, PNG, JPG, GIF, WebP)",
    };
  }

  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      message: `Image file is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 10MB. Please compress your image.`,
    };
  }

  return { valid: true };
};
