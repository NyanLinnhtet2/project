// src/services/cloudinaryService.ts
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME!,
  api_key: process.env.API_KEY!,
  api_secret: process.env.API_SECRET!,
});

export const uploadSingleImage = async (image: string, folder_name: string) => {
  try {
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
