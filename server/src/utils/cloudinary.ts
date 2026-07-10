// src/services/cloudinaryService.ts
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME!,
  api_key: process.env.API_KEY!,
  api_secret: process.env.API_SECRET!,
});

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const validateImageSize = (base64String: string) => {
  const sizeInBytes = Buffer.from(base64String, "base64").length;

  if (sizeInBytes > MAX_FILE_SIZE) {
    throw new Error(
      `Image size (${(sizeInBytes / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size of 5MB. Please compress your image.`,
    );
  }

  return true;
};

export const uploadSingleImage = async (image: string, folder_name: string) => {
  try {

    validateImageSize(image);

    const response = await cloudinary.uploader.upload(image, {
      folder: folder_name,
    });

    return {
      image_url: response.secure_url,
      public_id: response.public_id,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload image");
  }
};

export const deleteImage = async (public_id: string) => {
  try {
    const response = await cloudinary.uploader.destroy(public_id);
    return response?.result === "ok";
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return false;
  }
};

export const updateImage = async (
  image: string,
  folder_name: string,
  oldPublicId?: string,
) => {
  try {

    validateImageSize(image);

    if (oldPublicId) {
      await deleteImage(oldPublicId);
    }

    // Upload new image
    return await uploadSingleImage(image, folder_name);
  } catch (error) {
    console.error("Cloudinary update error:", error);
    throw new Error("Failed to update image");
  }
};
